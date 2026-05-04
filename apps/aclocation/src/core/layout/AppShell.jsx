import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import { useTenant } from '../tenancy/TenantProvider.jsx'
import { Button, cn } from '../ui/index.js'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', roles: ['member', 'admin', 'super_admin', 'master_admin'], module: 'dashboard' },
  { to: '/clients', label: 'Clients', roles: ['member', 'admin', 'super_admin', 'master_admin'], module: 'clients' },
  { to: '/crn', label: 'CRN', roles: ['member', 'admin', 'super_admin', 'master_admin'], module: 'crn' },
  { to: '/check-ins', label: 'Check-ins', roles: ['member', 'admin', 'super_admin', 'master_admin'], module: 'check-ins' },
  { to: '/field-agents', label: 'Field agents', roles: ['member', 'admin', 'super_admin', 'master_admin'], module: 'field-agents' },
  { to: '/crisis', label: 'Crisis', roles: ['admin', 'super_admin', 'master_admin'], module: 'crisis' },
  { to: '/providers', label: 'Providers', roles: ['admin', 'super_admin', 'master_admin'], module: 'providers' },
  { to: '/billing', label: 'Billing', roles: ['admin', 'super_admin', 'master_admin'], module: 'billing' },
  { to: '/audit', label: 'Audit log', roles: ['admin', 'super_admin', 'master_admin'], module: 'audit' },
  { to: '/settings/database', label: 'Database settings', roles: ['super_admin', 'master_admin'] },
  { to: '/system/locations', label: 'Locations', roles: ['master_admin'] },
  { to: '/system/database-requests', label: 'DB approvals', roles: ['master_admin'] },
  { to: '/system/monitoring', label: 'Monitoring', roles: ['master_admin'] },
]

export function AppShell() {
  const { user, logout, roles } = useAuth()
  const { active, memberships, selectLocation } = useTenant()

  const isMaster = roles.includes('master_admin')
  const enabledModules = Array.isArray(active?.enabled_modules) ? active.enabled_modules : null

  const allowed = NAV.filter((item) => {
    if (!item.roles.some((r) => roles.includes(r))) return false
    if (isMaster) return true
    if (item.module && enabledModules && !enabledModules.includes(item.module)) return false
    return true
  })

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-300"
      >
        Skip to main content
      </a>
      <header className="bg-white border-b border-slate-200" role="banner">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-tight text-brand-700">ACLOCATION</span>
            {memberships.length > 1 && (
              <>
                <label htmlFor="location-select" className="sr-only">Select active location</label>
                <select
                  id="location-select"
                  value={active?.id ?? ''}
                  onChange={(e) => selectLocation(e.target.value)}
                  aria-label="Select active location"
                  className="h-8 min-h-[44px] sm:min-h-0 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  {memberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            {memberships.length === 1 && active && (
              <span className="text-xs text-slate-500">{active.name}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-500" aria-label={user?.email ? `Signed in as ${user.email}` : undefined}>{user?.email}</span>
            <Button size="sm" variant="ghost" onClick={() => logout()} aria-label="Sign out">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav
          className="hidden md:block w-56 border-r border-slate-200 bg-white"
          aria-label="Main navigation"
        >
          <ul className="p-3 space-y-1">
            {allowed.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2 text-sm',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-100',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main-content" tabIndex={-1} className="flex-1 bg-slate-50" role="main">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
