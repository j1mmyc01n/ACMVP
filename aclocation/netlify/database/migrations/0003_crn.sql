-- Care Recipient Numbers (CRN). Two-stage flow:
--   1. crn_requests captures the inbound public/staff request.
--   2. crns is the issued, durable identifier.
-- Splitting requests from issued numbers preserves the audit trail and lets
-- requests be triaged, denied, or duplicated without polluting the canonical id.

CREATE TABLE crn_requests (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id     UUID        REFERENCES clients(id) ON DELETE SET NULL,
  requested_by  UUID,
  channel       TEXT        NOT NULL DEFAULT 'web'
    CHECK (channel IN ('web', 'staff', 'api', 'phone')),
  full_name     TEXT        NOT NULL,
  date_of_birth DATE,
  reason        TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'issued', 'rejected', 'duplicate')),
  rejected_reason TEXT,
  metadata      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

CREATE INDEX idx_crn_requests_location_status ON crn_requests (location_id, status);

CREATE TABLE crns (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id     UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  request_id    UUID        REFERENCES crn_requests(id) ON DELETE SET NULL,
  number        TEXT        NOT NULL,
  issued_by     UUID,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_crns_number_per_location ON crns (location_id, number);
CREATE INDEX idx_crns_client ON crns (client_id);
