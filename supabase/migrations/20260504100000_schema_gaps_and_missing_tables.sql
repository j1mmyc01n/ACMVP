-- ─────────────────────────────────────────────────────────────────────────────
-- Schema gaps & missing tables
--
-- Adds all columns and tables that the application code references but that
-- are absent from the consolidated supabase/migrations/ path.
--
-- All changes are idempotent — safe to re-apply.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. care_centres_1777090000 — add missing columns ─────────────────────────
ALTER TABLE care_centres_1777090000
  ADD COLUMN IF NOT EXISTS primary_service  text,               -- mapped care type ID used by wizard & billing
  ADD COLUMN IF NOT EXISTS latitude         numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude        numeric(9,6),
  ADD COLUMN IF NOT EXISTS parent_id        uuid                -- FK to another care centre (optional)
    REFERENCES care_centres_1777090000(id) ON DELETE SET NULL;

-- ── 2. location_instances — add parent_location_id ───────────────────────────
ALTER TABLE location_instances
  ADD COLUMN IF NOT EXISTS parent_location_id uuid
    REFERENCES location_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_location_instances_parent ON location_instances(parent_location_id);

-- ── 3. clients_1777020684735 — add missing columns ───────────────────────────
ALTER TABLE clients_1777020684735
  ADD COLUMN IF NOT EXISTS event_log       jsonb   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS offboard_reason text;

-- ── 4. providers_1740395000 — add missing columns ────────────────────────────
ALTER TABLE providers_1740395000
  ADD COLUMN IF NOT EXISTS status        text DEFAULT 'pending',   -- 'pending' | 'active' | 'rejected'
  ADD COLUMN IF NOT EXISTS provider_type text DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS practice_name text,
  ADD COLUMN IF NOT EXISTS email         text;

-- ── 5. feedback_tickets_1777090000 — add missing columns ─────────────────────
ALTER TABLE feedback_tickets_1777090000
  ADD COLUMN IF NOT EXISTS assigned_to    text,
  ADD COLUMN IF NOT EXISTS admin_response text;

-- ── 6. admin_users_1777025000000 — add missing columns ───────────────────────
ALTER TABLE admin_users_1777025000000
  ADD COLUMN IF NOT EXISTS sublocation      text,
  ADD COLUMN IF NOT EXISTS agent_status     text,
  ADD COLUMN IF NOT EXISTS agent_lat        numeric(9,6),
  ADD COLUMN IF NOT EXISTS agent_lng        numeric(9,6),
  ADD COLUMN IF NOT EXISTS agent_last_ping  timestamptz;

-- ── 7. profiles ───────────────────────────────────────────────────────────────
-- Lightweight profile record keyed on CRN, used by the client portal and
-- staff profile viewer. Not backed by Supabase Auth.
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crn         text        UNIQUE,
  role        text        DEFAULT 'user',   -- 'user' | 'staff' | 'admin'
  full_name   text,
  first_name  text,
  last_name   text,
  dob         date,
  email       text,
  phone       text,
  postcode    text,
  avatar_url  text,
  bio         text,
  status      text        DEFAULT 'active',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'anon_all') THEN
    CREATE POLICY "anon_all" ON profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_crn   ON profiles(crn);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ── 8. profile_audit_log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,
  crn         text,
  action      text        NOT NULL,
  table_name  text,
  record_id   text,
  old_data    jsonb,
  new_data    jsonb,
  actor       text,
  actor_role  text,
  ip_address  text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE profile_audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_audit_log' AND policyname = 'anon_all') THEN
    CREATE POLICY "anon_all" ON profile_audit_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profile_audit_log_crn       ON profile_audit_log(crn);
CREATE INDEX IF NOT EXISTS idx_profile_audit_log_created_at ON profile_audit_log(created_at DESC);

-- ── 9. audit_logs (alias view) ────────────────────────────────────────────────
-- Some code queries `.from('audit_logs')` without the numeric suffix.
-- Create a view so both names work.
CREATE OR REPLACE VIEW audit_logs AS
  SELECT * FROM audit_logs_1777090020;

-- ── 10. check_ins (alias view) ────────────────────────────────────────────────
-- Some code queries `.from('check_ins')` without the numeric suffix.
CREATE OR REPLACE VIEW check_ins AS
  SELECT * FROM check_ins_1740395000;

-- ── 11. providers (alias view) ────────────────────────────────────────────────
-- ProviderJoinPage inserts/selects from 'providers' (no suffix).
CREATE OR REPLACE VIEW providers AS
  SELECT * FROM providers_1740395000;

