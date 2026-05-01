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
  'By continuing, creating a CRN, checking in, updating your details, submitting information, or using Acute Connect, you confirm that you have read, understood, and agree to the Privacy Policy, Terms of Use, Medical Disclaimer, AI Disclosure, Crisis Safety Notice, and Cookie & Storage Policy. You also agree that each platform action may be recorded in your profile card audit log with a timestamp for safety, governance, privacy, and compliance purposes.';

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
