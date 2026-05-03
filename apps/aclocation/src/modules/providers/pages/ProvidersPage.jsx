import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Input, Select } from '../../../core/ui/index.js'

export function ProvidersPage() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const data = await api.get('/providers-list')
      setProviders(data.providers ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Providers</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Close' : 'Add provider'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New provider</CardTitle>
          </CardHeader>
          <CardBody>
            <ProviderForm
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
      ) : providers.length === 0 ? (
        <EmptyState title="No providers yet" description="Clinicians, field agents, and partners are listed here." />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {providers.map((p) => (
              <li key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.display_name}</p>
                  <p className="text-xs text-slate-500">
                    {p.kind} {p.contact_email ? `· ${p.contact_email}` : ''}
                  </p>
                </div>
                <Badge tone={p.is_active ? 'green' : 'slate'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function ProviderForm({ onSaved }) {
  const [displayName, setDisplayName] = useState('')
  const [kind, setKind] = useState('clinician')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/providers-create', {
        displayName,
        kind,
        contactEmail: email || null,
        phone: phone || null,
      })
      onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Display name">
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </Field>
      <Field label="Kind">
        <Select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="clinician">Clinician</option>
          <option value="field_agent">Field agent</option>
          <option value="partner_org">Partner org</option>
          <option value="sponsor">Sponsor</option>
        </Select>
      </Field>
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Phone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={!displayName || submitting}>
          {submitting ? 'Saving…' : 'Add provider'}
        </Button>
      </div>
    </form>
  )
}
