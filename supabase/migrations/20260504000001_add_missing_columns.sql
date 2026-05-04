-- ─────────────────────────────────────────────────────────────────────────────
-- Add missing columns required by the apps/web UI
--
-- Fixes columns that the UI inserts/selects but that were missing from the
-- canonical supabase/migrations path, causing silent failures or schema
-- errors at runtime.
--
-- All changes are idempotent (ADD COLUMN IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── care_centres_1777090000 ───────────────────────────────────────────────────
-- parent_id: allows sub-locations to reference a parent care centre.
--   Used by LocationRollout.jsx Quick Rollout and LocationsPage.jsx.
ALTER TABLE care_centres_1777090000
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES care_centres_1777090000(id);

-- primary_service: main service category string (e.g. 'mental_health').
--   Used by LocationsPage.jsx on create/update and read.
ALTER TABLE care_centres_1777090000
  ADD COLUMN IF NOT EXISTS primary_service text NOT NULL DEFAULT 'general';

-- secondary_services: additional service categories as a text array.
--   Used by LocationsPage.jsx on create/update and read.
ALTER TABLE care_centres_1777090000
  ADD COLUMN IF NOT EXISTS secondary_services text[] NOT NULL DEFAULT '{}';

-- latitude / longitude: used by HeatMapPage and location proximity features.
ALTER TABLE care_centres_1777090000
  ADD COLUMN IF NOT EXISTS latitude  double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- ── location_instances ────────────────────────────────────────────────────────
-- parent_location_id: allows sub-location instances to inherit DB credentials
--   from a parent instance.  Used by LocationRollout.jsx Quick Rollout.
ALTER TABLE location_instances
  ADD COLUMN IF NOT EXISTS parent_location_id uuid REFERENCES location_instances(id);

-- ── admin_users_1777025000000 ─────────────────────────────────────────────────
-- sub_location: optional sub-centre string for staff assigned to a child
--   location within a parent centre.  Used by UsersPage.jsx.
ALTER TABLE admin_users_1777025000000
  ADD COLUMN IF NOT EXISTS sub_location text NOT NULL DEFAULT '';

-- last_login: display-friendly alias selected by some UI queries.
--   The canonical column is last_login_at; this adds last_login so both
--   column names resolve without errors.
ALTER TABLE admin_users_1777025000000
  ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Force PostgREST schema-cache refresh so all new columns are immediately
-- queryable without a project restart.
NOTIFY pgrst, 'reload schema';
