/*
# Migration: Client Portal Accounts
# Run this in Supabase Dashboard > SQL Editor

Creates client_accounts table that links Supabase Auth users
to existing client CRNs — enabling client portal logins.
*/

CREATE TABLE IF NOT EXISTS client_accounts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id    uuid        REFERENCES clients_1777020684735(id) ON DELETE SET NULL,
  crn          text,
  email        text        NOT NULL,
  first_name   text,
  last_name    text,
  phone        text,
  location_id  uuid,
  status       text        DEFAULT 'active',
  last_login   timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;

-- Clients can only read/update their own record
CREATE POLICY "client_own_record" ON client_accounts
  FOR ALL
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Admin and sysadmin can see all client accounts
CREATE POLICY "admin_read_all" ON client_accounts
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'sysadmin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'sysadmin')
  );

-- Admin can update client accounts
CREATE POLICY "admin_update" ON client_accounts
  FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'sysadmin')
  );

-- Index for fast CRN lookups
CREATE INDEX IF NOT EXISTS idx_client_accounts_crn ON client_accounts(crn);
CREATE INDEX IF NOT EXISTS idx_client_accounts_email ON client_accounts(email);
CREATE INDEX IF NOT EXISTS idx_client_accounts_auth_user ON client_accounts(auth_user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_client_accounts_updated_at ON client_accounts;
CREATE TRIGGER update_client_accounts_updated_at
  BEFORE UPDATE ON client_accounts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
