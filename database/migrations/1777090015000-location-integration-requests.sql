-- Location integration requests table
-- Stores admin requests to activate third-party integrations (AI Engine, CRM, Calendar)
-- for specific care-centre locations, pending SysAdmin approval.

CREATE TABLE IF NOT EXISTS location_integration_requests_1777090015 (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,           -- 'ai_activation' | 'crm_connection' | 'calendar_connection'
  location_id uuid NOT NULL,           -- references care_centres_1777090000.id
  status      text NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'active'
  payload     jsonb,                   -- type-specific form data
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Allow anyone to insert (admin users submit requests)
ALTER TABLE location_integration_requests_1777090015 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert_integration_requests"
  ON location_integration_requests_1777090015
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_select_integration_requests"
  ON location_integration_requests_1777090015
  FOR SELECT USING (true);

CREATE POLICY "allow_update_integration_requests"
  ON location_integration_requests_1777090015
  FOR UPDATE USING (true);
