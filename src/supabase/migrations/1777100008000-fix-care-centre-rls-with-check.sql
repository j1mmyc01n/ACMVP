-- Repair RLS policies for the tables the seed-test-location flow writes to.
-- The original policies used `FOR ALL USING (true)` without `WITH CHECK (true)`.
-- In PostgreSQL, INSERT/UPDATE on an RLS-enabled table requires a WITH CHECK
-- predicate; without it, anonymous writes are silently rejected with
-- "new row violates row-level security policy".
--
-- This migration drops the legacy policy on care_centres_1777090000 and
-- replaces it with one that grants both USING and WITH CHECK = true. The
-- same defensive shape is applied to clients_1777020684735 and
-- check_ins_1740395000 in case any deployment is missing the WITH CHECK
-- clause on those policies. RLS remains enabled — the policy itself is
-- permissive (matching the existing MVP "open access" posture).

DO $$
BEGIN
  -- care_centres
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'care_centres_1777090000'
  ) THEN
    DROP POLICY IF EXISTS "Allow all on care_centres" ON care_centres_1777090000;
    DROP POLICY IF EXISTS "Allow all for care_centres" ON care_centres_1777090000;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'care_centres_1777090000'
  ) THEN
    EXECUTE 'ALTER TABLE care_centres_1777090000 ENABLE ROW LEVEL SECURITY';
    EXECUTE $POLICY$
      CREATE POLICY "Allow all for care_centres"
        ON care_centres_1777090000
        FOR ALL
        USING (true)
        WITH CHECK (true)
    $POLICY$;
  END IF;

  -- clients
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients_1777020684735'
  ) THEN
    DROP POLICY IF EXISTS "Allow all for clients" ON clients_1777020684735;
    DROP POLICY IF EXISTS "Allow all on clients" ON clients_1777020684735;
    EXECUTE 'ALTER TABLE clients_1777020684735 ENABLE ROW LEVEL SECURITY';
    EXECUTE $POLICY$
      CREATE POLICY "Allow all for clients"
        ON clients_1777020684735
        FOR ALL
        USING (true)
        WITH CHECK (true)
    $POLICY$;
  END IF;

  -- check_ins
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'check_ins_1740395000'
  ) THEN
    DROP POLICY IF EXISTS "Allow all for check-ins" ON check_ins_1740395000;
    DROP POLICY IF EXISTS "Allow all on check_ins" ON check_ins_1740395000;
    EXECUTE 'ALTER TABLE check_ins_1740395000 ENABLE ROW LEVEL SECURITY';
    EXECUTE $POLICY$
      CREATE POLICY "Allow all for check-ins"
        ON check_ins_1740395000
        FOR ALL
        USING (true)
        WITH CHECK (true)
    $POLICY$;
  END IF;
END $$;
