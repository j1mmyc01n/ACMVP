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
    document.title = 'Providers — ACLOCATION'
  }, [])

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Providers</h1>
        <Button onClick={() => setShowForm((s) => !s)} aria-expanded={showForm} aria-controls="new-provider-panel">{showForm ? 'Close' : 'Add provider'}</Button>
      </div>

      {showForm && (
        <Card id="new-provider-panel">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900" id="new-provider-form-title">New provider</h2>
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

      <div aria-live="polite" aria-atomic="false">
      {loading ? (
        <p className="text-sm text-slate-500" role="status">Loading providers…</p>
      ) : providers.length === 0 ? (
        <EmptyState title="No providers yet" description="Clinicians, field agents, and partners are listed here." />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100" aria-label={`${providers.length} provider${providers.length === 1 ? '' : 's'}`}>
            {providers.map((p) => (
              <li key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.display_name}</p>
                  <p className="text-xs text-slate-500">
                    {p.kind} {p.contact_email ? `· ${p.contact_email}` : ''}
                  </p>
                </div>
                <Badge tone={p.is_active ? 'green' : 'slate'} role="status" aria-label={`Status: ${p.is_active ? 'Active' : 'Inactive'}`}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
      </div>
    </div>
  )
}

function ProviderForm({ onSaved }) {
  const [displayName, setDisplayName] = useState('')
  const [kind, setKind] = useState('clinician')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/providers-create', {
        displayName,
        kind,
        contactEmail: email || null,
        phone: phone || null,
      })
      onSaved()
    } catch (err) {
      setError(err?.message || 'Could not create provider.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" aria-labelledby="new-provider-form-title" noValidate>
      {error && <div role="alert" className="sm:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <Field label="Display name" htmlFor="provider-name" required>
        <Input id="provider-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="organization" />
      </Field>
      <Field label="Kind" htmlFor="provider-kind">
        <Select id="provider-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="clinician">Clinician</option>
          <option value="field_agent">Field agent</option>
          <option value="partner_org">Partner org</option>
          <option value="sponsor">Sponsor</option>
        </Select>
      </Field>
      <Field label="Email" htmlFor="provider-email">
        <Input id="provider-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </Field>
      <Field label="Phone" htmlFor="provider-phone">
        <Input id="provider-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      </Field>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={!displayName || submitting} aria-busy={submitting}>
          {submitting ? 'Saving…' : 'Add provider'}
        </Button>
      </div>
    </form>
  )
}
