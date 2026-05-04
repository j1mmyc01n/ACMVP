import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Select, Textarea } from '../../../core/ui/index.js'

export function CheckInsPage() {
  const [checkIns, setCheckIns] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [ci, cl] = await Promise.all([api.get('/check-ins-list'), api.get('/clients-list')])
      setCheckIns(ci.checkIns ?? [])
      setClients(cl.clients ?? [])
    } catch (err) {
      setError(err?.message || 'Could not load check-ins.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Check-ins — ACLOCATION'
  }, [])

  useEffect(() => {
    refresh()
  }, [])

  const clientName = (id) => clients.find((c) => c.id === id)?.full_name ?? '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Check-ins</h1>
        <Button onClick={() => setShowForm((s) => !s)} aria-expanded={showForm} aria-controls="checkin-form-panel">{showForm ? 'Close' : 'Record check-in'}</Button>
      </div>

      {showForm && (
        <Card id="checkin-form-panel">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900" id="checkin-form-title">Record check-in</h2>
          </CardHeader>
          <CardBody>
            <CheckInForm
              clients={clients}
              onSaved={() => {
                setShowForm(false)
                refresh()
              }}
            />
          </CardBody>
        </Card>
      )}

      <div aria-live="polite" aria-atomic="false">
      {error ? (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : loading ? (
        <p className="text-sm text-slate-500" role="status">Loading check-ins…</p>
      ) : checkIns.length === 0 ? (
        <EmptyState title="No check-ins recorded" description="The most recent encounter for any client appears here." />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100" aria-label={`${checkIns.length} recent check-ins`}>
            {checkIns.map((c) => (
              <li key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{clientName(c.client_id)}</p>
                  <p className="text-xs text-slate-500">
                    <time dateTime={c.occurred_at}>{new Date(c.occurred_at).toLocaleString()}</time> · {c.template}
                  </p>
                </div>
                {c.triage_level && <Badge tone={triageTone(c.triage_level)} role="status" aria-label={`Triage level: ${c.triage_level}`}>{c.triage_level}</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}
      </div>
    </div>
  )
}

function CheckInForm({ clients, onSaved }) {
  const [clientId, setClientId] = useState('')
  const [triage, setTriage] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/check-ins-create', {
        clientId,
        triageLevel: triage || null,
        notes: { summary: note },
      })
      onSaved()
    } catch (err) {
      setError(err?.message || 'Could not save check-in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="checkin-form-title" noValidate>
      {error && <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <Field label="Client" htmlFor="checkin-client" required>
        <Select id="checkin-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Triage level" htmlFor="checkin-triage">
        <Select id="checkin-triage" value={triage} onChange={(e) => setTriage(e.target.value)}>
          <option value="">— none —</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
      </Field>
      <Field label="Note" htmlFor="checkin-note">
        <Textarea id="checkin-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={!clientId || submitting} aria-busy={submitting}>
          {submitting ? 'Saving…' : 'Save check-in'}
        </Button>
      </div>
    </form>
  )
}

function triageTone(level) {
  return { low: 'slate', medium: 'amber', high: 'red', critical: 'red' }[level] ?? 'slate'
}

