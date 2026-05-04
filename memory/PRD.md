# JimmyAi CRM — PRD

## Original problem statement
Healthcare CRM inspired by a C3-style dashboard but in a light/white theme
and matching the "Acute Connect" kanban look & feel. Patients intake all
fields mapped, location-specific custom fields pullable, profile cards
stacked with requested call day/time on the right, AI predicts patterns,
Twilio calling + social + calendar integrations (Outlook / Google / iOS /
Calendly), no Emergent branding. No in-app login (activated by parent
platform). Rebrand: **JimmyAi**.

## User choices (verbatim)
- AI: Claude Sonnet 4.5 (Emergent Universal Key)
- Twilio: mocked UI for now
- Calendar: Outlook, Google, iOS, Calendly — no Emergent branding
- Auth: none in-app (inherited from host platform)
- Look & feel: match the Acute Connect kanban module
- Brand: JimmyAi

## Architecture
- Frontend: React 19 + Tailwind + shadcn/ui + recharts + sonner +
  lucide-react. Fonts: Fraunces (display) + Geist (UI) + JetBrains Mono.
  Router with 8 pages behind a shared `AppShell` (sidebar + top bar +
  intake drawer + detail drawer + call-queue rail).
- Backend: FastAPI + Motor + Pydantic + emergentintegrations (Claude).
- DB: Mongo — `locations`, `patients`, `clinical_notes`, `documents`,
  `call_queue`, `call_logs`, `calendar_events`, `ai_insights`.

## Implemented (Feb 2026)
- [x] **Shell**: JimmyAi branded sidebar (collapsible) + global top bar
      (search, Call queue counter, Pop out, New intake).
- [x] **Overview** — 4 KPI cards, Claude-powered forecast chart,
      per-lane distribution, pattern-intelligence insights, Escalate-now
      list.
- [x] **Patients** — table with lane chips, score, preferred window,
      doctor; filters by location and risk lane + global search.
- [x] **Kanban** — 5 lanes (Stable / Monitoring / Elevated / High risk /
      Critical) with colored tops, score ranges, overdue badges,
      card-per-patient matching the Acute Connect card format.
- [x] **Calendar** — monthly grid with scheduled calls from
      `/api/calendar/events`, Upcoming list, provider-coloured strips.
- [x] **Call Queue** — dedicated page with full-size queue cards, Twilio
      call button (MOCKED), social buttons, Schedule dropdown.
- [x] **AI Studio** — global Claude insights + per-patient prediction.
- [x] **Locations** — editable custom-fields editor per clinic, saved
      via `PATCH /api/locations/{id}/custom-fields`.
- [x] **Settings** — integration placeholders (Twilio / Google / Outlook
      / Calendly) and AI / workspace info.
- [x] **New intake** drawer — all core fields + Patient ID / CRN + DOB +
      location + concern + preferred day/time + insurance + source +
      notes + per-location custom fields + user-added extras; auto-adds
      to call queue.
- [x] **Patient detail** drawer — 5 tabs (Overview / Clinical Notes /
      Documents / Call History / AI Insights with live Claude prediction).
- [x] Seeded 12 patients across 3 locations with vitals, scores and
      doctors so the UI is immediately populated.

## Next Action Items (P1 / P2 backlog)
- P1 Drag-and-drop kanban lane changes (persist `escalation_score`).
- P1 Real Twilio wiring (user supplies SID / token / from-number).
- P1 Real OAuth for Google / Outlook / Calendly.
- P1 Document upload via object storage.
- P2 Per-patient timeline (notes + calls + schedule merged).
- P2 Bulk actions (call all High risk, export).
- P2 Per-location working-hours + doctor roster.
