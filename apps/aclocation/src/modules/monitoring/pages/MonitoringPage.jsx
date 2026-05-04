import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Badge, Card, EmptyState } from '../../../core/ui/index.js'

export function MonitoringPage() {
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'Monitoring — ACLOCATION'
  }, [])

  useEffect(() => {
    api
      .get('/monitoring-status')
      .then((d) => setStatuses(d.statuses ?? []))
      .catch((err) => setError(err?.message || 'Could not load monitoring data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-500" role="status" aria-live="polite">Loading monitoring data…</p>
  if (error) return <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
  if (statuses.length === 0)
    return <EmptyState title="No locations to monitor" description="Roll out a location to start collecting health checks." />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Cross-location monitoring</h1>
      <Card>
        <table className="w-full text-sm">
          <caption className="sr-only">Live health status for all locations ({statuses.length})</caption>
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2">Location</th>
              <th scope="col" className="px-4 py-2">Netlify</th>
              <th scope="col" className="px-4 py-2">Database</th>
              <th scope="col" className="px-4 py-2">Identity</th>
              <th scope="col" className="px-4 py-2">GitHub</th>
              <th scope="col" className="px-4 py-2">Last checked</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <th scope="row" className="px-4 py-2 font-medium text-slate-900 text-left">{s.name}</th>
                <td className="px-4 py-2"><StatusBadge value={s.netlify_status} label="Netlify status" /></td>
                <td className="px-4 py-2"><StatusBadge value={s.database_status} label="Database status" /></td>
                <td className="px-4 py-2"><StatusBadge value={s.identity_status} label="Identity status" /></td>
                <td className="px-4 py-2"><StatusBadge value={s.github_status} label="GitHub status" /></td>
                <td className="px-4 py-2 text-slate-500">
                  {s.checked_at ? <time dateTime={s.checked_at}>{new Date(s.checked_at).toLocaleString()}</time> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function StatusBadge({ value, label }) {
  if (!value) return <span className="text-xs text-slate-400" aria-label={`${label}: unknown`}>—</span>
  const tone = value === 'ok' ? 'green' : value === 'degraded' ? 'amber' : 'red'
  return <Badge tone={tone} role="status" aria-label={`${label}: ${value}`}>{value}</Badge>
}
