/*
# Create Sponsors Table
1. New Tables
- `sponsors_1777090009`
  - `id` (uuid, primary key)
  - `company_name` (text)
  - `email` (text)
  - `color` (text, hex code)
  - `logo_url` (text)
  - `is_active` (boolean)
  - `created_at` (timestamp)
2. Security
- Enable RLS
- Allow public inserts for signup
- Allow public reads for the check-in view 
*/

CREATE TABLE IF NOT EXISTS sponsors_1777090009 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  email text NOT NULL,
  color text DEFAULT '#007AFF',
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sponsors_1777090009 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read sponsors"
  ON sponsors_1777090009
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert sponsors"
  ON sponsors_1777090009
  FOR INSERT
  WITH CHECK (true);