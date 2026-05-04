export declare const LEGAL_VERSIONS: Readonly<{
    legal_bundle: "v1.0";
    privacy: "v1.0";
    terms: "v1.0";
    medical_disclaimer: "v1.0";
    ai_disclosure: "v1.0";
    crisis_notice: "v1.0";
    cookie_policy: "v1.0";
}>;
export declare const AGREEMENT_TEXT = "By using Acute Connect, the user agreed to all platform legal documents and consented to proceed.";
export declare const AGREEMENT_COPY = "By pressing Continue, requesting a CRN on the Get CRN tab, updating your status or details, submitting information, or using any feature of Acute Connect, you confirm that you have read, understood, and agree to the Privacy Policy, Terms of Use, Medical Disclaimer, AI Disclosure, Crisis Safety Notice, and Cookie & Storage Policy.";
export declare const AGREEMENT_NOTICE_LEADS: Readonly<{
    continue: "By pressing Continue";
    crn_request: "By requesting a CRN on the Get CRN tab";
    check_in_submit: "By submitting this check-in";
    call_window: "By confirming this call window";
    mood: "By submitting your mood";
    status_update: "By updating your status";
    profile_update: "By updating your profile";
    generic: "By using any feature of Acute Connect";
}>;
export declare const AGREEMENT_NOTICE_TAIL_PREFIX = ", or by using any feature of Acute Connect, you agree to the ";
export declare const AGREEMENT_NOTICE_DOCS_LABEL = "Privacy Policy, Terms of Use, Medical Disclaimer, AI Disclosure, Crisis Safety Notice, and Cookie & Storage Policy";
export declare const AGREEMENT_NOTICE_TAIL_SUFFIX = ".";
export declare const AGREEMENT_NOTICE_TAIL: string;
export declare const AUDIT_ACTIONS: Readonly<{
    readonly CRN_CREATED: "CRN_CREATED";
    readonly CRN_REDEEMED: "CRN_REDEEMED";
    readonly CHECK_IN_SUBMITTED: "CHECK_IN_SUBMITTED";
    readonly PROFILE_UPDATED: "PROFILE_UPDATED";
    readonly CALL_WINDOW_UPDATED: "CALL_WINDOW_UPDATED";
    readonly MOOD_SUBMITTED: "MOOD_SUBMITTED";
    readonly CONCERN_SUBMITTED: "CONCERN_SUBMITTED";
    readonly AI_TRIAGE_USED: "AI_TRIAGE_USED";
}>;
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
//# sourceMappingURL=constants.d.ts.map