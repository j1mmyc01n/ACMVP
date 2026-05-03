import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthError } from '@netlify/identity'
import { useAuth } from '../../../core/auth/index.js'
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from '../../../core/ui/index.js'

/**
 * Invite-only signup. Public open signup is disabled — every signup must
 * include an invite token issued by the master_admin (or, for non-bootstrap
 * scenarios, by a location super_admin). The first user across the platform
 * is auto-promoted to master_admin and may sign up without a token.
 */
export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(params.get('token') ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const user = await signup(email, password, {
        full_name: fullName,
        invite_token: token || undefined,
      })
      if (user.emailVerified) {
        navigate('/dashboard', { replace: true })
      } else {
        setMessage('Account created. Check your email to confirm.')
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setError(
          err.status === 403
            ? 'Invite required. Ask the platform administrator for a signup link.'
            : err.message,
        )
      } else {
        setError('Signup failed.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
        </CardHeader>
        <CardBody>
          {message ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">{message}</p>
              <Link to="/login" className="text-sm text-brand-600 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Field
                label="Invite token"
                htmlFor="token"
                hint="Required. Bootstrap accounts (the very first user) may leave this blank."
              >
                <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} />
              </Field>
              <Field label="Full name" htmlFor="full_name">
                <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Password" htmlFor="password" hint="At least 8 characters.">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </Field>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create account'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
