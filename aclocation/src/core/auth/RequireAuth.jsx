import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'

/**
 * Gate a subtree on authentication and (optionally) one of a list of roles.
 * Renders `fallback` while the session is hydrating.
 */
export function RequireAuth({ children, roles, fallback = null }) {
  const { isAuthenticated, loading, roles: have } = useAuth()
  const location = useLocation()

  if (loading) return fallback
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (roles && roles.length > 0 && !roles.some((r) => have.includes(r))) {
    return <Navigate to="/unauthorised" replace />
  }
  return children
}
