import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Select, Textarea } from '../../../core/ui/index.js'

export function CrisisPage() {
  const [events, setEvents] = useState([])
  const [clients, setClients] = useState([])
  const [filter, setFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const [e, c] = await Promise.all([
        api.get(`/crisis-list?status=${filter}`),
        api.get('/clients-list'),
      ])
      setEvents(e.events ?? [])
      setClients(c.clients ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Crisis events</h1>
        <div className="flex items-center gap-2">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-32">
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Close' : 'Open crisis'}</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Open a crisis</CardTitle>
          </CardHeader>
          <CardBody>
            <CrisisForm
              clients={clients}
              onSaved={() => {
                setShowForm(false)
                refresh()
              }}
            />
          </CardBody>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : events.length === 0 ? (
        <EmptyState title="No matching crises" />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {events.map((ev) => (
              <li key={ev.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{ev.summary}</p>
                  <p className="text-xs text-slate-500">{new Date(ev.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={severityTone(ev.severity)}>{ev.severity}</Badge>
                  <Badge tone={ev.status === 'resolved' || ev.status === 'closed' ? 'green' : 'amber'}>
                    {ev.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function CrisisForm({ clients, onSaved }) {
  const [clientId, setClientId] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/crisis-create', { clientId, severity, summary })
      onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Client">
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
          <option value="">Select…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Severity">
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
      </Field>
      <Field label="Summary">
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} required rows={3} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={!clientId || !summary || submitting}>
          {submitting ? 'Opening…' : 'Open crisis'}
        </Button>
      </div>
    </form>
  )
}

function severityTone(s) {
  return { low: 'slate', medium: 'amber', high: 'red', critical: 'red' }[s] ?? 'slate'
}
