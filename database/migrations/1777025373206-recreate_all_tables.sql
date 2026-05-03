/*
# Initialize missing tables for new Supabase instance

1. New Tables
  - `crns_1740395000` (Client Reference Numbers)
  - `check_ins_1740395000` (Patient check-ins)
  - `providers_1740395000` (Service providers)
  - `locations_1740395000` (Office locations)
  - `clients_1777020684735` (Patient registry)
  - `admin_users_1777025000000` (System administrators)

2. Security
  - Enable RLS on all tables
  - Add open policies for MVP testing to allow full public access
  - Ensure safe idempotent operations with `IF NOT EXISTS`
*/

-- CRNs Table
CREATE TABLE IF NOT EXISTS crns_1740395000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE crns_1740395000 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for CRNs" ON crns_1740395000;
CREATE POLICY "Allow all for CRNs" ON crns_1740395000 FOR ALL USING (true) WITH CHECK (true);

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
DROP POLICY IF EXISTS "Allow all for check-ins" ON check_ins_1740395000;
CREATE POLICY "Allow all for check-ins" ON check_ins_1740395000 FOR ALL USING (true) WITH CHECK (true);

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
DROP POLICY IF EXISTS "Allow all for providers" ON providers_1740395000;
CREATE POLICY "Allow all for providers" ON providers_1740395000 FOR ALL USING (true) WITH CHECK (true);

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
DROP POLICY IF EXISTS "Allow all for locations" ON locations_1740395000;
CREATE POLICY "Allow all for locations" ON locations_1740395000 FOR ALL USING (true) WITH CHECK (true);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients_1777020684735 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  crn text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clients_1777020684735 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access for clients" ON clients_1777020684735;
CREATE POLICY "Allow public full access for clients" ON clients_1777020684735 FOR ALL USING (true) WITH CHECK (true);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users_1777025000000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text DEFAULT 'Admin',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_users_1777025000000 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for admin_users" ON admin_users_1777025000000;
CREATE POLICY "Allow all for admin_users" ON admin_users_1777025000000 FOR ALL USING (true) WITH CHECK (true);

INSERT INTO admin_users_1777025000000 (email, role) 
VALUES 
  ('ops@acuteconnect.health', 'Admin'),
  ('sysadmin@acuteconnect.health', 'SysAdmin') 
ON CONFLICT (email) DO NOTHING;