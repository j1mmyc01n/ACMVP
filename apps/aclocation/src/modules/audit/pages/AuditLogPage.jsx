import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Card, EmptyState } from '../../../core/ui/index.js'

export function AuditLogPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'Audit log — ACLOCATION'
  }, [])

  useEffect(() => {
    api
      .get('/audit-list?limit=200')
      .then((d) => setEntries(d.entries ?? []))
      .catch((err) => setError(err?.message || 'Could not load audit entries.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <p className="text-sm text-slate-500" role="status" aria-live="polite">
        Loading audit log…
      </p>
    )
  }
  if (error) {
    return (
      <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </div>
    )
  }
  if (entries.length === 0)
    return <EmptyState title="No audit activity yet" description="Every privileged operation will be logged here." />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Audit log</h1>
      <Card>
        <table className="w-full text-sm">
          <caption className="sr-only">Audit log — most recent {entries.length} entries</caption>
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2">When</th>
              <th scope="col" className="px-4 py-2">Actor</th>
              <th scope="col" className="px-4 py-2">Action</th>
              <th scope="col" className="px-4 py-2">Entity</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-500">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-900">{e.actor_email ?? 'system'}</td>
                <td className="px-4 py-2 text-slate-900 font-medium">{e.action}</td>
                <td className="px-4 py-2 text-slate-600">
                  {e.entity_type ? `${e.entity_type}:${e.entity_id ?? ''}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
