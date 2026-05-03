import { supabase } from '@acmvp/database';
import { logActivity } from '@acmvp/database';
import type { CRNRequest } from '@acmvp/types';

const CRN_TABLE = 'crn_requests_1777090006';

export async function createCRN(params: {
  userId?: string | null;
  crn: string;
  profile?: Record<string, unknown>;
  ipAddress?: string | null;
  deviceInfo?: Record<string, unknown>;
}): Promise<CRNRequest> {
  if (!params.crn) throw new Error('createCRN: crn is required');

  const { data: record, error } = await supabase
    .from(CRN_TABLE)
    .insert({
      user_id: params.userId,
      crn: params.crn,
      status: 'active',
      created_by: params.userId,
      created_at: new Date().toISOString(),
      ...params.profile,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity({
    user_id: params.userId ?? undefined,
    action: 'CRN_CREATED',
    entity_type: 'crn_requests',
    entity_id: record.id,
    new_value: record,
    ip_address: params.ipAddress ?? undefined,
    device_info: params.deviceInfo,
  });

  return record as CRNRequest;
}

export async function revokeCRN(id: string, revokedBy: string) {
  return supabase.from(CRN_TABLE).update({ status: 'revoked' }).eq('id', id);
}

export async function searchCRN(crn: string) {
  return supabase.from(CRN_TABLE).select('*').eq('crn', crn).maybeSingle();
}
