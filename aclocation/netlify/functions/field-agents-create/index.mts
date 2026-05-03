// POST /.netlify/functions/field-agents-create
// admin or super_admin creates a field agent record for the active tenant.

import { handler, json, readJson } from '../_shared/response.js'
import { requireRole, HttpError } from '../_shared/auth.js'
import { resolveTenant } from '../_shared/tenant.js'
import { recordUsage } from '../_shared/usage.js'
import { db } from '../_shared/db.js'
import { audit } from '../_shared/audit.js'

type Body = {
  fullName: string
  email?: string
  phone?: string
  roleTitle?: string
  userId?: string
}

export default handler(async (req) => {
  const actor = await requireRole(['admin', 'super_admin'])
  const locationId = await resolveTenant(req, actor)
  await recordUsage(locationId, 'field-agents-create')
  const body = await readJson<Body>(req)

  if (!body.fullName) throw new HttpError(422, 'full_name_required')

  const [agent] = await db().sql`
    INSERT INTO field_agents (location_id, user_id, full_name, email, phone, role_title)
    VALUES (
      ${locationId},
      ${body.userId ?? null},
      ${body.fullName},
      ${body.email ?? null},
      ${body.phone ?? null},
      ${body.roleTitle ?? null}
    )
    RETURNING id, full_name, email, phone, role_title, status, created_at
  `

  await audit({
    locationId,
    actor,
    action: 'field_agent.created',
    entityType: 'field_agent',
    entityId: agent.id,
    metadata: { full_name: body.fullName },
  })

  return json({ agent }, { status: 201 })
})
