/*
# Extend admin_users with location and login-tracking columns

The original admin_users_1777025000000 table only had id, email, role, status,
created_at. The UI writes additional fields when staff are created/edited and
records last_login on sign-in. Without these columns, those writes fail silently
and the Staff Management page never shows a Last Login or location.
*/

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

CREATE INDEX IF NOT EXISTS idx_admin_users_location ON admin_users_1777025000000(location);
CREATE INDEX IF NOT EXISTS idx_admin_users_location_id ON admin_users_1777025000000(location_id);
