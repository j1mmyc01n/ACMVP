import type { Config, Context } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// CRN issuance endpoint. Drives both the legacy tables (clients_*,
// crns_*, crn_requests_*, profile_audit_log) AND the new
// medical-integration spine (profiles, crn_records, consent_agreements,
// audit_logs, medical_events). Runs with the Supabase service-role key
// so RLS does not block anonymous browser callers.
//
// POST body: { first_name, mobile, email }
// Response : { ok, crn, profile, error? }

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

const generateCRN = () => {
  const block = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CRN-${block()}-${block()}`;
};

const LEGAL_VERSIONS = {
  legal_bundle: 'v1.0',
  privacy: 'v1.0',
  terms: 'v1.0',
  medical_disclaimer: 'v1.0',
  ai_disclosure: 'v1.0',
  crisis_notice: 'v1.0',
  cookie_policy: 'v1.0',
};
const COMBINED_AGREEMENT_VERSION =
  `terms-${LEGAL_VERSIONS.terms}-privacy-${LEGAL_VERSIONS.privacy}-medical-${LEGAL_VERSIONS.medical_disclaimer}`;

interface CRNRequestBody {
  first_name?: string;
  mobile?: string;
  email?: string;
  device_info?: Record<string, unknown>;
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'GET') {
    return json(200, { ok: true, function: 'request-crn', method: 'POST to request a CRN' });
  }
  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const SERVICE_KEY = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SERVICE_KEY) {
    return json(500, { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY not configured' });
  }
  const SUPABASE_URL = resolveSupabaseUrl();
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  let body: CRNRequestBody;
  try {
    body = (await req.json()) as CRNRequestBody;
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body' });
  }
  const first_name = (body.first_name || '').trim();
  const mobile = (body.mobile || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  if (!first_name || !mobile || !email) {
    return json(400, { ok: false, error: 'first_name, mobile and email are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: 'Please enter a valid email address' });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-nf-client-connection-ip') || null;
  const device_info = body.device_info || { source: 'request-crn' };

  const crn = generateCRN();
  const warnings: string[] = [];

  // Legacy: log the request itself.
  const requestInsert = await supabase
    .from('crn_requests_1777090006')
    .insert([{ first_name, mobile, email, status: 'processed', crn_issued: crn }])
    .select()
    .single();
  if (requestInsert.error) warnings.push(`crn_requests: ${requestInsert.error.message}`);

  // Legacy: register the CRN code.
  const crnInsert = await supabase
    .from('crns_1740395000')
    .insert([{ code: crn, is_active: true }])
    .select()
    .single();
  if (crnInsert.error) warnings.push(`crns: ${crnInsert.error.message}`);

  // Legacy: create the client row used by the rest of the platform.
  const clientInsert = await supabase
    .from('clients_1777020684735')
    .insert([{ name: first_name, email, phone: mobile, crn, status: 'active', support_category: 'general' }])
    .select()
    .single();
  if (clientInsert.error) warnings.push(`clients: ${clientInsert.error.message}`);
  const client = clientInsert.data || null;

  // Legacy: implied-consent / profile audit row.
  const auditInsert = await supabase.from('profile_audit_log').insert({
    profile_id: client?.id || null,
    crn,
    action: 'CRN_CREATED',
    agreement_accepted: true,
    agreement_text: 'By using Acute Connect, the user agreed to all platform legal documents and consented to proceed.',
    legal_bundle_version: LEGAL_VERSIONS.legal_bundle,
    privacy_version: LEGAL_VERSIONS.privacy,
    terms_version: LEGAL_VERSIONS.terms,
    medical_disclaimer_version: LEGAL_VERSIONS.medical_disclaimer,
    ai_disclosure_version: LEGAL_VERSIONS.ai_disclosure,
    crisis_notice_version: LEGAL_VERSIONS.crisis_notice,
    cookie_policy_version: LEGAL_VERSIONS.cookie_policy,
    device_info,
    ip_address: ip,
  });
  if (auditInsert.error) warnings.push(`profile_audit_log: ${auditInsert.error.message}`);

  // ─── Medical-integration spine ─────────────────────────────────────
  const profileInsert = await supabase
    .from('profiles')
    .insert([{ full_name: first_name, email, phone: mobile, crn, role: 'user' }])
    .select()
    .single();
  if (profileInsert.error) warnings.push(`profiles: ${profileInsert.error.message}`);
  const profile = profileInsert.data || null;
  const userId = profile?.user_id || profile?.id || null;

  await supabase.from('consent_agreements').insert({
    user_id: userId,
    agreement_type: 'platform_use_and_medical_disclaimer',
    agreement_version: COMBINED_AGREEMENT_VERSION,
    accepted: true,
    source_action: 'create_crn',
    ip_address: ip,
    device_info,
  });

  const crnRecord = await supabase
    .from('crn_records')
    .insert([{ crn, user_id: userId, status: 'active', created_by: userId }])
    .select()
    .single();
  if (crnRecord.error) warnings.push(`crn_records: ${crnRecord.error.message}`);

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'CREATE_CRN',
    entity_type: 'crn_records',
    entity_id: crnRecord.data?.id || null,
    previous_value: null,
    new_value: crnRecord.data || { crn },
    agreement_version: COMBINED_AGREEMENT_VERSION,
    ip_address: ip,
    device_info,
  });

  if (profile) {
    const fhirPatient = {
      resourceType: 'Patient',
      id: crn,
      identifier: [{ system: 'https://acuteconnect.health/crn', value: crn }],
      name: [{ text: first_name }],
      telecom: [
        { system: 'phone', value: mobile },
        { system: 'email', value: email },
      ],
      active: true,
    };
    await supabase.from('medical_events').insert({
      user_id: userId,
      crn,
      event_type: 'patient_created',
      fhir_resource_type: 'Patient',
      fhir_payload: fhirPatient,
    });
  }

  return json(200, {
    ok: true,
    crn,
    profile,
    legacy_client: client,
    warnings: warnings.length ? warnings : undefined,
  });
};

export const config: Config = {
  path: '/api/crn',
};
