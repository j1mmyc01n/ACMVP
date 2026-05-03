-- Field agents module.
--
-- A field agent is a staff member who works in the field on behalf of a
-- location (community outreach, transport, in-home check-ins). They are
-- represented as a domain entity (not just an Identity user) because some
-- field agents are contractors without platform logins. Linkage to an
-- Identity user is optional — when present the agent can submit their own
-- check-ins through the mobile-friendly UI.

CREATE TABLE field_agents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id      UUID,                 -- optional Identity user
  full_name    TEXT        NOT NULL,
  email        TEXT,
  phone        TEXT,
  role_title   TEXT,
  status       TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'on_leave')),
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_field_agents_location ON field_agents (location_id, status);
CREATE INDEX idx_field_agents_user ON field_agents (user_id) WHERE user_id IS NOT NULL;

-- Field check-ins are GPS-stamped, agent-attributed encounter rows. They
-- complement clinical `check_ins` (which are tied to a client+visit) by
-- recording where an agent is and what they're doing right now.
CREATE TABLE field_agent_check_ins (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  agent_id      UUID        NOT NULL REFERENCES field_agents(id) ON DELETE CASCADE,
  client_id     UUID,                 -- optional reference into clients
  kind          TEXT        NOT NULL DEFAULT 'visit'
    CHECK (kind IN ('visit', 'transport', 'welfare', 'crisis', 'other')),
  notes         TEXT,
  latitude      NUMERIC(9,6),
  longitude     NUMERIC(9,6),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_field_agent_checkins_loc_time
  ON field_agent_check_ins (location_id, occurred_at DESC);
CREATE INDEX idx_field_agent_checkins_agent
  ON field_agent_check_ins (agent_id, occurred_at DESC);
