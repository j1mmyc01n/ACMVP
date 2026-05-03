/*
# Add UNIQUE constraint on clients_1777020684735.crn

The original table was created with `crn text` (no unique constraint).
The upsert in the seed-test-location flow uses `onConflict: 'crn'`, which
requires a UNIQUE constraint to exist so that PostgREST can generate an
INSERT … ON CONFLICT (crn) DO UPDATE statement.

This migration:
1. Removes any duplicate CRN rows, keeping the most recently created record.
2. Adds the UNIQUE constraint idempotently.
*/

DO $$
BEGIN
  -- Step 1: Deduplicate – delete older rows that share the same non-null CRN,
  --         keeping only the most-recently created row for each CRN value.
  DELETE FROM clients_1777020684735
  WHERE crn IS NOT NULL
    AND id NOT IN (
      SELECT DISTINCT ON (crn) id
      FROM clients_1777020684735
      WHERE crn IS NOT NULL
      ORDER BY crn, created_at DESC NULLS LAST
    );

  -- Step 2: Add UNIQUE constraint if it does not already exist.
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints
    WHERE  constraint_type = 'UNIQUE'
      AND  table_name      = 'clients_1777020684735'
      AND  constraint_name = 'clients_crn_unique'
  ) THEN
    ALTER TABLE clients_1777020684735
      ADD CONSTRAINT clients_crn_unique UNIQUE (crn);
  END IF;
END $$;
