import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordRecovery, AuthError } from '@netlify/identity'
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from '../../../core/ui/index.js'

export function RecoverPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

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
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardBody>
          {sent ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">If that email is registered, a reset link is on its way.</p>
              <Link to="/login" className="text-sm text-brand-600 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Email" htmlFor="email">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
