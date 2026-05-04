import type { CrisisEvent } from '@acmvp/types';
export declare function listCrisisEvents(params?: {
    severity?: string;
    resolved?: boolean;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function createCrisisEvent(event: Partial<CrisisEvent>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function resolveCrisisEvent(id: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=crisis.d.ts.map