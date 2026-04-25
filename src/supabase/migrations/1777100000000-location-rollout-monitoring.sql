/*
# Location Rollout Monitoring & Billing System
  
Creates tables for:
1. Location instances (deployed locations)
2. API credentials and keys
3. Usage tracking (API calls, credits, bandwidth)
4. Billing records
5. Health monitoring
*/

-- ═══════════════════════════════════════════════════════════════════
-- LOCATION INSTANCES
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS location_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  care_type text NOT NULL,
  
  -- Infrastructure URLs
  github_repo_url text,
  github_repo_full_name text,
  netlify_url text,
  netlify_site_id text,
  supabase_ref text,
  supabase_url text,
  
  -- Deployment status
  status text DEFAULT 'provisioning', -- provisioning | active | suspended | error
  deployment_phase text, -- github | supabase | netlify | secrets | deploy
  last_deployed_at timestamptz,
  
  -- Billing
  plan_type text DEFAULT 'pro', -- starter | pro | enterprise
  monthly_credit_limit numeric DEFAULT 10000,
  credits_used numeric DEFAULT 0,
  billing_status text DEFAULT 'active', -- active | suspended | overdue
  
  -- Contact
  primary_contact_email text,
  primary_contact_phone text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  notes text
);

ALTER TABLE location_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for location_instances" ON location_instances;
CREATE POLICY "Allow all for location_instances" ON location_instances FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_location_instances_slug ON location_instances(slug);
CREATE INDEX IF NOT EXISTS idx_location_instances_status ON location_instances(status);

-- ═══════════════════════════════════════════════════════════════════
-- API CREDENTIALS (Encrypted storage)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS location_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES location_instances(id) ON DELETE CASCADE,
  
  credential_type text NOT NULL, -- github_token | netlify_token | supabase_token | supabase_anon_key | api_key
  credential_key text NOT NULL, -- The actual key/token (should be encrypted in production)
  
  -- Metadata
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  
  UNIQUE(location_id, credential_type)
);

ALTER TABLE location_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for location_credentials" ON location_credentials;
CREATE POLICY "Allow all for location_credentials" ON location_credentials FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_location_credentials_location ON location_credentials(location_id);

-- ═══════════════════════════════════════════════════════════════════
-- API USAGE TRACKING
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS location_api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES location_instances(id) ON DELETE CASCADE,
  
  -- Usage metrics
  endpoint text, -- API endpoint called
  method text, -- GET | POST | PUT | DELETE
  credits_consumed numeric DEFAULT 1,
  response_time_ms numeric,
  status_code integer,
  
  -- Request details
  user_agent text,
  ip_address text,
  request_body_size numeric, -- bytes
  response_body_size numeric, -- bytes
  
  -- Timestamps
  timestamp timestamptz DEFAULT now(),
  date date DEFAULT CURRENT_DATE
);

ALTER TABLE location_api_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for location_api_usage" ON location_api_usage;
CREATE POLICY "Allow all for location_api_usage" ON location_api_usage FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_location_api_usage_location ON location_api_usage(location_id);
CREATE INDEX IF NOT EXISTS idx_location_api_usage_date ON location_api_usage(date);
CREATE INDEX IF NOT EXISTS idx_location_api_usage_timestamp ON location_api_usage(timestamp);

-- ═══════════════════════════════════════════════════════════════════
-- DAILY USAGE AGGREGATES (for performance)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS location_daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES location_instances(id) ON DELETE CASCADE,
  date date NOT NULL,
  
  -- Aggregated metrics
  total_requests integer DEFAULT 0,
  total_credits_consumed numeric DEFAULT 0,
  total_bandwidth_gb numeric DEFAULT 0,
  avg_response_time_ms numeric DEFAULT 0,
  error_count integer DEFAULT 0,
  
  -- Top endpoints
  top_endpoint text,
  top_endpoint_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(location_id, date)
);

