import type { DashboardMetrics } from '../types';
export declare function useDashboardData(carecentreId?: string): {
    metrics: DashboardMetrics | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};
//# sourceMappingURL=useDashboardData.d.ts.map