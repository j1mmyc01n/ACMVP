# ACMVP — Architecture Reference

## Overview

ACMVP (Acute Care Management & Value Platform) is a Progressive Web App for
Acute Care Services, a mental health and crisis management provider operating
in Camperdown, NSW, Australia.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.3.1 |
| Build | Vite 5.1.6 |
| Styling | Tailwind CSS 3 + custom design system (`src/styles/acute.css`) |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Animations | Framer Motion 11 |
| Charts | Recharts 3 |
| Icons | React Icons 5 (Feather icon set via `FiIcons`) |
| PWA | vite-plugin-pwa 1.2 + Workbox |
| Deployment | Netlify (Node 20, `dist/`, SPA catch-all redirect) |

---

## Project Structure

```
src/
├── App.jsx                    # Root: auth, routing, layout, SmartMenu
├── main.jsx                   # React entry point
├── styles/acute.css           # Design system (CSS custom properties, layout)
│
├── common/
│   └── SafeIcon.jsx           # Null-safe react-icons wrapper
│
├── components/
│   ├── UI.jsx                 # Shared primitives: Button, Badge, Field, Input, Select, Card
│   ├── JaxAI.jsx              # Floating AI assistant chat (role-gated, goto prop)
│   ├── ModernComponents.jsx   # Higher-level UI components
│   ├── GitHubAgent.jsx        # GitHub issue/PR automation panel
│   ├── PWAInstallPrompt.jsx   # iOS/Android install banner
│   ├── PatientCard.jsx        # Patient summary card
│   ├── SimplePatientCard.jsx  # Compact patient card
│   └── ResourceHub.jsx        # External resource directory
│
├── lib/
│   ├── menu.js                # SmartMenu structure: groups, items, roles, badges
│   ├── utils.js               # Shared helpers (date format, CRN gen, etc.)
│   └── locationRolloutUtils.js# Location rollout planning logic
│
├── pages/
│   ├── AdminViews.jsx         # Barrel: AdminDashboard + re-exports from admin/
│   ├── SystemViews.jsx        # Barrel: SysAdminDashboard + re-exports from system/
│   ├── ClientViews.jsx        # Public + client pages (CheckIn, Resources, etc.)
│   │
│   ├── admin/
│   │   ├── ModernTriageDashboard.jsx  # Main admin dashboard
│   │   ├── CRMPage.jsx                # Full patient CRM
│   │   ├── ClientCRM.jsx              # CRM sub-component
│   │   ├── ClientProfileCard.jsx      # Patient profile
│   │   ├── CRNGenerator.jsx           # CRN issuance tool
│   │   ├── PatientDirectoryGrid.jsx   # Searchable patient grid
│   │   ├── PatientRegistry.jsx        # New patient registration
│   │   ├── CrisisPage.jsx             # Crisis event management
│   │   ├── ReportsPage.jsx            # Clinical reports + CSV export
│   │   ├── InvoicingPage.jsx          # Invoicing & billing
│   │   ├── SponsorLedger.jsx          # Sponsor management
│   │   ├── MultiCentreCheckin.jsx     # Multi-centre check-in view
│   │   ├── TriageDashboard.jsx        # Legacy triage dashboard
│   │   └── AdditionalPages.jsx        # BulkOffboarding, CrisisAnalytics, FeedbackDash
│   │
│   ├── system/
│   │   ├── LocationsPage.jsx          # Care Centres management (SYSADMIN)
│   │   ├── UsersPage.jsx              # Staff management (SYSADMIN)
│   │   ├── AuditLogPage.jsx           # Compliance audit log + AI insights
│   │   ├── OverseerDashboard.jsx      # System overview dashboard
│   │   └── LocationRollout.jsx        # Location expansion planning
│   │
│   └── client/
│       └── ClientPortal.jsx           # Logged-in client view
│
└── supabase/
    ├── supabase.js             # Supabase client (reads env vars with hardcoded fallbacks)
    └── migrations/             # 20+ timestamped SQL migration files
```

---

## Routing

Routing is **custom state-based**, not React Router (react-router-dom is
installed but unused at runtime). `App.jsx` maintains a `page` string in
`useState` and a `PageRenderer` component maps page IDs to components via
`switch/case`.

```
page state → PageRenderer → <ComponentForPage />
```

Navigation is done by calling `setPage(id)` (exposed as `goto` prop
throughout the tree, including to `JaxAI`).

Public page IDs: `checkin`, `resources`, `professionals`, `join_provider`, `join_sponsor`

