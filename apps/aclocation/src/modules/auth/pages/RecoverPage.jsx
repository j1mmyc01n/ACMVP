import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordRecovery, AuthError } from '@netlify/identity'
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from '../../../core/ui/index.js'

export function RecoverPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const errorRef = useRef(null)

  useEffect(() => {
    document.title = 'Reset password — ACLOCATION'
  }, [])

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus()
  }, [error])

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await requestPasswordRecovery(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not send recovery email.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main id="main-content" className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-base font-semibold text-slate-900" id="recover-title">Reset password</h1>
        </CardHeader>
        <CardBody>
          {sent ? (
            <div className="space-y-3" role="status" aria-live="polite">
              <p className="text-sm text-emerald-700">If that email is registered, a reset link is on its way.</p>
              <Link to="/login" className="text-sm text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="recover-title" noValidate>
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
              <Field label="Email" htmlFor="email" required>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </Field>
              <Button type="submit" disabled={submitting} className="w-full" aria-busy={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </main>
  )
}
