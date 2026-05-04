// ─── Legal Version Constants ──────────────────────────────────────────────────
// Bump these whenever the corresponding legal document changes.
// Every audit row carries the version the user agreed to at the moment of action.
export const LEGAL_VERSIONS = Object.freeze({
    legal_bundle: 'v1.0',
    privacy: 'v1.0',
    terms: 'v1.0',
    medical_disclaimer: 'v1.0',
    ai_disclosure: 'v1.0',
    crisis_notice: 'v1.0',
    cookie_policy: 'v1.0',
});
export const AGREEMENT_TEXT = 'By using Acute Connect, the user agreed to all platform legal documents and consented to proceed.';
export const AGREEMENT_COPY = 'By pressing Continue, requesting a CRN on the Get CRN tab, updating your status or details, submitting information, or using any feature of Acute Connect, you confirm that you have read, understood, and agree to the Privacy Policy, Terms of Use, Medical Disclaimer, AI Disclosure, Crisis Safety Notice, and Cookie & Storage Policy.';
// Short, action-specific lead-ins. The component appends the universal
// "you agree to the platform terms" tail. Keep these terse.
export const AGREEMENT_NOTICE_LEADS = Object.freeze({
    continue: 'By pressing Continue',
    crn_request: 'By requesting a CRN on the Get CRN tab',
    check_in_submit: 'By submitting this check-in',
    call_window: 'By confirming this call window',
    mood: 'By submitting your mood',
    status_update: 'By updating your status',
    profile_update: 'By updating your profile',
    generic: 'By using any feature of Acute Connect',
});
// The notice tail is split so the document list can be rendered as a link.
export const AGREEMENT_NOTICE_TAIL_PREFIX = ', or by using any feature of Acute Connect, you agree to the ';
export const AGREEMENT_NOTICE_DOCS_LABEL = 'Privacy Policy, Terms of Use, Medical Disclaimer, AI Disclosure, Crisis Safety Notice, and Cookie & Storage Policy';
export const AGREEMENT_NOTICE_TAIL_SUFFIX = '.';
export const AGREEMENT_NOTICE_TAIL = AGREEMENT_NOTICE_TAIL_PREFIX + AGREEMENT_NOTICE_DOCS_LABEL + AGREEMENT_NOTICE_TAIL_SUFFIX;
// ─── Audit Action Constants ───────────────────────────────────────────────────
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
//# sourceMappingURL=constants.js.map