import { useEffect } from 'react'
import { useTenant } from '../tenancy/TenantProvider.jsx'

/**
 * Applies the active location's branding (primary/secondary/accent colours,
 * UX preset, font) as CSS custom properties on the document root. Components
 * that should respond to per-location branding read these variables via
 * Tailwind arbitrary values, e.g. `bg-[var(--brand-primary)]`.
 *
 * This is a side-effect-only component — it renders nothing.
 */
export function BrandingProvider() {
  const { active } = useTenant()

  useEffect(() => {
    if (typeof document === 'undefined') return
    const branding = (active?.branding ?? {}) || {}
    const root = document.documentElement
    const set = (name, value) => {
      if (value) root.style.setProperty(name, value)
      else root.style.removeProperty(name)
    }
    set('--brand-primary', branding.primaryColor)
    set('--brand-secondary', branding.secondaryColor)
    set('--brand-accent', branding.accentColor)
    if (branding.fontFamily) document.body.style.fontFamily = branding.fontFamily
    if (branding.uxPreset === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [active?.branding])

  return null
}
