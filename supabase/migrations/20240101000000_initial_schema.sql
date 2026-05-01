-- ─────────────────────────────────────────────────────────────────────────────
-- Acute Connect MVP — Initial Schema Migration
-- Run this in your Supabase SQL editor to create all required tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Care Centres ──────────────────────────────────────────────────────────────
create table if not exists care_centres_1777090000 (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  suffix          text,
  address         text,
  phone           text,
  active          boolean default true,
  clients_count   integer default 0,
  clients         integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── CRNs ─────────────────────────────────────────────────────────────────────
create table if not exists crns_1740395000 (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  is_active  boolean default true,
  created_at timestamptz default now()
);

-- ── Clients ───────────────────────────────────────────────────────────────────
create table if not exists clients_1777020684735 (
  id               uuid primary key default gen_random_uuid(),
  crn              text unique,
  name             text,
  email            text,
  phone            text,
  postcode         text,
  care_centre      text,
  office           text,
  dob              date,
  support_category text default 'general',
  status           text default 'active',
  mood_score       integer,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── CRN Requests (public self-registration) ───────────────────────────────────
create table if not exists crn_requests_1777090006 (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  mobile      text not null,
  email       text not null,
  status      text default 'pending',
  crn_issued  text,
  created_at  timestamptz default now()
);

-- ── Check-Ins ─────────────────────────────────────────────────────────────────
create table if not exists check_ins_1740395000 (
  id         uuid primary key default gen_random_uuid(),
  crn        text,
  name       text,
  mood_score integer,
  status     text default 'pending',
  resolved   boolean default false,
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Admin Users (staff, admin, sysadmin, field_agent) ─────────────────────────
create table if not exists admin_users_1777025000000 (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  email         text unique not null,
  role          text default 'staff',   -- 'staff' | 'admin' | 'sysadmin' | 'field_agent'
  status        text default 'active',
  location      text,
  location_id   uuid,
  last_login_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Audit Log ─────────────────────────────────────────────────────────────────
create table if not exists audit_log_1777090000 (
  id          uuid primary key default gen_random_uuid(),
  action      text,
  table_name  text,
  record_id   text,
  user_email  text,
  detail      jsonb,
  created_at  timestamptz default now()
);

-- ── Providers ─────────────────────────────────────────────────────────────────
create table if not exists providers_1740395000 (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  qualification text,
  gender        text,
  rating        numeric(3,1),
  experience    text,
  bio           text,
  availability  text,
  location_lat  numeric,
  location_lng  numeric,
  bulk_billing  boolean default false,
  is_partner    boolean default false,
  languages     text[],
  created_at    timestamptz default now()
);

-- ── Feedback Tickets ──────────────────────────────────────────────────────────
create table if not exists feedback_tickets_1777090000 (
  id           uuid primary key default gen_random_uuid(),
  subject      text not null,
  category     text default 'feedback',
  priority     text default 'medium',
  status       text default 'open',
  message      text not null,
  submitted_by text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Location Integration Requests (field agents, AI, etc.) ────────────────────
create table if not exists location_integration_requests_1777090015 (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,  -- 'field_agents_upgrade' | 'ai_activation' | 'field_agent_add' | etc.
  location_id text,
  status      text default 'pending',  -- 'pending' | 'active' | 'rejected'
  payload     jsonb default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Organisation Platform Access Requests ─────────────────────────────────────
create table if not exists org_access_requests_1777090000 (
  id               uuid primary key default gen_random_uuid(),
  org_name         text,
  org_type         text,
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  website          text,
  num_clients      text,
  num_locations    text,
  state            text,
  description      text,
  selected_plan    text default 'professional',
  referral         text,
  abn              text,
  ndis_registered  boolean default false,
  dv_accredited    boolean default false,
  status           text default 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── Push Notifications ────────────────────────────────────────────────────────
create table if not exists push_notifications_1777090000 (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  message      text not null,
  type         text default 'info',
  target       text default 'all',
  location_ids text[],
  priority     text default 'normal',
  sent_by      text,
  created_at   timestamptz default now()
);

-- ── Crisis Events v2 ─────────────────────────────────────────────────────────
create table if not exists crisis_events_1777090008 (
  id                   uuid        primary key default gen_random_uuid(),
  client_crn           text,
  client_name          text        not null,
  location             text        not null,
  severity             text        default 'medium',
  crisis_type          text        default 'mental_health',
  description          text,
  police_requested     boolean     default false,
  ambulance_requested  boolean     default false,
  assigned_team        jsonb       default '[]'::jsonb,
  status               text        default 'active',
  created_at           timestamptz default now(),
  resolved_at          timestamptz,
  updated_at           timestamptz default now()
);

-- ── Audit Logs v2 ─────────────────────────────────────────────────────────────
create table if not exists audit_logs_1777090020 (
  id           uuid        primary key default gen_random_uuid(),
  action       text,
  resource     text,
  detail       text,
  actor        text,
  actor_name   text,
  actor_role   text,
  source_type  text        default 'system',
  location     text,
  ip_address   text,
  level        text        default 'info',
  created_at   timestamptz default now()
);

-- ── Client Accounts (for client portal login) ────────────────────────────────
create table if not exists client_accounts (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  client_id    uuid,
  crn          text,
  email        text unique not null,
  first_name   text,
  last_name    text,
  phone        text,
  location_id  uuid,
  status       text default 'active',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS) — enable for all tables
-- Adjust policies to match your auth setup.
-- ─────────────────────────────────────────────────────────────────────────────

alter table care_centres_1777090000              enable row level security;
alter table crns_1740395000                      enable row level security;
alter table clients_1777020684735                enable row level security;
alter table crn_requests_1777090006              enable row level security;
alter table check_ins_1740395000                 enable row level security;
alter table admin_users_1777025000000            enable row level security;
alter table audit_log_1777090000                 enable row level security;
alter table providers_1740395000                 enable row level security;
alter table feedback_tickets_1777090000          enable row level security;
alter table location_integration_requests_1777090015 enable row level security;
alter table org_access_requests_1777090000       enable row level security;
alter table push_notifications_1777090000        enable row level security;
alter table client_accounts                      enable row level security;
alter table crisis_events_1777090008             enable row level security;
alter table audit_logs_1777090020                enable row level security;

-- ── Permissive policies (allow anon for MVP — tighten in production) ──────────
-- These allow the anon key (used by the frontend) to read/write all tables.
-- In production, replace with role-based policies.

create policy "anon_all" on care_centres_1777090000              for all using (true) with check (true);
create policy "anon_all" on crns_1740395000                      for all using (true) with check (true);
create policy "anon_all" on clients_1777020684735                for all using (true) with check (true);
create policy "anon_all" on crn_requests_1777090006              for all using (true) with check (true);
create policy "anon_all" on check_ins_1740395000                 for all using (true) with check (true);
create policy "anon_all" on admin_users_1777025000000            for all using (true) with check (true);
create policy "anon_all" on audit_log_1777090000                 for all using (true) with check (true);
create policy "anon_all" on providers_1740395000                 for all using (true) with check (true);
create policy "anon_all" on feedback_tickets_1777090000          for all using (true) with check (true);
create policy "anon_all" on location_integration_requests_1777090015 for all using (true) with check (true);
create policy "anon_all" on org_access_requests_1777090000       for all using (true) with check (true);
create policy "anon_all" on push_notifications_1777090000        for all using (true) with check (true);
create policy "anon_all" on client_accounts                      for all using (true) with check (true);
create policy "anon_all" on crisis_events_1777090008             for all using (true) with check (true);
create policy "anon_all" on audit_logs_1777090020                for all using (true) with check (true);
