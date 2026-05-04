import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fieldAgentsApi } from '../lib/api.js'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Textarea,
} from '../../../core/ui/index.js'

/**
 * Mobile-friendly check-in capture for field agents. The agent is preselected
 * via ?agentId=…; if the device supports geolocation, lat/lon are filled in
 * automatically and can be cleared.
 */
export function FieldAgentCheckInPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const presetAgent = params.get('agentId') ?? ''

  const [agents, setAgents] = useState([])
  const [agentId, setAgentId] = useState(presetAgent)
  const [kind, setKind] = useState('visit')
  const [notes, setNotes] = useState('')
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    document.title = 'Record check-in — ACLOCATION'
  }, [])

  useEffect(() => {
    fieldAgentsApi.list('active').then((r) => setAgents(r.agents ?? []))
  }, [])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude)
          setLongitude(pos.coords.longitude)
        },
        () => {
          /* user denied — leave coords null */
        },
        { enableHighAccuracy: true, timeout: 5000 },
      )
    }
  }, [])

  const selected = useMemo(() => agents.find((a) => a.id === agentId) ?? null, [agents, agentId])

  async function onSubmit(e) {
    e.preventDefault()
    if (!agentId) return
    setSubmitting(true)
    setError(null)
    try {
      await fieldAgentsApi.checkIn({
        agentId,
        kind,
        notes,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      })
      setSuccess(true)
      setNotes('')
    } catch (err) {
      setError(err?.payload?.error ?? err.message ?? 'Failed to record check-in.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-lg" role="status" aria-live="polite">
        <CardHeader>
          <h1 className="text-base font-semibold text-slate-900">Check-in recorded</h1>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <p>
            <span className="text-slate-500">Agent:</span>{' '}
            <span className="font-medium">{selected?.full_name}</span>
          </p>
          <p>
            <span className="text-slate-500">Kind:</span> {kind}
          </p>
          {latitude != null && longitude != null && (
            <p className="text-slate-500">
              <span aria-hidden="true">📍 </span>
              <span className="sr-only">Location: </span>
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button onClick={() => setSuccess(false)}>Record another</Button>
            <Button variant="secondary" onClick={() => navigate('/field-agents')}>
              Back to roster
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <h1 className="text-base font-semibold text-slate-900" id="checkin-form-h1">Record a check-in</h1>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="checkin-form-h1" noValidate>
          <Field label="Agent" htmlFor="agent" required>
            <Select id="agent" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              <option value="">Select an agent…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kind" htmlFor="kind">
            <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="visit">Visit</option>
              <option value="transport">Transport</option>
              <option value="welfare">Welfare</option>
              <option value="crisis">Crisis</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="What happened? Anything operations needs to know?"
            />
          </Field>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600" role="status" aria-live="polite">
            {latitude != null && longitude != null ? (
              <span>
                <span aria-hidden="true">📍 </span>
                Location captured: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                <button
                  type="button"
                  onClick={() => {
                    setLatitude(null)
                    setLongitude(null)
                  }}
                  aria-label="Clear captured location"
                  className="ml-3 text-rose-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 rounded min-h-[44px] inline-flex items-center"
                >
                  Clear
                </button>
              </span>
            ) : (
              <span>Location not available (permission denied or unsupported).</span>
            )}
          </div>
          {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !agentId} aria-busy={submitting}>
              {submitting ? 'Saving…' : 'Submit check-in'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
