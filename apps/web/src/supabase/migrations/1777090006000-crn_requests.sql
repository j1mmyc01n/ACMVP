/*
# CRN Request System

1. New Tables
  - `crn_requests_1777090006` - Stores client CRN requests
    - `id` (uuid, primary key)
    - `first_name` (text)
    - `mobile` (text)
    - `email` (text)
    - `status` (text: pending, processed)
    - `crn_issued` (text, nullable)
    - `created_at` (timestamptz)

2. Security
  - Enable RLS
  - Public can insert (client-facing form)
  - Authenticated can read and update
*/

CREATE TABLE IF NOT EXISTS crn_requests_1777090006 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  crn_issued text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crn_requests_1777090006 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit CRN requests"
  ON crn_requests_1777090006
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can read CRN requests"
  ON crn_requests_1777090006
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update CRN requests"
  ON crn_requests_1777090006
  FOR UPDATE
  TO authenticated
  USING (true);