import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../core/api/index.js'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState } from '../../../core/ui/index.js'

export function LocationsPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'Locations — ACLOCATION'
  }, [])

  useEffect(() => {
    api
      .get('/locations-list')
      .then((d) => setLocations(d.locations ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-500" role="status" aria-live="polite">Loading locations…</p>
  if (error) return <p className="text-sm text-rose-600" role="alert">{error}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Locations</h1>
          <p className="text-sm text-slate-500">
            Every tenant on the platform. Health and billing snapshot are pulled from the central database.
          </p>
        </div>
        <Link to="/system/locations/new">
          <Button>+ Roll out new location</Button>
        </Link>
      </div>

      {locations.length === 0 ? (
        <EmptyState
          title="No locations yet"
          description="Roll out the first location to start onboarding teams."
          action={
            <Link to="/system/locations/new">
              <Button>Roll out first location</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <caption className="sr-only">Locations ({locations.length})</caption>
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2">Name</th>
                <th scope="col" className="px-4 py-2">Status</th>
                <th scope="col" className="px-4 py-2">Plan</th>
                <th scope="col" className="px-4 py-2">DB</th>
                <th scope="col" className="px-4 py-2">Modules</th>
                <th scope="col" className="px-4 py-2">Health</th>
                <th scope="col" className="px-4 py-2">Site URL</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <th scope="row" className="px-4 py-2 font-medium text-slate-900 text-left">{l.name}</th>
                  <td className="px-4 py-2">
                    <Badge tone={l.status === 'active' ? 'green' : l.status === 'provisioning' ? 'amber' : 'slate'} role="status" aria-label={`Status: ${l.status}`}>
                      {l.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{l.plan_tier ?? 'starter'}</td>
                  <td className="px-4 py-2">
                    <Badge
                      tone={
                        l.database_status === 'approved'
                          ? 'green'
                          : l.database_status === 'pending_approval'
                          ? 'amber'
                          : 'slate'
                      }
                    >
                      {l.database_mode === 'dedicated'
                        ? `dedicated · ${l.database_status}`
                        : 'shared'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {Array.isArray(l.enabled_modules) ? l.enabled_modules.length : 0} enabled
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={healthTone(l)} role="status" aria-label={`Health: ${healthLabel(l)}`}>{healthLabel(l)}</Badge>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {l.netlify_url ? (
                      <a
                        href={l.netlify_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${l.name} site (opens in new tab)`}
                        className="text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded"
                      >
                        {new URL(l.netlify_url).hostname}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

function healthTone(l) {
  if (!l.last_health_at) return 'slate'
  if (l.netlify_status === 'down' || l.db_health_status === 'down') return 'red'
  if (l.netlify_status === 'degraded' || l.db_health_status === 'degraded') return 'amber'
  return 'green'
}

function healthLabel(l) {
  if (!l.last_health_at) return 'unknown'
  return [l.netlify_status, l.db_health_status].filter(Boolean).every((s) => s === 'ok') ? 'healthy' : 'check'
}
