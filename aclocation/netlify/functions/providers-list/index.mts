// GET /.netlify/functions/providers-list

import { handler, json } from '../_shared/response.js'
import { requireUser } from '../_shared/auth.js'
import { resolveTenant } from '../_shared/tenant.js'
import { db } from '../_shared/db.js'

export default handler(async (req) => {
  const user = await requireUser()
  const locationId = await resolveTenant(req, user)

  const rows = await db().sql`
    SELECT id, display_name, kind, contact_email, phone, is_active
    FROM providers
    WHERE location_id = ${locationId}
    ORDER BY display_name ASC
  `
  return json({ providers: rows })
})
