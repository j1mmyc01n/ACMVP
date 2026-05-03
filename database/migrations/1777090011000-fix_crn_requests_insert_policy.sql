/*
# Fix CRN Requests Insert Policy
1. Changes
- Drop the previous 'TO anon' restrict policy
- Add a fully open insert policy so all users can submit requests without authentication barriers
*/

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can submit CRN requests" ON crn_requests_1777090006;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

CREATE POLICY "Allow public insert CRN requests"
  ON crn_requests_1777090006
  FOR INSERT
  WITH CHECK (true);