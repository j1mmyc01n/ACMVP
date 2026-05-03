import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../core/api/index.js'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
} from '../../../core/ui/index.js'

/**
 * Master-admin-only rollout flow. Captures everything needed to bootstrap a
 * new tenant in one form:
 *   - identity:    name + slug
 *   - billing:     plan tier
 *   - admin user:  email — receives an invite as super_admin
 *   - branding:    primary/secondary/accent colour, UX preset
 *   - modules:     which feature modules to enable
 *   - database:    shared (default) or dedicated (queues a BYOD approval)
 *   - infra:       optional dedicated Netlify site
 */
const ALL_MODULES = [
  { slug: 'dashboard', label: 'Dashboard', required: true },
  { slug: 'clients', label: 'Clients' },
  { slug: 'crn', label: 'CRN' },
  { slug: 'check-ins', label: 'Check-ins' },
  { slug: 'crisis', label: 'Crisis events' },
  { slug: 'providers', label: 'Provider directory' },
  { slug: 'billing', label: 'Billing' },
  { slug: 'audit', label: 'Audit log' },
  { slug: 'field-agents', label: 'Field agents' },
]

export function LocationRolloutPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [planTier, setPlanTier] = useState('starter')
  const [adminEmail, setAdminEmail] = useState('')
  const [cloneSite, setCloneSite] = useState(false)
  const [databaseMode, setDatabaseMode] = useState('shared')
  const [primaryColor, setPrimaryColor] = useState('#0f766e')
  const [secondaryColor, setSecondaryColor] = useState('#0e7490')
  const [accentColor, setAccentColor] = useState('#f59e0b')
  const [uxPreset, setUxPreset] = useState('light')
  const [modules, setModules] = useState(ALL_MODULES.map((m) => m.slug))
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function autoSlug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function toggleModule(slug) {
    setModules((curr) =>
      curr.includes(slug) ? curr.filter((m) => m !== slug) : [...curr, slug],
    )
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const data = await api.post('/locations-create', {
        name,
        slug: slug || autoSlug(name),
        planTier,
        cloneSite,
        adminEmail: adminEmail || undefined,
        databaseMode,
        branding: { primaryColor, secondaryColor, accentColor, uxPreset },
        modules,
      })
      setResult(data)
    } catch (err) {
      setError(err?.payload?.error ?? err.message ?? 'Provisioning failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Location ready</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <p>
            <span className="text-slate-500">Name:</span>{' '}
            <span className="font-medium">{result.location.name}</span>
          </p>
          <p>
            <span className="text-slate-500">Slug:</span> <code>{result.location.slug}</code>
          </p>
          <p>
            <span className="text-slate-500">Database:</span>{' '}
            {result.location.database_mode === 'dedicated'
              ? 'Dedicated (BYOD pending master approval)'
              : 'Shared platform database'}
          </p>
          {result.location.netlifySite?.url && (
            <p>
              <span className="text-slate-500">Site:</span>{' '}
              <a
                href={result.location.netlifySite.url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:underline"
              >
                {result.location.netlifySite.url}
              </a>
            </p>
          )}
          {result.invite && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <p className="font-medium">Send this invite link to the location super_admin:</p>
              <code className="break-all text-xs">
                {window.location.origin}/signup?token={result.invite.token}
              </code>
              <p className="mt-1 text-xs text-amber-700">
                Single-use, expires in 14 days. The recipient must use the email{' '}
                <strong>{result.invite.email}</strong>.
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button onClick={() => navigate('/system/locations')}>Back to locations</Button>
            <Button variant="secondary" onClick={() => setResult(null)}>
              Roll out another
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Roll out a new location</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Identity</h3>
            <Field label="Display name" htmlFor="name" hint="Shown to staff and clients of this location.">
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!slug) setSlug(autoSlug(e.target.value))
                }}
                required
              />
            </Field>
            <Field label="Slug" htmlFor="slug" hint="Lowercase, URL-safe; used in deep links and site names.">
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} pattern="[a-z0-9-]+" required />
            </Field>
            <Field label="Plan tier" htmlFor="plan">
              <Select id="plan" value={planTier} onChange={(e) => setPlanTier(e.target.value)}>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </Select>
            </Field>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">First admin</h3>
            <Field
              label="Super-admin email"
              htmlFor="admin_email"
              hint="An invite is issued to this address as the location's super_admin."
            >
              <Input
                id="admin_email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </Field>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Branding</h3>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Primary" htmlFor="primary">
                <Input id="primary" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </Field>
              <Field label="Secondary" htmlFor="secondary">
                <Input id="secondary" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
              </Field>
              <Field label="Accent" htmlFor="accent">
                <Input id="accent" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
              </Field>
            </div>
            <Field label="UX preset" htmlFor="ux">
              <Select id="ux" value={uxPreset} onChange={(e) => setUxPreset(e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">Match system</option>
              </Select>
            </Field>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Modules</h3>
            <p className="text-xs text-slate-500">
              Toggle which feature modules this location can use. Required modules can't be disabled.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {ALL_MODULES.map((m) => (
                <label key={m.slug} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={modules.includes(m.slug)}
                    disabled={m.required}
                    onChange={() => toggleModule(m.slug)}
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Database</h3>
            <Select value={databaseMode} onChange={(e) => setDatabaseMode(e.target.value)}>
              <option value="shared">Shared platform database (default)</option>
              <option value="dedicated">Dedicated database (BYOD — pending master approval)</option>
            </Select>
            {databaseMode === 'dedicated' && (
              <p className="text-xs text-amber-700">
                The location's super_admin must submit a connection URL through the
                Database settings page; the master admin then approves it before the
                runtime switches over. The location stays on the shared database in the
                meantime.
              </p>
            )}
          </section>

          <section>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={cloneSite}
                onChange={(e) => setCloneSite(e.target.checked)}
                className="mt-1"
              />
              <span>
                Provision a dedicated Netlify site for this location.
                <span className="block text-xs text-slate-500">
                  Requires NETLIFY_API_TOKEN to be set on the control-plane environment.
                </span>
              </span>
            </label>
          </section>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Provisioning…' : 'Roll out location'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
