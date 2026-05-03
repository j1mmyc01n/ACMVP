// GET /.netlify/functions/audit-list — admin/super_admin only.
// Returns the most recent audit rows for the active tenant. Super-admins
// receive cross-tenant rows when no `x-aclocation-id` header is present.

import { handler, json } from '../_shared/response.js'
import { requireRole } from '../_shared/auth.js'
import { db } from '../_shared/db.js'

export default handler(async (req) => {
  const user = await requireRole(['admin', 'super_admin'])
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 500)
  const headerId = req.headers.get('x-aclocation-id')

  const rows =
    headerId
      ? await db().sql`
          SELECT id, location_id, actor_email, action, entity_type, entity_id, metadata, created_at
          FROM audit_log
          WHERE location_id = ${headerId}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      : user.roles.includes('super_admin')
        ? await db().sql`
            SELECT id, location_id, actor_email, action, entity_type, entity_id, metadata, created_at
            FROM audit_log
            ORDER BY created_at DESC
            LIMIT ${limit}
          `
        : []

  return json({ entries: rows })
})
