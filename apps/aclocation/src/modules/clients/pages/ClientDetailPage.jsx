import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../../core/api/index.js'
import { Card, CardBody, CardHeader, CardTitle, Badge, EmptyState } from '../../../core/ui/index.js'

export function ClientDetailPage() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/clients-list?q=').then((d) => d.clients?.find((c) => c.id === id)),
      api.get(`/check-ins-list?clientId=${id}`).then((d) => d.checkIns ?? []),
    ])
      .then(([c, ci]) => {
        setClient(c)
        setCheckIns(ci)
      })
      .catch((err) => setError(err?.message || 'Could not load client.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (client?.full_name) document.title = `${client.full_name} — ACLOCATION`
  }, [client?.full_name])

  if (loading) return <p className="text-sm text-slate-500" role="status" aria-live="polite">Loading client…</p>
  if (error) return <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
  if (!client) return <EmptyState title="Client not found" description="It may have been archived." />

  return (
    <div className="space-y-4">
      <Link to="/clients" className="text-sm text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded inline-block">
        <span aria-hidden="true">← </span>Back to clients
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-base font-semibold text-slate-900">{client.full_name}</h1>
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
                <Badge tone={client.status === 'active' ? 'green' : 'slate'} role="status" aria-label={`Status: ${client.status}`}>{client.status}</Badge>
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">Recent check-ins</h2>
        </CardHeader>
        <CardBody>
          <div aria-live="polite" aria-atomic="false">
            {checkIns.length === 0 ? (
              <p className="text-sm text-slate-500">No check-ins recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100" aria-label={`${checkIns.length} recent check-in${checkIns.length === 1 ? '' : 's'} for ${client.full_name}`}>
                {checkIns.map((c) => (
                  <li key={c.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{c.template}</p>
                        <time dateTime={c.occurred_at} className="text-xs text-slate-500">{new Date(c.occurred_at).toLocaleString()}</time>
                      </div>
                      {c.triage_level && <Badge tone={triageTone(c.triage_level)} role="status" aria-label={`Triage level: ${c.triage_level}`}>{c.triage_level}</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function triageTone(level) {
  return { low: 'slate', medium: 'amber', high: 'red', critical: 'red' }[level] ?? 'slate'
}
