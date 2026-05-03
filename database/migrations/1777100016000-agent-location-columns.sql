/*
# Agent Location Columns

Adds GPS location tracking columns to admin_users_1777025000000 so field agents
can report their current position. Updated by FieldAgentDashboard.jsx on mount
via the browser Geolocation API.

Columns added idempotently:
  - last_location_lat   (float8) — latitude
  - last_location_lng   (float8) — longitude
  - last_location_at    (timestamptz) — when location was last recorded
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users_1777025000000' AND column_name = 'last_location_lat'
  ) THEN
    ALTER TABLE admin_users_1777025000000 ADD COLUMN last_location_lat float8;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users_1777025000000' AND column_name = 'last_location_lng'
  ) THEN
    ALTER TABLE admin_users_1777025000000 ADD COLUMN last_location_lng float8;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users_1777025000000' AND column_name = 'last_location_at'
  ) THEN
    ALTER TABLE admin_users_1777025000000 ADD COLUMN last_location_at timestamptz;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
