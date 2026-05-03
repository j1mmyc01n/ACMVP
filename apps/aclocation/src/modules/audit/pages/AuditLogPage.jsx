import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Card, EmptyState } from '../../../core/ui/index.js'

export function AuditLogPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/audit-list?limit=200')
      .then((d) => setEntries(d.entries ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>
  if (entries.length === 0)
    return <EmptyState title="No audit activity yet" description="Every privileged operation will be logged here." />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Audit log</h1>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Entity</th>
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
