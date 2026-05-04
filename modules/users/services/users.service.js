import { supabase } from '@acmvp/database';
const ADMIN_TABLE = 'admin_users_1777025000000';
export async function listStaffUsers() {
    return supabase.from(ADMIN_TABLE).select('*').order('created_at', { ascending: false });
}
export async function inviteStaffUser(params) {
    return supabase.from(ADMIN_TABLE).insert({ ...params, status: 'active' }).select().maybeSingle();
}
export async function updateStaffStatus(id, status) {
    return supabase.from(ADMIN_TABLE).update({ status }).eq('id', id);
}
export async function deleteStaffUser(id) {
    return supabase.from(ADMIN_TABLE).delete().eq('id', id);
}
//# sourceMappingURL=users.service.js.map