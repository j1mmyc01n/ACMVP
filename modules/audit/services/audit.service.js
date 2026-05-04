import { supabase } from '@acmvp/database';
const AUDIT_TABLE = 'audit_logs_1777090020';
export async function listAuditLogs(params) {
    let query = supabase.from(AUDIT_TABLE).select('*').order('created_at', { ascending: false });
    if (params?.entityType)
        query = query.eq('entity_type', params.entityType);
    if (params?.userId)
        query = query.eq('user_id', params.userId);
    if (params?.from)
        query = query.gte('created_at', params.from);
    if (params?.to)
        query = query.lte('created_at', params.to);
    if (params?.limit)
        query = query.limit(params.limit);
    return query;
}
export async function exportAuditLogs(params) {
    const { data } = await listAuditLogs({ ...params, limit: undefined });
    return data ?? [];
}
//# sourceMappingURL=audit.service.js.map