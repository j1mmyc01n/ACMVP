// GET /.netlify/functions/field-agents-list
// Lists field agents for the active tenant.
import { handler, json } from '../_shared/response.js';
import { requireUser } from '../_shared/auth.js';
import { resolveTenant } from '../_shared/tenant.js';
import { recordUsage } from '../_shared/usage.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    const user = await requireUser();
    const locationId = await resolveTenant(req, user);
    await recordUsage(locationId, 'field-agents-list');
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? 'active';
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 500);
    const rows = status === 'all'
        ? await db().sql `
        SELECT id, full_name, email, phone, role_title, status, user_id, created_at
        FROM field_agents
        WHERE location_id = ${locationId}
        ORDER BY full_name ASC
        LIMIT ${limit}
      `
        : await db().sql `
        SELECT id, full_name, email, phone, role_title, status, user_id, created_at
        FROM field_agents
        WHERE location_id = ${locationId} AND status = ${status}
        ORDER BY full_name ASC
        LIMIT ${limit}
      `;
    return json({ agents: rows });
});
//# sourceMappingURL=index.mjs.map