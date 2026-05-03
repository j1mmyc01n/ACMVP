// POST /.netlify/functions/locations-database-request
//
// A location's super_admin asks to bring their own database for the
// location. The request is queued for master_admin review — calling this
// endpoint does NOT change the location's runtime database. Approval flips
// `locations.database_status` to 'approved' and rewires queries.

import { handler, json, readJson } from '../_shared/response.js'
import { requireRole, HttpError } from '../_shared/auth.js'
import { resolveTenant } from '../_shared/tenant.js'
import { db } from '../_shared/db.js'
import { audit } from '../_shared/audit.js'

type Body = {
  provider: string
  connectionUrl: string
  reason?: string
}

const ALLOWED_PROVIDERS = ['neon', 'supabase', 'rds', 'self_hosted_postgres', 'other']

export default handler(async (req) => {
  const actor = await requireRole(['super_admin'])
  const locationId = await resolveTenant(req, actor)
  const body = await readJson<Body>(req)

  if (!body.provider || !body.connectionUrl) {
    throw new HttpError(422, 'provider_and_connection_required')
  }
  if (!ALLOWED_PROVIDERS.includes(body.provider)) {
    throw new HttpError(422, 'unsupported_provider')
  }

  const [request] = await db().sql`
    INSERT INTO location_database_requests
      (location_id, requested_by, provider, connection_url, reason, status)
    VALUES (${locationId}, ${actor.id}, ${body.provider}, ${body.connectionUrl}, ${body.reason ?? null}, 'pending')
    RETURNING id, status, provider, created_at
  `

  await db().sql`
    UPDATE locations
    SET database_mode = 'dedicated',
        database_status = 'pending_approval',
        updated_at = NOW()
    WHERE id = ${locationId} AND database_status NOT IN ('approved')
  `

  await audit({
    locationId,
    actor,
    action: 'location.database.requested',
    entityType: 'location_database_request',
    entityId: request.id,
    metadata: { provider: body.provider },
  })

  return json({ request }, { status: 201 })
})
