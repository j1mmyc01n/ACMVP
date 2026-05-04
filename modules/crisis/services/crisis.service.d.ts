import type { CrisisEvent } from '@acmvp/types';
export declare function listCrisisEvents(params?: {
    resolved?: boolean;
    carecentreId?: string;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function createCrisisEvent(event: Partial<CrisisEvent>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function resolveCrisisEvent(id: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
export declare function assignCrisisEvent(id: string, assignedTo: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=crisis.service.d.ts.map