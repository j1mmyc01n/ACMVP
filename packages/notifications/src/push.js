// Push notification service for Acute Connect.
// Wraps the Supabase push_notifications table and quota logic.
import { supabase } from '@acmvp/database';
const PUSH_TABLE = 'push_notifications_1777090000';
const INTG_TABLE = 'location_integration_requests_1777090015';
export const FREE_PUSH_LIMIT = 3;
export const PACK_PUSH_EXTRA = 5;
export const PUSH_PACK_FEE = 75;
export async function sendPushNotification(notification) {
    return supabase.from(PUSH_TABLE).insert({
        ...notification,
        sent_at: new Date().toISOString(),
        status: 'sent',
    });
}
export async function listPushNotifications(params) {
    let query = supabase.from(PUSH_TABLE).select('*').order('sent_at', { ascending: false });
    if (params?.centreId)
        query = query.eq('target_centre_id', params.centreId);
    if (params?.limit)
        query = query.limit(params.limit);
    return query;
}
export async function getMonthlyPushCount(centreId) {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const { count } = await supabase
        .from(PUSH_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('target_centre_id', centreId)
        .gte('sent_at', start.toISOString());
    return count ?? 0;
}
export async function requestPushPackUpgrade(params) {
    return supabase.from(INTG_TABLE).insert({
        location_id: params.locationId,
        integration_type: 'push_pack',
        requested_by: params.requestedBy,
        notes: params.notes ?? `Push notification pack upgrade (+${PACK_PUSH_EXTRA} messages). Fee: $${PUSH_PACK_FEE}`,
        status: 'pending',
    });
}
//# sourceMappingURL=push.js.map