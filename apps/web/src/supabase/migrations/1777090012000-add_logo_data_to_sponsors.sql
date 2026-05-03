/*
# Add logo_data column to sponsors table

1. Changes
- Adds `logo_data` column to `sponsors_1777090009` to store base64-encoded logo images
  uploaded directly by the sponsor during registration.
- Keeps `logo_url` for backward compatibility with URL-based logos.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sponsors_1777090009'
    AND column_name = 'logo_data'
  ) THEN
    ALTER TABLE sponsors_1777090009 ADD COLUMN logo_data text;
  END IF;
END $$;