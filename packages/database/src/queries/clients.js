import { supabase } from '../client';
const TABLE = 'clients_1777020684735';
export async function getClientByCRN(crn) {
    return supabase.from(TABLE).select('*').eq('crn', crn).maybeSingle();
}
export async function getClientById(id) {
    return supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
}
export async function listClients(carecentreId) {
    let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (carecentreId)
        query = query.eq('care_centre_id', carecentreId);
    return query;
}
export async function upsertClient(client) {
    return supabase.from(TABLE).upsert(client).select().maybeSingle();
}
export async function updateClientStatus(id, status) {
    return supabase.from(TABLE).update({ status }).eq('id', id);
}
export async function appendClientEvent(id, event, currentLog = []) {
    const MAX_EVENTS = 200;
    const updated = [event, ...currentLog].slice(0, MAX_EVENTS);
    return supabase.from(TABLE).update({ event_log: updated }).eq('id', id);
}
//# sourceMappingURL=clients.js.map