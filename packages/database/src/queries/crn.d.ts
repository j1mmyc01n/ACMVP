import type { CRNRequest } from '@acmvp/types';
export declare function getCRNByCode(crn: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function listCRNRequests(params?: {
    status?: string;
    carecentreId?: string;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function createCRNRequest(request: Partial<CRNRequest>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function updateCRNStatus(id: string, status: CRNRequest['status']): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=crn.d.ts.map