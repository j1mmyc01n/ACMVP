/*
# Add care_centre column to clients
1. Changes
- Add `care_centre` column to `clients_1777020684735` to resolve schema cache error.
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients_1777020684735' 
    AND column_name = 'care_centre'
  ) THEN
    ALTER TABLE clients_1777020684735 ADD COLUMN care_centre text;
  END IF;
END $$;