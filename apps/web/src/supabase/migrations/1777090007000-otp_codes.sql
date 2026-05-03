/*
# One-Time Password (OTP) Login System

1. New Tables
  - `login_otp_codes_1777090007` - Stores single-use login codes
    - `id` (uuid, primary key)
    - `email` (text) - Staff email the OTP was sent to
    - `code` (text) - 6-digit OTP code
    - `used` (boolean) - Whether the code has been consumed
    - `expires_at` (timestamptz) - Code expiry (10 minutes)
    - `created_at` (timestamptz)

2. Security
  - Enable RLS
  - Full open access for MVP (matches existing pattern)

3. Notes
  - OTPs expire after 10 minutes
  - Each code is single-use (used = true after verification)
*/

CREATE TABLE IF NOT EXISTS login_otp_codes_1777090007 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE login_otp_codes_1777090007 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for OTP codes"
  ON login_otp_codes_1777090007
  FOR ALL
  USING (true)
  WITH CHECK (true);