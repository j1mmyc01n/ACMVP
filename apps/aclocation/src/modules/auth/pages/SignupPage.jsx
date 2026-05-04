import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthError } from '@netlify/identity'
import { useAuth } from '../../../core/auth/index.js'
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from '../../../core/ui/index.js'

/**
 * Invite-only signup.
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
  const errorRef = useRef(null)

  useEffect(() => {
    document.title = 'Create account — ACLOCATION'
  }, [])

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus()
  }, [error])

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
    <main id="main-content" className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-base font-semibold text-slate-900" id="signup-title">Create your account</h1>
        </CardHeader>
        <CardBody>
          {message ? (
            <div className="space-y-3" role="status" aria-live="polite">
              <p className="text-sm text-emerald-700">{message}</p>
              <Link to="/login" className="text-sm text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="signup-title" noValidate>
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
              <Field
                label="Invite token"
                htmlFor="token"
                hint="Required. Bootstrap accounts (the very first user) may leave this blank."
              >
                <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Full name" htmlFor="full_name" required>
                <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Email" htmlFor="email" required>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </Field>
              <Field label="Password" htmlFor="password" hint="At least 8 characters." required>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
              <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
                {submitting ? 'Creating…' : 'Create account'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardBody>
      </Card>
    </main>
  )
}
