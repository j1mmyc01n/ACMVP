import type { CareCenter, LocationInstance } from '@acmvp/types';
export declare function listCareCentres(): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function getCareCentreById(id: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function upsertCareCentre(centre: Partial<CareCenter>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function listLocationInstances(): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function getLocationInstanceBySlug(slug: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function upsertLocationInstance(instance: Partial<LocationInstance>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function updateLocationInstanceStatus(id: string, status: LocationInstance['status']): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=locations.d.ts.map