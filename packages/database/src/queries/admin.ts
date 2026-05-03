import { supabase } from '../client';
import type { AdminUser } from '@acmvp/types';

const TABLE = 'admin_users_1777025000000';

export async function listAdminUsers() {
  return supabase.from(TABLE).select('*').order('created_at', { ascending: false });
}

export async function getAdminUserByEmail(email: string) {
  return supabase.from(TABLE).select('*').eq('email', email).maybeSingle();
}

export async function upsertAdminUser(user: Partial<AdminUser>) {
  return supabase.from(TABLE).upsert(user).select().maybeSingle();
}

export async function updateAdminLocation(
  id: string,
  lat: number,
  lng: number,
) {
  return supabase.from(TABLE).update({
    last_location_lat: lat,
    last_location_lng: lng,
    last_location_at: new Date().toISOString(),
  }).eq('id', id);
}
