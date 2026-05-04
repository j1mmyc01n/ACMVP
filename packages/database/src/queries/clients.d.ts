import type { Client } from '@acmvp/types';
export declare function getClientByCRN(crn: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function getClientById(id: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function listClients(carecentreId?: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function upsertClient(client: Partial<Client>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function updateClientStatus(id: string, status: Client['status']): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
export declare function appendClientEvent(id: string, event: Record<string, unknown>, currentLog?: Record<string, unknown>[]): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=clients.d.ts.map