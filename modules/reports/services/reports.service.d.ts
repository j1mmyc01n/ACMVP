export declare function listClinicalReports(carecentreId?: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function generateReport(params: {
    carecentreId?: string;
    from?: string;
    to?: string;
    type?: string;
}): Promise<{
    ok: boolean;
    data: never[];
    params: {
        carecentreId?: string;
        from?: string;
        to?: string;
        type?: string;
    };
}>;
//# sourceMappingURL=reports.service.d.ts.map