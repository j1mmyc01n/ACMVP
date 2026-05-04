import { supabase } from '../client';
import { LEGAL_VERSIONS, AGREEMENT_TEXT } from '@acmvp/config';
const AUDIT_TABLE = 'audit_logs_1777090020';
const PROFILE_AUDIT_TABLE = 'profile_audit_log';
export async function logActivity(entry) {
    return supabase.from(AUDIT_TABLE).insert({
        ...entry,
        created_at: new Date().toISOString(),
    });
}
export async function listAuditLogs(params) {
    let query = supabase.from(AUDIT_TABLE).select('*').order('created_at', { ascending: false });
    if (params?.entityType)
        query = query.eq('entity_type', params.entityType);
    if (params?.userId)
        query = query.eq('user_id', params.userId);
    if (params?.limit)
        query = query.limit(params.limit);
    return query;
}
export async function recordAgreementAudit({ profileId = null, crn = null, action, deviceInfo, }) {
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
        device_info: deviceInfo,
    };
    return supabase.from(PROFILE_AUDIT_TABLE).insert(payload);
}
//# sourceMappingURL=audit.js.map