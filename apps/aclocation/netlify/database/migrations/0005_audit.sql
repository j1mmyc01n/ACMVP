-- Append-only audit log. Authorization is enforced at the function layer; this
-- table is the system-of-record for who did what. Never UPDATE or DELETE rows.

CREATE TABLE audit_log (
  id           BIGSERIAL   PRIMARY KEY,
  location_id  UUID        REFERENCES locations(id) ON DELETE SET NULL,
  actor_id     UUID,
  actor_email  TEXT,
  action       TEXT        NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_location_time ON audit_log (location_id, created_at DESC);
CREATE INDEX idx_audit_log_actor         ON audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_log_action        ON audit_log (action, created_at DESC);
