import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input, Textarea } from '../../../core/ui/index.js'

/**
 * Public, unauthenticated CRN request form. Designed to be embeddable from a
 * tenant's marketing site via deep link `/request-crn?slug=<location-slug>`.
 */
export function PublicCrnRequestPage() {
  const [params] = useSearchParams()
  const slug = params.get('slug') ?? ''
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/crn-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, fullName, dateOfBirth: dob || null, reason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'request_failed')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err.message ?? 'Could not submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Request a Care Recipient Number</CardTitle>
        </CardHeader>
        <CardBody>
          {submitted ? (
            <p className="text-sm text-emerald-700">
              Thank you. A staff member will follow up to confirm your details.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Full name">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </Field>
              <Field label="Reason for request" hint="Optional, but helps us route your request faster.">
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit request'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
