import { getUser } from '@netlify/identity'

export type AuthedUser = {
  id: string
  email: string
  roles: string[]
  appMetadata: Record<string, unknown>
  userMetadata: Record<string, unknown>
}

/**
 * Resolve the caller's Identity user. Returns null when no valid session
 * cookie or bearer token is present.
 */
export async function currentUser(): Promise<AuthedUser | null> {
  const user = await getUser()
  if (!user) return null
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
  const roles = Array.isArray(appMeta.roles) ? (appMeta.roles as string[]) : []
  return {
    id: user.id,
    email: user.email ?? '',
    roles,
    appMetadata: appMeta,
    userMetadata: (user.user_metadata ?? {}) as Record<string, unknown>,
  }
}

export async function requireUser(): Promise<AuthedUser> {
  const user = await currentUser()
  if (!user) throw new HttpError(401, 'unauthorised')
  return user
}

/**
 * Role hierarchy (highest to lowest):
 *   master_admin  : platform sysadmin — implicitly satisfies every role gate
 *                   below. Sees and controls everything across all locations.
 *   super_admin   : a single location's senior administrator. Higher
 *                   visibility than admin within their tenant.
 *   admin         : day-to-day administrator within a single location.
 *   member        : standard staff user within a single location.
 */
export const ROLES = ['member', 'admin', 'super_admin', 'master_admin'] as const
export type Role = (typeof ROLES)[number]

export function isMaster(user: AuthedUser): boolean {
  return user.roles.includes('master_admin')
}

export async function requireRole(role: string | string[]): Promise<AuthedUser> {
  const user = await requireUser()
  const allowed = Array.isArray(role) ? role : [role]
  // master_admin implicitly satisfies any role gate.
  if (user.roles.includes('master_admin')) return user
  if (!user.roles.some((r) => allowed.includes(r))) {
    throw new HttpError(403, 'forbidden')
  }
  return user
}

export async function requireMaster(): Promise<AuthedUser> {
  const user = await requireUser()
  if (!user.roles.includes('master_admin')) {
    throw new HttpError(403, 'master_admin_only')
  }
  return user
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message)
  }
}
