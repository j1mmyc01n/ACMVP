-- ─────────────────────────────────────────────────────────────────────────────
-- Fix RLS policies for public-facing form tables
--
-- Problems addressed:
--
-- 1. org_access_requests_1777090000 — INSERT blocked with "new row violates
--    row-level security policy". Two migration tracks (src/ and supabase/)
--    can leave the DB in a state where the anon_all policy is missing or
--    replaced with a more restrictive policy that blocks anonymous inserts.
--    Fix: drop all known policy variants, recreate a single open anon_all
--    policy with both USING and WITH CHECK.
--
-- 2. feedback_tickets_1777090000 — same policy conflict scenario.
--
-- 3. feature_requests_1777090000 — same policy conflict + the src/ migration
--    track defines this table with a column named requested_by NOT NULL,
--    while the UI was sending submitted_by. Ensure the table has a
--    submitted_by column so both names work, and the policies are open.
--
-- 4. providers_1740395000 — ensure policies are permissive so the provider
--    join form can INSERT and admins can UPDATE/DELETE.
--
-- All changes are idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. org_access_requests_1777090000 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_access_requests_1777090000 (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  selected_plan    text DEFAULT 'professional',
  referral         text,
  abn              text,
  ndis_registered  boolean DEFAULT false,
  dv_accredited    boolean DEFAULT false,
  status           text DEFAULT 'pending',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE org_access_requests_1777090000 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all"     ON org_access_requests_1777090000;
DROP POLICY IF EXISTS "anon_insert"  ON org_access_requests_1777090000;
DROP POLICY IF EXISTS "authed_all"   ON org_access_requests_1777090000;

CREATE POLICY "anon_all" ON org_access_requests_1777090000
  FOR ALL USING (true) WITH CHECK (true);

-- ── 2. feedback_tickets_1777090000 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_tickets_1777090000 (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject        text NOT NULL,
  category       text DEFAULT 'feedback',
  priority       text DEFAULT 'medium',
  status         text DEFAULT 'open',
  message        text NOT NULL,
  submitted_by   text,
  submitter_type text DEFAULT 'admin',
  admin_response text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE feedback_tickets_1777090000 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all"               ON feedback_tickets_1777090000;
DROP POLICY IF EXISTS "anon_insert_feedback"   ON feedback_tickets_1777090000;
DROP POLICY IF EXISTS "authed_all_feedback"    ON feedback_tickets_1777090000;
DROP POLICY IF EXISTS "Enable all for feedback" ON feedback_tickets_1777090000;

CREATE POLICY "anon_all" ON feedback_tickets_1777090000
  FOR ALL USING (true) WITH CHECK (true);

-- ── 3. feature_requests_1777090000 ───────────────────────────────────────────
-- The src/ migration track created this table with `requested_by NOT NULL`.
-- The UI sends `submitted_by`. Add submitted_by as an alias column so inserts
-- from the UI succeed regardless of which track created the table.
CREATE TABLE IF NOT EXISTS feature_requests_1777090000 (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text NOT NULL,
  requested_by text,
  submitted_by text,
  category     text DEFAULT 'general',
  priority     text DEFAULT 'medium',
  status       text DEFAULT 'under_review',
  votes        integer DEFAULT 0,
  admin_notes  text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- If the table already exists with requested_by NOT NULL, relax the constraint
-- so inserts from the UI (which send submitted_by) don't fail.
ALTER TABLE feature_requests_1777090000 ALTER COLUMN requested_by DROP NOT NULL;

-- Add submitted_by column if the table was created without it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'feature_requests_1777090000'
      AND column_name = 'submitted_by'
  ) THEN
    ALTER TABLE feature_requests_1777090000 ADD COLUMN submitted_by text;
  END IF;
END $$;

ALTER TABLE feature_requests_1777090000 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all"                ON feature_requests_1777090000;
DROP POLICY IF EXISTS "anon_insert_features"    ON feature_requests_1777090000;
DROP POLICY IF EXISTS "authed_all_features"     ON feature_requests_1777090000;
DROP POLICY IF EXISTS "Enable all for features" ON feature_requests_1777090000;

CREATE POLICY "anon_all" ON feature_requests_1777090000
  FOR ALL USING (true) WITH CHECK (true);

-- ── 4. providers_1740395000 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS providers_1740395000 (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  qualification text,
  gender        text,
  rating        numeric(3,1),
  experience    text,
  bio           text,
  availability  text,
  location_lat  numeric,
  location_lng  numeric,
  bulk_billing  boolean DEFAULT false,
  is_partner    boolean DEFAULT false,
  languages     text[],
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE providers_1740395000 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all"              ON providers_1740395000;
DROP POLICY IF EXISTS "Allow all for providers" ON providers_1740395000;

CREATE POLICY "anon_all" ON providers_1740395000
  FOR ALL USING (true) WITH CHECK (true);

-- Force PostgREST schema-cache refresh so changes are immediately visible.
NOTIFY pgrst, 'reload schema';
