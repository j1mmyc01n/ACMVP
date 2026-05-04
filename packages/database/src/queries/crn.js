import { supabase } from '../client';
const TABLE = 'crn_requests_1777090006';
export async function getCRNByCode(crn) {
    return supabase.from(TABLE).select('*').eq('crn', crn).maybeSingle();
}
export async function listCRNRequests(params) {
    let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (params?.status)
        query = query.eq('status', params.status);
    if (params?.carecentreId)
        query = query.eq('care_centre_id', params.carecentreId);
    return query;
}
export async function createCRNRequest(request) {
    return supabase.from(TABLE).insert(request).select().maybeSingle();
}
export async function updateCRNStatus(id, status) {
    return supabase.from(TABLE).update({ status }).eq('id', id);
}
//# sourceMappingURL=crn.js.map