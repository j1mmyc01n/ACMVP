import { useState } from 'react'
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
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to ACLOCATION</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <Link to="/signup" className="text-brand-600 hover:underline">
                Create account
              </Link>
              <Link to="/recover" className="text-slate-500 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
