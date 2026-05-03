// GET /.netlify/functions/locations-status?id=<uuid>
// Returns the rollout & health status of a single location, including the
// last 50 deployment-log entries. Super-admin only.

import { handler, json } from '../_shared/response.js'
import { requireRole, HttpError } from '../_shared/auth.js'
import { db } from '../_shared/db.js'

export default handler(async (req) => {
  await requireRole('super_admin')

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) throw new HttpError(400, 'id_required')

  const [location] = await db()
    .sql`SELECT id, slug, name, status, plan_tier, netlify_site_id, netlify_url, created_at
         FROM locations WHERE id = ${id}`
  if (!location) throw new HttpError(404, 'location_not_found')

  const [latestHealth] = await db()
    .sql`SELECT * FROM location_health_checks WHERE location_id = ${id} ORDER BY checked_at DESC LIMIT 1`

  const logs = await db()
    .sql`SELECT step, status, message, metadata, created_at FROM location_deployment_logs
         WHERE location_id = ${id} ORDER BY created_at DESC LIMIT 50`

  return json({ location, health: latestHealth ?? null, logs })
})
