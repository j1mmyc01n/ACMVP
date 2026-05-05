-- Call logs table for CRM caller screen
-- Records every outbound call made from the CRM

CREATE TABLE IF NOT EXISTS call_logs_1777090000 (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id         uuid        REFERENCES clients_1777020684735(id) ON DELETE SET NULL,
  client_name       text,
  client_phone      text,
  care_centre       text,
  initiated_by      text,
  status            text        NOT NULL DEFAULT 'ended',  -- dialing | active | on_hold | ended | bridged
  started_at        timestamptz DEFAULT now(),
  ended_at          timestamptz,
  duration_seconds  int,
  notes             text,
  bridged_to_name   text,
  bridged_to_phone  text,
  created_at        timestamptz DEFAULT now()
);

-- Open RLS for anon (matches existing tables pattern)
ALTER TABLE call_logs_1777090000 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_logs_all" ON call_logs_1777090000
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
