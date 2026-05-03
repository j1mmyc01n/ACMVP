# Database

## Migration Tracks

The repo has two migration tracks that are now consolidated in `/database/migrations/`:

| Prefix | Source | Description |
|--------|--------|-------------|
| `1740*` / `1777*` | `src/supabase/migrations/` | Incremental feature migrations |
| `20240*` | `supabase/migrations/` | Monolithic snapshots |

Apply files in ascending filename order. The monolithic `20240*` files are idempotent.

## Core Tables

| Table | Description |
|-------|-------------|
| `clients_1777020684735` | Patient/client records. Has `event_log jsonb` (capped at 200 entries). |
| `crn_requests_1777090006` | CRN requests. `crn` field has a UNIQUE constraint. |
| `care_centres_1777090000` | Care centre (clinic) records. Routes CRN intake by `service_types`. |
| `location_instances` | Provisioned location instances. `slug` is UNIQUE. |
| `admin_users_1777025000000` | Staff/admin users. Has `last_location_lat/lng/at` for field agents. |
| `audit_logs_1777090020` | Immutable audit log. `logActivity()` in `@acmvp/database`. |
| `profile_audit_log` | Requires `legal_bundle_version` + `agreement_accepted` (non-null). |
| `crisis_events_1777090008` | Crisis events. `resolved_at` is null for open events. |
| `sponsors_1777090009` | Sponsor records with ad copy and logo data. |
| `feedback_tickets_1777090000` | User feedback, bug reports, feature requests. |
| `login_otp_codes_1777090007` | OTP codes for staff login. Expire after 10 minutes. |
| `push_notifications_1777090000` | Push notification log. Monthly quota tracked per centre. |
| `location_integration_requests_1777090015` | Integration/upgrade requests. `location_id` is UUID FK to `care_centres_1777090000.id`. |
| `location_credentials` | Credentials per location. No `service_name` or `updated_at`. `location_id` → `location_instances(id)`. |
| `location_feature_flags_1777100020` | Feature flags per location instance. |

## RLS Policy Conventions

- Most tables use a permissive `anon_all` policy (MVP — open access).
- `crn_requests` uses `anon_all_crn_requests`.
- `location_instances` has public full access (`USING true / WITH CHECK true`).
- Audit tables are append-only (INSERT only, no UPDATE/DELETE for non-superusers).

## Audit Helpers

- `logActivity()` — writes to `audit_logs_1777090020`. Import from `@acmvp/database`.
- `appendClientEvent()` — prepends to `clients_1777020684735.event_log`, capped at 200 entries.
- `recordAgreementAudit()` — writes to `profile_audit_log` with legal version metadata.

## Seed Data

See `/database/seed/dev_seed.sql` for development seed scripts.
Original seed sources:
- `supabase/migrations/20240103000000_seed_test_location.sql`
- `src/supabase/migrations/1777100001000-seed-demo-data.sql`
- `src/supabase/migrations/1777100002000-ensure-default-admin-accounts.sql`
