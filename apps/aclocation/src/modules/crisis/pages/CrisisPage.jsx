import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Select, Textarea } from '../../../core/ui/index.js'

export function CrisisPage() {
  const [events, setEvents] = useState([])
  const [clients, setClients] = useState([])
  const [filter, setFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [e, c] = await Promise.all([
        api.get(`/crisis-list?status=${filter}`),
        api.get('/clients-list'),
      ])
      setEvents(e.events ?? [])
      setClients(c.clients ?? [])
    } catch (err) {
      setError(err?.message || 'Could not load crisis events.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Crisis events — ACLOCATION'
  }, [])

  useEffect(() => {
    refresh()
  }, [filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Crisis events</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="crisis-filter" className="sr-only">Filter crises by status</label>
          <Select id="crisis-filter" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-32" aria-label="Filter crises by status">
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Button onClick={() => setShowForm((s) => !s)} aria-expanded={showForm} aria-controls="crisis-form-panel">{showForm ? 'Close' : 'Open crisis'}</Button>
        </div>
      </div>

      {showForm && (
        <Card id="crisis-form-panel">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900" id="crisis-form-title">Open a crisis</h2>
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

      {/* Crisis events use assertive aria-live so they announce immediately */}
      <div aria-live="assertive" aria-atomic="false">
        {error ? (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : loading ? (
          <p className="text-sm text-slate-500" role="status">Loading crisis events…</p>
        ) : events.length === 0 ? (
          <EmptyState title="No matching crises" />
        ) : (
          <Card>
            <ul className="divide-y divide-slate-100" aria-label={`${events.length} ${filter} crisis event${events.length === 1 ? '' : 's'}`}>
              {events.map((ev) => (
                <li key={ev.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{ev.summary}</p>
                    <time dateTime={ev.created_at} className="text-xs text-slate-500">{new Date(ev.created_at).toLocaleString()}</time>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={severityTone(ev.severity)} role="status" aria-label={`Severity: ${ev.severity}`}>{ev.severity}</Badge>
                    <Badge tone={ev.status === 'resolved' || ev.status === 'closed' ? 'green' : 'amber'} role="status" aria-label={`Status: ${ev.status}`}>
                      {ev.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}

function CrisisForm({ clients, onSaved }) {
  const [clientId, setClientId] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/crisis-create', { clientId, severity, summary })
      onSaved()
    } catch (err) {
      setError(err?.message || 'Could not open crisis.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="crisis-form-title" noValidate>
      {error && <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <Field label="Client" htmlFor="crisis-client" required>
        <Select id="crisis-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Select…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Severity" htmlFor="crisis-severity">
        <Select id="crisis-severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
      </Field>
      <Field label="Summary" htmlFor="crisis-summary" required>
        <Textarea id="crisis-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={!clientId || !summary || submitting} aria-busy={submitting}>
          {submitting ? 'Opening…' : 'Open crisis'}
        </Button>
      </div>
    </form>
  )
}

function severityTone(s) {
  return { low: 'slate', medium: 'amber', high: 'red', critical: 'red' }[s] ?? 'slate'
}

