-- ─────────────────────────────────────────────────────────────────────────────
-- Add-on billing columns
-- Adds add-on feature flags to location_instances and itemised add-on fee
-- columns to location_billing for AI, field agent, and push notification packs.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── location_instances: add-on flags ──────────────────────────────────────────
alter table location_instances
  add column if not exists ai_enabled             boolean default false,
  add column if not exists field_agent_count      integer default 0,
  add column if not exists push_notification_pack boolean default false;

comment on column location_instances.ai_enabled             is 'AI Engine add-on active ($150/month)';
comment on column location_instances.field_agent_count      is 'Number of active field agent seats ($100/agent/month)';
comment on column location_instances.push_notification_pack is 'Extra push notification pack active — +5 notifications/month ($75/month)';

-- ── location_billing: itemised add-on fee columns ────────────────────────────
alter table location_billing
  add column if not exists ai_addon_fee          numeric default 0,
  add column if not exists field_agent_addon_fee numeric default 0,
  add column if not exists push_notification_fee numeric default 0;

comment on column location_billing.ai_addon_fee          is 'AI Engine add-on charge for this billing period';
comment on column location_billing.field_agent_addon_fee is 'Field agent seats charge for this billing period';
comment on column location_billing.push_notification_fee is 'Push notification pack charge for this billing period';
