-- ─────────────────────────────────────────────────────────────────────────────
-- Add provision_credentials table
--
-- Stores the SysAdmin provisioning API credentials (GitHub, Netlify, Supabase
-- management tokens) so they persist across devices and browser sessions.
-- A single row (id = 'default') is upserted whenever the admin clicks
-- "Save Credentials" in the Location Rollout screen.
--
-- Security note: this table lives in the same Supabase project as all other
-- ACMVP data and uses the same open-anon RLS posture as every other table in
-- this MVP.  Restrict the policy here if the project moves to authenticated
-- access.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provision_credentials (
  id              text        PRIMARY KEY DEFAULT 'default',
  github_org      text        NOT NULL DEFAULT '',
  template_repo   text        NOT NULL DEFAULT '',
  github_token    text        NOT NULL DEFAULT '',
  netlify_token   text        NOT NULL DEFAULT '',
  supabase_token  text        NOT NULL DEFAULT '',
  supabase_org_id text        NOT NULL DEFAULT '',
  region          text        NOT NULL DEFAULT 'ap-southeast-2',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE provision_credentials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'provision_credentials'
      AND policyname = 'anon_all_provision_credentials'
  ) THEN
    CREATE POLICY "anon_all_provision_credentials"
      ON provision_credentials
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
