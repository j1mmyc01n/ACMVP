import { supabase } from '../client';
import type { CRNRequest } from '@acmvp/types';

const TABLE = 'crn_requests_1777090006';

export async function getCRNByCode(crn: string) {
  return supabase.from(TABLE).select('*').eq('crn', crn).maybeSingle();
}

export async function listCRNRequests(params?: { status?: string; carecentreId?: string }) {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (params?.status) query = query.eq('status', params.status);
  if (params?.carecentreId) query = query.eq('care_centre_id', params.carecentreId);
  return query;
}

export async function createCRNRequest(request: Partial<CRNRequest>) {
  return supabase.from(TABLE).insert(request).select().maybeSingle();
}

export async function updateCRNStatus(id: string, status: CRNRequest['status']) {
  return supabase.from(TABLE).update({ status }).eq('id', id);
}
