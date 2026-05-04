# Sableheart CRM — PRD

## Original problem statement
Recreate a C3 AI CRM–inspired dashboard but in WHITE. Patients come into the
platform, all intake fields mapped, location-specific concern data pullable,
profile cards stacked on the right with the time they are requesting a call.
AI predicts patterns. Twilio calling + calendar integrations (Outlook / Google
/ iOS / Calendly) + social buttons. No Emergent branding anywhere. CRM
activated by login off-platform (no in-app login). Maximizable to full screen.

## User choices (verbatim)
- AI: Claude Sonnet 4.5
- Twilio: mocked UI
- Calendar: Outlook, Google, iOS, Calendly — no Emergent branding
- Auth: none in-app (activated by outer platform)
- Fields: Patient ID, CRN + standard set; location-customizable extras stored
  in secondary table; include Clinical Notes and Documents sections

## Architecture
- Frontend: React 19 + Tailwind + shadcn/ui + recharts + sonner + lucide-react.
  Fonts: Cormorant Garamond / Cabinet Grotesk / JetBrains Mono.
- Backend: FastAPI + Motor + Pydantic + emergentintegrations (Claude 4.5).
- DB: MongoDB — collections `locations`, `patients`, `clinical_notes`,
  `documents`, `call_queue`, `call_logs`, `calendar_events`, `ai_insights`.

## Implemented (Feb 2026)
- [x] KPI strip (patients, pending calls, conversion, AI forecast) + pipeline strip
- [x] Forecast vs Actual line/area chart (12 months, recharts)
- [x] AI Contributor panel — Claude Sonnet 4.5 generates 6 grouped insights
- [x] Patient ledger table with AI probability meters, stage pills
- [x] Patients-to-escalate list with AI-picked reasons
- [x] Right-rail Call Queue with airline-style boarding-pass cards
  - [x] Call via Twilio (mocked) — writes call_log
  - [x] Social buttons (SMS, Email, LinkedIn)
  - [x] Schedule dropdown → Google / Outlook / iOS / Calendly
- [x] Intake drawer — core fields + location custom fields + user-added extras
- [x] Patient detail drawer — Overview, Clinical Notes, Documents, Call History,
      AI Insights (live Claude prediction endpoint)
- [x] Location filter, search, fullscreen toggle, sidebar nav
- [x] Seed data: 3 locations, 12 patients, queue, notes, documents
- [x] No Emergent branding, no purple, no Inter/Roboto

## Next Action Items (P1/P2 backlog)
- P1 Calendar view page (grid of scheduled calls by day/location)
- P1 Location manager UI to edit custom fields per location
- P1 Wire real Twilio (user supplies SID/token) + webhook
- P1 Real OAuth for Google/Outlook/Calendly calendar creation
- P2 Per-patient AI probability recompute job after every note/call
- P2 Document upload (object storage integration) — currently metadata only
- P2 Role-based access control once parent platform sends a signed JWT
- P2 Analytics page — cohort retention, source→conversion funnel
