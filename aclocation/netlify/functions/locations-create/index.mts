// POST /.netlify/functions/locations-create
//
// Master-admin-only tenant rollout. Captures the per-location configuration
// the platform needs in one call:
//   - identity:    name, slug
//   - billing:     planTier
//   - branding:    primary/secondary colour, logo url, ux preset (light/dark)
//   - modules:     array of enabled module slugs
//   - admin user:  adminEmail — an invite is issued to this address as the
//                  location's super_admin, who will receive a signup link.
//   - database:    'shared' (default) or 'dedicated' (locations may bring
//                  their own database, but that requires master_admin
//                  approval before it goes live — see locations-database-*)
//   - infra:       cloneSite (optional dedicated Netlify site)
//
// Only master_admin may call this endpoint. A super_admin of a single
// location cannot mint another location.

import { handler, json, readJson } from '../_shared/response.js'
import { requireMaster, HttpError } from '../_shared/auth.js'
import { db } from '../_shared/db.js'
import { audit } from '../_shared/audit.js'

type Branding = {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  logoUrl?: string
  uxPreset?: 'light' | 'dark' | 'system'
  fontFamily?: string
}

type Body = {
  name: string
  slug: string
  planTier?: string
  cloneSite?: boolean
  adminEmail?: string
  branding?: Branding
  modules?: string[]
  databaseMode?: 'shared' | 'dedicated'
}

const ALLOWED_MODULES = [
  'dashboard',
  'clients',
  'crn',
  'check-ins',
  'crisis',
  'providers',
  'billing',
  'audit',
  'field-agents',
  'monitoring',
]

const DEFAULT_BRANDING: Required<Pick<Branding, 'primaryColor' | 'secondaryColor' | 'accentColor' | 'uxPreset' | 'fontFamily'>> = {
  primaryColor: '#0f766e',
  secondaryColor: '#0e7490',
  accentColor: '#f59e0b',
  uxPreset: 'light',
  fontFamily: 'Inter, system-ui, sans-serif',
}

export default handler(async (req) => {
  const actor = await requireMaster()
  const body = await readJson<Body>(req)

  if (!body.name || !body.slug) {
    throw new HttpError(422, 'name_and_slug_required')
  }

  const [{ existing }] = (await db()
    .sql`SELECT EXISTS(SELECT 1 FROM locations WHERE slug = ${body.slug}) AS existing`) as {
    existing: boolean
  }[]
  if (existing) throw new HttpError(409, 'slug_already_in_use')

  const branding = { ...DEFAULT_BRANDING, ...(body.branding ?? {}) }
  const modules = (body.modules ?? ALLOWED_MODULES).filter((m) => ALLOWED_MODULES.includes(m))
  const databaseMode = body.databaseMode === 'dedicated' ? 'dedicated' : 'shared'
  const databaseStatus = databaseMode === 'dedicated' ? 'pending_approval' : 'shared'

  const [location] = await db().sql`
    INSERT INTO locations (
      slug, name, plan_tier, status, branding, enabled_modules,
      database_mode, database_status, admin_email,
      approval_status, approved_by, approved_at
    )
    VALUES (
      ${body.slug}, ${body.name}, ${body.planTier ?? 'starter'}, 'provisioning',
      ${JSON.stringify(branding)}::jsonb,
      ${JSON.stringify(modules)}::jsonb,
      ${databaseMode}, ${databaseStatus}, ${body.adminEmail ?? null},
      'approved', ${actor.id}, NOW()
    )
    RETURNING id, slug, name, plan_tier, status, branding, enabled_modules,
              database_mode, database_status, admin_email
  `

  await db().sql`
    INSERT INTO location_billing (location_id, plan_tier)
    VALUES (${location.id}, ${body.planTier ?? 'starter'})
    ON CONFLICT (location_id) DO NOTHING
  `

  await db().sql`
    INSERT INTO location_deployment_logs (location_id, step, status, message)
    VALUES (${location.id}, 'create_location_row', 'succeeded', 'row created in central control plane')
  `

  // Issue an invite for the location's super_admin so the master_admin
  // doesn't have to create accounts manually. The invite token is returned
  // to the caller and is the single secret the new admin needs to sign up.
  let invite: { token: string; email: string } | null = null
  if (body.adminEmail) {
    const token = cryptoToken()
    await db().sql`
      INSERT INTO location_invites (location_id, email, role, token, invited_by)
      VALUES (${location.id}, ${body.adminEmail}, 'super_admin', ${token}, ${actor.id})
    `
    invite = { token, email: body.adminEmail }
  }

  let netlifySite: { id: string; url: string } | null = null
  if (body.cloneSite) {
    netlifySite = await provisionNetlifySite(body.slug, location.id).catch((err) => {
      console.error('[locations-create] netlify site provisioning failed', err)
      return null
    })
  }

  if (netlifySite) {
    await db().sql`
      UPDATE locations
      SET netlify_site_id = ${netlifySite.id},
          netlify_url     = ${netlifySite.url},
          status          = 'active',
          updated_at      = NOW()
      WHERE id = ${location.id}
    `
  } else {
    await db().sql`
      UPDATE locations SET status = 'active', updated_at = NOW() WHERE id = ${location.id}
    `
  }

  await audit({
    locationId: location.id,
    actor,
    action: 'location.created',
    entityType: 'location',
    entityId: location.id,
    metadata: {
      slug: body.slug,
      plan_tier: body.planTier ?? 'starter',
      modules,
      database_mode: databaseMode,
      admin_email: body.adminEmail ?? null,
    },
  })

  return json(
    { location: { ...location, netlifySite }, invite },
    { status: 201 },
  )
})

async function provisionNetlifySite(
  slug: string,
  locationId: string,
): Promise<{ id: string; url: string } | null> {
  const token = process.env.NETLIFY_API_TOKEN
  if (!token) return null

  const res = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ name: `aclocation-${slug}` }),
  })

  if (!res.ok) throw new Error(`netlify_site_create_${res.status}`)
  const site = (await res.json()) as { id: string; ssl_url?: string; url?: string }

  await db().sql`
    INSERT INTO location_deployment_logs (location_id, step, status, metadata)
    VALUES (${locationId}, 'create_netlify_site', 'succeeded', ${JSON.stringify({ siteId: site.id })}::jsonb)
  `

  return { id: site.id, url: site.ssl_url ?? site.url ?? '' }
}

function cryptoToken(): string {
  // 32 random bytes hex-encoded — good enough for invite tokens and avoids a
  // dependency. The token is single-use and short-lived.
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
