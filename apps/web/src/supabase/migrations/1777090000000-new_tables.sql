/*
# Create Advanced Management Tables
1. New Tables
  - `feedback_tickets_1777090000`: Tracks user/admin feedback and support tickets.
  - `feature_requests_1777090000`: Manages internal feature requests and voting.
  - `crisis_events_1777090000`: Stores active and resolved crisis incidents.
2. Security
  - Enable RLS on all tables and allow open access for MVP.
*/

CREATE TABLE IF NOT EXISTS feedback_tickets_1777090000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by text NOT NULL,
  submitter_type text DEFAULT 'client',
  subject text NOT NULL,
  message text NOT NULL,
  category text DEFAULT 'general',
  priority text DEFAULT 'medium',
  status text DEFAULT 'open',
  admin_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_requests_1777090000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  requested_by text NOT NULL,
  category text DEFAULT 'enhancement',
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  votes integer DEFAULT 0,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crisis_events_1777090000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_crn text,
  location text,
  crisis_type text,
  severity text,
  notes text,
  assigned_team jsonb DEFAULT '[]'::jsonb,
  police_requested boolean DEFAULT false,
  ambulance_requested boolean DEFAULT false,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE feedback_tickets_1777090000 ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests_1777090000 ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events_1777090000 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for feedback" ON feedback_tickets_1777090000 USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for features" ON feature_requests_1777090000 USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for crisis" ON crisis_events_1777090000 USING (true) WITH CHECK (true);