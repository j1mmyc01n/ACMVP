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
          <Field label="Filter">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="issued">Issued</option>
              <option value="rejected">Rejected</option>
            </Select>
          </Field>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState title="Nothing to triage" description="New CRN requests appear here for staff review." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">CRN</th>
                <th className="px-4 py-2">Created</th>
                {canIssue && <th />}
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
  )
}

function CrnRow({ req, clients, onIssue, canIssue }) {
  const [clientId, setClientId] = useState('')
  const tone = req.status === 'issued' ? 'green' : req.status === 'pending' ? 'amber' : 'slate'
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2 font-medium text-slate-900">{req.full_name}</td>
      <td className="px-4 py-2">
        <Badge tone={tone}>{req.status}</Badge>
      </td>
      <td className="px-4 py-2 text-slate-600">{req.crn_number ?? '—'}</td>
      <td className="px-4 py-2 text-slate-500">{new Date(req.created_at).toLocaleString()}</td>
      {canIssue && (
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm"
            >
              <option value="">Link to client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            <Button size="sm" disabled={!clientId} onClick={() => onIssue(req.id, clientId)}>
              Issue
            </Button>
          </div>
        </td>
      )}
    </tr>
  )
}
