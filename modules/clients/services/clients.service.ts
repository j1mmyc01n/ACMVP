import { supabase } from '@acmvp/database';
import type { Client } from '@acmvp/types';

const TABLE = 'clients_1777020684735';

export async function listClients(params?: { carecentreId?: string; status?: string; search?: string }) {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (params?.carecentreId) query = query.eq('care_centre_id', params.carecentreId);
  if (params?.status) query = query.eq('status', params.status);
  if (params?.search) query = query.ilike('full_name', `%${params.search}%`);
  return query;
}

export async function getClient(id: string) {
  return supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
}

export async function updateClient(id: string, patch: Partial<Client>) {
  return supabase.from(TABLE).update(patch).eq('id', id).select().maybeSingle();
}

export async function offboardClient(id: string) {
  return supabase.from(TABLE).update({ status: 'offboarded' }).eq('id', id);
}
