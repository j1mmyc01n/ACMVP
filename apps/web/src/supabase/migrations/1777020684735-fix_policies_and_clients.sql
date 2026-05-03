/*
# Add Clients Table and Fix Policies
1. New Tables
- `clients_1777020684735`
  - `id` (uuid, primary key)
  - `name` (text)
  - `phone` (text)
  - `email` (text)
  - `crn` (text)
  - `created_at` (timestamp)
2. Security
- Enable RLS on `clients_1777020684735`
- Add public policies for full access to clients
- Fix policies for `crns_1740395000` (allow public insert and update)
- Fix policies for `check_ins_1740395000` (allow public select and update)
*/

CREATE TABLE IF NOT EXISTS clients_1777020684735 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text,
    email text,
    crn text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE clients_1777020684735 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access for clients" ON clients_1777020684735 FOR ALL USING (true) WITH CHECK (true);

-- Fix CRNs table to allow public insert and update
CREATE POLICY "Allow public insert for CRNs" ON crns_1740395000 FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for CRNs" ON crns_1740395000 FOR UPDATE USING (true);

-- Fix Check-ins table to allow public select and update (so admin can mark as read/complete and view lists)
CREATE POLICY "Allow public read for check-ins" ON check_ins_1740395000 FOR SELECT USING (true);
CREATE POLICY "Allow public update for check-ins" ON check_ins_1740395000 FOR UPDATE USING (true);