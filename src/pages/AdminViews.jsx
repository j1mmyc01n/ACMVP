// Re-export modular admin pages
export { default as TriageDashboard } from './admin/TriageDashboard';
export { default as CRMPage } from './admin/CRMPage';
export { default as InvoicingPage } from './admin/InvoicingPage';
export { default as CrisisPage } from './admin/CrisisPage';
export { default as ReportsPage } from './admin/ReportsPage';
export { default as PatientRegistry } from './admin/PatientRegistry';
export { default as CRNGenerator } from './admin/CRNGenerator';

// Export remaining pages that reference the old structure
import PatientRegistry from './admin/PatientRegistry';
import CRNGenerator from './admin/CRNGenerator';

export const ClientsPage = PatientRegistry;
export const CRNPage = CRNGenerator;