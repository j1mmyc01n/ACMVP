-- Care providers (clinicians, field agents, partner orgs) attached to a
-- location. Independent of Identity users — a provider may have many users.

CREATE TABLE providers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  display_name TEXT        NOT NULL,
  kind         TEXT        NOT NULL DEFAULT 'clinician'
    CHECK (kind IN ('clinician', 'field_agent', 'partner_org', 'sponsor')),
  contact_email TEXT,
  phone        TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_providers_loc_kind ON providers (location_id, kind);
