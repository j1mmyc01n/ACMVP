-- Clinical check-ins. One row per encounter; clinical notes live as JSONB so
-- the schema is stable across changing assessment templates.

CREATE TABLE check_ins (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  client_id    UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  recorded_by  UUID,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  template     TEXT        NOT NULL DEFAULT 'standard',
  triage_level TEXT        CHECK (triage_level IN ('low', 'medium', 'high', 'critical')),
  notes        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  attachments  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_check_ins_client_time ON check_ins (client_id, occurred_at DESC);
CREATE INDEX idx_check_ins_location_triage ON check_ins (location_id, triage_level);
