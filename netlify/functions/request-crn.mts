import type { Config, Context } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// CRN issuance endpoint. Drives both the legacy tables (clients_*,
// crns_*, crn_requests_*, profile_audit_log) AND the new
// medical-integration spine (profiles, crn_records, consent_agreements,
// audit_logs, medical_events). Runs with the Supabase service-role key
// so RLS does not block anonymous browser callers.
//
// POST body: { first_name, mobile?, email?, location?: { lat, lng }, device_info? }
// At least one of mobile / email is required. Name, DOB, and the missing
// contact channel are gradually collected in later flows (check-in, my
// account) and used to verify the person before clinical reports go out.
//
// Response : { ok, crn, profile, care_centre? }

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
  location?: { lat?: number; lng?: number; accuracy?: number } | null;
  device_info?: Record<string, unknown>;
}

interface CareCentreRow {
  id?: string;
  name?: string;
  suffix?: string;
  address?: string;
  phone?: string | null;
  status?: string | null;
  active?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
}

// Haversine distance in km between two WGS84 points.
const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const pickClosestCentre = (
  centres: CareCentreRow[],
  origin: { lat: number; lng: number } | null,
): CareCentreRow | null => {
  const usable = centres.filter(
    (c) => typeof c.latitude === 'number' && typeof c.longitude === 'number',
  );
  if (!usable.length) return centres[0] || null;
  if (!origin) return usable[0];
  let best: { row: CareCentreRow; d: number } | null = null;
  for (const c of usable) {
    const d = haversineKm(origin, { lat: c.latitude as number, lng: c.longitude as number });
    if (!best || d < best.d) best = { row: c, d };
  }
  return best?.row || null;
};

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
  if (!first_name) {
    return json(400, { ok: false, error: 'First name is required' });
  }
  if (!mobile && !email) {
    return json(400, {
      ok: false,
      error: 'Please provide either a mobile number or an email address',
    });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: 'Please enter a valid email address' });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-nf-client-connection-ip') || null;
  const device_info = body.device_info || { source: 'request-crn' };
  const location =
    body.location &&
    typeof body.location.lat === 'number' &&
    typeof body.location.lng === 'number'
      ? { lat: body.location.lat, lng: body.location.lng }
      : null;

  // ─── Match closest care centre by approximate location ──────────────
  let careCentre: CareCentreRow | null = null;
  let careCentreDistanceKm: number | null = null;
  try {
    const { data: centres } = await supabase
      .from('care_centres_1777090000')
      .select('id, name, suffix, address, phone, status, active, latitude, longitude');
    const eligible = (centres || []).filter(
      (c) => (c.active === undefined || c.active === null || c.active) &&
             (!c.status || c.status === 'active'),
    );
    careCentre = pickClosestCentre(eligible as CareCentreRow[], location);
    if (
      careCentre &&
      location &&
      typeof careCentre.latitude === 'number' &&
      typeof careCentre.longitude === 'number'
    ) {
      careCentreDistanceKm = Number(
        haversineKm(location, {
          lat: careCentre.latitude as number,
          lng: careCentre.longitude as number,
        }).toFixed(2),
      );
    }
  } catch (_) {
    careCentre = null;
  }
  const careCentreName = careCentre?.name || null;

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
  const clientPayload: Record<string, unknown> = {
    name: first_name,
    email: email || null,
    phone: mobile || null,
    crn,
    status: 'active',
    support_category: 'general',
  };
  if (careCentreName) clientPayload.care_centre = careCentreName;
  const clientInsert = await supabase
    .from('clients_1777020684735')
    .insert([clientPayload])
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
    .insert([
      {
        full_name: first_name,
        email: email || null,
        phone: mobile || null,
        crn,
        role: 'user',
      },
    ])
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
    new_value: {
      ...(crnRecord.data || { crn }),
      care_centre: careCentreName,
      care_centre_id: careCentre?.id || null,
      approximate_location: location,
      distance_km: careCentreDistanceKm,
    },
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
        ...(mobile ? [{ system: 'phone', value: mobile }] : []),
        ...(email ? [{ system: 'email', value: email }] : []),
      ],
      managingOrganization: careCentreName
        ? { display: careCentreName, identifier: { value: careCentre?.suffix || careCentreName } }
        : undefined,
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
    care_centre: careCentre
      ? {
          id: careCentre.id,
          name: careCentre.name,
          suffix: careCentre.suffix,
          address: careCentre.address,
          phone: careCentre.phone,
          distance_km: careCentreDistanceKm,
        }
      : null,
    warnings: warnings.length ? warnings : undefined,
  });
};

export const config: Config = {
  path: '/api/crn',
};
