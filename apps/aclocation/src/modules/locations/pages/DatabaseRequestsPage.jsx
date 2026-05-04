import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
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
  Select,
  Textarea,
} from '../../../core/ui/index.js'

/**
 * master_admin queue for BYOD database approvals. Locations request a
 * dedicated database; this page lists pending requests and lets the master
 * admin approve or reject them.
 */
export function DatabaseRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get(`/locations-database-list?status=${statusFilter}`)
      setRequests(data.requests ?? [])
    } catch (err) {
      setError(err?.payload?.error ?? err.message ?? 'Failed to load.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function decide(req, decision) {
    const notes = decision === 'reject' ? window.prompt('Reason for rejection (optional)') : null
    setBusyId(req.id)
    try {
      await api.post('/locations-database-review', {
        requestId: req.id,
        decision,
        notes: notes ?? undefined,
      })
      await refresh()
    } catch (err) {
      setError(err?.payload?.error ?? err.message ?? 'Action failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Database approvals</h1>
          <p className="text-sm text-slate-500">
            Locations cannot bring their own database without master-admin approval.
          </p>
        </div>
        <div className="w-48">
          <label htmlFor="db-status-filter" className="sr-only">Filter by status</label>
          <Select id="db-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}

      <div aria-live="polite" aria-atomic="false">
      {loading ? (
        <p className="text-sm text-slate-500" role="status">Loading database requests…</p>
      ) : requests.length === 0 ? (
        <EmptyState
          title="Nothing to review"
          description="When a location super_admin opens a BYOD database request it lands here."
        />
      ) : (
        <ul className="space-y-3" aria-label={`${requests.length} ${statusFilter} request${requests.length === 1 ? '' : 's'}`}>
          {requests.map((r) => (
            <li key={r.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {r.location_name}{' '}
                      <span className="text-xs text-slate-400">/{r.location_slug}</span>
                    </CardTitle>
                    <Badge tone={r.status === 'pending' ? 'amber' : r.status === 'approved' ? 'green' : 'red'} role="status" aria-label={`Status: ${r.status}`}>
                      {r.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody className="space-y-2 text-sm">
                  <p>
                    <span className="text-slate-500">Provider:</span> {r.provider}
                  </p>
                  {r.reason && (
                    <p className="text-slate-600">
                      <span className="text-slate-500">Reason:</span> {r.reason}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    Requested {new Date(r.created_at).toLocaleString()}
                    {r.reviewed_at && (
                      <>
                        {' '}· Reviewed {new Date(r.reviewed_at).toLocaleString()}
                      </>
                    )}
                  </p>
                  {r.review_notes && (
                    <p className="text-xs text-slate-500">Notes: {r.review_notes}</p>
                  )}
                  {r.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        disabled={busyId === r.id}
                        aria-busy={busyId === r.id}
                        aria-label={`Approve database request from ${r.location_name}`}
                        onClick={() => decide(r, 'approve')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === r.id}
                        aria-busy={busyId === r.id}
                        aria-label={`Reject database request from ${r.location_name}`}
                        onClick={() => decide(r, 'reject')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  )
}

/**
 * Per-location settings page for the location's super_admin to open a BYOD
 * database request. Until the master_admin approves, runtime queries continue
 * against the shared database.
 */
export function DatabaseSettingsPage() {
  const [provider, setProvider] = useState('neon')
  const [connectionUrl, setConnectionUrl] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/locations-database-request', { provider, connectionUrl, reason })
      setSuccess(true)
      setConnectionUrl('')
    } catch (err) {
      setError(err?.payload?.error ?? err.message ?? 'Request failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Database settings</h1>
      <p className="text-sm text-slate-500">
        Locations may bring their own database for tighter isolation or sovereignty,
        but the master admin must approve the request before the runtime switches over.
        While pending, this location continues to use the shared platform database.
      </p>

      {success && (
        <div role="status" aria-live="polite" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Request submitted. The master admin will review it.
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900" id="db-request-form-title">Request a dedicated database</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="db-request-form-title" noValidate>
            <Field label="Provider" htmlFor="provider">
              <Select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="neon">Neon</option>
                <option value="supabase">Supabase Postgres</option>
                <option value="rds">AWS RDS Postgres</option>
                <option value="self_hosted_postgres">Self-hosted Postgres</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field
              label="Connection URL"
              htmlFor="conn"
              hint="postgres://user:password@host/db — stored encrypted, never displayed back."
              required
            >
              <Input
                id="conn"
                value={connectionUrl}
                onChange={(e) => setConnectionUrl(e.target.value)}
                placeholder="postgres://…"
                autoComplete="off"
              />
            </Field>
            <Field label="Reason" htmlFor="reason">
              <Textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why does this location need its own database?"
              />
            </Field>
            {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting} aria-busy={submitting}>
                {submitting ? 'Submitting…' : 'Submit request'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