Admin page IDs: `admin`, `crm`, `crisis`, `reports`, `invoicing`, `multicentre`, `bulk_offboard`, `crisis_analytics`, `feedback_dash`, `resource_hub`, `heatmap`, `integrations`

SysAdmin page IDs: `sysdash`, `offices`, `users`, `audit_log`, `overseer`, `rollout`, `feedback`, `features`, `sponsor_ledger`, `provider_metrics`, `settings`, `super_admin`, `ai_fixer`, `github_agent`

---

## Authentication

Three auth modes, all using the same Supabase project:

### Staff (password + OTP)
- Email + password login — checked against `admin_users_1777025000000` table
- OTP fallback — 6-digit code stored in `login_otp_codes_1777090007`, 10-minute expiry
- Session stored in `sessionStorage` under key `ac_staff_role`
- Role (`admin` / `sysadmin`) comes from the `role` column in `admin_users_1777025000000`

### Client portal (magic link)
- Created via Supabase Edge Function `create-client-account` (Deno, uses service role key)
- Pre-confirmed auth user, magic link delivered by email
- On link click → redirect to `/checkin` → session auto-detected
- Client record in `client_accounts` table (links `auth_user_id` → CRN)

### Default staff accounts (seeded in migration)
- `ops@acuteconnect.health` → role: `admin`
- `sysadmin@acuteconnect.health` → role: `sysadmin`

---

## Role Model

| Role | Access |
|---|---|
| `null` (public) | Check-In, Get CRN, Resources, Professionals, Join pages |
| `client` | Client portal (my_portal) |
| `admin` | All patient/clinical/crisis/CRM/invoice/integration pages |
| `sysadmin` | Everything + system config, staff, care centres, settings |

`JaxAI` chat is only mounted for `admin` and `sysadmin` roles.

---

## Database Tables

| Table | Purpose |
|---|---|
| `admin_users_1777025000000` | Staff accounts: `email`, `role`, `status` |
| `client_accounts` | Client portal accounts: `auth_user_id`, `crn`, `email`, `status` |
| `clients` | Patient records: name, CRN, care_centre, status, support_category |
| `care_centres_1777090000` | Facilities: `name`, `suffix`, `address`, `beds`, `status` |
| `crn_requests_1777090006` | Self-service CRN requests |
| `login_otp_codes_1777090007` | OTP codes for staff auth |
| `sponsors` | Sponsor records: name, logo_data, tier |
| `feedback_tickets_1777090000` | Feedback/idea submissions |
| `audit_logs_1777090020` | System audit trail (falls back to mock data if empty) |

All tables use RLS policies. The anon key is safe to use in frontend code.
The service role key is only used in the Edge Function.

---

## Design System

Custom CSS in `src/styles/acute.css` using CSS custom properties:

```css
--ac-primary: #507C7B    /* teal — primary brand */
--ac-surface: #FFFFFF    /* card backgrounds */
--ac-bg: #F8F9FA         /* page background */
--ac-border: #E2E8F0     /* borders */
--ac-text: #1C1C1E       /* primary text */
--ac-muted: #94A3B8      /* secondary text */
```

Key layout classes: `ac-app`, `ac-shell`, `ac-drawer`, `ac-top`, `ac-main`,
`ac-card`, `ac-grid-2/3/4`, `ac-stat-tile`, `ac-btn`, `ac-table`,
`ac-stack`, `ac-scrim`, `ac-sidebar-toggle`.

On desktop (≥768px) the drawer is always visible (persistent sidebar).
On mobile the drawer is toggled by a hamburger button.

---

## PWA

- Install prompt on mobile and desktop
- Offline-first: fonts, images, and API responses are cached via Workbox
- Auto-updating service worker (`registerType: 'autoUpdate'`)
- Manifest: standalone, portrait, theme `#4F46E5`

---

## Deployment

```
npm run build     # outputs to dist/
```

Hosted on Netlify. `netlify.toml`:
- Build command: `npm run build`
- Publish dir: `dist`
- Node version: 20
- SPA catch-all: `/* → /index.html (200)`
- Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- Asset caching: `/assets/*` immutable, 1 year

---

## Edge Functions

One Supabase Edge Function (Deno runtime):

**`supabase/functions/create-client-account/index.ts`**
- Creates a Supabase Auth user with `role: client` metadata
- Pre-confirms email
- Creates `client_accounts` record
- Sends magic link welcome email
- Uses `SUPABASE_SERVICE_ROLE_KEY` (never exposed to frontend)
