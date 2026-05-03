-- Add assistance/service type support to the CRN intake flow.
--
-- A care centre advertises which assistance types it can handle
-- (`service_types text[]`). The CRN request captures which type the
-- person is asking for. If a matching centre exists, the new client is
-- attached there. If no matching centre exists, a row is written to
-- `sysadmin_reports_1777100012` so a human can stand up coverage, and
-- the user is provisionally attached to the closest support centre so
-- they get something started.

-- Care centres: which assistance types are offered.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_centres_1777090000' AND column_name = 'service_types'
  ) THEN
    ALTER TABLE care_centres_1777090000 ADD COLUMN service_types text[] DEFAULT ARRAY['general']::text[];
  END IF;
END $$;

-- Make sure every existing row has at least 'general' so the assistance
-- match never returns an empty set on legacy data.
UPDATE care_centres_1777090000
   SET service_types = ARRAY['general']::text[]
 WHERE service_types IS NULL OR array_length(service_types, 1) IS NULL;

-- Backfill plausible service types for the demo centres so a fresh
-- deploy has something the assistance dropdown can match against.
UPDATE care_centres_1777090000
   SET service_types = ARRAY['general','mental_health','crisis']::text[]
 WHERE LOWER(name) LIKE '%camperdown%';

UPDATE care_centres_1777090000
   SET service_types = ARRAY['general','mental_health','crisis','substance_abuse']::text[]
 WHERE LOWER(name) LIKE '%rpa%';

UPDATE care_centres_1777090000
   SET service_types = ARRAY['mental_health','youth']::text[]
 WHERE LOWER(name) LIKE '%headspace%';

-- CRN request rows: capture the requested assistance type.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crn_requests_1777090006' AND column_name = 'assistance_type'
  ) THEN
    ALTER TABLE crn_requests_1777090006 ADD COLUMN assistance_type text;
  END IF;
END $$;

-- Sysadmin reports: structured queue for "things sysadmin should look at".
-- Used for the unmatched-assistance-type case but extensible to other
-- ops alerts (missing centre coordinates, blocked OTPs, etc.).
CREATE TABLE IF NOT EXISTS sysadmin_reports_1777100012 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  title text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  related_crn text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text
);

ALTER TABLE sysadmin_reports_1777100012 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sysadmin_reports_1777100012'
      AND policyname = 'Allow all on sysadmin_reports'
  ) THEN
    CREATE POLICY "Allow all on sysadmin_reports" ON sysadmin_reports_1777100012 FOR ALL USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sysadmin_reports_1777100012_status_idx
  ON sysadmin_reports_1777100012 (status, created_at DESC);
