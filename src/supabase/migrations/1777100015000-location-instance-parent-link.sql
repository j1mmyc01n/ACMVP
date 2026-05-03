-- ─────────────────────────────────────────────────────────────────────────────
-- Add parent_location_id to location_instances
--
-- Enables sub-locations (e.g. a care centre added under a main location) to
-- reference their parent location instance. When a sub-location is provisioned
-- via Quick Rollout it inherits the parent's database rather than provisioning
-- a new one — this column records that relationship.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE location_instances
  ADD COLUMN IF NOT EXISTS parent_location_id uuid REFERENCES location_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_location_instances_parent ON location_instances(parent_location_id);

NOTIFY pgrst, 'reload schema';
