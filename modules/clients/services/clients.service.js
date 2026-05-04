import { supabase } from '@acmvp/database';
const TABLE = 'clients_1777020684735';
export async function listClients(params) {
    let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (params?.carecentreId)
        query = query.eq('care_centre_id', params.carecentreId);
    if (params?.status)
        query = query.eq('status', params.status);
    if (params?.search)
        query = query.ilike('full_name', `%${params.search}%`);
    return query;
}
export async function getClient(id) {
    return supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
}
export async function updateClient(id, patch) {
    return supabase.from(TABLE).update(patch).eq('id', id).select().maybeSingle();
}
export async function offboardClient(id) {
    return supabase.from(TABLE).update({ status: 'offboarded' }).eq('id', id);
}
//# sourceMappingURL=clients.service.js.map