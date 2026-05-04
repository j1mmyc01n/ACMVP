import { supabase } from '@acmvp/database';
const CLIENTS_TABLE = 'clients_1777020684735';
const CRN_TABLE = 'crn_requests_1777090006';
export async function submitCheckIn(payload) {
    const { crn, userId, carecentreId, mood, concerns, callWindow, deviceInfo } = payload;
    // Record the check-in as an event in the client record
    if (crn || userId) {
        const query = crn
            ? supabase.from(CLIENTS_TABLE).select('id, event_log').eq('crn', crn).maybeSingle()
            : supabase.from(CLIENTS_TABLE).select('id, event_log').eq('user_id', userId).maybeSingle();
        const { data: client } = await query;
        if (client) {
            const event = {
                type: 'check_in',
                mood,
                concerns,
                call_window: callWindow,
                created_at: new Date().toISOString(),
                device_info: deviceInfo,
            };
            const updatedLog = [event, ...(client.event_log ?? [])].slice(0, 200);
            await supabase.from(CLIENTS_TABLE).update({ event_log: updatedLog }).eq('id', client.id);
        }
    }
    return { ok: true };
}
export async function validateCRNForCheckIn(crn) {
    const { data } = await supabase
        .from(CRN_TABLE)
        .select('*')
        .eq('crn', crn)
        .eq('status', 'active')
        .maybeSingle();
    return data;
}
//# sourceMappingURL=checkin.service.js.map