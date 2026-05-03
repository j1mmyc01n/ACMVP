/*
# Crisis Events v2

Creates the `crisis_events_1777090008` table used by ComprehensiveCrisisManagement.jsx.
This is the active crisis-events table (the earlier crisis_events_1777090000 is kept for
historical data only).

1. New Table
   - `crisis_events_1777090008`
     - id               (uuid, primary key)
     - client_crn       (text)
     - client_name      (text, required)
     - location         (text, required)
     - severity         (text)  — 'low' | 'medium' | 'high' | 'critical'
     - crisis_type      (text)  — e.g. 'mental_health' | 'medical' | 'safeguarding'
     - description      (text)
     - police_requested (boolean)
     - ambulance_requested (boolean)
     - assigned_team    (jsonb)
     - status           (text)  — 'active' | 'resolved'
     - created_at       (timestamptz)
     - resolved_at      (timestamptz)
     - updated_at       (timestamptz)

2. Security
   - Enable RLS
   - Allow full access for MVP (tighten in production)
*/

CREATE TABLE IF NOT EXISTS crisis_events_1777090008 (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_crn           text,
  client_name          text        NOT NULL,
  location             text        NOT NULL,
  severity             text        DEFAULT 'medium',
  crisis_type          text        DEFAULT 'mental_health',
  description          text,
  police_requested     boolean     DEFAULT false,
  ambulance_requested  boolean     DEFAULT false,
  assigned_team        jsonb       DEFAULT '[]'::jsonb,
  status               text        DEFAULT 'active',
  created_at           timestamptz DEFAULT now(),
  resolved_at          timestamptz,
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE crisis_events_1777090008 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all" ON crisis_events_1777090008;
CREATE POLICY "anon_all" ON crisis_events_1777090008
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_crisis_events_1777090008_status
  ON crisis_events_1777090008(status);

CREATE INDEX IF NOT EXISTS idx_crisis_events_1777090008_created_at
  ON crisis_events_1777090008(created_at);
