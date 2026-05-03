/*
# Audit Logs v2

Creates the `audit_logs_1777090020` table used by AuditLogPage.jsx.
This is the active audit-log table (the earlier audit_log_1777090000 used a
simpler schema; this version captures richer actor and request context).

1. New Table
   - `audit_logs_1777090020`
     - id          (uuid, primary key)
     - action      (text)  — e.g. 'create' | 'update' | 'delete' | 'view' | 'login'
     - resource    (text)  — e.g. 'client' | 'check_in' | 'crisis_event'
     - detail      (text)  — human-readable description of the event
     - actor       (text)  — email / username performing the action (short alias)
     - actor_name  (text)  — full display name of the actor
     - actor_role  (text)  — role at time of action
     - source_type (text)  — 'admin' | 'client' | 'system' | 'api'
     - location    (text)  — care-centre / location name at time of action
     - ip_address  (text)
     - level       (text)  — 'info' | 'warning' | 'error'
     - created_at  (timestamptz)

2. Security
   - Enable RLS
   - Allow full access for MVP (tighten in production)
*/

CREATE TABLE IF NOT EXISTS audit_logs_1777090020 (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action       text,
  resource     text,
  detail       text,
  actor        text,
  actor_name   text,
  actor_role   text,
  source_type  text        DEFAULT 'system',
  location     text,
  ip_address   text,
  level        text        DEFAULT 'info',
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE audit_logs_1777090020 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all" ON audit_logs_1777090020;
CREATE POLICY "anon_all" ON audit_logs_1777090020
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_1777090020_created_at
  ON audit_logs_1777090020(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_1777090020_actor
  ON audit_logs_1777090020(actor);

CREATE INDEX IF NOT EXISTS idx_audit_logs_1777090020_action
  ON audit_logs_1777090020(action);
