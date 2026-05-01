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
  capacity        integer default 20,
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
  id              uuid primary key default gen_random_uuid(),
  crn             text,
  name            text,
  mood_score      integer,
  status          text default 'pending',
  resolved        boolean default false,
  notes           text,
  care_centre     text,
  clinical_notes  text,
  last_edited_by  text,
  last_edited_at  timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
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
  location_id uuid,
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

-- ─────────────────────────────────────────────────────────────────────────────
-- Additional tables not in the original schema
-- ─────────────────────────────────────────────────────────────────────────────

-- ── OTP Login Codes ───────────────────────────────────────────────────────────
create table if not exists login_otp_codes_1777090007 (
  id         uuid primary key default gen_random_uuid(),
  email      text not null default '',
  code       text not null default '',
  used       boolean not null default false,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz default now()
);

alter table login_otp_codes_1777090007 enable row level security;
create policy "anon_all" on login_otp_codes_1777090007 for all using (true) with check (true);

-- ── Feature Requests ──────────────────────────────────────────────────────────
create table if not exists feature_requests_1777090000 (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null,
  requested_by text not null,
  category     text default 'enhancement',
  priority     text default 'medium',
  status       text default 'pending',
  votes        integer default 0,
  admin_notes  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table feature_requests_1777090000 enable row level security;
create policy "anon_all" on feature_requests_1777090000 for all using (true) with check (true);

-- ── Sponsors ──────────────────────────────────────────────────────────────────
create table if not exists sponsors_1777090009 (
  id             uuid primary key default gen_random_uuid(),
  company_name   text not null,
  email          text not null,
  color          text default '#007AFF',
  logo_url       text,
  ad_image_1     text,
  ad_image_2     text,
  is_active      boolean default true,
  start_date     date,
  end_date       date,
  receipt_number text,
  amount         numeric default 15000,
  created_at     timestamptz default now()
);

alter table sponsors_1777090009 enable row level security;
create policy "sponsors_select" on sponsors_1777090009 for select using (true);
create policy "sponsors_insert" on sponsors_1777090009 for insert with check (true);
create policy "sponsors_update" on sponsors_1777090009 for update using (true) with check (true);
create policy "sponsors_delete" on sponsors_1777090009 for delete using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Location Rollout Monitoring & Billing System
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Location Instances ────────────────────────────────────────────────────────
create table if not exists location_instances (
  id                     uuid primary key default gen_random_uuid(),
  location_name          text not null,
  slug                   text unique not null,
  care_type              text not null,
  github_repo_url        text,
  github_repo_full_name  text,
  netlify_url            text,
  netlify_site_id        text,
  supabase_ref           text,
  supabase_url           text,
  status                 text default 'provisioning',
  deployment_phase       text,
  last_deployed_at       timestamptz,
  plan_type              text default 'pro',
  monthly_credit_limit   numeric default 10000,
  credits_used           numeric default 0,
  billing_status         text default 'active',
  primary_contact_email  text,
  primary_contact_phone  text,
  notes                  text,
  created_by             uuid,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

alter table location_instances enable row level security;
create policy "anon_all" on location_instances for all using (true) with check (true);

create index if not exists idx_location_instances_slug   on location_instances(slug);
create index if not exists idx_location_instances_status on location_instances(status);

-- ── Location Credentials ──────────────────────────────────────────────────────
create table if not exists location_credentials (
  id              uuid primary key default gen_random_uuid(),
  location_id     uuid references location_instances(id) on delete cascade,
  credential_type text not null,
  credential_key  text not null,
  is_active       boolean default true,
  expires_at      timestamptz,
  last_used_at    timestamptz,
  created_by      uuid,
  created_at      timestamptz default now(),
  unique(location_id, credential_type)
);

alter table location_credentials enable row level security;
create policy "anon_all" on location_credentials for all using (true) with check (true);

create index if not exists idx_location_credentials_location on location_credentials(location_id);

-- ── Location API Usage ────────────────────────────────────────────────────────
create table if not exists location_api_usage (
  id                   uuid primary key default gen_random_uuid(),
  location_id          uuid references location_instances(id) on delete cascade,
  endpoint             text,
  method               text,
  credits_consumed     numeric default 1,
  response_time_ms     numeric,
  status_code          integer,
  user_agent           text,
  ip_address           text,
  request_body_size    numeric,
  response_body_size   numeric,
  timestamp            timestamptz default now(),
  date                 date default current_date
);

alter table location_api_usage enable row level security;
create policy "anon_all" on location_api_usage for all using (true) with check (true);

create index if not exists idx_location_api_usage_location  on location_api_usage(location_id);
create index if not exists idx_location_api_usage_date      on location_api_usage(date);
create index if not exists idx_location_api_usage_timestamp on location_api_usage(timestamp);

-- ── Location Daily Usage ──────────────────────────────────────────────────────
create table if not exists location_daily_usage (
  id                       uuid primary key default gen_random_uuid(),
  location_id              uuid references location_instances(id) on delete cascade,
  date                     date not null,
  total_requests           integer default 0,
  total_credits_consumed   numeric default 0,
  total_bandwidth_gb       numeric default 0,
  avg_response_time_ms     numeric default 0,
  error_count              integer default 0,
  top_endpoint             text,
  top_endpoint_count       integer default 0,
  created_at               timestamptz default now(),
  unique(location_id, date)
);

alter table location_daily_usage enable row level security;
create policy "anon_all" on location_daily_usage for all using (true) with check (true);

create index if not exists idx_location_daily_usage_location_date on location_daily_usage(location_id, date);

-- ── Location Billing ──────────────────────────────────────────────────────────
create table if not exists location_billing (
  id                     uuid primary key default gen_random_uuid(),
  location_id            uuid references location_instances(id) on delete cascade,
  billing_period_start   date not null,
  billing_period_end     date not null,
  credits_used           numeric default 0,
  credit_rate            numeric default 0.01,
  usage_charge           numeric default 0,
  base_subscription_fee  numeric default 0,
  subtotal               numeric default 0,
  tax                    numeric default 0,
  total_amount           numeric default 0,
  status                 text default 'pending',
  paid_at                timestamptz,
  payment_method         text,
  invoice_url            text,
  due_date               date,
  notes                  text,
  created_at             timestamptz default now()
);

alter table location_billing enable row level security;
create policy "anon_all" on location_billing for all using (true) with check (true);

create index if not exists idx_location_billing_location on location_billing(location_id);
create index if not exists idx_location_billing_period   on location_billing(billing_period_start, billing_period_end);
create index if not exists idx_location_billing_status   on location_billing(status);

-- ── Location Health Checks ────────────────────────────────────────────────────
create table if not exists location_health_checks (
  id                 uuid primary key default gen_random_uuid(),
  location_id        uuid references location_instances(id) on delete cascade,
  status             text not null,
  uptime_percentage  numeric default 100,
  response_time_ms   numeric,
  netlify_status     text,
  supabase_status    text,
  github_status      text,
  error_message      text,
  error_count        integer default 0,
  last_error_at      timestamptz,
  checked_at         timestamptz default now(),
  next_check_at      timestamptz
);

alter table location_health_checks enable row level security;
create policy "anon_all" on location_health_checks for all using (true) with check (true);

create index if not exists idx_location_health_checks_location   on location_health_checks(location_id);
create index if not exists idx_location_health_checks_checked_at on location_health_checks(checked_at);

-- ── Location Deployment Logs ──────────────────────────────────────────────────
create table if not exists location_deployment_logs (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid references location_instances(id) on delete cascade,
  phase       text,
  message     text not null,
  log_type    text default 'info',
  timestamp   timestamptz default now()
);

alter table location_deployment_logs enable row level security;
create policy "anon_all" on location_deployment_logs for all using (true) with check (true);

create index if not exists idx_location_deployment_logs_location  on location_deployment_logs(location_id);
create index if not exists idx_location_deployment_logs_timestamp on location_deployment_logs(timestamp);

-- ── Location Alert Rules ──────────────────────────────────────────────────────
create table if not exists location_alert_rules (
  id                   uuid primary key default gen_random_uuid(),
  location_id          uuid references location_instances(id) on delete cascade,
  rule_type            text not null,
  threshold_value      numeric not null,
  comparison_operator  text default 'greater_than',
  is_active            boolean default true,
  notify_email         text,
  notify_webhook       text,
  last_triggered_at    timestamptz,
  trigger_count        integer default 0,
  created_at           timestamptz default now()
);

alter table location_alert_rules enable row level security;
create policy "anon_all" on location_alert_rules for all using (true) with check (true);

create index if not exists idx_location_alert_rules_location on location_alert_rules(location_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes for core tables
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_crisis_events_1777090008_status     on crisis_events_1777090008(status);
create index if not exists idx_crisis_events_1777090008_created_at on crisis_events_1777090008(created_at);
create index if not exists idx_audit_logs_1777090020_created_at    on audit_logs_1777090020(created_at desc);
create index if not exists idx_audit_logs_1777090020_actor         on audit_logs_1777090020(actor);
create index if not exists idx_audit_logs_1777090020_action        on audit_logs_1777090020(action);
create index if not exists idx_client_accounts_crn                 on client_accounts(crn);
create index if not exists idx_client_accounts_email               on client_accounts(email);

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-update updated_at function and triggers
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_location_instances_updated_at on location_instances;
create trigger update_location_instances_updated_at
  before update on location_instances
  for each row execute function update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed default admin accounts
-- ─────────────────────────────────────────────────────────────────────────────
insert into admin_users_1777025000000 (email, role, status)
values
  ('ops@acuteconnect.health',      'admin',    'active'),
  ('sysadmin@acuteconnect.health', 'sysadmin', 'active')
on conflict (email) do update
  set status = 'active',
      role   = excluded.role;
