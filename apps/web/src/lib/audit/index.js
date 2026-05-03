import { supabase } from '../../supabase/supabase';

// Pinned version metadata for the legal bundle. Bump these whenever the
// corresponding document changes — every audit row carries the version
// the user agreed to at the moment of the action.
export const LEGAL_VERSIONS = Object.freeze({
  legal_bundle: 'v1.0',
  privacy: 'v1.0',
  terms: 'v1.0',
  medical_disclaimer: 'v1.0',
  ai_disclosure: 'v1.0',
  crisis_notice: 'v1.0',
  cookie_policy: 'v1.0',
});

export const AGREEMENT_TEXT =
  'By using Acute Connect, the user agreed to all platform legal documents and consented to proceed.';

export const AGREEMENT_COPY =
  'By pressing Continue, requesting a CRN on the Get CRN tab, updating your status or details, submitting information, or using any feature of Acute Connect, you confirm that you have read, understood, and agree to the Privacy Policy, Terms of Use, Medical Disclaimer, AI Disclosure, Crisis Safety Notice, and Cookie & Storage Policy.';

// Short, action-specific lead-ins. The component appends the universal
// "you agree to the platform terms" tail. Keep these terse — the notice
// sits directly under a button, not as a wall of text.
export const AGREEMENT_NOTICE_LEADS = Object.freeze({
  continue:
    'By pressing Continue',
  crn_request:
    'By requesting a CRN on the Get CRN tab',
  check_in_submit:
    'By submitting this check-in',
  call_window:
    'By confirming this call window',
  mood:
    'By submitting your mood',
  status_update:
    'By updating your status',
  profile_update:
    'By updating your profile',
  generic:
    'By using any feature of Acute Connect',
});

// The notice tail is split so the document list can be rendered as a single
// clickable link to the Legal Hub. Concatenating all three pieces with
// AGREEMENT_NOTICE_DOCS_LABEL between PREFIX and SUFFIX yields the original
// sentence verbatim.
export const AGREEMENT_NOTICE_TAIL_PREFIX =
  ', or by using any feature of Acute Connect, you agree to the ';
export const AGREEMENT_NOTICE_DOCS_LABEL =
  'Privacy Policy, Terms of Use, Medical Disclaimer, AI Disclosure, Crisis Safety Notice, and Cookie & Storage Policy';
export const AGREEMENT_NOTICE_TAIL_SUFFIX =
  '.';

// Kept for any consumer that still imports the combined string.
export const AGREEMENT_NOTICE_TAIL =
  AGREEMENT_NOTICE_TAIL_PREFIX + AGREEMENT_NOTICE_DOCS_LABEL + AGREEMENT_NOTICE_TAIL_SUFFIX;

export const AUDIT_ACTIONS = Object.freeze({
  CRN_CREATED: 'CRN_CREATED',
  CRN_REDEEMED: 'CRN_REDEEMED',
  CHECK_IN_SUBMITTED: 'CHECK_IN_SUBMITTED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  CALL_WINDOW_UPDATED: 'CALL_WINDOW_UPDATED',
  MOOD_SUBMITTED: 'MOOD_SUBMITTED',
  CONCERN_SUBMITTED: 'CONCERN_SUBMITTED',
  AI_TRIAGE_USED: 'AI_TRIAGE_USED',
});

export function collectDeviceInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {};
  }
  return {
    userAgent: navigator.userAgent || null,
    language: navigator.language || null,
    platform: navigator.platform || null,
    screen:
      typeof window.screen !== 'undefined'
        ? { width: window.screen.width, height: window.screen.height }
        : null,
    timezone:
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : null,
  };
}

// Inserts an immutable audit row for `action`. Resolves to `{ data, error }`
// on success/failure. Callers should treat audit failures as warnings — the
// underlying user action should already have succeeded by the time we record
// it. The table is RLS-open + revoke-update/delete, so rows are append-only.
export async function recordAgreementAudit({
  profileId = null,
  crn = null,
  action,
  deviceInfo,
  client = supabase,
} = {}) {
  if (!action) {
    return { data: null, error: new Error('audit: action is required') };
  }

  const payload = {
    profile_id: profileId,
    crn,
    action,
    agreement_accepted: true,
    agreement_text: AGREEMENT_TEXT,
    legal_bundle_version: LEGAL_VERSIONS.legal_bundle,
    privacy_version: LEGAL_VERSIONS.privacy,
    terms_version: LEGAL_VERSIONS.terms,
    medical_disclaimer_version: LEGAL_VERSIONS.medical_disclaimer,
    ai_disclosure_version: LEGAL_VERSIONS.ai_disclosure,
    crisis_notice_version: LEGAL_VERSIONS.crisis_notice,
    cookie_policy_version: LEGAL_VERSIONS.cookie_policy,
    device_info: deviceInfo ?? collectDeviceInfo(),
  };

  try {
    const { data, error } = await client
      .from('profile_audit_log')
      .insert(payload)
      .select()
      .single();
    if (error) console.warn('[audit] insert failed:', error.message);
    return { data, error };
  } catch (err) {
    console.warn('[audit] insert threw:', err);
    return { data: null, error: err };
  }
}

