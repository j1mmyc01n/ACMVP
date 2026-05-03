/*
# Open Access and Add Admins Table
1. New Tables
- `admin_users_1777025000000` to store admin accounts.
2. Security Updates
- Drop restrictive policies on CRNs and Check-ins.
- Add completely open policies for MVP testing.
*/

CREATE TABLE IF NOT EXISTS admin_users_1777025000000 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    role text DEFAULT 'Admin',
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users_1777025000000 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for admin_users" ON admin_users_1777025000000 FOR ALL USING (true) WITH CHECK (true);

-- Insert default admins
INSERT INTO admin_users_1777025000000 (email, role) VALUES 
('ops@acuteconnect.health', 'Admin'),
('sysadmin@acuteconnect.health', 'SysAdmin')
ON CONFLICT DO NOTHING;

-- Completely open up other tables for MVP UI
DROP POLICY IF EXISTS "Allow public read for active CRNs" ON crns_1740395000;
DROP POLICY IF EXISTS "Allow authenticated full access for CRNs" ON crns_1740395000;
DROP POLICY IF EXISTS "Allow public insert for CRNs" ON crns_1740395000;
DROP POLICY IF EXISTS "Allow public update for CRNs" ON crns_1740395000;
CREATE POLICY "Allow all for CRNs" ON crns_1740395000 FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert for check-ins" ON check_ins_1740395000;
DROP POLICY IF EXISTS "Allow authenticated read for check-ins" ON check_ins_1740395000;
DROP POLICY IF EXISTS "Allow public read for check-ins" ON check_ins_1740395000;
DROP POLICY IF EXISTS "Allow public update for check-ins" ON check_ins_1740395000;
CREATE POLICY "Allow all for check-ins" ON check_ins_1740395000 FOR ALL USING (true) WITH CHECK (true);