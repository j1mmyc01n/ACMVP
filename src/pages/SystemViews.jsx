// System Admin Pages - Central Export Hub
export { default as OverseerDashboard } from './system/OverseerDashboard';
export { default as LocationRollout } from './system/LocationRollout';
export { default as AuditLogPage } from './system/AuditLogPage';

// Legacy alias for backward compatibility (Exporting directly from source to avoid ReferenceError)
export { default as SysDashPage } from './system/OverseerDashboard';
export { default as RolloutPage } from './system/LocationRollout';

// Placeholder exports (to be modularized)
import React from 'react';
import { Card } from '../components/UI';

export const IntegrationPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Integrations & API Hub</h1>
    <Card><p className="ac-muted">Integrations module is being migrated to modular structure.</p></Card>
  </div>
);

export const SettingsPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Global Settings</h1>
    <Card><p className="ac-muted">Settings module is being migrated to modular structure.</p></Card>
  </div>
);

export const UsersPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Staff Management</h1>
    <Card><p className="ac-muted">Staff management module is being migrated to modular structure.</p></Card>
  </div>
);

export const SuperAdminPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Super Admin Controls</h1>
    <Card><p className="ac-muted">Super Admin module is being migrated to modular structure.</p></Card>
  </div>
);

export const LocationsPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Locations</h1>
    <Card><p className="ac-muted">Locations (Care Centres) module is being migrated to modular structure.</p></Card>
  </div>
);

export const HeatMapPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">AI Dispatch & Heat Map</h1>
    <Card><p className="ac-muted">Heat Map module is being migrated to modular structure.</p></Card>
  </div>
);

export const FeedbackPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Feedback & Tickets</h1>
    <Card><p className="ac-muted">Feedback module is being migrated to modular structure.</p></Card>
  </div>
);

export const FeatureRequestPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Feature Requests</h1>
    <Card><p className="ac-muted">Feature Requests module is being migrated to modular structure.</p></Card>
  </div>
);

export const ProviderMetricsPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">Provider Metrics</h1>
    <Card><p className="ac-muted">Provider Metrics module is being migrated to modular structure.</p></Card>
  </div>
);

export const AICodeFixerPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">AI Code Fixer</h1>
    <Card><p className="ac-muted">AI Code Fixer module is being migrated to modular structure.</p></Card>
  </div>
);

export const GitHubAgentPage = () => (
  <div className="ac-stack">
    <h1 className="ac-h1">GitHub AI Agent</h1>
    <Card><p className="ac-muted">GitHub Agent module is being migrated to modular structure.</p></Card>
  </div>
);

export const OfficesPage = LocationsPage;