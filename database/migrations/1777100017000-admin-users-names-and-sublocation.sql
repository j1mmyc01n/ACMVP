/*
# Ensure admin_users has name, location_id, sub_location, last_login columns
  and care_centres has parent_id column for sub-location network tracking.

This migration is idempotent — safe to run multiple times.
*/

-- Ensure all expected columns exist on admin_users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users_1777025000000' AND column_name = 'name') THEN
    ALTER TABLE admin_users_1777025000000 ADD COLUMN name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users_1777025000000' AND column_name = 'location') THEN
    ALTER TABLE admin_users_1777025000000 ADD COLUMN location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users_1777025000000' AND column_name = 'location_id') THEN
    ALTER TABLE admin_users_1777025000000 ADD COLUMN location_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users_1777025000000' AND column_name = 'sub_location') THEN
    ALTER TABLE admin_users_1777025000000 ADD COLUMN sub_location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users_1777025000000' AND column_name = 'last_login') THEN
    ALTER TABLE admin_users_1777025000000 ADD COLUMN last_login timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users_1777025000000' AND column_name = 'updated_at') THEN
    ALTER TABLE admin_users_1777025000000 ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Set friendly display names for the default seed accounts (only if name is still null)
UPDATE admin_users_1777025000000 SET name = 'Ops Admin'   WHERE email = 'ops@acuteconnect.health'      AND name IS NULL;
UPDATE admin_users_1777025000000 SET name = 'SysAdmin'    WHERE email = 'sysadmin@acuteconnect.health' AND name IS NULL;

-- Add parent_id to care_centres to track sub-location network membership
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_centres_1777090000' AND column_name = 'parent_id') THEN
    ALTER TABLE care_centres_1777090000 ADD COLUMN parent_id uuid REFERENCES care_centres_1777090000(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_users_location    ON admin_users_1777025000000(location);
CREATE INDEX IF NOT EXISTS idx_admin_users_location_id ON admin_users_1777025000000(location_id);
CREATE INDEX IF NOT EXISTS idx_care_centres_parent_id  ON care_centres_1777090000(parent_id);

NOTIFY pgrst, 'reload schema';
