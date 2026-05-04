# Crisis Patient Kanban — PRD

## Original Problem Statement
> Create a kanban module for my saas project to monitor the crisis patients of
> https://acmvp.netlify.app/. Draggable, color-changes with crisis level,
> linked to the database, auto-updates when the profile is edited elsewhere.
>
> Iter-2: strip the kanban to just cards; tabs inside a Crisis Dashboard;
> pop-out for second display.
>
> Iter-3: white background.
>
> Iter-4: collapsible top region with a hamburger restore — full-screen kanban.
>
> Iter-5: remove Emergent branding from the module.

## Information Architecture
- `/`        → Crisis Dashboard
  - **Collapsible top region** (eyebrow + title + Tabs)
  - **Tab "Patient Profiles"** → editable list = single source of truth
  - **Tab "Kanban"** → bare 5-column kanban + Pop-out button
- `/kanban`  → Standalone Kanban Popout for a second display

## UX Behaviors (current)
- White background, severity color ramp tuned for light theme.
- "Collapse" button in the header → entire chrome (eyebrow + title + tabs) animates to height 0.
- Floating "MENU" hamburger appears top-left when collapsed → restores the chrome.
- "Pop out" opens `/kanban` in `window.open` — drag to a second monitor for ambient triage view.
- Live WebSocket indicator + card pulse ring on remote update.
- Drag-and-drop moves persist to DB and broadcast to all open screens.

## Architecture
- **Backend:** FastAPI + Motor (MongoDB), WebSocket `/api/ws` with ConnectionManager.
- **Frontend:** React 19, `@hello-pangea/dnd`, shadcn/ui (Tabs, Sheet, Dialog), lucide-react, sonner, custom `useKanbanWebSocket` hook.
- **Theme:** Manrope (headings) + IBM Plex Sans (body) + JetBrains Mono (clinical numbers); pure white background; severity left-border accents (emerald-600 → rose-700).

## Backend Endpoints
- `GET  /api/patients`, `POST /api/patients`, `PATCH /api/patients/{id}`,
  `PATCH /api/patients/{id}/move`, `DELETE /api/patients/{id}`,
  `POST /api/patients/seed?reset=1`, `WS /api/ws`.

## What's Been Implemented (cumulative through Iter-5, Jan 2026)
- Full CRUD + WebSocket; auto-seeds 12 demo patients on startup; 15/15 backend pytest PASS.
- Crisis Dashboard with Tabs: Patient Profiles (editable, source of truth) + Kanban (read/triage view).
- Pop-out kanban window for a second display.
- Drag-and-drop between severity lanes, severity-accent re-color on drop.
- Collapsible header (horizontal collapse animation) with hamburger restore for true full-screen Kanban.
- White theme across all components; severity colors AA-contrast on white.
- Emergent badge hidden site-wide; browser-tab title rebranded to "Acute Connect | Crisis Dashboard".

## Prioritized Backlog
### P1
- Connect to the real Acute Connect patient DB (adapter layer).
- Per-clinician + risk-range filters on Profiles tab.
- Vitals timeline chart inside each patient profile row.

### P2
- Role-based auth (clinician vs. admin).
- Audit trail of column moves (who/when/from→to).
- Critical Response SLA widget (first-touch latency per clinician).
- SMS / email alert on Critical entry (Twilio / Resend).
- CSV / PDF shift-handover export.
- F11 / native fullscreen toggle in the popped-out window.

## Known Minor Issues
- DialogContent / SheetContent lack aria-describedby (a11y warning only).

## Next Action Items
- Hook the live Acute Connect patient DB.
- Vitals timeline chart on the Profiles row.
