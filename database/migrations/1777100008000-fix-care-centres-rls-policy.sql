/*
# Fix care_centres RLS policy — add WITH CHECK clause

The original policy was created without an explicit WITH CHECK expression:
  CREATE POLICY "Allow all on care_centres" ... FOR ALL USING (true);

Supabase requires an explicit WITH CHECK (true) for INSERT / UPDATE (upsert)
operations to succeed. Without it, the "Seed Test Location" button and the
"New Centre" form throw:
  "new row violates row-level security policy for table care_centres_1777090000"

Fix: drop the incomplete policy and recreate it with both clauses.
*/

DROP POLICY IF EXISTS "Allow all on care_centres" ON care_centres_1777090000;

CREATE POLICY "Allow all on care_centres"
  ON care_centres_1777090000
  FOR ALL
  USING (true)
  WITH CHECK (true);
