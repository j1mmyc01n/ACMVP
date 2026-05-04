# Supabase Dual Site Map (Detailed)

Generated: 2026-05-04
Repo: `j1mmyc01n/ACMVP`
Source reference: `FILE_STRUCTURE_MAP.md`

This document is a **dual site map**:

1. **UI / Route map** — every page/route/screen in the repo (grouped by app) and the files that define them.
2. **Supabase data map** — every known Supabase table (from migrations and code references), plus the UI surfaces / serverless functions that read/write them.

> Notes / limitations
>
> - This repo contains multiple app surfaces (`src/`, `apps/web/`, `aclocation/`, and `acute-connect-fixes/`). This map includes all of them.
> - GitHub code search has result limits; this map is best-effort from code + migrations. If a page isn’t listed under a table, it may still use it indirectly.

---

## 0) App surfaces in this repo

### A) Root app (legacy / main)
- Entry: `src/main.jsx`
- App shell + “page id router”: `src/App.jsx`
- Pages grouped under: `src/pages/*`
- Supabase client: `src/supabase/supabase.js`

### B) Web app (monorepo)
- App: `apps/web/src/*`
- Supabase client: `apps/web/src/supabase/supabase.js`
- Netlify functions: `apps/web/netlify/functions/*`

### C) ACLOCATION app (React Router)
- App: `aclocation/src/*`
- Routes: `aclocation/src/App.jsx`

### D) Acute-connect-fixes (patch track)
- App: `acute-connect-fixes/src/*`
- Used as a “drop-in replacement” track (see `acute-connect-fixes/INSTRUCTIONS.md`).

---

## 1) UI / Route Map (Detailed)

### 1.1 Root `src/` app — Page IDs (single-page navigation)

Defined in `src/App.jsx` via `PageRenderer` switch.

#### Public pages
- `checkin` → `CheckInPage` (`src/pages/ClientViews.jsx`)
- `resources` → `ResourcesPage` (`src/pages/ClientViews.jsx`)
- `professionals` → `ProfessionalsPage` (`src/pages/ClientViews.jsx`)
- `join_provider` → `ProviderJoinPage` (`src/pages/ClientViews.jsx`)
- `join_sponsor` → `SponsorJoinPage` (`src/pages/ClientViews.jsx`)
- `request_access` → `OrgAccessRequestPage` (`src/pages/ClientViews.jsx`)
- `legal` → `LegalHubPage` (`src/pages/ClientViews.jsx`)

#### Client
- `my_portal` → `ClientPortal` (`src/pages/client/ClientPortal`)

#### Admin / staff / sysadmin / field agent
- `admin` → `ModernTriageDashboard` (`src/pages/AdminViews.jsx`)
- `crm` → `CRMPage` (`src/pages/admin/CRMPage.jsx`)
- `patient_directory` → `CRMPage` (`src/pages/admin/CRMPage.jsx`)
- `resource_hub` → `ResourceHub` (`src/components/ResourceHub`)
- `multicentre` → `MultiCentreCheckin` (`src/pages/admin/*`)
- `bulk_offboard` → `BulkOffboardingPage` (`src/pages/admin/*`)
- `invoicing` / `sponsor_ledger` / `finance_hub` / `provider_metrics` → `FinanceHubPage` (imported in `src/App.jsx`)
- `crisis` → `CrisisPage` (`src/pages/admin/CrisisPage.jsx`)
- `reports` → `ReportsPage` (`src/pages/admin/ReportsPage.jsx`)
- `admin_audit` → `AdminAuditPage` (`src/pages/admin/AdminAuditPage`)
- `feedback_dash` → `FeedbackDashPage` (`src/pages/admin/*`)
- `heatmap` → `HeatMapPage` (`src/pages/system/HeatMapPage.jsx`)
- `sysdash` → `OverseerDashboard` (`src/pages/system/OverseerDashboard.jsx`)
- `platform_requests` / `feedback` / `features` / `inbox` / `integration_requests` → `RequestsInboxPage` (`src/pages/system/*`)
- `offices` → `LocationsPage` (`src/pages/system/LocationsPage.jsx`)
- `loc_integrations` (+ `*_ai`, `*_agents`) → `LocationIntegrationsPage` (`src/pages/system/*`)
- `integrations` → `IntegrationPage` (`src/pages/system/IntegrationPage.jsx`)
- `users` → `UsersPage` (`src/pages/system/UsersPage.jsx`)
- `settings` → `SettingsPage` (`src/pages/system/SettingsPage.jsx`)
- `superadmin` → `SuperAdminPage` (`src/pages/system/SuperAdminPage.jsx`)
- `ai_fixer` → `AICodeFixerPage` (`src/pages/system/AICodeFixerPage.jsx`)
- `github_agent` → `GitHubAgentPage` (`src/pages/system/GitHubAgentPage.jsx`)
- `audit_log` → `AuditLogPage` (`src/pages/system/AuditLogPage.jsx`)
- `rollout` → `LocationRollout` (`src/pages/system/LocationRollout.jsx`)
- `feature_rollout` → `FeatureRolloutPage` (`src/pages/system/*`)
- `connectivity` → `ConnectivityPage` (`src/pages/system/*`)
- `push_notifications` → `PushNotificationsPage` (`src/pages/system/*`)
- `admin_push_notifications` → `AdminPushNotificationsPage` (`src/pages/system/*`)
- `field_agent_dash` → `FieldAgentDashboard` (`src/pages/*`)

