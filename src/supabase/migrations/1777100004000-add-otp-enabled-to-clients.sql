/*
# Migration: Add otp_enabled to clients

Adds an `otp_enabled` boolean flag to `clients_1777020684735`.
When true, location admins/staff have granted this client OTP access,
allowing them to log in via the OTP flow or access higher-level resources.
Only location admins/staff can set this flag — clients cannot modify it themselves.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients_1777020684735' AND column_name = 'otp_enabled'
  ) THEN
    ALTER TABLE clients_1777020684735 ADD COLUMN otp_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;
