import React from 'react';

// ─── Re-exports from system/ subdirectory ────────────────────────────────────
export { default as AuditLogPage }          from './system/AuditLogPage';
export { default as OverseerDashboard }     from './system/OverseerDashboard';
export { default as LocationRollout }       from './system/LocationRollout';
export { default as LocationsPage }         from './system/LocationsPage';
export { default as UsersPage }             from './system/UsersPage';
export { default as ConnectivityPage }      from './system/ConnectivityPage';
export { default as RequestsInboxPage }     from './system/RequestsInboxPage';
export { default as FinanceHubPage }        from './system/FinanceHubPage';
export { default as FeatureRolloutPage }    from './system/FeatureRolloutPage';
export { default as IntegrationPage }       from './system/IntegrationPage';
export { SuperAdminPage }                   from './system/SuperAdminPage';
export { ProviderMetricsPage }              from './system/ProviderMetricsPage';
export { FeedbackPage }                     from './system/FeedbackPage';
export { FeatureRequestPage }               from './system/FeatureRequestPage';
export { SysAdminDashboard }                from './system/SysAdminDashboard';
export { PushNotificationsPage }            from './system/PushNotificationsPage';
export { IntegrationRequestsPage }          from './system/IntegrationRequestsPage';

// ─── Stub pages (placeholder until fully implemented) ─────────────────────────
const Stub = ({ title, icon = '🔧' }) => (
  <div style={{ padding: '0 0 32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{title}</h1>
    </div>
    <p style={{ color: 'var(--ac-muted)', fontSize: 14, marginBottom: 24 }}>This module is being configured. Check back soon.</p>
    <div style={{ background: 'var(--ac-surface)', borderRadius: 16, border: '1px solid var(--ac-border)', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Coming Soon</div>
      <div style={{ color: 'var(--ac-muted)', fontSize: 14 }}>This feature is in active development.</div>
    </div>
  </div>
);

export const HeatMapPage       = () => <Stub title="Heat Map &amp; Dispatch" icon="🗺️" />;
export const SettingsPage      = () => <Stub title="Settings"                icon="⚙️" />;
export const AICodeFixerPage   = () => <Stub title="AI Code Fixer"           icon="🤖" />;
export const GitHubAgentPage   = () => <Stub title="GitHub Agent"            icon="🐙" />;
