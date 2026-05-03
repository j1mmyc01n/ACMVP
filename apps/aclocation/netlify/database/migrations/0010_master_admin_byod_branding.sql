-- Master admin (sysadmin), bring-your-own database (BYOD), branding,
-- enabled modules, invite-based onboarding.
--
-- Role hierarchy (highest to lowest):
--   master_admin  : platform owner / sysadmin — sees and controls everything
--                   across every location. Approves new locations, approves
--                   BYOD database requests, controls billing.
--   super_admin   : a location's senior administrator — higher visibility than
--                   admin within that location. Can manage admins/members of
--                   that location, see billing for the location.
--   admin         : day-to-day administrator within a single location.
--   member        : standard staff user within a single location.
--
-- Identity stores the role array on `app_metadata.roles`. The check constraint
-- below is widened so `master_admin` is a valid persisted role.

ALTER TABLE location_members
  DROP CONSTRAINT IF EXISTS location_members_role_check;

ALTER TABLE location_members
  ADD CONSTRAINT location_members_role_check
  CHECK (role IN ('member', 'admin', 'super_admin', 'master_admin'));

-- Tenant rollout config: branding, enabled modules, BYOD database wiring.
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS branding         JSONB  NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS enabled_modules  JSONB  NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS database_mode    TEXT   NOT NULL DEFAULT 'shared'
    CHECK (database_mode IN ('shared', 'dedicated')),
  ADD COLUMN IF NOT EXISTS database_status  TEXT   NOT NULL DEFAULT 'shared'
    CHECK (database_status IN ('shared', 'pending_approval', 'approved', 'rejected', 'revoked')),
  ADD COLUMN IF NOT EXISTS database_url     TEXT,
  ADD COLUMN IF NOT EXISTS database_provider TEXT,
  ADD COLUMN IF NOT EXISTS admin_email      TEXT,
  ADD COLUMN IF NOT EXISTS approval_status  TEXT   NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by      UUID,
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMPTZ;

-- BYOD database approval queue. A location super_admin opens a request; the
-- master_admin approves or rejects. Until approved the request has no effect
-- on the runtime — `locations.database_status` only flips after approval.
CREATE TABLE IF NOT EXISTS location_database_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  requested_by    UUID        NOT NULL,
  provider        TEXT        NOT NULL,
  connection_url  TEXT        NOT NULL,
  reason          TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  reviewed_by     UUID,
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_db_requests_status
  ON location_database_requests (status, created_at DESC);

-- Invite-based account creation. Public signup is disabled; the master_admin
-- (or a location super_admin within their tenant) issues an invite, the
-- recipient signs up using the invite token, and identity-signup binds them
-- to the right location with the right role.
CREATE TABLE IF NOT EXISTS location_invites (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID        REFERENCES locations(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'admin', 'super_admin', 'master_admin')),
  token         TEXT        NOT NULL UNIQUE,
  invited_by    UUID        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  accepted_by   UUID,
  accepted_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_invites_email ON location_invites (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_location_invites_status ON location_invites (status, expires_at);

-- Helpful default for existing rows: shared DB, all core modules enabled.
UPDATE locations
SET enabled_modules = '["dashboard","clients","crn","check-ins","crisis","providers","billing","audit","field-agents"]'::jsonb
WHERE enabled_modules = '[]'::jsonb;
