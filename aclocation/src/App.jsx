import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth } from './core/auth/index.js'
import { AppShell } from './core/layout/index.js'

import { LoginPage } from './modules/auth/pages/LoginPage.jsx'
import { SignupPage } from './modules/auth/pages/SignupPage.jsx'
import { RecoverPage } from './modules/auth/pages/RecoverPage.jsx'
import { UnauthorisedPage } from './modules/auth/pages/UnauthorisedPage.jsx'

import { DashboardPage } from './modules/dashboard/pages/DashboardPage.jsx'
import { ClientsListPage } from './modules/clients/pages/ClientsListPage.jsx'
import { ClientDetailPage } from './modules/clients/pages/ClientDetailPage.jsx'
import { CrnRequestsPage } from './modules/crn/pages/CrnRequestsPage.jsx'
import { PublicCrnRequestPage } from './modules/crn/pages/PublicCrnRequestPage.jsx'
import { CheckInsPage } from './modules/check-ins/pages/CheckInsPage.jsx'
import { AuditLogPage } from './modules/audit/pages/AuditLogPage.jsx'
import { BillingPage } from './modules/billing/pages/BillingPage.jsx'
import { CrisisPage } from './modules/crisis/pages/CrisisPage.jsx'
import { ProvidersPage } from './modules/providers/pages/ProvidersPage.jsx'
import { LocationsPage } from './modules/locations/pages/LocationsPage.jsx'
import { LocationRolloutPage } from './modules/locations/pages/LocationRolloutPage.jsx'
import {
  DatabaseRequestsPage,
  DatabaseSettingsPage,
} from './modules/locations/pages/DatabaseRequestsPage.jsx'
import { MonitoringPage } from './modules/monitoring/pages/MonitoringPage.jsx'
import { FieldAgentsPage, FieldAgentCheckInPage } from './modules/field-agents/index.js'

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/recover" element={<RecoverPage />} />
      <Route path="/unauthorised" element={<UnauthorisedPage />} />
      <Route path="/request-crn" element={<PublicCrnRequestPage />} />

      {/* Authenticated app shell */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="clients" element={<ClientsListPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />

        <Route path="crn" element={<CrnRequestsPage />} />
        <Route path="check-ins" element={<CheckInsPage />} />
        <Route path="crisis" element={<CrisisPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="audit" element={<AuditLogPage />} />

        <Route path="field-agents" element={<FieldAgentsPage />} />
        <Route path="field-agents/check-in" element={<FieldAgentCheckInPage />} />

        {/* Location super_admin: settings for their own tenant */}
        <Route path="settings/database" element={<DatabaseSettingsPage />} />

        {/* master_admin and super_admin */}
        <Route path="system">
          <Route path="locations" element={<LocationsPage />} />
          <Route path="locations/new" element={<LocationRolloutPage />} />
          <Route path="database-requests" element={<DatabaseRequestsPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
