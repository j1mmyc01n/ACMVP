import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Select, Textarea } from '../../../core/ui/index.js'

export function CheckInsPage() {
  const [checkIns, setCheckIns] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const [ci, cl] = await Promise.all([api.get('/check-ins-list'), api.get('/clients-list')])
      setCheckIns(ci.checkIns ?? [])
      setClients(cl.clients ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const clientName = (id) => clients.find((c) => c.id === id)?.full_name ?? '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Check-ins</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Close' : 'Record check-in'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record check-in</CardTitle>
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

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : checkIns.length === 0 ? (
        <EmptyState title="No check-ins recorded" description="The most recent encounter for any client appears here." />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {checkIns.map((c) => (
              <li key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{clientName(c.client_id)}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(c.occurred_at).toLocaleString()} · {c.template}
                  </p>
                </div>
                {c.triage_level && <Badge tone={triageTone(c.triage_level)}>{c.triage_level}</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function CheckInForm({ clients, onSaved }) {
  const [clientId, setClientId] = useState('')
  const [triage, setTriage] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/check-ins-create', {
        clientId,
        triageLevel: triage || null,
        notes: { summary: note },
      })
      onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Client">
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
          <option value="">Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Triage level">
        <Select value={triage} onChange={(e) => setTriage(e.target.value)}>
          <option value="">— none —</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
      </Field>
      <Field label="Note">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={!clientId || submitting}>
          {submitting ? 'Saving…' : 'Save check-in'}
        </Button>
      </div>
    </form>
  )
}

function triageTone(level) {
  return { low: 'slate', medium: 'amber', high: 'red', critical: 'red' }[level] ?? 'slate'
}
