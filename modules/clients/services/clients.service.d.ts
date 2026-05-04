import type { Client } from '@acmvp/types';
export declare function listClients(params?: {
    carecentreId?: string;
    status?: string;
    search?: string;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function getClient(id: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function updateClient(id: string, patch: Partial<Client>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function offboardClient(id: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=clients.service.d.ts.map