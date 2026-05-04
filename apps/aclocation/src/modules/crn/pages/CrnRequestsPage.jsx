import { useEffect, useState } from 'react'
import { useAuth } from '../../../core/auth/index.js'
import { api } from '../../../core/api/index.js'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Select } from '../../../core/ui/index.js'

export function CrnRequestsPage() {
  const { roles } = useAuth()
  const canIssue = roles.includes('admin') || roles.includes('super_admin')
  const [filter, setFilter] = useState('pending')
  const [requests, setRequests] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      const [r, c] = await Promise.all([
        api.get(`/crn-list?status=${filter}`),
        api.get('/clients-list'),
      ])
      setRequests(r.requests ?? [])
      setClients(c.clients ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'CRN requests — ACLOCATION'
  }, [])

  useEffect(() => {
    refresh()
  }, [filter])

  async function issue(requestId, clientId) {
    if (!clientId) return
    await api.post('/crn-issue', { requestId, clientId })
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">CRN requests</h1>
        <div className="w-44">
          <Field label="Filter" htmlFor="crn-filter">
            <Select id="crn-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="issued">Issued</option>
              <option value="rejected">Rejected</option>
            </Select>
          </Field>
        </div>
      </div>

      <div aria-live="polite" aria-atomic="false">
      {loading ? (
        <p className="text-sm text-slate-500" role="status">Loading CRN requests…</p>
      ) : requests.length === 0 ? (
        <EmptyState title="Nothing to triage" description="New CRN requests appear here for staff review." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <caption className="sr-only">CRN requests ({requests.length}, filter: {filter})</caption>
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2">Name</th>
                <th scope="col" className="px-4 py-2">Status</th>
                <th scope="col" className="px-4 py-2">CRN</th>
                <th scope="col" className="px-4 py-2">Created</th>
                {canIssue && <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <CrnRow key={r.id} req={r} clients={clients} onIssue={issue} canIssue={canIssue && r.status === 'pending'} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
      </div>
    </div>
  )
}

function CrnRow({ req, clients, onIssue, canIssue }) {
  const [clientId, setClientId] = useState('')
  const [busy, setBusy] = useState(false)
  const tone = req.status === 'issued' ? 'green' : req.status === 'pending' ? 'amber' : 'slate'
  const selectId = `crn-link-${req.id}`
  return (
    <tr className="border-t border-slate-100">
      <th scope="row" className="px-4 py-2 font-medium text-slate-900 text-left">{req.full_name}</th>
      <td className="px-4 py-2">
        <Badge tone={tone} role="status" aria-label={`Status: ${req.status}`}>{req.status}</Badge>
      </td>
      <td className="px-4 py-2 text-slate-600">{req.crn_number ?? '—'}</td>
      <td className="px-4 py-2 text-slate-500"><time dateTime={req.created_at}>{new Date(req.created_at).toLocaleString()}</time></td>
      {canIssue && (
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <label htmlFor={selectId} className="sr-only">Link {req.full_name} to a client</label>
            <select
              id={selectId}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              aria-label={`Link ${req.full_name} to a client`}
              className="h-8 min-h-[44px] sm:min-h-0 rounded-md border border-slate-300 bg-white px-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <option value="">Link to client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={!clientId || busy}
              aria-busy={busy}
              aria-label={`Issue CRN to ${req.full_name}`}
              onClick={async () => { setBusy(true); try { await onIssue(req.id, clientId); } finally { setBusy(false); } }}
            >
              Issue
            </Button>
          </div>
        </td>
      )}
    </tr>
  )
}
