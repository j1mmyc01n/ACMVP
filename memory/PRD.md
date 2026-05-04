# Crisis Patient Kanban — PRD

## Original Problem Statement
> Create a kanban module for my saas project to monitor the crisis patients of
> https://acmvp.netlify.app/ , have look better than the image, fully modular,
> dragable and colour change with crisis level. The cards will link up to my
> databases to track patients status and move and update by themselves if the
> users profile is updated on another screen.

## Target SaaS
Acute Connect — mental-health / acute-care platform (clients identified by CRN).

## User Personas
- **Clinician** — triages patients across severity lanes, takes action on critical cases.
- **Admin / Sys-admin** — oversees overall load, reviews overdue reviews and clinician workload.

## Core Requirements (static)
- 5-column Kanban (Stable → Monitoring → Elevated → High Risk → Critical) with clinically meaningful color ramp.
- Draggable patient cards; severity accent changes immediately on move.
- Every card surfaces: avatar, name, CRN, age, crisis level, risk score dial, vitals (HR/BP/SpO₂), assigned clinician, last update, review date, notes indicator.
- Cards must auto-update across every open screen in real time (WebSockets).
- Linked to a database (MongoDB) so status is persisted and queryable.
- Distinctive dark clinical UI that exceeds the reference screenshot (no AI-slop).

## Architecture
- **Backend:** FastAPI + Motor (MongoDB) + `WebSocket /api/ws` with ConnectionManager broadcast.
- **Frontend:** React 19, `@hello-pangea/dnd`, shadcn/ui, lucide-react, sonner, custom `useKanbanWebSocket` hook.
- **Fonts:** Manrope (headings/KPIs), IBM Plex Sans (body), JetBrains Mono (clinical data).
- **Theme:** Deep slate `#090E17` with glassmorphic KPI cards, severity left-border accents, risk-score SVG dials.

## Backend Endpoints
- `GET  /api/`                        → health
- `GET  /api/patients`                → list
- `POST /api/patients`                → create (+ ws `patient.created`)
- `PATCH /api/patients/{id}`          → update (+ ws `patient.updated`)
- `PATCH /api/patients/{id}/move`    → move column + reorder (+ ws `patient.moved`)
- `DELETE /api/patients/{id}`         → delete (+ ws `patient.deleted`)
- `POST /api/patients/seed?reset=1`  → reseed demo (+ ws `patients.seeded`)
- `WS   /api/ws`                      → snapshot on connect + live mutations

## What's Been Implemented (Iteration 1 — Jan 2026)
- Full backend CRUD with WebSocket broadcast; auto-seed of 12 demo patients on startup.
- Drag-and-drop kanban, optimistic updates + server persistence.
- KPI strip (Total / Critical / Overdue / Avg Risk) with glassmorphic depth.
- Patient drawer (inline-edit every field + delete) and New-patient dialog.
- Search (name / CRN / clinician) + clinician dropdown filter.
- Live WebSocket indicator (green pulse) + card pulse ring on remote updates.
- Dedupe guard on create to prevent React duplicate-key races vs. WS broadcast.
- Backend pytest suite: 15/15 PASS (REST + WebSocket). Frontend Playwright smoke PASS.

## Prioritized Backlog
### P1 (next up)
- Hook real Acute Connect patient DB (replace local seed): adapter layer in `server.py` + env-driven base URL.
- Historical vitals timeline chart in drawer (recharts).
- Audit log: persist column moves with actor + timestamp.

### P2
- Role-based auth (clinician vs. admin) with JWT — integrate later.
- Export board snapshot (CSV / PDF) for shift handover.
- Bulk "acknowledge critical" action on the Critical column.
- Smart alerts (SMS / email) when a patient enters Critical (Twilio/Resend integration).

## Known Minor Issues
- DialogContent / SheetContent lack an aria-describedby (a11y console warning only, non-blocking).

## Next Action Items
- Await user feedback / real DB credentials for Acute Connect integration.
- Add historical vitals timeline and audit log once data source is connected.
