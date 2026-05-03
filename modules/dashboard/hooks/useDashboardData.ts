import { useState, useEffect } from 'react';
import { fetchDashboardMetrics } from '../services/dashboard.service';
import type { DashboardMetrics } from '../types';

export function useDashboardData(carecentreId?: string) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardMetrics(carecentreId);
      setMetrics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [carecentreId]);

  return { metrics, loading, error, refresh };
}
