// GET /.netlify/functions/check-ins-list?clientId=<uuid>
// Returns the recent check-ins for the active tenant, optionally filtered
// to a single client.

import { handler, json } from '../_shared/response.js'
import { requireUser } from '../_shared/auth.js'
import { resolveTenant } from '../_shared/tenant.js'
import { db } from '../_shared/db.js'

export default handler(async (req) => {
  const user = await requireUser()
  const locationId = await resolveTenant(req, user)

  const url = new URL(req.url)
  const clientId = url.searchParams.get('clientId')

  const rows = clientId
    ? await db().sql`
        SELECT id, client_id, occurred_at, template, triage_level, notes
        FROM check_ins
        WHERE location_id = ${locationId} AND client_id = ${clientId}
        ORDER BY occurred_at DESC
        LIMIT 100
      `
    : await db().sql`
        SELECT id, client_id, occurred_at, template, triage_level, notes
        FROM check_ins
        WHERE location_id = ${locationId}
        ORDER BY occurred_at DESC
        LIMIT 100
      `

  return json({ checkIns: rows })
})
