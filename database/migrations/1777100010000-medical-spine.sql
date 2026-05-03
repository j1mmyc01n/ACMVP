-- Medical-integration-ready spine.
--
-- Adds the canonical schema described in the platform-restructure spec:
--   profiles, crn_records, consent_agreements, audit_logs, check_ins,
--   medical_events.
--
-- These coexist with the legacy tables (clients_1777020684735,
-- crns_1740395000, crn_requests_1777090006, profile_audit_log,
-- check_ins_1740395000). The legacy tables remain in active use; the
-- new tables are the FHIR/HL7-ready surface for upcoming medical
-- integrations and stored consent/audit trails.

create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  full_name text,
  dob date,
  phone text,
  email text,
  role text not null default 'user',
  crn text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_user_id_idx on profiles (user_id);
create index if not exists profiles_crn_idx on profiles (crn);
create index if not exists profiles_email_idx on profiles (lower(email));

-- ─── crn_records ─────────────────────────────────────────────────────
create table if not exists crn_records (
  id uuid primary key default gen_random_uuid(),
  crn text not null unique,
  user_id uuid,
  status text not null default 'active',
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists crn_records_user_idx on crn_records (user_id);

-- ─── consent_agreements ──────────────────────────────────────────────
create table if not exists consent_agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  agreement_type text not null,
  agreement_version text not null,
  accepted boolean not null default true,
  accepted_at timestamptz not null default now(),
  ip_address text,
  device_info jsonb,
  source_action text
);
create index if not exists consent_agreements_user_idx
  on consent_agreements (user_id, accepted_at desc);
create index if not exists consent_agreements_type_idx
  on consent_agreements (agreement_type, accepted_at desc);

-- ─── audit_logs (structured action audit) ───────────────────────────
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity_type text,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  agreement_version text,
  ip_address text,
  device_info jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_user_idx on audit_logs (user_id, created_at desc);
create index if not exists audit_logs_action_idx on audit_logs (action, created_at desc);
create index if not exists audit_logs_entity_idx on audit_logs (entity_type, entity_id);

-- ─── check_ins (FHIR-ready replacement) ──────────────────────────────
create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  crn text,
  status text not null default 'submitted',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists check_ins_user_idx on check_ins (user_id, created_at desc);
create index if not exists check_ins_crn_idx on check_ins (crn, created_at desc);

-- ─── medical_events (FHIR-style payload store) ───────────────────────
create table if not exists medical_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  crn text,
  event_type text not null,
  fhir_resource_type text,
  fhir_payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists medical_events_user_idx on medical_events (user_id, created_at desc);
create index if not exists medical_events_type_idx on medical_events (fhir_resource_type);

-- ─── RLS: enable on every spine table ───────────────────────────────
alter table profiles enable row level security;
alter table crn_records enable row level security;
alter table consent_agreements enable row level security;
alter table audit_logs enable row level security;
alter table check_ins enable row level security;
alter table medical_events enable row level security;

-- Open MVP-style policies (reads + inserts), append-only on audit/consent.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles', 'crn_records', 'consent_agreements', 'audit_logs',
    'check_ins', 'medical_events'
  ]) loop
    execute format('drop policy if exists %I_select on %I', t, t);
    execute format('drop policy if exists %I_insert on %I', t, t);
    execute format('create policy %I_select on %I for select using (true)', t, t);
    execute format('create policy %I_insert on %I for insert with check (true)', t, t);
  end loop;

  -- profiles + check_ins + crn_records also allow updates for MVP.
  for t in select unnest(array['profiles', 'check_ins', 'crn_records']) loop
    execute format('drop policy if exists %I_update on %I', t, t);
    execute format('create policy %I_update on %I for update using (true) with check (true)', t, t);
  end loop;
end $$;

-- audit_logs and consent_agreements are append-only; revoke mutating grants.
revoke update, delete on audit_logs from anon, authenticated;
revoke update, delete on consent_agreements from anon, authenticated;
revoke delete on medical_events from anon, authenticated;

-- updated_at maintenance for profiles.
create or replace function set_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
before update on profiles
for each row execute function set_profiles_updated_at();
