// GET /.netlify/functions/crn-list?status=pending|issued|all
// Returns crn_requests joined with their issued CRNs (if any).

import { handler, json } from '../_shared/response.js'
import { requireUser } from '../_shared/auth.js'
import { resolveTenant } from '../_shared/tenant.js'
import { db } from '../_shared/db.js'

export default handler(async (req) => {
  const user = await requireUser()
  const locationId = await resolveTenant(req, user)

  const url = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'all'

  const rows =
    status === 'all'
      ? await db().sql`
          SELECT r.id, r.full_name, r.status, r.created_at, r.resolved_at,
                 c.number AS crn_number, c.issued_at
          FROM crn_requests r
          LEFT JOIN crns c ON c.request_id = r.id
          WHERE r.location_id = ${locationId}
          ORDER BY r.created_at DESC
          LIMIT 200
        `
      : await db().sql`
          SELECT r.id, r.full_name, r.status, r.created_at, r.resolved_at,
                 c.number AS crn_number, c.issued_at
          FROM crn_requests r
          LEFT JOIN crns c ON c.request_id = r.id
          WHERE r.location_id = ${locationId} AND r.status = ${status}
          ORDER BY r.created_at DESC
          LIMIT 200
        `

  return json({ requests: rows })
})
