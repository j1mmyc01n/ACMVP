// Dashboard module types
import type { UserRole } from '@acmvp/types';

export interface DashboardMetrics {
  totalClients: number;
  activeClients: number;
  pendingCRNs: number;
  openCrisisEvents: number;
  recentCheckIns: number;
}

export interface DashboardConfig {
  role: UserRole;
  carecentreId?: string;
  userEmail?: string;
}