ALTER TABLE location_daily_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for location_daily_usage" ON location_daily_usage;
CREATE POLICY "Allow all for location_daily_usage" ON location_daily_usage FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_location_daily_usage_location_date ON location_daily_usage(location_id, date);

-- ═══════════════════════════════════════════════════════════════════
-- BILLING RECORDS
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS location_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES location_instances(id) ON DELETE CASCADE,
  
  -- Billing period
  billing_period_start date NOT NULL,
  billing_period_end date NOT NULL,
  
  -- Usage charges
  credits_used numeric DEFAULT 0,
  credit_rate numeric DEFAULT 0.01, -- $ per credit
  usage_charge numeric DEFAULT 0,
  
  -- Fixed charges
  base_subscription_fee numeric DEFAULT 0,
  
  -- Totals
  subtotal numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  
  -- Payment
  status text DEFAULT 'pending', -- pending | paid | overdue | cancelled
  paid_at timestamptz,
  payment_method text,
  invoice_url text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  due_date date,
  notes text
);

ALTER TABLE location_billing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for location_billing" ON location_billing;
CREATE POLICY "Allow all for location_billing" ON location_billing FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_location_billing_location ON location_billing(location_id);
CREATE INDEX IF NOT EXISTS idx_location_billing_period ON location_billing(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_location_billing_status ON location_billing(status);

-- ═══════════════════════════════════════════════════════════════════
-- HEALTH MONITORING
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS location_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES location_instances(id) ON DELETE CASCADE,
  
  -- Health metrics
  status text NOT NULL, -- healthy | degraded | down
  uptime_percentage numeric DEFAULT 100,
  response_time_ms numeric,
  
  -- Service checks
  netlify_status text, -- up | down
  supabase_status text, -- up | down
  github_status text, -- up | down
  
  -- Error tracking
  error_message text,
  error_count integer DEFAULT 0,
  last_error_at timestamptz,
  
  -- Timestamps
  checked_at timestamptz DEFAULT now(),
  next_check_at timestamptz
);

ALTER TABLE location_health_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for location_health_checks" ON location_health_checks;
CREATE POLICY "Allow all for location_health_checks" ON location_health_checks FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_location_health_checks_location ON location_health_checks(location_id);
CREATE INDEX IF NOT EXISTS idx_location_health_checks_checked_at ON location_health_checks(checked_at);

-- ═══════════════════════════════════════════════════════════════════
-- DEPLOYMENT LOGS
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS location_deployment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES location_instances(id) ON DELETE CASCADE,
  
  -- Log entry
  phase text, -- github | supabase | netlify | secrets | deploy
  message text NOT NULL,
  log_type text DEFAULT 'info', -- info | success | warning | error | code
  
  -- Metadata
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE location_deployment_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for location_deployment_logs" ON location_deployment_logs;
CREATE POLICY "Allow all for location_deployment_logs" ON location_deployment_logs FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_location_deployment_logs_location ON location_deployment_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_location_deployment_logs_timestamp ON location_deployment_logs(timestamp);

-- ═══════════════════════════════════════════════════════════════════
-- ALERT RULES
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS location_alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES location_instances(id) ON DELETE CASCADE,
  
  -- Rule definition
  rule_type text NOT NULL, -- credit_threshold | uptime | error_rate | response_time
  threshold_value numeric NOT NULL,
  comparison_operator text DEFAULT 'greater_than', -- greater_than | less_than | equals
  
  -- Actions
  is_active boolean DEFAULT true,
  notify_email text,
  notify_webhook text,
  
  -- Metadata
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE location_alert_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for location_alert_rules" ON location_alert_rules;
CREATE POLICY "Allow all for location_alert_rules" ON location_alert_rules FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_location_alert_rules_location ON location_alert_rules(location_id);

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTIONS: Auto-update timestamps
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_location_instances_updated_at ON location_instances;
CREATE TRIGGER update_location_instances_updated_at
  BEFORE UPDATE ON location_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
