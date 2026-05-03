import type { Config, Context } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const TEST_CENTRE_ID = '10000000-0000-0000-0000-000000000001';
const TEST_CENTRE_NAME = '⚗️ TEST LOCATION';

const TEST_PATIENTS = [
  { crn: 'TST10000001', name: 'Test Patient Alpha', email: 'alpha@test.local', phone: '0400000001', care_centre: TEST_CENTRE_NAME, support_category: 'mental_health', status: 'active', postcode: '2000' },
  { crn: 'TST10000002', name: 'Test Patient Beta',  email: 'beta@test.local',  phone: '0400000002', care_centre: TEST_CENTRE_NAME, support_category: 'crisis',        status: 'active', postcode: '2000' },
  { crn: 'TST10000003', name: 'Test Patient Gamma', email: 'gamma@test.local', phone: '0400000003', care_centre: TEST_CENTRE_NAME, support_category: 'general',       status: 'active', postcode: '2000' },
];

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const resolveSupabaseUrl = () => {
  const candidates = [
    Netlify.env.get('SUPABASE_URL'),
    Netlify.env.get('VITE_SUPABASE_URL'),
    Netlify.env.get('SUPABASE_DATABASE_URL'),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    try {
      const u = new URL(raw);
      if (/\.supabase\.(co|in)$/i.test(u.hostname)) return `${u.protocol}//${u.host}`;
    } catch {
      /* ignore */
    }
  }
  return 'https://amfikpnctfgesifwdkkd.supabase.co';
};

export default async (req: Request, _context: Context) => {
  if (req.method === 'GET') {
    return json(200, { ok: true, function: 'seed-test-location', method: 'POST to seed' });
  }

  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' });
  }

  const serviceKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) {
    return json(500, { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
  }

  const supabaseUrl = resolveSupabaseUrl();
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const summary = { care_centre: 0, patients: 0, check_ins: 0 };
  const errors: string[] = [];

  const { error: ccErr } = await admin
    .from('care_centres_1777090000')
    .upsert([{
      id: TEST_CENTRE_ID,
      name: TEST_CENTRE_NAME,
      suffix: 'TST',
      address: '1 Test Street, Testville NSW 2000',
      phone: '(02) 0000 0000',
      active: true,
      clients_count: TEST_PATIENTS.length,
      capacity: 10,
    }], { onConflict: 'id' });

  if (ccErr) {
    errors.push(`care_centres: ${ccErr.message}`);
  } else {
    summary.care_centre = 1;
  }

  for (const p of TEST_PATIENTS) {
    const { error } = await admin
      .from('clients_1777020684735')
      .upsert([p], { onConflict: 'crn' });
    if (error) {
      errors.push(`clients(${p.crn}): ${error.message}`);
    } else {
      summary.patients += 1;
    }
  }

  const now = Date.now();
  const checkIns = [
    { crn: 'TST10000001', name: 'Test Patient Alpha', mood_score: 2, status: 'urgent',  resolved: false, care_centre: TEST_CENTRE_NAME, created_at: new Date(now - 3_600_000).toISOString() },
    { crn: 'TST10000002', name: 'Test Patient Beta',  mood_score: 5, status: 'pending', resolved: false, care_centre: TEST_CENTRE_NAME, created_at: new Date(now - 7_200_000).toISOString() },
    { crn: 'TST10000003', name: 'Test Patient Gamma', mood_score: 8, status: 'pending', resolved: false, care_centre: TEST_CENTRE_NAME, created_at: new Date(now - 10_800_000).toISOString() },
  ];

  for (const ci of checkIns) {
    const { data: existing, error: selErr } = await admin
      .from('check_ins_1740395000')
      .select('id')
      .eq('crn', ci.crn)
      .eq('resolved', false)
      .limit(1);

    if (selErr) {
      errors.push(`check_ins(select ${ci.crn}): ${selErr.message}`);
      continue;
    }
    if (existing && existing.length > 0) continue;

    const { error: insErr } = await admin
      .from('check_ins_1740395000')
      .insert([ci]);
    if (insErr) {
      errors.push(`check_ins(insert ${ci.crn}): ${insErr.message}`);
    } else {
      summary.check_ins += 1;
    }
  }

  if (errors.length > 0 && summary.care_centre === 0) {
    return json(500, { ok: false, summary, errors });
  }

  return json(200, {
    ok: true,
    summary,
    errors: errors.length > 0 ? errors : undefined,
    centre_id: TEST_CENTRE_ID,
    centre_name: TEST_CENTRE_NAME,
  });
};

export const config: Config = {
  path: '/api/seed-test-location',
  method: ['GET', 'POST'],
};
