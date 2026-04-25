# Acute Connect — Changelog

## v2.9.2 — Current
### Added
- ✅ **Multi-Centre Check-In Management** (`/multicentre` — ADMIN menu):
  - Live centre cards with capacity bars and colour-coded status (green/amber/red)
  - Full / Near Full / Available status badges per centre
  - Client transfer modal between centres
  - Auto-route unassigned clients to available centres
  - Unassigned clients alert banner + table
  - Summary stats bar (total centres, active clients, unassigned, full centres)
  - All transfers and auto-routes write to client event log automatically

### Improved
- ✅ **Enhanced Client Profile Card** — complete redesign:
  - Gradient header (blue → indigo) showing name, CRN, status, care centre, mood trend
  - Tabbed layout: Details / Notes & Reports / Team & Emergency / Event Log
  - Mood trend visualisation with coloured dots (last 10 check-ins)
  - Failover centre assignment field (used during staff shortages or system failures)
  - Event log tab with full timestamped history in card format
  - All sections fully editable and saved back to Supabase

---

## v2.9.1
### Fixed
- ✅ PDF reports — removed "professional receipt" header, content aligned to top
- ✅ CRN Requests — Approve (auto-creates client + issues CRN) and Reject actions
- ✅ Client Profiles — open as full rectangular card modal, all fields editable
- ✅ Care team access control — non-assigned admins see "Access Restricted" screen

---

## v2.8.0
### Added
- GitHub AI Agent Panel (GPT-style right-side drawer, SysAdmin only)
- GitHub icon in header triggers panel

### Fixed
- Menu freezing after SysAdmin login

---

## v2.7.0
### Added
- AI Code Fixer (Anthropic Claude 3.5 Sonnet)
- Location Rollout Manager

---

## v2.6.0
### Added
- PWA install prompt, OTP login, golden lightbulb feedback icon
- Heat Map & AI Dispatch, Crisis Analytics, Bulk Offboarding
- Invoicing, Sponsor Ledger, Care Centre CRUD, Staff Management, Module Access Control

---

## v2.5.0
### Added
- Care team assignment for client profiles
- Crisis analytics dashboard
- Provider & Sponsor join pages

---

## v2.0.0
### Added
- Jax AI assistant, Password + OTP auth, CRM, Triage Dashboard
- Clinical Reports, Integrations hub, Dark mode