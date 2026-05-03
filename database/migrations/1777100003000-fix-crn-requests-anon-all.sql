/*
# Fix CRN Requests — Allow full anon access for MVP

The CRN request flow runs as anon (unauthenticated) in the client portal.
Ensure all operations (INSERT, SELECT, UPDATE) work without authentication.
*/

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Public can submit CRN requests"  ON crn_requests_1777090006;
DROP POLICY IF EXISTS "Allow public insert CRN requests" ON crn_requests_1777090006;
DROP POLICY IF EXISTS "Allow public read CRN requests"  ON crn_requests_1777090006;
DROP POLICY IF EXISTS "Allow public update CRN requests" ON crn_requests_1777090006;
DROP POLICY IF EXISTS "anon_all"                        ON crn_requests_1777090006;

-- Single open policy — allows all operations for MVP (tighten in production)
CREATE POLICY "anon_all_crn_requests"
  ON crn_requests_1777090006
  FOR ALL
  USING (true)
  WITH CHECK (true);
