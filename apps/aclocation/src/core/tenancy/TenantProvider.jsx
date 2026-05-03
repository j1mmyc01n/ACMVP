import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider.jsx'
import { api } from '../api/client.js'

const TenantContext = createContext(null)
const STORAGE_KEY = 'aclocation.activeLocationId'

/**
 * Holds the currently-selected location (tenant) for the signed-in user.
 * The chosen location id is sent on every API request via `x-aclocation-id`,
 * which the function-side `resolveTenant` helper reads.
 */
export function TenantProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [memberships, setMemberships] = useState([])
  const [activeId, setActiveId] = useState(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(STORAGE_KEY)
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setMemberships([])
      return
    }
    setLoading(true)
    api
      .get('/locations-mine')
      .then((data) => {
        setMemberships(data.locations ?? [])
        if (!activeId && data.locations?.length) {
          const fallback =
            user?.app_metadata?.default_location_id || data.locations[0].id
          selectLocation(fallback)
        }
      })
      .catch(() => setMemberships([]))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  function selectLocation(id) {
    setActiveId(id)
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem(STORAGE_KEY, id)
      else window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  const value = useMemo(
    () => ({
      activeId,
      active: memberships.find((m) => m.id === activeId) ?? null,
      memberships,
      loading,
      selectLocation,
    }),
    [activeId, memberships, loading],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within <TenantProvider>')
  return ctx
}

export function getActiveLocationId() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}
