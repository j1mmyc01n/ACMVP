-- Clients (patients) — the central record for the care-coordination workflow.

CREATE TABLE clients (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  full_name    TEXT        NOT NULL,
  date_of_birth DATE,
  email        TEXT,
  phone        TEXT,
  status       TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  privacy_mode BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_location_status ON clients (location_id, status);
CREATE INDEX idx_clients_full_name        ON clients (location_id, full_name);
CREATE UNIQUE INDEX uq_clients_email_per_location
  ON clients (location_id, lower(email)) WHERE email IS NOT NULL;
