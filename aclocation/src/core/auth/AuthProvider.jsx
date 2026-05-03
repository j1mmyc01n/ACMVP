import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  getUser,
  login as identityLogin,
  signup as identitySignup,
  logout as identityLogout,
  oauthLogin,
  onAuthChange,
  handleAuthCallback,
  AUTH_EVENTS,
} from '@netlify/identity'

const AuthContext = createContext(null)

/**
 * Single source of truth for the current Identity user and role membership.
 * Wraps `@netlify/identity` so the rest of the app never imports it directly.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    handleAuthCallback().catch(() => {})

    getUser().then((u) => {
      if (cancelled) return
      setUser(u)
      setLoading(false)
    })

    const unsubscribe = onAuthChange((event, next) => {
      if (event === AUTH_EVENTS.LOGIN || event === AUTH_EVENTS.USER_UPDATED) setUser(next)
      if (event === AUTH_EVENTS.LOGOUT) setUser(null)
      if (event === AUTH_EVENTS.TOKEN_REFRESH) setUser(next ?? null)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    const roles = user?.app_metadata?.roles ?? []
    return {
      user,
      loading,
      roles,
      isAuthenticated: Boolean(user),
      hasRole: (r) => roles.includes(r),
      login: identityLogin,
      signup: identitySignup,
      logout: identityLogout,
      oauth: oauthLogin,
    }
  }, [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
