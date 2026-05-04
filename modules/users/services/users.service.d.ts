export declare function listStaffUsers(): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function inviteStaffUser(params: {
    email: string;
    role: string;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function updateStaffStatus(id: string, status: 'active' | 'inactive'): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
export declare function deleteStaffUser(id: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=users.service.d.ts.map