#### Embedded panels (always mounted)
- `JaxAI` panel: `src/components/JaxAI.jsx`
- `GitHubAgentPanel`: `src/components/GitHubAgent.jsx`

#### Authentication entry points
- Staff login modal in `src/App.jsx`:
  - Password lookup: `admin_users_1777025000000`
  - OTP flow: `login_otp_codes_1777090007`
- Client login (magic link / session restore): Supabase auth listener + `client_accounts`

---

### 1.2 ACLOCATION app — React Router routes

Defined in `aclocation/src/App.jsx`.

#### Public
- `/login` → `modules/auth/pages/LoginPage.jsx`
- `/signup` → `modules/auth/pages/SignupPage.jsx`
- `/recover` → `modules/auth/pages/RecoverPage.jsx`
- `/unauthorised` → `modules/auth/pages/UnauthorisedPage.jsx`
- `/request-crn` → `modules/crn/pages/PublicCrnRequestPage.jsx`

#### Authenticated (inside `RequireAuth` + `AppShell`)
- `/dashboard` → `modules/dashboard/pages/DashboardPage.jsx`
- `/clients` → `modules/clients/pages/ClientsListPage.jsx`
- `/clients/:id` → `modules/clients/pages/ClientDetailPage.jsx`
- `/crn` → `modules/crn/pages/CrnRequestsPage.jsx`
- `/check-ins` → `modules/check-ins/pages/CheckInsPage.jsx`
- `/crisis` → `modules/crisis/pages/CrisisPage.jsx`
- `/providers` → `modules/providers/pages/ProvidersPage.jsx`
- `/billing` → `modules/billing/pages/BillingPage.jsx`
- `/audit` → `modules/audit/pages/AuditLogPage.jsx`
- `/field-agents` → `modules/field-agents/*`
- `/field-agents/check-in` → `modules/field-agents/*`
- `/settings/database` → `modules/locations/pages/DatabaseRequestsPage.jsx` (exports settings + requests pages)
- `/system/locations` → `modules/locations/pages/LocationsPage.jsx`
- `/system/locations/new` → `modules/locations/pages/LocationRolloutPage.jsx`
- `/system/database-requests` → `modules/locations/pages/DatabaseRequestsPage.jsx`
- `/system/monitoring` → `modules/monitoring/pages/MonitoringPage.jsx`

---

## 2) Supabase Data Map (Detailed)

### 2.1 Supabase clients

**Preferred singleton (typed):**
- `packages/database/src/client.ts` exports `supabase` and should be the only creator.

**Other client creators (legacy / duplicated):**
- `src/supabase/supabase.js`
- `apps/web/src/supabase/supabase.js`
- `acute-connect-fixes/src/supabase/supabase.js`

### 2.2 Tables (from migrations + code references)

> The table list below is derived from `supabase/migrations/*` plus tables referenced in code.

#### Identity / auth bridging
- `client_accounts`
  - Purpose: links `auth.users` → `clients_1777020684735`.
  - Used by: `src/App.jsx` auth listener (`supabase.auth.onAuthStateChange`) to hydrate the client portal.

