import { useEffect, useRef, useState } from 'react'
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
  const errorRef = useRef(null)

  useEffect(() => {
    document.title = 'Request a Care Recipient Number'
  }, [])

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus()
  }, [error])

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
    <main id="main-content" className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-base font-semibold text-slate-900" id="crn-request-title">Request a Care Recipient Number</h1>
        </CardHeader>
        <CardBody>
          {submitted ? (
            <p className="text-sm text-emerald-700" role="status" aria-live="polite">
              Thank you. A staff member will follow up to confirm your details.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="crn-request-title" noValidate>
              {error && (
                <div
                  ref={errorRef}
                  role="alert"
                  tabIndex={-1}
                  aria-live="assertive"
                  className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-rose-500"
                >
                  {error}
                </div>
              )}
              <Field label="Full name" htmlFor="crn-full-name" required>
                <Input id="crn-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Date of birth" htmlFor="crn-dob">
                <Input id="crn-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} autoComplete="bday" />
              </Field>
              <Field label="Reason for request" htmlFor="crn-reason" hint="Optional, but helps us route your request faster.">
                <Textarea id="crn-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
                {submitting ? 'Sending…' : 'Submit request'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </main>
  )
}
