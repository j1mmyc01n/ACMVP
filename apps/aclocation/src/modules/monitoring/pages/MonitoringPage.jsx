import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Badge, Card, EmptyState } from '../../../core/ui/index.js'

export function MonitoringPage() {
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/monitoring-status')
      .then((d) => setStatuses(d.statuses ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>
  if (statuses.length === 0)
    return <EmptyState title="No locations to monitor" description="Roll out a location to start collecting health checks." />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Cross-location monitoring</h1>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Netlify</th>
              <th className="px-4 py-2">Database</th>
              <th className="px-4 py-2">Identity</th>
              <th className="px-4 py-2">GitHub</th>
              <th className="px-4 py-2">Last checked</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-2"><StatusBadge value={s.netlify_status} /></td>
                <td className="px-4 py-2"><StatusBadge value={s.database_status} /></td>
                <td className="px-4 py-2"><StatusBadge value={s.identity_status} /></td>
                <td className="px-4 py-2"><StatusBadge value={s.github_status} /></td>
                <td className="px-4 py-2 text-slate-500">
                  {s.checked_at ? new Date(s.checked_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function StatusBadge({ value }) {
  if (!value) return <span className="text-xs text-slate-400">—</span>
  const tone = value === 'ok' ? 'green' : value === 'degraded' ? 'amber' : 'red'
  return <Badge tone={tone}>{value}</Badge>
}
