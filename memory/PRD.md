# Patient CRM — PRD

## Original problem statement
Recreate a CRM tailored for clinical/care locations with:
- White / light theme (no AI slop, no purple gradients, no Emergent branding).
- Multi-location architecture: data, integrations, billing scoped per location.
- Kanban / Pipeline board, right-rail Call Queue, Patient Intake forms with
  per-location custom fields.
- Claude AI Pattern / Probability insights (Sonnet 4.5 via Emergent LLM key).
- Twilio voice/SMS + Google / Outlook / Calendly calendar integrations
  (currently mocked behind toggles; awaiting tenant keys).
- System Admin portal with seat-based billing — $45 / mo CRM, $125 / mo AI
  add-on per seat.
- Admin-uploadable company logo + per-location pipeline stages.

## Architecture
- Frontend: React 18 + React Router + Tailwind + Shadcn UI. Geist + Fraunces
  type stack, JetBrains Mono for tickers. Pure white (#FFFFFF) base.
- Backend: FastAPI + Motor (Mongo). Emergent Object Storage for documents
  & uploaded brand logo.
- AI: Claude Sonnet 4.5 via emergentintegrations.

## Implemented
- Multi-page shell: Overview, Patients (Table | Kanban | Profiles toggle),
  Calendar, Call Queue, AI Studio, Integrations, System Admin.
- Patients: dynamic stages per location (default Intake → Triage → Active →
  Follow-up → Discharged). Patient cards show CRN chip, stage chip
  (Kanban only), assigned doctor, and "Updated …" timestamp.
- System Admin: Brand & Logo upload (5 MB max, PNG/JPG/SVG/WebP), seat-priced
  Care Centre management (Add / Edit / Delete + Pipeline Stage editor with
  colour, label, key, reset), billing card ($45 + $125), Claude/OpenAI
  toggles, Twilio mock SMS console, calendar connectors.
- Integrations (BYO keys): Twilio + Google Calendar + Outlook + Calendly.
  System defaults + per-location overrides. Secrets masked with last-4 on
  read; empty values do not overwrite stored values.
- Object-storage backed document uploads, auto CRN generator, sticky Call
  Queue rail, location-scoped dashboards, search and filters.

## Removed in this iteration
- Team Chat feature (frontend page + backend endpoints).
- Standalone Locations page + sidebar nav (location admin only in Sysadmin).
- Standalone Board page + sidebar nav (Kanban now lives inside Patients).
- BYO OpenAI / Claude on the Integrations page (AI is bundled).
- Off-white #fbfaf8 background — now pure #ffffff.
- Green Activity logo — replaced by uploaded logo or company-initial mark.

## Next / backlog (P1)
- Wire real Twilio (calls + SMS) once tenant keys are saved.
- Real OAuth flows for Google / Outlook / Calendly (currently mocked
  endpoints record intent only).
- Sysadmin: seat-utilisation alert when a location passes 80% of its
  purchased seats — auto-suggest upgrade.
- Patient drag-and-drop between stages on the Kanban (currently click).

## Testing status
- Backend: pytest suite at `/app/backend/tests/backend_test.py`
  (10 tests, all passing). Covers default stages, list backfill, key
  normalisation, 400/404 paths, patient default stage, integrations
  round-trip with masking, location-scope isolation, location delete
  cascade.
- Frontend: testing-agent iteration_2.json — 100% of listed flows verified.

## Mocked
- Twilio /calls/twilio + /sms/send (returns mock SIDs into `call_logs` /
  `sms_logs`).
- /calendar/schedule (writes to `calendar_events` collection).

## Test credentials
None — no auth in spec yet. DB starts empty.
