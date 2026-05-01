-- Add missing columns to care_centres_1777090000 so that the seed function
-- in LocationsPage (phone, active, clients_count, capacity) can upsert without error.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_centres_1777090000' AND column_name = 'phone'
  ) THEN
    ALTER TABLE care_centres_1777090000 ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_centres_1777090000' AND column_name = 'active'
  ) THEN
    ALTER TABLE care_centres_1777090000 ADD COLUMN active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_centres_1777090000' AND column_name = 'clients_count'
  ) THEN
    ALTER TABLE care_centres_1777090000 ADD COLUMN clients_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_centres_1777090000' AND column_name = 'capacity'
  ) THEN
    ALTER TABLE care_centres_1777090000 ADD COLUMN capacity integer DEFAULT 20;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_centres_1777090000' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE care_centres_1777090000 ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
