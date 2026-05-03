# ACLOCATION

Multi-tenant SaaS for care coordination, built fully on the Netlify
platform. This is the **Option 4** rebuild of the prior Acute Connect
project: Supabase (database, auth, RLS, PostgREST) is replaced end-to-end
with **Netlify Database** (managed Postgres), **Netlify Identity** (auth +
roles), and **Netlify Functions** (application logic).

This directory is the master fence — the canonical source for the platform.
Promote it to its own GitHub repository (`ACLOCATIONS`) by following
[Promoting this scaffold](#promoting-this-scaffold-to-its-own-repo) below;
work continues here in the meantime.

## Quick start

```bash
npm install
netlify dev          # boots Vite + Functions + Database against a preview branch
```

Identity must be enabled on the Netlify site after the first deploy by
running `node scripts/enable.cjs` from the `netlify-identity` agent skill.
The very first user to sign up is auto-promoted to `master_admin` so the
platform can bootstrap without out-of-band steps.

## Repository layout

```
aclocation/
├── netlify/
│   ├── database/migrations/     auto-applied SQL migrations (one per module)
│   ├── functions/
│   │   ├── _shared/             auth, db, tenant, audit, usage helpers
│   │   ├── identity-signup/     Identity event hook (invite redemption)
│   │   ├── locations-*          rollout, directory, BYOD database, invites, update
│   │   ├── clients-*            client CRUD
│   │   ├── crn-*                CRN request + issue
│   │   ├── check-ins-*          encounter logging
│   │   ├── crisis-*             crisis events
│   │   ├── providers-*          provider directory
│   │   ├── field-agents-*       field-agent roster + GPS check-ins
│   │   ├── billing-summary      usage/quota dashboard data
│   │   ├── audit-list           privileged action log
│   │   └── monitoring-*         per-location health
│   └── edge-functions/          (reserved for low-latency middleware)
└── src/
    ├── core/
    │   ├── auth/                AuthProvider, RequireAuth, useAuth
    │   ├── tenancy/             TenantProvider, useTenant, location switcher
    │   ├── branding/            applies per-location colours/UX preset at runtime
    │   ├── api/                 typed fetch wrapper to /.netlify/functions
    │   ├── ui/                  Button, Card, Form, Badge, EmptyState
    │   └── layout/              AppShell + side nav (role + module aware)
    └── modules/
        ├── auth/                login / signup (invite-token) / recover / unauthorised
        ├── dashboard/           role-aware home
        ├── clients/             list + detail + create
        ├── crn/                 staff triage + public request page
        ├── check-ins/           encounter recording
        ├── audit/               read-only audit log
        ├── billing/             plan + usage chart
        ├── crisis/              open + manage crises
        ├── providers/           clinician/agent/partner directory
        ├── field-agents/        roster + GPS-stamped mobile check-ins
        ├── locations/           rollout, directory, BYOD database, settings
        └── monitoring/          cross-tenant health board
```

Each module is self-contained: `pages/`, `components/`, `lib/`, and an
`index.js` barrel. A module knows nothing about other modules' internals;
cross-module data flow goes through the API layer.

## Tenancy model

A **location** is the unit of multitenancy. Every domain table (`clients`,
`crns`, `check_ins`, `crisis_events`, `field_agents`, …) carries a
`location_id` foreign key. Membership is tracked in
`location_members(location_id, user_id, role)` where `user_id` is the
Identity user id (Identity stores user records out-of-band, so the database
holds only the id).

Function-side authorisation:

1. `requireUser()` resolves the caller's Identity user from the `nf_jwt`
   cookie or bearer token.
2. `requireRole(['admin'])` adds a role gate. **`master_admin` implicitly
   passes every role gate** — there is no need to add it to each list.
3. `requireMaster()` is the explicit master-only gate.
4. `resolveTenant(req, user)` reads `x-aclocation-id` (or the user's default
   location), then verifies membership in `location_members`. `master_admin`
   and `super_admin` bypass membership.

Browser-side, `TenantProvider` calls `/locations-mine` on mount and exposes
the active location id via `localStorage`, which the API client attaches as
`x-aclocation-id` on every request. `BrandingProvider` watches the active
location's `branding` blob and applies its colours and UX preset as CSS
custom properties on `:root`.

## Roles

Identity `app_metadata.roles` is the source of truth. Highest to lowest:

| Role           | Scope                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| `master_admin` | Platform sysadmin — sees and controls **everything across every location**. Approves new locations, BYOD database requests, billing. Implicitly satisfies any role gate. |
| `super_admin`  | A location's senior administrator. Higher visibility than `admin` within the tenant; can invite admins and members of that tenant; opens BYOD database requests. |
| `admin`        | Day-to-day administrator within a single location.                       |
| `member`       | Standard staff user within a single location.                            |

The very first user to sign up is auto-promoted to `master_admin`. **Public
signup is otherwise disabled** — every subsequent signup must include a
valid invite token (`user_metadata.invite_token`). The signup hook redeems
the token, binding the user to the right location with the right role.

## Account creation flow

1. **Master admin** rolls out a location and supplies the new
   `super_admin`'s email. `locations-create` issues an invite token and
   returns it to the master admin in the rollout result.
2. The master admin sends the invite link `…/signup?token=<token>` to the
   recipient (out-of-band — email, Slack, etc.).
3. The recipient signs up using that link. `identity-signup` redeems the
   token, binds them to the location with role `super_admin`, and sets
   `default_location_id`.
4. The location's `super_admin` then invites their own admins and members
   via `POST /.netlify/functions/locations-invite` — they cannot mint
   accounts at or above their own role.

There is no path for a location to create accounts without going through
the central invite + Identity flow. All authentication, account approval,
and billing therefore flows through the master admin.

## Rolling out a new location

`POST /.netlify/functions/locations-create` (master_admin only). One call
captures everything needed to bootstrap a tenant:

| Field          | Purpose                                                           |
| -------------- | ----------------------------------------------------------------- |
| `name`, `slug` | Display name + URL-safe id                                        |
| `planTier`     | `starter` / `growth` / `enterprise` — seeds `location_billing`    |
| `adminEmail`   | Recipient of the auto-issued super_admin invite                   |
| `branding`     | `{ primaryColor, secondaryColor, accentColor, uxPreset, fontFamily }` — applied client-side via CSS custom properties |
| `modules`      | Subset of `dashboard,clients,crn,check-ins,crisis,providers,billing,audit,field-agents` — only enabled modules appear in the side nav for that tenant |
| `databaseMode` | `shared` (default) or `dedicated` — see BYOD below                |
| `cloneSite`    | Optional: provision a dedicated Netlify site for this tenant      |

The UI for this lives at `/system/locations/new`. The result panel shows
the invite URL ready to send to the new super_admin.

### Tailoring a roll-out

When you need to update the rollout instructions for a new tenant
(different modules, different branding, different plan caps), edit:

1. `src/modules/locations/pages/LocationRolloutPage.jsx` — UI presets,
   default colours, the `ALL_MODULES` list.
2. `netlify/functions/locations-create/index.mts` — `ALLOWED_MODULES` and
   `DEFAULT_BRANDING`.
3. `tailwind.config.js` — if you want a new global brand alias.

After roll-out, branding/modules can be updated for an existing location via
`PATCH /.netlify/functions/locations-update` without a redeploy.

## Bring-your-own database (BYOD)

Locations may run on the **shared** platform database (default) or request
a **dedicated** database for sovereignty / isolation. Locations cannot
attach a database without master-admin approval.

Workflow:

1. The location's `super_admin` opens **Database settings** and submits a
   provider + connection URL via `POST /.netlify/functions/locations-database-request`.
2. The request lands in the master admin's queue at
   `/system/database-requests`.
3. The master admin approves or rejects via
   `POST /.netlify/functions/locations-database-review`.
4. Approval flips `locations.database_status` to `approved` and writes the
   connection URL to `locations.database_url`. Until then the runtime keeps
   using the shared database.

Approval is the single chokepoint. Locations cannot self-serve a database
swap. The audit log (`audit_log`) captures every request and decision.

## Master-admin operational surface

| Path                          | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `/system/locations`           | Full directory of every tenant + plan + DB + health  |
| `/system/locations/new`       | Roll out a new location (this is the rollout form)   |
| `/system/database-requests`   | BYOD approval queue                                  |
| `/system/monitoring`          | Cross-tenant health board                            |

Routes under `/system/*` are also gated by Netlify role redirect rules in
`netlify.toml` — only `master_admin` reaches them at the CDN.

## Migrations

Migrations are SQL files in `netlify/database/migrations/`, applied
automatically by Netlify on every deploy. Never hand-edit a migration that
has been applied — roll forward with a new file.

| File                                          | Purpose                                                        |
| --------------------------------------------- | -------------------------------------------------------------- |
| `0001_tenancy.sql`                            | `locations`, `location_members`                                |
| `0002_clients.sql`                            | `clients`                                                      |
| `0003_crn.sql`                                | `crn_requests`, `crns`                                         |
| `0004_check_ins.sql`                          | `check_ins`                                                    |
| `0005_audit.sql`                              | `audit_log` (append-only)                                      |
| `0006_billing.sql`                            | `location_billing`, `location_api_usage`, daily                |
| `0007_crisis.sql`                             | `crisis_events`                                                |
| `0008_providers.sql`                          | `providers`                                                    |
| `0009_monitoring.sql`                         | `location_health_checks`, deployment logs, alerts              |
| `0010_master_admin_byod_branding.sql`         | `master_admin` role; branding/modules/database columns; BYOD request queue; invite tokens |
| `0011_field_agents.sql`                       | `field_agents`, `field_agent_check_ins`                        |

## Environment variables

Browser (must be `VITE_`-prefixed):

- `VITE_APP_NAME` (cosmetic)

Server (Netlify Functions):

- `NETLIFY_API_TOKEN` — required only for the `cloneSite` rollout option.
- `GITHUB_TOKEN`, `GITHUB_TEMPLATE_OWNER`, `GITHUB_TEMPLATE_REPO` — reserved
  for the optional repo-clone step (not yet wired into `locations-create`).
- `ALERT_WEBHOOK_URL` — optional sink for monitoring alerts.

No Supabase variables. None.

## Promoting this scaffold to its own repo

```bash
cp -r aclocation/ /tmp/ACLOCATIONS && cd /tmp/ACLOCATIONS
git init && git add . && git commit -m "Initial commit: ACLOCATIONS master fence"
gh repo create ACLOCATIONS --private --source=. --push
netlify init       # link to a new Netlify site
netlify db init    # provision the managed Postgres database
```

Then enable Identity on the new Netlify site (one-time UI step) and sign
up — the first account becomes `master_admin` automatically.

## Adding a new module

1. `mkdir src/modules/<name>/{pages,components,lib}` and add `index.js`.
2. Add a migration in `netlify/database/migrations/<NNNN>_<name>.sql` (must
   sort lexicographically after existing ones).
3. Add functions in `netlify/functions/<name>-<action>/index.mts` using the
   `_shared/{auth,tenant,audit,response,db,usage}` helpers.
4. Add an entry to the `NAV` array in `src/core/layout/AppShell.jsx` with
   the roles allowed to see it and the module slug (locations toggle this
   slug in their `enabled_modules`).
5. Wire pages into `src/App.jsx`.
6. Add the slug to `ALLOWED_MODULES` in `locations-create` and the
   `LocationRolloutPage` `ALL_MODULES` list so it can be enabled per-tenant.

The `field-agents` module ships as a working example.
