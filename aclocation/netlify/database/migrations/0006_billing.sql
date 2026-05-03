-- Per-location billing & usage tracking.
--
-- The control-plane billing model is provider-agnostic: usage rows are
-- aggregated daily, then folded into invoice-style billing rows. Add-on fees
-- (AI, field agent, push notifications) are stored as columns rather than a
-- separate junction so a location's plan summary is one read.

CREATE TABLE location_billing (
  location_id          UUID        PRIMARY KEY REFERENCES locations(id) ON DELETE CASCADE,
  plan_tier            TEXT        NOT NULL DEFAULT 'starter',
  monthly_credit_limit INTEGER     NOT NULL DEFAULT 1000,
  credit_rate          NUMERIC(10,4) NOT NULL DEFAULT 0.0100,
  ai_addon_fee         NUMERIC(10,2) NOT NULL DEFAULT 0,
  field_agent_addon_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  push_notification_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  invoice_status       TEXT        NOT NULL DEFAULT 'current'
    CHECK (invoice_status IN ('current', 'past_due', 'paid', 'cancelled')),
  due_at               TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per billable API call. Aggregated nightly into location_daily_usage.
CREATE TABLE location_api_usage (
  id          BIGSERIAL   PRIMARY KEY,
  location_id UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  route       TEXT        NOT NULL,
  units       INTEGER     NOT NULL DEFAULT 1,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_location_api_usage_loc_time ON location_api_usage (location_id, occurred_at DESC);

CREATE TABLE location_daily_usage (
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  day         DATE NOT NULL,
  total_units INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (location_id, day)
);
