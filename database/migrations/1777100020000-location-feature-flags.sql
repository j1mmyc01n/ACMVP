-- Migration: location_feature_flags table
-- Stores per-location feature enable/disable state for sysadmin Feature Rollout

CREATE TABLE IF NOT EXISTS location_feature_flags (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     text NOT NULL,
  feature_id      text NOT NULL,
  enabled         boolean NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id, feature_id)
);

-- Permissive RLS for MVP (sysadmin controls via app-level auth)
ALTER TABLE location_feature_flags ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'location_feature_flags' AND policyname = 'anon_all'
  ) THEN
    CREATE POLICY anon_all ON location_feature_flags FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
