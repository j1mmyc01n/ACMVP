import type { AuditLog } from '@acmvp/types';
export declare function logActivity(entry: Partial<AuditLog>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
export declare function listAuditLogs(params?: {
    entityType?: string;
    userId?: string;
    limit?: number;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function recordAgreementAudit({ profileId, crn, action, deviceInfo, }: {
    profileId?: string | null;
    crn?: string | null;
    action: string;
    deviceInfo?: Record<string, unknown>;
}): Promise<import("@supabase/postgrest-js").PostgrestResponseFailure | import("@supabase/postgrest-js").PostgrestResponseSuccess<null> | {
    data: null;
    error: Error;
}>;
//# sourceMappingURL=audit.d.ts.map