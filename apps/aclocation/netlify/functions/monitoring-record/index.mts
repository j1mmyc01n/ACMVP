// POST /.netlify/functions/monitoring-record
// Append-only health-check writer. Designed to be called by a scheduled
// function or external probe. Body:
//   { locationId, netlify, database, github, identity, detail }

import { handler, json, readJson } from '../_shared/response.js'
import { requireRole, HttpError } from '../_shared/auth.js'
import { db } from '../_shared/db.js'

type Body = {
  locationId: string
  netlify?: 'ok' | 'degraded' | 'down'
  database?: 'ok' | 'degraded' | 'down'
  github?: 'ok' | 'degraded' | 'down'
  identity?: 'ok' | 'degraded' | 'down'
  detail?: Record<string, unknown>
}

export default handler(async (req) => {
  await requireRole('super_admin')
  const body = await readJson<Body>(req)
  if (!body.locationId) throw new HttpError(422, 'locationId_required')

  const [row] = await db().sql`
    INSERT INTO location_health_checks
      (location_id, netlify_status, database_status, github_status, identity_status, detail)
    VALUES (
      ${body.locationId},
      ${body.netlify ?? null},
      ${body.database ?? null},
      ${body.github ?? null},
      ${body.identity ?? null},
      ${JSON.stringify(body.detail ?? {})}::jsonb
    )
    RETURNING id, checked_at
  `

  return json({ check: row }, { status: 201 })
})