-- ── 12. consent_agreements ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_agreements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crn          text,
  client_id    uuid,
  type         text        NOT NULL DEFAULT 'general',  -- 'general' | 'data_sharing' | 'treatment'
  version      text        DEFAULT '1.0',
  agreed       boolean     DEFAULT false,
  agreed_at    timestamptz,
  ip_address   text,
  user_agent   text,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE consent_agreements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'consent_agreements' AND policyname = 'anon_all') THEN
    CREATE POLICY "anon_all" ON consent_agreements FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consent_agreements_crn ON consent_agreements(crn);

-- ── 13. crn_records ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crn_records (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crn         text        UNIQUE NOT NULL,
  client_id   uuid,
  issued_at   timestamptz DEFAULT now(),
  issued_by   text,
  status      text        DEFAULT 'active',   -- 'active' | 'suspended' | 'revoked'
  notes       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE crn_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crn_records' AND policyname = 'anon_all') THEN
    CREATE POLICY "anon_all" ON crn_records FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crn_records_crn ON crn_records(crn);

-- ── 14. medical_events ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crn          text,
  client_id    uuid,
  event_type   text        NOT NULL DEFAULT 'general',
  title        text,
  description  text,
  severity     text        DEFAULT 'low',    -- 'low' | 'medium' | 'high' | 'critical'
  location     text,
  recorded_by  text,
  recorded_at  timestamptz DEFAULT now(),
  metadata     jsonb       DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE medical_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'medical_events' AND policyname = 'anon_all') THEN
    CREATE POLICY "anon_all" ON medical_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_medical_events_crn       ON medical_events(crn);
CREATE INDEX IF NOT EXISTS idx_medical_events_client_id ON medical_events(client_id);

-- ── 15. location_feature_flags ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_feature_flags (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  uuid        REFERENCES location_instances(id) ON DELETE CASCADE,
  feature_id   text        NOT NULL,
  enabled      boolean     DEFAULT false,
  price        numeric     DEFAULT 0,
  metadata     jsonb       DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(location_id, feature_id)
);

ALTER TABLE location_feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'location_feature_flags' AND policyname = 'anon_all') THEN
    CREATE POLICY "anon_all" ON location_feature_flags FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_location_feature_flags_location ON location_feature_flags(location_id);

-- ── 16. invoices_1777090000 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices_1777090000 (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id      uuid        REFERENCES location_instances(id) ON DELETE SET NULL,
  location_name    text,
  contact_email    text,
  line_items       jsonb       DEFAULT '[]'::jsonb,
  total_amount     numeric     DEFAULT 0,
  status           text        DEFAULT 'pending',   -- 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date         date,
  paid_at          timestamptz,
  invoice_number   text,
  notes            text,
  amount           numeric     GENERATED ALWAYS AS (total_amount) STORED,  -- alias for FinanceHubPage
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE invoices_1777090000 ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices_1777090000' AND policyname = 'anon_all') THEN
    CREATE POLICY "anon_all" ON invoices_1777090000 FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_1777090000_location   ON invoices_1777090000(location_id);
CREATE INDEX IF NOT EXISTS idx_invoices_1777090000_status     ON invoices_1777090000(status);
CREATE INDEX IF NOT EXISTS idx_invoices_1777090000_created_at ON invoices_1777090000(created_at DESC);

-- ── 17. sponsors_1777020684735 ───────────────────────────────────────────────
-- Second sponsors table referenced by FinanceHubPage for contribution tracking.
CREATE TABLE IF NOT EXISTS sponsors_1777020684735 (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        text,
  contact_name        text,
  email               text,
  contribution_amount numeric     DEFAULT 0,
  status              text        DEFAULT 'pending',   -- 'pending' | 'confirmed' | 'cancelled'
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE sponsors_1777020684735 ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sponsors_1777020684735' AND policyname = 'anon_all') THEN
    CREATE POLICY "anon_all" ON sponsors_1777020684735 FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 18. auto-update triggers for new tables ──────────────────────────────────
DROP TRIGGER IF EXISTS update_profiles_updated_at            ON profiles;
DROP TRIGGER IF EXISTS update_location_feature_flags_updated_at ON location_feature_flags;
DROP TRIGGER IF EXISTS update_invoices_1777090000_updated_at ON invoices_1777090000;
DROP TRIGGER IF EXISTS update_sponsors_1777020684735_updated_at ON sponsors_1777020684735;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_feature_flags_updated_at
  BEFORE UPDATE ON location_feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_1777090000_updated_at
  BEFORE UPDATE ON invoices_1777090000
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsors_1777020684735_updated_at
  BEFORE UPDATE ON sponsors_1777020684735
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Reload PostgREST schema cache ────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
