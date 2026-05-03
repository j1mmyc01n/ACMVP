# Roadmap

## Current Status — MVP (Phase 1)

The platform is live as a single-location deployment with:
- ✅ Client check-in flow with CRN
- ✅ Triage dashboard for admins
- ✅ Patient directory & CRM
- ✅ Crisis event management
- ✅ Multi-centre check-in
- ✅ Location rollout & provisioning
- ✅ Audit logging with legal consent tracking
- ✅ PWA (installable)
- ✅ Field agent GPS dashboard
- ✅ Push notifications (admin-scoped)
- ✅ Feedback & feature request system
- ✅ Sponsor management & ledger
- ✅ Finance hub

## Phase 2 — Monorepo & TypeScript

- [ ] Complete TypeScript migration (`packages/` → `modules/` → `apps/web`)
- [ ] Replace OTP login with Supabase Auth magic link
- [ ] Wire `@acmvp/billing` with Stripe
- [ ] Full test coverage for `packages/auth`, `packages/ai`, `packages/config`
- [ ] Playwright e2e tests for: login, check-in, CRN request

## Phase 3 — AI Layer

- [ ] Replace `callClaudeAI()` stub with real OpenAI API calls
- [ ] Implement JaxAI as a proper conversational agent
- [ ] Prompt management system
- [ ] AI-assisted triage escalation alerts

## Phase 4 — Multi-Tenancy

- [ ] Full `apps/aclocation` rollout automation
- [ ] Per-location feature flags UI
- [ ] Location credential management UI
- [ ] Central billing across locations

## Phase 5 — Mobile

- [ ] `apps/mobile` — React Native (Expo) client app
- [ ] Push notification deep links
- [ ] Offline-first check-in

## Backlog

Items from TODO.md and TASK_SUMMARY.md:
- CRM advanced filtering + bulk actions
- Clinical report PDF export
- FHIR R4 full compliance
- Provider portal
- Sponsor ad rotation
- SMS/email notification delivery
- Data retention policies
- HIPAA compliance audit
