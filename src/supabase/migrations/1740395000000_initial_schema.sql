/*
# Initial Schema Setup for Acute Connect

1. New Tables
  - `check_ins_1740395000`: Stores patient check-ins
    - `id` (uuid, primary key)
    - `crn` (text, not null)
    - `concerns` (text)
    - `mood` (integer)
    - `scheduled_day` (text)
    - `scheduled_window` (text)
    - `status` (text) - e.g., 'pending', 'reviewed', 'completed'
    - `created_at` (timestamp)
  - `crns_1740395000`: Stores generated Client Reference Numbers
    - `id` (uuid, primary key)
    - `code` (text, unique)
    - `is_active` (boolean)
    - `created_at` (timestamp)
  - `providers_1740395000`: Stores service providers
    - `id` (uuid, primary key)
    - `name` (text)
    - `qualification` (text)
    - `gender` (text)
    - `experience` (text)
    - `rating` (numeric)
    - `location_lat` (numeric)
    - `location_lng` (numeric)
    - `is_partner` (boolean)
    - `created_at` (timestamp)
  - `locations_1740395000`: Stores office locations
    - `id` (uuid, primary key)
    - `name` (text)
    - `address` (text)
    - `phone` (text)
    - `is_active` (boolean)
    - `created_at` (timestamp)

2. Security
  - Enable RLS on all tables
  - Add policies for public read/write where appropriate for the MVP
*/

-- Check-ins Table
CREATE TABLE IF NOT EXISTS check_ins_1740395000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crn text NOT NULL,
  concerns text,
  mood integer DEFAULT 5,
  scheduled_day text,
  scheduled_window text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE check_ins_1740395000 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for check-ins" ON check_ins_1740395000 FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read for check-ins" ON check_ins_1740395000 FOR SELECT TO authenticated USING (true);

-- CRNs Table
CREATE TABLE IF NOT EXISTS crns_1740395000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crns_1740395000 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for active CRNs" ON crns_1740395000 FOR SELECT USING (is_active = true);
CREATE POLICY "Allow authenticated full access for CRNs" ON crns_1740395000 FOR ALL TO authenticated USING (true);

-- Providers Table
CREATE TABLE IF NOT EXISTS providers_1740395000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  qualification text,
  gender text,
  experience text,
  rating numeric DEFAULT 5.0,
  location_lat numeric,
  location_lng numeric,
  is_partner boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE providers_1740395000 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for providers" ON providers_1740395000 FOR SELECT USING (true);
CREATE POLICY "Allow public insert for provider signups" ON providers_1740395000 FOR INSERT WITH CHECK (true);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations_1740395000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations_1740395000 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for active locations" ON locations_1740395000 FOR SELECT USING (is_active = true);
CREATE POLICY "Allow authenticated full access for locations" ON locations_1740395000 FOR ALL TO authenticated USING (true);