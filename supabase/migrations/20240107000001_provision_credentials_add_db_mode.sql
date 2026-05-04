-- ─────────────────────────────────────────────────────────────────────────────
-- Add db_mode, manual_db_url, manual_db_anon_key to provision_credentials
--
-- Allows the Location Rollout screen to either auto-provision a new Supabase
-- project (db_mode = 'supabase', the original behaviour) or reuse existing
-- database credentials without creating a new Supabase project
-- (db_mode = 'manual', supplying manual_db_url + manual_db_anon_key).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE provision_credentials
  ADD COLUMN IF NOT EXISTS db_mode          text NOT NULL DEFAULT 'supabase',
  ADD COLUMN IF NOT EXISTS manual_db_url    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS manual_db_anon_key text NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
