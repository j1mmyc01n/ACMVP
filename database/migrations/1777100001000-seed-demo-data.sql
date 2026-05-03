-- Seed data for demonstration purposes
-- Creates sample location instances, usage data, and billing records

-- Sample location instances
INSERT INTO location_instances (location_name, slug, care_type, status, github_repo_url, github_repo_full_name, netlify_url, netlify_site_id, supabase_ref, supabase_url, plan_type, monthly_credit_limit, credits_used, billing_status, primary_contact_email, last_deployed_at)
VALUES
  ('Bondi Beach Wellness', 'bondi-beach-wellness', 'mental_health', 'active', 'https://github.com/acme/acute-connect-bondi', 'acme/acute-connect-bondi', 'https://bondi-wellness.netlify.app', 'bb-123', 'proj-bondi-456', 'https://proj-bondi-456.supabase.co', 'pro', 10000, 7543, 'active', 'admin@bondi-wellness.com', now() - interval '2 days'),
  ('Sydney CBD Crisis', 'sydney-cbd-crisis', 'crisis_support', 'active', 'https://github.com/acme/acute-connect-sydney-cbd', 'acme/acute-connect-sydney-cbd', 'https://sydney-crisis.netlify.app', 'sc-789', 'proj-sydney-012', 'https://proj-sydney-012.supabase.co', 'enterprise', 50000, 28934, 'active', 'ops@sydney-crisis.org', now() - interval '5 days'),
  ('Melbourne Youth Services', 'melbourne-youth-services', 'youth_services', 'active', 'https://github.com/acme/acute-connect-melb-youth', 'acme/acute-connect-melb-youth', 'https://melb-youth.netlify.app', 'my-345', 'proj-melb-678', 'https://proj-melb-678.supabase.co', 'pro', 10000, 4211, 'active', 'contact@melb-youth.org', now() - interval '1 day'),
  ('Brisbane DV Support', 'brisbane-dv-support', 'domestic_violence', 'provisioning', NULL, NULL, NULL, NULL, NULL, NULL, 'pro', 10000, 0, 'active', 'admin@brisbane-dv.org', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Get location IDs for seeding related data
DO $$
DECLARE
  bondi_id uuid;
  sydney_id uuid;
  melb_id uuid;
  i integer;
  sample_date date;
BEGIN
  -- Get location IDs
  SELECT id INTO bondi_id FROM location_instances WHERE slug = 'bondi-beach-wellness';
  SELECT id INTO sydney_id FROM location_instances WHERE slug = 'sydney-cbd-crisis';
  SELECT id INTO melb_id FROM location_instances WHERE slug = 'melbourne-youth-services';

  -- Create daily usage data for last 30 days
  FOR i IN 0..29 LOOP
    sample_date := CURRENT_DATE - i;
    
    -- Bondi Beach
    INSERT INTO location_daily_usage (location_id, date, total_requests, total_credits_consumed, total_bandwidth_gb, avg_response_time_ms, error_count, top_endpoint, top_endpoint_count)
    VALUES (
      bondi_id,
      sample_date,
      150 + (random() * 50)::int,
      200 + (random() * 100)::int,
      (random() * 5)::numeric(10,2),
      120 + (random() * 80)::int,
      (random() * 5)::int,
      '/api/clients',
      45 + (random() * 20)::int
    )
    ON CONFLICT (location_id, date) DO NOTHING;

    -- Sydney CBD
    INSERT INTO location_daily_usage (location_id, date, total_requests, total_credits_consumed, total_bandwidth_gb, avg_response_time_ms, error_count, top_endpoint, top_endpoint_count)
    VALUES (
      sydney_id,
      sample_date,
      800 + (random() * 200)::int,
      950 + (random() * 300)::int,
      (random() * 20)::numeric(10,2),
      95 + (random() * 50)::int,
      (random() * 3)::int,
      '/api/crisis-events',
      320 + (random() * 80)::int
    )
    ON CONFLICT (location_id, date) DO NOTHING;

    -- Melbourne Youth
    INSERT INTO location_daily_usage (location_id, date, total_requests, total_credits_consumed, total_bandwidth_gb, avg_response_time_ms, error_count, top_endpoint, top_endpoint_count)
    VALUES (
      melb_id,
      sample_date,
      100 + (random() * 40)::int,
      130 + (random() * 60)::int,
      (random() * 3)::numeric(10,2),
      140 + (random() * 90)::int,
      (random() * 7)::int,
      '/api/check-ins',
      35 + (random() * 15)::int
    )
    ON CONFLICT (location_id, date) DO NOTHING;
  END LOOP;

  -- Health checks
  INSERT INTO location_health_checks (location_id, status, uptime_percentage, response_time_ms, netlify_status, supabase_status, github_status, checked_at)
  VALUES
    (bondi_id, 'healthy', 99.8, 125, 'up', 'up', 'up', now()),
    (sydney_id, 'healthy', 99.95, 98, 'up', 'up', 'up', now()),
    (melb_id, 'degraded', 98.2, 187, 'up', 'up', 'down', now())
  ON CONFLICT DO NOTHING;

  -- Billing records
  INSERT INTO location_billing (location_id, billing_period_start, billing_period_end, credits_used, credit_rate, usage_charge, base_subscription_fee, subtotal, tax, total_amount, status, paid_at)
  VALUES
    (bondi_id, '2026-03-01', '2026-03-31', 6892, 0.01, 68.92, 299, 367.92, 36.79, 404.71, 'paid', '2026-04-05'),
    (sydney_id, '2026-03-01', '2026-03-31', 27543, 0.01, 275.43, 999, 1274.43, 127.44, 1401.87, 'paid', '2026-04-02'),
    (melb_id, '2026-03-01', '2026-03-31', 3821, 0.01, 38.21, 299, 337.21, 33.72, 370.93, 'paid', '2026-04-07'),
    (bondi_id, '2026-04-01', '2026-04-30', 7543, 0.01, 75.43, 299, 374.43, 37.44, 411.87, 'pending', NULL),
    (sydney_id, '2026-04-01', '2026-04-30', 28934, 0.01, 289.34, 999, 1288.34, 128.83, 1417.17, 'pending', NULL),
    (melb_id, '2026-04-01', '2026-04-30', 4211, 0.01, 42.11, 299, 341.11, 34.11, 375.22, 'pending', NULL)
  ON CONFLICT DO NOTHING;

  -- Alert rules
  INSERT INTO location_alert_rules (location_id, rule_type, threshold_value, comparison_operator, is_active, notify_email)
  VALUES
    (bondi_id, 'credit_threshold', 8000, 'greater_than', true, 'admin@bondi-wellness.com'),
    (sydney_id, 'credit_threshold', 40000, 'greater_than', true, 'ops@sydney-crisis.org'),
    (sydney_id, 'uptime', 99.0, 'less_than', true, 'ops@sydney-crisis.org'),
    (melb_id, 'response_time', 200, 'greater_than', true, 'contact@melb-youth.org')
  ON CONFLICT DO NOTHING;
END $$;
