-- Tenancy primitives.
-- A "location" is a tenant in the SaaS. Every domain table that holds
-- per-tenant data carries a `location_id` foreign key to this table.
-- Membership and role are tracked separately so a single Identity user may
-- serve in multiple locations with different roles.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE locations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('provisioning', 'active', 'suspended', 'archived')),
  plan_tier       TEXT        NOT NULL DEFAULT 'starter',
  netlify_site_id TEXT,
  netlify_url     TEXT,
  github_repo     TEXT,
  privacy_mode    BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_status ON locations (status);

-- Membership: which Identity users can act on which locations and in what role.
-- Identity user IDs are not stored in Postgres, so user_id is a plain UUID
-- (sourced from `app_metadata` after sign-in).
CREATE TABLE location_members (
  location_id UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'admin', 'super_admin')),
  invited_by  UUID,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (location_id, user_id)
);

CREATE INDEX idx_location_members_user ON location_members (user_id);
