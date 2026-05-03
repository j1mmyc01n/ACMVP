-- ─────────────────────────────────────────────────────────────────────────────
-- Add privacy_mode column to location_instances
--
-- The LocationRollout provisioning form includes a "Privacy Mode" checkbox
-- that is stored as privacy_mode on location_instances, but the column was
-- never included in the original schema migration. This migration adds it
-- idempotently for already-deployed databases.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE location_instances
  ADD COLUMN IF NOT EXISTS privacy_mode boolean DEFAULT false;
