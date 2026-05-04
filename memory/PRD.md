# Crisis Patient Kanban — PRD

## Original Problem Statement
> Create a kanban module for my saas project to monitor the crisis patients of
> https://acmvp.netlify.app/ ... draggable, color-changes with crisis level,
> linked to the database, auto-updates when the profile is edited elsewhere.
>
> Iteration 2: "Take off everything from the module — just the kanban cards.
> They pull their info from the patient profile / crisis management dashboard.
> The Kanban view sits inside the crisis dashboard as a tab and can be
> maximized to release from the platform onto another display."

## Information Architecture
- Route `/`           → **Crisis Dashboard** (single page with tabs)
  - Tab "Patient Profiles" → editable list (source of truth)
  - Tab "Kanban"           → bare 5-column kanban cards + Pop-out button
- Route `/kanban`     → **Kanban Popout** (chrome-less full-screen kanban for a second display)

## User Personas
- **Clinician** — works mostly in the Patient Profiles tab; flips to Kanban for triage; pops it out onto a wall display.
- **Charge nurse / admin** — leaves the popped-out Kanban running on a second monitor 24/7.

## Core Requirements
- Five severity lanes (Stable → Monitoring → Elevated → High Risk → Critical) with clinically meaningful color ramp.
- Cards: avatar, name, CRN, age, crisis-level badge, risk-score dial, vitals (HR/BP/SpO₂), assigned clinician, last update, review date, notes flag.
- Cards are draggable; severity accent re-colors instantly on drop.
- All boards share a single MongoDB source of truth and broadcast via WebSocket so every screen (tab, popped-out window, other clinicians) auto-updates within ~1s.
- Kanban tab is intentionally minimal (no KPIs, filters, or add/reseed) — those affordances live on the Patient Profiles tab.
- "Pop out" opens `/kanban` in a new browser window via `window.open` so it can be dragged to a second display.

## Architecture
- **Backend:** FastAPI + Motor (MongoDB) + WebSocket `/api/ws` with ConnectionManager broadcast.
- **Frontend:** React 19, `@hello-pangea/dnd`, shadcn/ui (Tabs, Dialog, Sheet), lucide-react, sonner, custom `useKanbanWebSocket` hook.
- **Theme:** Manrope (headings), IBM Plex Sans (body), JetBrains Mono (clinical numbers); deep slate `#090E17`, severity left-border accents, SVG risk dials.

## Backend Endpoints (unchanged from iter-1)
- `GET  /api/patients`, `POST /api/patients`, `PATCH /api/patients/{id}`,
  `PATCH /api/patients/{id}/move`, `DELETE /api/patients/{id}`,
  `POST /api/patients/seed?reset=1`
- `WS /api/ws` (snapshot on connect + per-mutation broadcast)

## What's Been Implemented
- **Iter-1 (Jan 2026):** Standalone Kanban with KPIs, filters, drawer, add dialog. 15/15 backend pytest PASS, frontend Playwright PASS.
- **Iter-2 (Jan 2026):**
  - Stripped the Kanban view to **cards only**; moved KPIs, search, add/reseed away.
  - New **Crisis Dashboard** with two tabs: Patient Profiles + Kanban.
  - New **Patient Profiles** editable list — single source of truth; edits auto-sync to Kanban via WebSocket.
  - **Pop out** button on the Kanban tab → `/kanban` route opens in `window.open`, draggable to a second monitor.
  - Drag-and-drop still persists `crisis_level` + `order` so moves on the kanban update the patient profile too.

## Prioritized Backlog
### P1
- Replace local seed with the real Acute Connect patient DB (adapter layer).
- Per-clinician filtering on the Profiles tab.
- Historical vitals timeline chart on patient profile.

### P2
- Role-based auth (clinician vs. admin).
- Audit trail of column moves with actor + timestamp.
- "Critical Response SLA" widget — first-touch latency per critical patient.
- Critical-entry alerts (Twilio SMS / Resend email).
- CSV / PDF shift-handover export.

## Known Minor Issues
- DialogContent / SheetContent lack aria-describedby (a11y warning only).

## Next Action Items
- Connect to the real Acute Connect database (need API base URL + auth or a sample record shape).
- Add the historical vitals chart inside the Patient Profile row expansion.
