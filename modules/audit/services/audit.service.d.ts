export declare function listAuditLogs(params?: {
    entityType?: string;
    userId?: string;
    limit?: number;
    from?: string;
    to?: string;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function exportAuditLogs(params?: Parameters<typeof listAuditLogs>[0]): Promise<any[]>;
//# sourceMappingURL=audit.service.d.ts.map