-- Crisis events & escalations. A crisis row is a heightened-state record on a
-- client; status transitions reflect the resolution lifecycle.

CREATE TABLE crisis_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id    UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reported_by  UUID,
  severity     TEXT        NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status       TEXT        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  summary      TEXT        NOT NULL,
  details      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at TIMESTAMPTZ,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crisis_events_loc_status ON crisis_events (location_id, status);
CREATE INDEX idx_crisis_events_client     ON crisis_events (client_id, created_at DESC);
