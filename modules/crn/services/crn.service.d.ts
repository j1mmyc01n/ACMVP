import type { CRNRequest } from '@acmvp/types';
export declare function createCRN(params: {
    userId?: string | null;
    crn: string;
    profile?: Record<string, unknown>;
    ipAddress?: string | null;
    deviceInfo?: Record<string, unknown>;
}): Promise<CRNRequest>;
export declare function revokeCRN(id: string, revokedBy: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
export declare function searchCRN(crn: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
//# sourceMappingURL=crn.service.d.ts.map