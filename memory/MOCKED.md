# What's still mocked / fake in the Patient CRM

_Last reviewed: Feb 2026_

This document is the single source of truth for everything in the CRM that **looks real in the UI but is not yet wired to a real third-party service**. Anything not on this list can be assumed to be production-real (Mongo persistence, Claude AI, file uploads, etc.).

---

## 1. Telephony — Twilio Voice & SMS  ⚠️ MOCKED

| Surface | What the user sees | What actually happens |
|---|---|---|
| Patient drawer → "Call" button | Toast "Dialing … via Twilio" | `POST /api/calls/twilio` writes a fake `CA…` SID into `call_logs`. **No phone rings.** |
| Patient drawer → "Send SMS" | Toast "SMS sent" | `POST /api/sms/send` writes a fake `SM…` SID into `sms_logs`. **No SMS is sent.** |
| Auto-CRN SMS on intake / discharge | Logged as if sent | Same: written to `sms_logs` with `provider: "twilio-mock"`. |
| Call Queue rail → "Call" action | Toast "Dialing …" | Same mock endpoint. |

**What's needed to make it real:**
- Run `integration_playbook_expert_v2` for Twilio.
- Read `twilio_account_sid`, `twilio_auth_token`, `twilio_from_number` from the **per-location** `locations.integrations` document (already stored, masked on read).
- Replace the mock body in `server.py` lines ~1573–1591 (`/calls/twilio`) and ~794–811 (`/sms/send`).

---

## 2. Calendars — Google / Outlook / Calendly  ⚠️ MOCKED

| Surface | What actually happens |
|---|---|
| Integrations page → "Connect Google / Outlook / Calendly" | Stores client_id/secret/token into `locations.integrations`. **No OAuth round-trip.** No tokens are exchanged, no refresh tokens, no Google/MS calendars are touched. |
| Call Queue rail → "Schedule on google / outlook" | `POST /api/calendar/schedule` writes a row into `calendar_events`. **Nothing appears on a real Google/Outlook/Calendly calendar.** |
| Calendar page list | Reads from local `calendar_events` collection only. |

**What's needed:**
- `integration_playbook_expert_v2` for Google OAuth, Microsoft Graph OAuth, Calendly OAuth.
- Real OAuth redirect URIs, code-for-token exchange, refresh-token storage.
- Replace `/calendar/schedule` to also push the event via the provider SDK.

---

## 3. Web Push notifications  ⚠️ MOCKED / STUBBED

| Surface | What actually happens |
|---|---|
| Notification bell (top-right) | **Real** — reads `/api/notifications` from Mongo. |
| Backend triggers (auto-route CRN, escalation, announcement, care-pulse) | **Real** — they create `notifications` rows. |
| Browser push to a registered device | ❌ Not delivered. The app exposes `GET /api/notifications/vapid-public` but it returns `{"key": ""}` (stub at `server.py:1222`). |
| Service worker / `pushManager.subscribe()` on the frontend | ❌ Not implemented. No `sw.js` is registered. |
| Per-device targeting UI ("Reception desk", "Dr. Harlowe iPhone") | ❌ Not built. The `notification_devices` collection exists but no UI registers entries. |

**What's needed:**
- `integration_playbook_expert_v2` for Web Push / VAPID.
- Generate VAPID keypair, store public in env, return it from `/api/notifications/vapid-public`.
- Add `/public/sw.js` + register it from `App.js`.
- Build the device-registration UI (Settings → Notifications).
- Replace the in-Mongo notification-only flow with `pywebpush.webpush(...)` calls.

---

## 4. Authentication / Identity  ⚠️ TRUSTED, NOT VERIFIED

| Component | Status |
|---|---|
| `/api/auth/login`, `/api/auth/verify_otp`, `/api/auth/me` (JWT + OTP) | **Implemented on the backend** but **the frontend never calls them**. There is no login screen by design. |
| `postMessage` platform bridge (`patientcrm:auth`) | **Real** — the frontend listens for the parent platform's identity message and adopts `role` / `name` / `location_id`. `POST /api/handshake` records the event for audit. |
| ACL enforcement | ⚠️ The role from `postMessage` is **trusted by the UI only**. Backend endpoints **do not verify** the caller's role/JWT today. Anyone who can reach the API can call any endpoint. This is acceptable while the CRM lives behind the parent platform's auth gateway, but **it is not zero-trust**. |
| Role pill in the topbar | Mock toggle that flips `localStorage` between `sysadmin` / `staff` for dev/testing. The parent platform's `postMessage` overrides it. |

**What's needed (when the parent platform is ready to drop the gateway):**
- Replace the role-pill toggle with a read-only display sourced from the JWT.
- Add `Depends(verify_jwt)` to every router and check `role == "sysadmin"` for admin endpoints.

---

## 5. Other non-real bits worth knowing

| Item | Status |
|---|---|
| Forecast numbers on the Overview page (`/api/analytics/forecast-categories`) | **Synthetic** — derived from `est_value` and a seeded random sparkline, not a real model. |
| "Best case / Probable / Commit" deltas | Same — heuristic math, not a forecast engine. |
| Demo seed data (sample patients, sample CRN requests) | Real Mongo rows, but **demo content** — wipe with `POST /api/admin/clear-all`. |

---

## What is **NOT** mocked (for the avoidance of doubt)

- Mongo persistence (patients, locations, queue, notes, documents, CRN requests, notifications, handshakes).
- Claude Sonnet 4.5 — Care Pulse insights are **real** Claude calls via Emergent LLM key.
- Document uploads — **real** Emergent Object Storage.
- Brand logo upload — **real**, served from object storage.
- Auto-routing of CRN requests across locations — real logic, real DB writes.
- Mobile responsive shell, Profile cards, search, location-scoping, dynamic pipeline stages — all real.

---

## TL;DR for the next agent

To finish making the CRM "production real" you must, in order, run `integration_playbook_expert_v2` for:

1. **Twilio** (replaces §1)
2. **Web Push / VAPID** (replaces §3)
3. **Google / Outlook / Calendly OAuth** (replaces §2)

Auth (§4) only needs to change once the parent platform stops gating the iframe.
