// GET /.netlify/functions/crisis-list?status=open|resolved|all
import { handler, json } from '../_shared/response.js';
import { requireUser } from '../_shared/auth.js';
import { resolveTenant } from '../_shared/tenant.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    const user = await requireUser();
    const locationId = await resolveTenant(req, user);
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? 'all';
    const rows = status === 'all'
        ? await db().sql `
          SELECT id, client_id, severity, status, summary, created_at, resolved_at
          FROM crisis_events
          WHERE location_id = ${locationId}
          ORDER BY created_at DESC
          LIMIT 200
        `
        : await db().sql `
          SELECT id, client_id, severity, status, summary, created_at, resolved_at
          FROM crisis_events
          WHERE location_id = ${locationId} AND status = ${status}
          ORDER BY created_at DESC
          LIMIT 200
        `;
    return json({ events: rows });
});
//# sourceMappingURL=index.mjs.map