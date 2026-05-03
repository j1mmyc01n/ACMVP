import { supabase } from '@acmvp/database';

const ADMIN_TABLE = 'admin_users_1777025000000';

export async function listStaffUsers() {
  return supabase.from(ADMIN_TABLE).select('*').order('created_at', { ascending: false });
}

export async function inviteStaffUser(params: { email: string; role: string }) {
  return supabase.from(ADMIN_TABLE).insert({ ...params, status: 'active' }).select().maybeSingle();
}

export async function updateStaffStatus(id: string, status: 'active' | 'inactive') {
  return supabase.from(ADMIN_TABLE).update({ status }).eq('id', id);
}

export async function deleteStaffUser(id: string) {
  return supabase.from(ADMIN_TABLE).delete().eq('id', id);
}
