-- Health-checks and deployment logs for the rollout/monitoring module.
-- These rows let the central control plane spot a degraded location without
-- depending on any provider-specific dashboard.

CREATE TABLE location_health_checks (
  id              BIGSERIAL   PRIMARY KEY,
  location_id     UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  netlify_status  TEXT        CHECK (netlify_status IN ('ok', 'degraded', 'down')),
  database_status TEXT        CHECK (database_status IN ('ok', 'degraded', 'down')),
  github_status   TEXT        CHECK (github_status IN ('ok', 'degraded', 'down')),
  identity_status TEXT        CHECK (identity_status IN ('ok', 'degraded', 'down')),
  detail          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_checks_loc_time ON location_health_checks (location_id, checked_at DESC);

CREATE TABLE location_deployment_logs (
  id          BIGSERIAL   PRIMARY KEY,
  location_id UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  step        TEXT        NOT NULL,
  status      TEXT        NOT NULL CHECK (status IN ('started', 'succeeded', 'failed', 'skipped')),
  message     TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deployment_logs_loc_time ON location_deployment_logs (location_id, created_at DESC);

CREATE TABLE location_alert_rules (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID        REFERENCES locations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  predicate   JSONB       NOT NULL,
  channel     TEXT        NOT NULL DEFAULT 'webhook',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
