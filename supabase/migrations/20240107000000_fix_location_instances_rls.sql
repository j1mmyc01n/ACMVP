-- ─────────────────────────────────────────────────────────────────────────────
-- Fix RLS on location_instances
--
-- The LocationRollout provisioning flow (Quick Provision and Full Provision)
-- inserts a row into location_instances with the anon Supabase client and
-- fails with: "new row violates row-level security policy for table
-- location_instances".
--
-- Two parallel migration paths historically created policies on this table:
--   • supabase/migrations/20240101000000_initial_schema.sql
--       create policy "anon_all" ... using (true) with check (true);
--   • src/supabase/migrations/1777100000000-location-rollout-monitoring.sql
--       CREATE POLICY "Allow all for location_instances" ... USING (true) WITH CHECK (true);
--
-- Production databases that ran an earlier variant ended up with a stale
-- policy that lacks WITH CHECK (or where WITH CHECK is NULL), which blocks
-- INSERT/UPDATE even when USING is permissive — the same failure mode that
-- 20240104000000_fix_rls_and_missing_tables.sql fixed for care_centres_1777090000.
--
-- Fix: drop every known policy variant and recreate a single open policy
-- with both USING and WITH CHECK. Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_all"                         ON location_instances;
DROP POLICY IF EXISTS "Allow all for location_instances" ON location_instances;
DROP POLICY IF EXISTS "Allow all on location_instances"  ON location_instances;

ALTER TABLE location_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all"
  ON location_instances
  FOR ALL
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
