-- Profile audit log: every consequential platform action records an
-- immutable entry capturing which legal documents were in force at the
-- time the user agreed to proceed. Used by:
--   - CRN creation / redemption
--   - Check-in submission
--   - Profile detail updates
--   - Call-window changes
--   - Mood / concern data submission
--   - AI-supported triage workflows

create extension if not exists "pgcrypto";

create table if not exists profile_audit_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid,
  crn text,
  action text not null,
  agreement_accepted boolean not null default false,
  agreement_text text,
  legal_bundle_version text not null,
  privacy_version text,
  terms_version text,
  medical_disclaimer_version text,
  ai_disclosure_version text,
  crisis_notice_version text,
  cookie_policy_version text,
  ip_address text,
  device_info jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profile_audit_log_crn_idx
  on profile_audit_log (crn, created_at desc);

create index if not exists profile_audit_log_profile_idx
  on profile_audit_log (profile_id, created_at desc);

alter table profile_audit_log enable row level security;

-- Open MVP-style policies, mirroring the rest of this project's tables.
-- Append-only is enforced by withholding update/delete grants below.
drop policy if exists profile_audit_log_select on profile_audit_log;
drop policy if exists profile_audit_log_insert on profile_audit_log;

create policy profile_audit_log_select on profile_audit_log
  for select using (true);

create policy profile_audit_log_insert on profile_audit_log
  for insert with check (true);

revoke update, delete on profile_audit_log from anon, authenticated;
