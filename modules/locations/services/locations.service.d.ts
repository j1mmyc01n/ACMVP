export declare function listLocations(): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function getLocationBySlug(slug: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function listCareCentres(): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function getFeatureFlags(locationId: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function updateFeatureFlags(locationId: string, flags: Record<string, boolean>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
//# sourceMappingURL=locations.service.d.ts.map