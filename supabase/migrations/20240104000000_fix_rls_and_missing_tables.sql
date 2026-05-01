-- ─────────────────────────────────────────────────────────────────────────────
-- Fix RLS policies and create missing tables
--
-- Problems addressed:
--
-- 1. care_centres_1777090000 — INSERT / upsert blocked with "new row violates
--    row-level security policy". The original migration in
--    src/supabase/migrations/1777090002000-ensure_care_centre.sql created the
--    policy with only USING (true) and no WITH CHECK clause. Supabase / PostgreSQL
--    treats a missing WITH CHECK as NULL, which blocks INSERT and UPDATE even when
--    the USING expression is permissive. Fix: drop every policy on the table and
--    recreate a single open policy with both USING and WITH CHECK.
--
-- 2. crn_requests_1777090006 — CRN requests submitted via the public form are not
--    visible when logged in as sysadmin. The app never uses Supabase Auth; all
--    requests (including staff / sysadmin) run under the anon role. The original
--    policy only granted SELECT to the `authenticated` role, so anon SELECT is
--    blocked. Fix: replace restrictive policies with a single anon-accessible policy.
--
-- 3. locations_1740395000 — "Could not find the table in the schema cache" in the
--    Connectivity Tests panel. This legacy table was created by the original
--    src/supabase/migrations/ path but is not present in the consolidated
--    supabase/migrations/ path. Fix: create idempotently.
--
-- 4. clinical_notes_1777090003 — same problem as locations_1740395000.
--    Fix: create idempotently.
--
-- All changes are idempotent so re-running this migration is safe.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Fix care_centres_1777090000 RLS ───────────────────────────────────────
-- Drop every known policy variant so we start clean regardless of which
-- prior migrations have been applied.
DROP POLICY IF EXISTS "Allow all on care_centres"  ON care_centres_1777090000;
DROP POLICY IF EXISTS "Allow all for care_centres" ON care_centres_1777090000;
DROP POLICY IF EXISTS "anon_all"                   ON care_centres_1777090000;

-- (Re)enable RLS in case it was accidentally disabled.
ALTER TABLE care_centres_1777090000 ENABLE ROW LEVEL SECURITY;

-- Single open policy: allows all operations (SELECT / INSERT / UPDATE / DELETE)
-- for every role including anon, matching the existing MVP "open access" posture.
CREATE POLICY "anon_all"
  ON care_centres_1777090000
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 2. Fix crn_requests_1777090006 RLS ───────────────────────────────────────
-- Drop all existing policies (various names have been used across migrations).
DROP POLICY IF EXISTS "Public can submit CRN requests"       ON crn_requests_1777090006;
DROP POLICY IF EXISTS "Authenticated can read CRN requests"  ON crn_requests_1777090006;
DROP POLICY IF EXISTS "Authenticated can update CRN requests" ON crn_requests_1777090006;
DROP POLICY IF EXISTS "Allow public insert CRN requests"     ON crn_requests_1777090006;
DROP POLICY IF EXISTS "Allow public read CRN requests"       ON crn_requests_1777090006;
DROP POLICY IF EXISTS "Allow public update CRN requests"     ON crn_requests_1777090006;
DROP POLICY IF EXISTS "anon_all"                             ON crn_requests_1777090006;
DROP POLICY IF EXISTS "anon_all_crn_requests"                ON crn_requests_1777090006;

ALTER TABLE crn_requests_1777090006 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_crn_requests"
  ON crn_requests_1777090006
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 3. Create locations_1740395000 if missing ─────────────────────────────────
CREATE TABLE IF NOT EXISTS locations_1740395000 (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  address    text,
  phone      text,
  is_active  boolean     DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations_1740395000 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'locations_1740395000'
      AND policyname = 'anon_all_locations'
  ) THEN
    CREATE POLICY "anon_all_locations"
      ON locations_1740395000
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ── 4. Create clinical_notes_1777090003 if missing ───────────────────────────
CREATE TABLE IF NOT EXISTS clinical_notes_1777090003 (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id  uuid        REFERENCES check_ins_1740395000(id),
  crn          text        NOT NULL,
  author       text        NOT NULL,
  note_type    text        DEFAULT 'general',
  content      text        NOT NULL,
  attachments  jsonb       DEFAULT '[]'::jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE clinical_notes_1777090003 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'clinical_notes_1777090003'
      AND policyname = 'anon_all_clinical_notes'
  ) THEN
    CREATE POLICY "anon_all_clinical_notes"
      ON clinical_notes_1777090003
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ── 5. Force PostgREST schema-cache refresh ───────────────────────────────────
-- Ensures the new tables are immediately visible to the REST API without
-- needing a manual restart, which also clears the "Could not find the table
-- in the schema cache" errors in the Connectivity Tests panel.
NOTIFY pgrst, 'reload schema';
