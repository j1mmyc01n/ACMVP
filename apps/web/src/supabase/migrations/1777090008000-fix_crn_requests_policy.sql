/*
# Fix CRN Requests Policies
1. Security
- Drop restrictive authenticated policies that prevented the CRM from fetching the data.
- Allow public read/update access for MVP to align with the admin dashboard.
*/

DROP POLICY IF EXISTS "Authenticated can read CRN requests" ON crn_requests_1777090006;
DROP POLICY IF EXISTS "Authenticated can update CRN requests" ON crn_requests_1777090006;

CREATE POLICY "Allow public read CRN requests"
  ON crn_requests_1777090006
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public update CRN requests"
  ON crn_requests_1777090006
  FOR UPDATE
  USING (true);