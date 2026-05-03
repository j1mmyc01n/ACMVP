import { supabase } from '@acmvp/database';

const AUDIT_TABLE = 'audit_logs_1777090020';

export async function listAuditLogs(params?: {
  entityType?: string;
  userId?: string;
  limit?: number;
  from?: string;
  to?: string;
}) {
  let query = supabase.from(AUDIT_TABLE).select('*').order('created_at', { ascending: false });
  if (params?.entityType) query = query.eq('entity_type', params.entityType);
  if (params?.userId) query = query.eq('user_id', params.userId);
  if (params?.from) query = query.gte('created_at', params.from);
  if (params?.to) query = query.lte('created_at', params.to);
  if (params?.limit) query = query.limit(params.limit);
  return query;
}

export async function exportAuditLogs(params?: Parameters<typeof listAuditLogs>[0]) {
  const { data } = await listAuditLogs({ ...params, limit: undefined });
  return data ?? [];
}
