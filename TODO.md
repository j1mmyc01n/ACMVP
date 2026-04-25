# Acute Connect — TODO & Request Tracker
_Last updated: v4.0.1 — Full Stack PWA_

---

## ✅ CONFIRMED COMPLETED

### Authentication & Access
- [x] OTP login (6-digit, 10 min expiry, single-use, Supabase-backed)
- [x] Password login with Supabase staff lookup
- [x] Care team access control — admin-only per care team, failover routing
- [x] PWA install prompt (menu + header)

### Client Management
- [x] Client profiles — full rectangular card view with tabbed interface (all editable)
- [x] CRM CRN Requests — all rows editable/actionable, no stuck states
- [x] Multi-Centre Check-In Management
- [x] Activity Log for Clients — in Client Profile Card
- [x] PDF reports — removed "professional receipt" header, text aligned top

### Admin Features
- [x] Triage Dashboard
- [x] Clinical Reports with CSV export
- [x] Crisis Event Reporting
- [x] Multi-User Assignment for Crisis Events
- [x] Crisis Management & Analytics
- [x] Bulk Offboarding
- [x] Invoicing & Billing (SysAdmin)
- [x] Sponsor Ledger (SysAdmin)
- [x] Heat Map & AI Dispatch

### System Administration
- [x] **Overseer Dashboard** — Real-time NOC monitoring
  - Live location telemetry with animated SVG gauges
  - System health metrics (uptime, throughput, bandwidth)
  - Network status for all locations
  - Real-time event stream
  
- [x] **Location Rollout System** — Fully automated deployment pipeline
  - **Infrastructure Integration**: GitHub, Netlify, Supabase credential inputs
  - **Care Type Tailoring**: Mental health, domestic violence, crisis support, substance abuse, youth services
  - **Automated Task Generation**: Care-type-specific checklist creation
  - **Phase-Based Deployment**: Planning → IT Setup → Staff Training → Testing → Live
  - **User Provisioning**: Contact management and account creation
  - **Deployment Simulation**: Real-time terminal logs for deployment process
  - **Progress Tracking**: Visual pipeline with completion percentages
  - **Template System**: Uses Acute Care as base template for all deployments
  - **Professional Dashboard**: Financial-style UI with metrics and charts
  - **API Key Management**: Secure credential delivery and storage
  - **Credit Monitoring**: Real-time usage tracking and analytics
  - **Billing System**: Automated invoice generation and payment tracking
  - **IT Monitoring**: Infrastructure health checks and alerts
  - **Autonomous Operations**: Scheduled health checks and alert evaluation

- [x] Location management (renamed from Care Centres)
- [x] Staff Management (CRUD)
- [x] Module Access Control (role-based)
- [x] Integrations hub
- [x] AI Code Fixer
- [x] GitHub AI Agent

### User Feedback
- [x] Feedback & Tickets system
- [x] Feature Requests with voting
- [x] Golden lightbulb feedback icon in header

### UI/UX
- [x] Dark mode toggle
- [x] Badge visibility toggle
- [x] Menu freezing fix — stopPropagation + touchAction
- [x] Provider & Sponsor join pages
- [x] Jax AI assistant

### Architecture
- [x] Modular file structure for system pages
- [x] Separated Overseer and Location Rollout into distinct modules
- [x] Created comprehensive documentation (FILE_STRUCTURE_MAP.md)
- [x] Updated CHANGELOG.md with version history

---

## 🔄 IN PROGRESS

_No active tasks. All requested features have been implemented._

---

## 📋 BACKLOG

- [ ] Complete AdminViews.jsx modularization (split into separate files)
- [ ] Extract business logic into `/features/` directory
- [ ] Real-time WebSocket notifications for critical events
- [ ] Multi-factor authentication for SysAdmin
- [ ] Custom report builder for clinical data
- [ ] Secure file sharing between team members
- [ ] Mobile responsiveness audit
- [ ] Advanced analytics dashboard
- [ ] Automated backup system
- [ ] TypeScript migration