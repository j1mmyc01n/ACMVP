import { supabase } from '../supabase/supabase';
import { LEGAL_VERSIONS, collectDeviceInfo } from './audit';

// Consent-agreement insert helper. Writes to the new `consent_agreements`
// table — one row per accepted agreement at the moment of an action. The
// legacy `profile_audit_log` continues to receive the implied-consent
// snapshot via `recordAgreementAudit`. New flows should call BOTH so the
// FHIR-ready surface gets a structured row and the legacy view keeps
// working.
export const CONSENT_TYPES = Object.freeze({
  PLATFORM_TERMS: 'platform_terms',
  PRIVACY: 'privacy',
  MEDICAL_DISCLAIMER: 'medical_disclaimer',
  AI_DISCLOSURE: 'ai_disclosure',
  CRISIS_NOTICE: 'crisis_notice',
  COOKIES: 'cookies',
  PLATFORM_USE_AND_MEDICAL_DISCLAIMER: 'platform_use_and_medical_disclaimer',
});

export const COMBINED_AGREEMENT_VERSION = `terms-${LEGAL_VERSIONS.terms}-privacy-${LEGAL_VERSIONS.privacy}-medical-${LEGAL_VERSIONS.medical_disclaimer}`;

export async function recordConsent({
  client = supabase,
  userId = null,
  agreementType,
  agreementVersion = COMBINED_AGREEMENT_VERSION,
  sourceAction = null,
  ipAddress = null,
  deviceInfo,
} = {}) {
  if (!agreementType) {
    return { data: null, error: new Error('consent: agreementType required') };
  }
  const payload = {
    user_id: userId,
    agreement_type: agreementType,
    agreement_version: agreementVersion,
    accepted: true,
    accepted_at: new Date().toISOString(),
    source_action: sourceAction,
    ip_address: ipAddress,
    device_info: deviceInfo ?? collectDeviceInfo(),
  };
  try {
    const { data, error } = await client
      .from('consent_agreements')
      .insert(payload)
      .select()
      .single();
    if (error) console.warn('[consent] insert failed:', error.message);
    return { data, error };
  } catch (err) {
    console.warn('[consent] insert threw:', err);
    return { data: null, error: err };
  }
}

export async function fetchConsentHistory({ userId, limit = 50, client = supabase } = {}) {
  if (!userId) return [];
  const { data, error } = await client
    .from('consent_agreements')
    .select('*')
    .eq('user_id', userId)
    .order('accepted_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[consent] fetch failed:', error.message);
    return [];
  }
  return data || [];
}
