# ACMVP — Feature Backlog

Status legend: **Live** = fully implemented and wired | **Stub** = page exists, not wired to real data | **Planned** = not started

---

## Public / Client-facing

| Feature | Status | File(s) | Notes |
|---|---|---|---|
| Client Check-In (CRN lookup + callback window) | **Live** | `ClientViews.jsx` | Mobile-first, connects to `clients` table |
| Get CRN (self-service registration) | **Live** | `ClientViews.jsx` | Inserts into `crn_requests_1777090006` |
| Client Portal (logged-in client view) | **Live** | `client/ClientPortal.jsx` | Magic link auth via Supabase |
| Resources page | **Live** | `ClientViews.jsx` | Static resource directory |
| Professionals directory | **Live** | `ClientViews.jsx` | Staff/provider listing |
| Join as Provider | **Live** | `ClientViews.jsx` | Form → `sponsors` table |
| Become a Sponsor | **Live** | `ClientViews.jsx` | Form with tier selection |
| PWA install prompt | **Live** | `PWAInstallPrompt.jsx` | iOS + Android install banner |
| Offline caching | **Live** | `vite.config.js` (Workbox) | Fonts, images, API calls cached |

---

## Admin

| Feature | Status | File(s) | Notes |
|---|---|---|---|
| Triage Dashboard | **Live** | `admin/ModernTriageDashboard.jsx` | Pending check-ins, mood scores, patient queue |
| Patient CRM | **Live** | `admin/CRMPage.jsx`, `ClientCRM.jsx` | Full CRUD, care centre assignment |
| Patient registration | **Live** | `admin/PatientRegistry.jsx` | Auto CRN generation |
| Patient directory (grid) | **Live** | `admin/PatientDirectoryGrid.jsx` | Searchable/filterable |
| Crisis management | **Live** | `admin/CrisisPage.jsx` | Raise events, police/ambulance dispatch |
| Clinical reports | **Live** | `admin/ReportsPage.jsx` | Check-in history, clinical notes, CSV export |
| Invoicing & billing | **Live** | `admin/InvoicingPage.jsx` | Invoice management |
| Sponsor ledger | **Live** | `admin/SponsorLedger.jsx` | Sponsor records with logo |
| Multi-centre check-in | **Live** | `admin/MultiCentreCheckin.jsx` | Across-centre view |
| Bulk offboarding | **Live** | `admin/AdditionalPages.jsx` | Batch patient offboard |
| Feedback dashboard | **Live** | `admin/AdditionalPages.jsx` | View submitted feedback tickets |
| Crisis analytics | **Stub** | `admin/AdditionalPages.jsx` | UI exists, charts not wired to real data |
| Heat Map & Dispatch | **Stub** | `SystemViews.jsx` (`HeatMapPage`) | Placeholder — geographic client heatmap not built |
| AI Integration (OpenAI GPT) | **Stub** | `components/JaxAI.jsx` | Config exists in Integrations; fully functional once API key added in Admin → Integrations |
| Integrations page (config UI) | **Stub** | `SystemViews.jsx` (`IntegrationPage`) | Config panel exists in JaxAI but dedicated page is a stub |
| Resource Hub | **Live** | `components/ResourceHub.jsx` | External resource directory |

---

## SysAdmin

| Feature | Status | File(s) | Notes |
|---|---|---|---|
| System Dashboard | **Live** | `system/OverseerDashboard.jsx` | System-wide stats |
| Care Centres management | **Live** | `system/LocationsPage.jsx` | CRUD against `care_centres_1777090000` |
| Staff Management | **Live** | `system/UsersPage.jsx` | CRUD against `admin_users_1777025000000` |
| Audit Log | **Live** | `system/AuditLogPage.jsx` | Paginated log, source filters, AI insights, CSV export |
| Location Rollout planning | **Live** | `system/LocationRollout.jsx` | Expansion tracking with Supabase backing |
| Settings | **Stub** | `SystemViews.jsx` (`SettingsPage`) | No implementation yet |
| Super Admin | **Stub** | `SystemViews.jsx` (`SuperAdminPage`) | No implementation yet |
| Feedback & Tickets | **Stub** | `SystemViews.jsx` (`FeedbackPage`) | Table `feedback_tickets_1777090000` exists; UI is stub |
| Feature Requests | **Stub** | `SystemViews.jsx` (`FeatureRequestPage`) | No implementation yet |
| Provider Metrics | **Stub** | `SystemViews.jsx` (`ProviderMetricsPage`) | No implementation yet |
| AI Code Fixer | **Stub** | `SystemViews.jsx` (`AICodeFixerPage`) | Concept only |
| GitHub Agent | **Stub** | `SystemViews.jsx` (`GitHubAgentPage`), `components/GitHubAgent.jsx` | Component exists; page not wired |

---

## Infrastructure / Platform

| Feature | Status | Notes |
|---|---|---|
| Supabase Auth (password + OTP) | **Live** | Staff login via `admin_users_1777025000000` |
| Magic link auth (clients) | **Live** | Edge Function `create-client-account` |
| Row Level Security | **Live** | All tables have RLS policies |
| Persistent sidebar (desktop) | **Live** | CSS `@media ≥768px`, `ac-shell` layout |
| Mobile hamburger menu | **Live** | Overlay drawer on `<768px` |
| JaxAI platform assistant | **Live** | Role-gated (admin/sysadmin); navigates platform; nav intent detection |
| Dark mode | **Live** | CSS custom properties toggle |
| Netlify deploy + previews | **Live** | Auto-deploy on push to main |
| `npm run lint` / `npm test` | **Planned** | No lint or test scripts configured yet |
| External EHR sync | **Planned** | Referenced in JaxAI prompt; not implemented |
| Real-time notifications | **Planned** | Supabase Realtime not yet wired |
| Calendar / scheduling | **Planned** | Calendly integration mentioned in docs; not built |
| Google Workspace / Outlook SSO | **Planned** | Listed in integration docs; not built |

---

## Next Recommended Tickets (in priority order)

1. **Wire Integrations page** — build the actual config UI for AI engine, Google Workspace, Calendly (replace stub)
2. **Wire Settings page** — org name, timezone, notification preferences, password change
3. **Wire Feedback & Tickets page** — connect to `feedback_tickets_1777090000` (table already exists)
4. **Provider Metrics** — build charts from `sponsors` / check-in data
5. **Add `npm run lint`** — configure ESLint with React + import rules
6. **Crisis Analytics** — wire charts in `AdditionalPages.jsx` to real crisis event data
7. **Real-time triage updates** — Supabase Realtime subscription on `clients` for live queue changes
8. **Heat Map** — geographic distribution of clients by postcode using a mapping library
