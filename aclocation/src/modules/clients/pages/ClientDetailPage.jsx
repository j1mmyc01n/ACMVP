import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../../core/api/index.js'
import { Card, CardBody, CardHeader, CardTitle, Badge, EmptyState } from '../../../core/ui/index.js'

export function ClientDetailPage() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/clients-list?q=').then((d) => d.clients?.find((c) => c.id === id)),
      api.get(`/check-ins-list?clientId=${id}`).then((d) => d.checkIns ?? []),
    ])
      .then(([c, ci]) => {
        setClient(c)
        setCheckIns(ci)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>
  if (!client) return <EmptyState title="Client not found" description="It may have been archived." />

  return (
    <div className="space-y-4">
      <Link to="/clients" className="text-sm text-brand-600 hover:underline">
        ← Back to clients
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{client.full_name}</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
              <dd className="text-slate-900">{client.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Phone</dt>
              <dd className="text-slate-900">{client.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
              <dd>
                <Badge tone={client.status === 'active' ? 'green' : 'slate'}>{client.status}</Badge>
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent check-ins</CardTitle>
        </CardHeader>
        <CardBody>
          {checkIns.length === 0 ? (
            <p className="text-sm text-slate-500">No check-ins recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {checkIns.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{c.template}</p>
                      <p className="text-xs text-slate-500">{new Date(c.occurred_at).toLocaleString()}</p>
                    </div>
                    {c.triage_level && <Badge tone={triageTone(c.triage_level)}>{c.triage_level}</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function triageTone(level) {
  return { low: 'slate', medium: 'amber', high: 'red', critical: 'red' }[level] ?? 'slate'
}
