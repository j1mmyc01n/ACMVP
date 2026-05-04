import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthError } from '@netlify/identity'
import { useAuth } from '../../../core/auth/index.js'
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from '../../../core/ui/index.js'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const errorRef = useRef(null)

  useEffect(() => {
    document.title = 'Sign in — ACLOCATION'
  }, [])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.status === 401 ? 'Invalid email or password.' : err.message)
      } else {
        setError('Sign-in failed.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main id="main-content" className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-base font-semibold text-slate-900" id="signin-title">Sign in to ACLOCATION</h1>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="signin-title" noValidate>
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
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <Link to="/signup" className="text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded">
                Create account
              </Link>
              <Link to="/recover" className="text-slate-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </main>
  )
}
