// POST /.netlify/functions/crisis-create

import { handler, json, readJson } from '../_shared/response.js'
import { requireUser, HttpError } from '../_shared/auth.js'
import { resolveTenant } from '../_shared/tenant.js'
import { audit } from '../_shared/audit.js'
import { db } from '../_shared/db.js'

type Body = {
  clientId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  details?: Record<string, unknown>
}

export default handler(async (req) => {
  const user = await requireUser()
  const locationId = await resolveTenant(req, user)
  const body = await readJson<Body>(req)
  if (!body.clientId || !body.summary?.trim()) {
    throw new HttpError(422, 'clientId_and_summary_required')
  }

  const [event] = await db().sql`
    INSERT INTO crisis_events (location_id, client_id, reported_by, severity, summary, details)
    VALUES (
      ${locationId},
      ${body.clientId},
      ${user.id},
      ${body.severity ?? 'medium'},
      ${body.summary.trim()},
      ${JSON.stringify(body.details ?? {})}::jsonb
    )
    RETURNING id, severity, status, created_at
  `

  await audit({
    locationId,
    actor: user,
    action: 'crisis.opened',
    entityType: 'crisis_event',
    entityId: event.id,
    metadata: { severity: event.severity, clientId: body.clientId },
  })

  return json({ event }, { status: 201 })
})
