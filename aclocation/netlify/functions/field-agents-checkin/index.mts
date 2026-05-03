// POST /.netlify/functions/field-agents-checkin
// A field agent (or someone on their behalf) records a check-in: GPS-stamped
// encounter row attributed to an agent and optionally a client.

import { handler, json, readJson } from '../_shared/response.js'
import { requireUser, HttpError } from '../_shared/auth.js'
import { resolveTenant } from '../_shared/tenant.js'
import { recordUsage } from '../_shared/usage.js'
import { db } from '../_shared/db.js'
import { audit } from '../_shared/audit.js'

type Body = {
  agentId: string
  clientId?: string
  kind?: 'visit' | 'transport' | 'welfare' | 'crisis' | 'other'
  notes?: string
  latitude?: number
  longitude?: number
  occurredAt?: string
}

export default handler(async (req) => {
  const user = await requireUser()
  const locationId = await resolveTenant(req, user)
  await recordUsage(locationId, 'field-agents-checkin')
  const body = await readJson<Body>(req)

  if (!body.agentId) throw new HttpError(422, 'agent_id_required')

  // Make sure the agent belongs to the active tenant.
  const ownership = await db()
    .sql`SELECT 1 FROM field_agents WHERE id = ${body.agentId} AND location_id = ${locationId} LIMIT 1`
  if (ownership.length === 0) throw new HttpError(404, 'agent_not_in_location')

  const [row] = await db().sql`
    INSERT INTO field_agent_check_ins
      (location_id, agent_id, client_id, kind, notes, latitude, longitude, occurred_at)
    VALUES (
      ${locationId},
      ${body.agentId},
      ${body.clientId ?? null},
      ${body.kind ?? 'visit'},
      ${body.notes ?? null},
      ${body.latitude ?? null},
      ${body.longitude ?? null},
      ${body.occurredAt ? new Date(body.occurredAt).toISOString() : null}
    )
    RETURNING id, agent_id, kind, occurred_at
  `

  await audit({
    locationId,
    actor: user,
    action: 'field_agent.check_in',
    entityType: 'field_agent_check_in',
    entityId: row.id,
    metadata: { agent_id: body.agentId, kind: body.kind ?? 'visit' },
  })

  return json({ checkIn: row }, { status: 201 })
})
