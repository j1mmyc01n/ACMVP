-- Migration: 1777100021000-fix-public-form-rls.sql
-- Ensures org_access_requests_1777090000 exists with permissive anon RLS policies
-- so the public "Request Platform Access" form can insert rows.
-- Also re-asserts anon policies for feedback_tickets and feature_requests tables.

-- ─── org_access_requests ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_access_requests_1777090000 (
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
  status           text default 'pending',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

ALTER TABLE org_access_requests_1777090000 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all" ON org_access_requests_1777090000;
CREATE POLICY "anon_all" ON org_access_requests_1777090000
  FOR ALL USING (true) WITH CHECK (true);

-- ─── feedback_tickets — ensure policy exists ─────────────────────────────────
ALTER TABLE IF EXISTS feedback_tickets_1777090000 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for feedback" ON feedback_tickets_1777090000;
CREATE POLICY "Enable all for feedback" ON feedback_tickets_1777090000
  FOR ALL USING (true) WITH CHECK (true);

-- ─── feature_requests — ensure policy exists ────────────────────────────────
ALTER TABLE IF EXISTS feature_requests_1777090000 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for features" ON feature_requests_1777090000;
CREATE POLICY "Enable all for features" ON feature_requests_1777090000
  FOR ALL USING (true) WITH CHECK (true);
