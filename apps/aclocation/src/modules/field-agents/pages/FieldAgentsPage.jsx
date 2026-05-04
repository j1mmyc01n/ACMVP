import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fieldAgentsApi } from '../lib/api.js'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
} from '../../../core/ui/index.js'
import { useAuth } from '../../../core/auth/index.js'

/**
 * Directory of field agents for the active tenant. admin/super_admin/master_admin
 * can mint a new agent; everyone can browse the roster and jump to the
 * mobile-friendly check-in page.
 */
export function FieldAgentsPage() {
  const { roles } = useAuth()
  const canManage = roles.some((r) => ['admin', 'super_admin', 'master_admin'].includes(r))
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [recent, setRecent] = useState([])

  async function refresh() {
    setLoading(true)
    try {
      const [agentList, checkInList] = await Promise.all([
        fieldAgentsApi.list('active'),
        fieldAgentsApi.checkIns(),
      ])
      setAgents(agentList.agents ?? [])
      setRecent(checkInList.checkIns ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Field agents — ACLOCATION'
  }, [])

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Field agents</h1>
          <p className="text-sm text-slate-500">
            Outreach, transport, and welfare staff active in this location.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate((s) => !s)} aria-expanded={showCreate} aria-controls="new-agent-panel">
            {showCreate ? 'Close' : 'New agent'}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card id="new-agent-panel">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900" id="new-agent-form-title">Add a field agent</h2>
          </CardHeader>
          <CardBody>
            <CreateAgentForm
              onCreated={() => {
                setShowCreate(false)
                refresh()
              }}
            />
          </CardBody>
        </Card>
      )}

      <div aria-live="polite" aria-atomic="false">
      {loading ? (
        <p className="text-sm text-slate-500" role="status">Loading field agents…</p>
      ) : agents.length === 0 ? (
        <EmptyState
          title="No field agents yet"
          description="Field agents are staff working outside the office — outreach workers, drivers, welfare officers."
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <caption className="sr-only">Active field agents ({agents.length})</caption>
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2">Name</th>
                <th scope="col" className="px-4 py-2">Role</th>
                <th scope="col" className="px-4 py-2">Contact</th>
                <th scope="col" className="px-4 py-2">Status</th>
                <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <th scope="row" className="px-4 py-2 font-medium text-slate-900 text-left">{a.full_name}</th>
                  <td className="px-4 py-2 text-slate-600">{a.role_title ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {a.email ?? a.phone ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={a.status === 'active' ? 'green' : 'amber'} role="status" aria-label={`Status: ${a.status}`}>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to={`/field-agents/check-in?agentId=${a.id}`}
                      aria-label={`Record check-in for ${a.full_name}`}
                      className="text-sm text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded"
                    >
                      Record check-in <span aria-hidden="true">→</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">Recent check-ins</h2>
        </CardHeader>
        <CardBody>
          <div aria-live="polite" aria-atomic="false">
            {recent.length === 0 ? (
              <p className="text-sm text-slate-500">No check-ins yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100" aria-label={`${Math.min(recent.length, 12)} most recent check-ins`}>
                {recent.slice(0, 12).map((c) => (
                  <li key={c.id} className="py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{c.agent_name}</span>
                      <time dateTime={c.occurred_at} className="text-xs text-slate-500">
                        {new Date(c.occurred_at).toLocaleString()}
                      </time>
                    </div>
                    <p className="text-slate-600">
                      <Badge tone="blue" className="mr-2">{c.kind}</Badge>
                      {c.notes ?? '—'}
                    </p>
                    {c.latitude != null && c.longitude != null && (
                      <p className="text-xs text-slate-400">
                        <span aria-hidden="true">📍 </span>
                        <span className="sr-only">Location: </span>
                        {Number(c.latitude).toFixed(4)}, {Number(c.longitude).toFixed(4)}
                      </p>
                    )}
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

function CreateAgentForm({ onCreated }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await fieldAgentsApi.create({ fullName, email, phone, roleTitle })
      onCreated?.()
    } catch (err) {
      setError(err?.payload?.error ?? err.message ?? 'Failed to create agent.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="new-agent-form-title" noValidate>
      <Field label="Full name" htmlFor="full_name" required>
        <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Role / title" htmlFor="role_title">
          <Input id="role_title" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </Field>
      </div>
      {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Saving…' : 'Add agent'}
        </Button>
      </div>
    </form>
  )
}
