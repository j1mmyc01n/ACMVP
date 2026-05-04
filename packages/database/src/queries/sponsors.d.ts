import type { Sponsor } from '@acmvp/types';
export declare function listSponsors(): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function getSponsorById(id: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function upsertSponsor(sponsor: Partial<Sponsor>): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any>>;
export declare function listLedgerEntries(sponsorId?: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
//# sourceMappingURL=sponsors.d.ts.map