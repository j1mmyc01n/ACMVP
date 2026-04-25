# Acute Connect — TODO & Request Tracker
_Last updated: v2.9.2_

---

## ✅ CONFIRMED COMPLETED

- [x] Menu freezing after login — stopPropagation + touchAction fix
- [x] Golden lightbulb feedback icon in header
- [x] OTP login (6-digit, 10 min expiry, single-use, Supabase-backed)
- [x] Password login with Supabase staff lookup
- [x] PWA install prompt (menu + header)
- [x] Dark mode toggle
- [x] Badge visibility toggle
- [x] Triage Dashboard
- [x] Clinical Reports with CSV export
- [x] **PDF reports** — removed "professional receipt" header, text now aligned at the top
- [x] **CRN requests tab** — fully actionable (Approve → creates client, Reject)
- [x] **Client profiles** — full rectangular card view with tabbed interface:
    - [x] Gradient header with name, CRN, status, care centre, mood trend
    - [x] Tabbed: Details / Notes & Reports / Team & Emergency / Event Log
    - [x] Editable core details (name, email, phone, category, care centre)
    - [x] Failover centre assignment (used during staff shortages/system failures)
    - [x] Clinical notes textarea with auto-logging on blur
    - [x] Clinical reports / check-in history attached
    - [x] Mood trend visualisation (coloured dots, last 10 visits)
    - [x] Assigned team members (add/remove with event logging)
    - [x] Police & emergency department assignment
    - [x] Full event log (timestamped, who accessed, summarised)
    - [x] Access control: only care team admins or assigned staff can open
- [x] **Multi-Centre Check-In Management** (new ADMIN module):
    - [x] Live centre cards with capacity bars (green/amber/red)
    - [x] Full/Near Full/Available status badges
    - [x] Client transfer between centres with modal
    - [x] Auto-route unassigned clients to available centres
    - [x] Unassigned clients alert + table
    - [x] Event logging on all transfers and auto-routes
    - [x] Summary stats: centres, active clients, unassigned, full centres
- [x] **Activity Log for Clients** (fully integrated in Client Profile Card)
- [x] **Crisis Event Reporting** (dedicated Crisis Management module)
- [x] **Multi-User Assignment for Crisis Events**
- [x] Care Centre management (CRUD)
- [x] Staff Management (CRUD)
- [x] Module Access Control (role-based)
- [x] Feedback & Tickets system with resolve workflow
- [x] Feature Requests with voting and status management
- [x] Heat Map & AI Dispatch
- [x] Crisis Management & Analytics
- [x] Bulk Offboarding
- [x] Invoicing & Billing (SysAdmin)
- [x] Sponsor Ledger (SysAdmin)
- [x] Integrations hub (Google, Outlook, Calendly, OpenAI)
- [x] AI Code Fixer (Anthropic Claude 3.5 Sonnet)
- [x] Location Rollout Manager
- [x] Provider & Sponsor join pages
- [x] Jax AI assistant (OpenAI floating chat)
- [x] GitHub AI Agent (GPT-style right-side drawer, SysAdmin only)

---

## 🔄 IN PROGRESS

- [ ] Real-time notifications for critical events via WebSocket
- [ ] Vercel webhook for live preview in GitHub Agent

---

## 📋 BACKLOG

- [ ] Multi-factor authentication for SysAdmin
- [ ] Custom report builder for clinical data
- [ ] Secure file sharing between team members
- [ ] Mobile responsiveness audit across all dashboard views
- [ ] Separate module file per integration (Google, Outlook, Calendly, AI)