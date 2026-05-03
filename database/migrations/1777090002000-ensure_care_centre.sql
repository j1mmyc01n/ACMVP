/*
# Add care centres and ensure column
1. New Tables
  - `care_centres_1777090000`
2. Changes
  - Add `care_centre` to `clients_1777020684735`
3. Security
  - Enable RLS
*/

CREATE TABLE IF NOT EXISTS care_centres_1777090000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  suffix text,
  address text,
  beds integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE care_centres_1777090000 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on care_centres" ON care_centres_1777090000 FOR ALL USING (true);

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients_1777020684735' AND column_name = 'care_centre'
  ) THEN 
    ALTER TABLE clients_1777020684735 ADD COLUMN care_centre text;
  END IF; 
END $$;