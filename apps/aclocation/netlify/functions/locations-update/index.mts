// PATCH /.netlify/functions/locations-update
//
// master_admin (always) or a location's super_admin (their own location)
// updates branding, enabled modules, plan tier, or admin email. Database
// mode/url is intentionally not editable here — see locations-database-*.

import { handler, json, readJson } from '../_shared/response.js'
import { requireUser, HttpError } from '../_shared/auth.js'
import { db } from '../_shared/db.js'
import { audit } from '../_shared/audit.js'

type Body = {
  locationId: string
  name?: string
  planTier?: string
  branding?: Record<string, unknown>
  modules?: string[]
  adminEmail?: string
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

export default handler(async (req) => {
  const actor = await requireUser()
  const body = await readJson<Body>(req)
  if (!body.locationId) throw new HttpError(422, 'location_id_required')

  const isMaster = actor.roles.includes('master_admin')
  if (!isMaster) {
    if (!actor.roles.includes('super_admin')) throw new HttpError(403, 'forbidden')
    const member = await db()
      .sql`SELECT 1 FROM location_members WHERE location_id = ${body.locationId} AND user_id = ${actor.id} LIMIT 1`
    if (member.length === 0) throw new HttpError(403, 'not_a_member_of_location')
  }

  const changed: string[] = []

  if (body.name !== undefined) {
    await db().sql`UPDATE locations SET name = ${body.name}, updated_at = NOW() WHERE id = ${body.locationId}`
    changed.push('name')
  }
  if (body.planTier !== undefined && isMaster) {
    await db().sql`UPDATE locations SET plan_tier = ${body.planTier}, updated_at = NOW() WHERE id = ${body.locationId}`
    changed.push('planTier')
  }
  if (body.adminEmail !== undefined) {
    await db().sql`UPDATE locations SET admin_email = ${body.adminEmail}, updated_at = NOW() WHERE id = ${body.locationId}`
    changed.push('adminEmail')
  }
  if (body.branding !== undefined) {
    await db().sql`UPDATE locations SET branding = ${JSON.stringify(body.branding)}::jsonb, updated_at = NOW() WHERE id = ${body.locationId}`
    changed.push('branding')
  }
  if (body.modules !== undefined) {
    const filtered = body.modules.filter((m) => ALLOWED_MODULES.includes(m))
    await db().sql`UPDATE locations SET enabled_modules = ${JSON.stringify(filtered)}::jsonb, updated_at = NOW() WHERE id = ${body.locationId}`
    changed.push('modules')
  }

  if (changed.length === 0) {
    return json({ ok: true, noop: true })
  }

  await audit({
    locationId: body.locationId,
    actor,
    action: 'location.updated',
    entityType: 'location',
    entityId: body.locationId,
    metadata: { changed },
  })

  const [location] = await db()
    .sql`SELECT id, slug, name, plan_tier, branding, enabled_modules, admin_email FROM locations WHERE id = ${body.locationId} LIMIT 1`
  return json({ location })
})
