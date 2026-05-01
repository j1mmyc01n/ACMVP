-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Test Location
-- Creates a single test care centre with sample patients and check-ins so that
-- integrations, field-agent flows, and other feature modules can be exercised
-- without needing to create data manually.
--
-- All rows use deterministic IDs so this script is safely re-runnable
-- (ON CONFLICT DO NOTHING / ON CONFLICT DO UPDATE).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Test Care Centre ──────────────────────────────────────────────────────────
insert into care_centres_1777090000
  (id, name, suffix, address, phone, active, clients_count, capacity)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '⚗️ TEST LOCATION',
    'TST',
    '1 Test Street, Testville NSW 2000',
    '(02) 0000 0000',
    true,
    3,
    10
  )
on conflict (id) do update
  set
    name          = excluded.name,
    suffix        = excluded.suffix,
    address       = excluded.address,
    phone         = excluded.phone,
    active        = excluded.active,
    capacity      = excluded.capacity,
    updated_at    = now();

-- ── Test Patients ─────────────────────────────────────────────────────────────
insert into clients_1777020684735
  (crn, name, email, phone, postcode, care_centre, support_category, status)
values
  ('TST10000001', 'Test Patient Alpha', 'alpha@test.local', '0400 000 001', '2000', '⚗️ TEST LOCATION', 'mental_health', 'active'),
  ('TST10000002', 'Test Patient Beta',  'beta@test.local',  '0400 000 002', '2000', '⚗️ TEST LOCATION', 'crisis',        'active'),
  ('TST10000003', 'Test Patient Gamma', 'gamma@test.local', '0400 000 003', '2000', '⚗️ TEST LOCATION', 'general',       'active')
on conflict (crn) do update
  set
    name             = excluded.name,
    email            = excluded.email,
    phone            = excluded.phone,
    care_centre      = excluded.care_centre,
    support_category = excluded.support_category,
    status           = excluded.status,
    updated_at       = now();

-- ── Test Check-Ins ────────────────────────────────────────────────────────────
-- Insert only if the patient does not already have an open check-in so that
-- re-running the migration never duplicates check-in rows.
insert into check_ins_1740395000
  (crn, name, mood_score, status, resolved, care_centre)
select 'TST10000001', 'Test Patient Alpha', 2, 'urgent',  false, '⚗️ TEST LOCATION'
where not exists (
  select 1 from check_ins_1740395000
  where crn = 'TST10000001' and resolved = false
);

insert into check_ins_1740395000
  (crn, name, mood_score, status, resolved, care_centre)
select 'TST10000002', 'Test Patient Beta', 5, 'pending', false, '⚗️ TEST LOCATION'
where not exists (
  select 1 from check_ins_1740395000
  where crn = 'TST10000002' and resolved = false
);

insert into check_ins_1740395000
  (crn, name, mood_score, status, resolved, care_centre)
select 'TST10000003', 'Test Patient Gamma', 8, 'pending', false, '⚗️ TEST LOCATION'
where not exists (
  select 1 from check_ins_1740395000
  where crn = 'TST10000003' and resolved = false
);
