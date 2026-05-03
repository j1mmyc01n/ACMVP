-- Backstop migration that creates legacy tables the connectivity tests
-- expect to see. The original initial-schema migrations may not have run
-- against every project, so re-create them here idempotently. Without
-- this, the System Admin → Connectivity Tests panel reports schema-cache
-- "Could not find the table" errors against `clinical_notes_1777090003`
-- and `locations_1740395000`.

-- ── locations_1740395000 (legacy office locations) ───────────────────
CREATE TABLE IF NOT EXISTS locations_1740395000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations_1740395000 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'locations_1740395000'
      AND policyname = 'Allow public read for active locations'
  ) THEN
    CREATE POLICY "Allow public read for active locations" ON locations_1740395000
      FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'locations_1740395000'
      AND policyname = 'Allow authenticated full access for locations'
  ) THEN
    CREATE POLICY "Allow authenticated full access for locations" ON locations_1740395000
      FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- ── clinical_notes_1777090003 (detailed clinical notes) ──────────────
CREATE TABLE IF NOT EXISTS clinical_notes_1777090003 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid REFERENCES check_ins_1740395000(id),
  crn text NOT NULL,
  author text NOT NULL,
  note_type text DEFAULT 'general',
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clinical_notes_1777090003 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clinical_notes_1777090003'
      AND policyname = 'Allow all on clinical_notes'
  ) THEN
    CREATE POLICY "Allow all on clinical_notes" ON clinical_notes_1777090003 FOR ALL USING (true);
  END IF;
END $$;

-- Force PostgREST to refresh its schema cache so the connectivity tests
-- can find these tables immediately on next request.
NOTIFY pgrst, 'reload schema';
