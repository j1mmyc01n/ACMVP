import { useState, useEffect } from 'react';
import { fetchDashboardMetrics } from '../services/dashboard.service';
export function useDashboardData(carecentreId) {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = async () => {
        setLoading(true);
        try {
            const data = await fetchDashboardMetrics(carecentreId);
            setMetrics(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load dashboard data');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        refresh();
    }, [carecentreId]);
    return { metrics, loading, error, refresh };
}
//# sourceMappingURL=useDashboardData.js.map