#### Staff login support
- `admin_users_1777025000000`
  - Used by: staff login in `src/App.jsx`.
- `login_otp_codes_1777090007`
  - Used by: staff OTP flow in `src/App.jsx` and `packages/auth`.

#### Core clinical / operational MVP
- `clients_1777020684735`
  - Used by: CRM, Triage, Crisis, Admin dashboards, conversion flows.
- `check_ins_1740395000`
  - Used by: dashboards, triage, overseer monitoring.
- `crns_1740395000`
  - Used by: CRN generation + assignment.
- `crn_requests_1777090006`
  - Used by: CRM queue + badge counts in some tracks.
- `care_centres_1777090000`
  - Used by: centre listing, toggles, routing.
- `locations_1740395000`
  - Used by: overseer + system location management.
- `providers_1740395000`
  - Used by: professionals directory.
- `crisis_events_1777090000`
  - Used by: crisis dashboard + realtime.

#### Feedback / requests
- `feedback_tickets_1777090000`
- `feature_requests_1777090000`
- `org_access_requests_1777090000`

#### Audit / monitoring
- `audit_logs_1777090020`
  - Used by: `src/pages/system/AuditLogPage.jsx`.
  - Realtime: postgres_changes INSERT subscription supported.

#### Provisioning / rollout
- `provision_credentials`
- `location_instances`
- `location_health_checks`
- `location_api_usage`

#### Clinical notes (separate table + column)
- `clinical_notes_1777090003`
  - `check_in_id` references `check_ins_1740395000(id)`.
- Column: `clients_1777020684735.clinical_notes jsonb`

#### Jax AI agent tables
- `jax_documents`
- `agent_conversations`
- `jax_form_registry`
- `jax_notifications`

### 2.3 Realtime map

- `audit_logs_1777090020`
  - Subscriber: `src/pages/system/AuditLogPage.jsx` (channel: `audit_log_realtime`).
- `check_ins_1740395000`
  - Subscriber: `acute-connect-fixes/src/pages/system/OverseerDashboard.jsx` (channel: `overseer_checkins`).
- `crisis_events_1777090000`
  - Subscriber: `acute-connect-fixes/src/pages/system/OverseerDashboard.jsx` (channel: `overseer_crises`).

### 2.4 Serverless / backend writers (important “agent entry points”)

- `netlify/functions/request-crn.mts`
  - Writes/reads a broader set of tables (integration spine): `profiles`, `consent_agreements`, `crn_records`, `audit_logs`, `profile_audit_log`, plus updates `clients_1777020684735.event_log`.
- `apps/web/netlify/functions/jax-handler.mts`
  - Implements REST-level helpers for Supabase (`/rest/v1/...`) and writes audit rows.

---

## 3) “Connected tables → pages” index (quick reference)

### `clients_1777020684735`
- `src/pages/admin/CRMPage.jsx` (create/update/delete clients)
- `src/pages/admin/TriageDashboard.jsx` (convert check-in → client)
- `src/pages/admin/CrisisPage.jsx` (select active clients)
- `src/pages/AdminViews.jsx` (dashboard list)

### `check_ins_1740395000`
- `src/pages/admin/TriageDashboard.jsx`
- `src/pages/AdminViews.jsx`
- `acute-connect-fixes/src/pages/system/OverseerDashboard.jsx`

### `care_centres_1777090000`
- `src/pages/admin/CRMPage.jsx`
- `src/pages/AdminViews.jsx`

### `crn_requests_1777090006`
- `src/pages/admin/CRMPage.jsx`

### `crisis_events_1777090000`
- `src/pages/admin/CrisisPage.jsx`
- `acute-connect-fixes/src/pages/system/OverseerDashboard.jsx`

### `audit_logs_1777090020`
- `src/pages/system/AuditLogPage.jsx` (select + realtime)

### `feedback_tickets_1777090000`
- `src/App.jsx` (FeedbackModal insert + badge count)

### `client_accounts`
- `src/App.jsx` Supabase auth state hydration for client portal

---

## 4) Recommended next hardening step (for correctness)

To make this 100% complete, add a small script that scans the repo for:
- `supabase.from('...')`, `supabase.channel(`, `postgres_changes`, `rpc(`, `storage.from(`

and outputs a generated JSON/Markdown matrix. That removes any dependency on GitHub search result limits.
