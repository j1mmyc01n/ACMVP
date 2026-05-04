import type { AdminUser } from '@acmvp/types';
export declare function listAdminUsers(): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function getAdminUserByEmail(email: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function upsertAdminUser(user: Partial<AdminUser>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function updateAdminLocation(id: string, lat: number, lng: number): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=admin.d.ts.map