export async function fetchAuditLog({ crn, profileId, limit = 25 } = {}) {
  let query = supabase
    .from('profile_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (crn) query = query.eq('crn', crn);
  else if (profileId) query = query.eq('profile_id', profileId);
  const { data, error } = await query;
  if (error) {
    console.warn('[audit] fetch failed:', error.message);
    return [];
  }
  return data || [];
}

// ─── Medical-integration spine: structured action audit ──────────────
//
// Inserts an immutable row in the new `audit_logs` table. Used for the
// CRN/check-in/profile/medical flows that map onto FHIR + HL7 surfaces.
// Every important action MUST also call `recordConsent` so the legal
// agreement version captured at action time is preserved.
export async function createAuditLog({
  client = supabase,
  userId = null,
  action,
  entityType,
  entityId,
  previousValue = null,
  newValue = null,
  agreementVersion = LEGAL_VERSIONS.legal_bundle,
  ipAddress = null,
  deviceInfo,
} = {}) {
  if (!action) return { data: null, error: new Error('audit: action required') };
  const payload = {
    user_id: userId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    previous_value: previousValue,
    new_value: newValue,
    agreement_version: agreementVersion,
    ip_address: ipAddress,
    device_info: deviceInfo ?? collectDeviceInfo(),
    created_at: new Date().toISOString(),
  };
  try {
    const { data, error } = await client
      .from('audit_logs')
      .insert(payload)
      .select()
      .single();
    if (error) console.warn('[audit_logs] insert failed:', error.message);
    return { data, error };
  } catch (err) {
    console.warn('[audit_logs] insert threw:', err);
    return { data: null, error: err };
  }
}

export async function fetchAuditLogs({
  userId,
  crn,
  action,
  entityType,
  agreementVersion,
  startDate,
  endDate,
  limit = 100,
  client = supabase,
} = {}) {
  let query = client.from('audit_logs').select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  if (action) query = query.eq('action', action);
  if (entityType) query = query.eq('entity_type', entityType);
  if (agreementVersion) query = query.eq('agreement_version', agreementVersion);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  const { data, error } = await query;
  if (error) {
    console.warn('[audit_logs] fetch failed:', error.message);
    return [];
  }
  if (crn) {
    return (data || []).filter((row) => {
      const candidates = [row?.new_value?.crn, row?.previous_value?.crn];
      return candidates.some((c) => c && String(c).toUpperCase() === String(crn).toUpperCase());
    });
  }
  return data || [];
}

export const STRUCTURED_AUDIT_ACTIONS = Object.freeze({
  SIGNUP: 'SIGNUP',
  LOGIN: 'LOGIN',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  CREATE_CRN: 'CREATE_CRN',
  CHECK_IN: 'CHECK_IN',
  MEDICAL_NOTE_UPDATE: 'MEDICAL_NOTE_UPDATE',
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  ROLE_CHANGE: 'ROLE_CHANGE',
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  TERMS_ACCEPTED: 'TERMS_ACCEPTED',
});

// ─── UI audit log writer ───────────────────────────────────────────────
//
// Writes to `audit_logs_1777090020`, the table that powers AuditLogPage.jsx
// and ConnectivityPage.jsx. Failures are logged but never thrown — audit is
// secondary to the action that triggered it.
const AUDIT_TABLE = 'audit_logs_1777090020';

export async function logActivity({
  action,
  resource = null,
  detail = null,
  actor = null,
  actor_name = null,
  actor_role = null,
  source_type = 'system',
  location = null,
  level = 'info',
  client = supabase,
} = {}) {
  if (!action) return { data: null, error: new Error('logActivity: action required') };
  try {
    const { data, error } = await client.from(AUDIT_TABLE).insert([{
      action, resource, detail,
      actor, actor_name, actor_role,
      source_type, location, level,
      created_at: new Date().toISOString(),
    }]);
    if (error) console.warn('[audit] logActivity failed:', error.message);
    return { data, error };
  } catch (err) {
    console.warn('[audit] logActivity threw:', err);
    return { data: null, error: err };
  }
}

// Append an event to a client's event_log without overwriting prior entries.
// Reads the existing array, prepends the new event, caps at MAX, then writes.
const EVENT_LOG_MAX = 200;

export async function appendClientEvent(clientId, event, { client = supabase } = {}) {
  if (!clientId || !event) return { error: new Error('appendClientEvent: clientId and event required') };
  try {
    const { data: existing } = await client
      .from('clients_1777020684735')
      .select('event_log')
      .eq('id', clientId)
      .maybeSingle();
    const prior = Array.isArray(existing?.event_log) ? existing.event_log : [];
    const next = [event, ...prior].slice(0, EVENT_LOG_MAX);
    const { error } = await client
      .from('clients_1777020684735')
      .update({ event_log: next })
      .eq('id', clientId);
    if (error) console.warn('[audit] appendClientEvent failed:', error.message);
    return { error };
  } catch (err) {
    console.warn('[audit] appendClientEvent threw:', err);
    return { error: err };
  }
}
