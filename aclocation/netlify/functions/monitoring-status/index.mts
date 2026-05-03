// GET /.netlify/functions/monitoring-status
// Cross-location health snapshot for the super-admin overview page.

import { handler, json } from '../_shared/response.js'
import { requireRole } from '../_shared/auth.js'
import { db } from '../_shared/db.js'

export default handler(async () => {
  await requireRole('super_admin')

  const rows = await db().sql`
    WITH latest AS (
      SELECT DISTINCT ON (location_id)
        location_id, netlify_status, database_status, github_status, identity_status,
        checked_at, detail
      FROM location_health_checks
      ORDER BY location_id, checked_at DESC
    )
    SELECT l.id, l.slug, l.name, l.status,
           latest.netlify_status, latest.database_status, latest.github_status, latest.identity_status,
           latest.checked_at
    FROM locations l
    LEFT JOIN latest ON latest.location_id = l.id
    ORDER BY l.name ASC
  `

  return json({ statuses: rows })
})
