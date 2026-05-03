// GET /.netlify/functions/locations-mine
// Lists every location the calling user is a member of, with their role.
// Used by the SPA to populate the location switcher on first load.

import { handler, json } from '../_shared/response.js'
import { requireUser } from '../_shared/auth.js'
import { db } from '../_shared/db.js'

export default handler(async () => {
  const user = await requireUser()

  // master_admin and super_admin see every location regardless of membership.
  const rows = user.roles.includes('master_admin') || user.roles.includes('super_admin')
    ? await db().sql`
        SELECT id, slug, name, status, plan_tier, netlify_url, branding, enabled_modules
        FROM locations
        WHERE status <> 'archived'
        ORDER BY name ASC
      `
    : await db().sql`
        SELECT l.id, l.slug, l.name, l.status, l.plan_tier, l.netlify_url,
               l.branding, l.enabled_modules, m.role
        FROM locations l
        JOIN location_members m ON m.location_id = l.id
        WHERE m.user_id = ${user.id} AND l.status <> 'archived'
        ORDER BY l.name ASC
      `

  return json({ locations: rows })
})
