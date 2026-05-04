import { supabase } from '@acmvp/database';
export async function fetchDashboardMetrics(carecentreId) {
    const filters = carecentreId ? { care_centre_id: carecentreId } : {};
    const [clientsRes, crnsRes, crisisRes] = await Promise.all([
        supabase
            .from('clients_1777020684735')
            .select('id, status', { count: 'exact' })
            .match(filters),
        supabase
            .from('crn_requests_1777090006')
            .select('id', { count: 'exact' })
            .eq('status', 'pending'),
        supabase
            .from('crisis_events_1777090008')
            .select('id', { count: 'exact' })
            .is('resolved_at', null),
    ]);
    const clients = clientsRes.data ?? [];
    return {
        totalClients: clientsRes.count ?? 0,
        activeClients: clients.filter((c) => c.status === 'active').length,
        pendingCRNs: crnsRes.count ?? 0,
        openCrisisEvents: crisisRes.count ?? 0,
        recentCheckIns: 0, // TODO: implement check-in count query
    };
}
//# sourceMappingURL=dashboard.service.js.map