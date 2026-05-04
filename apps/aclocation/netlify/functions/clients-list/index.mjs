// GET /.netlify/functions/clients-list
// Lists active clients for the active tenant. Supports a q filter and
// pagination via limit/offset query params.
import { handler, json } from '../_shared/response.js';
import { requireUser } from '../_shared/auth.js';
import { resolveTenant } from '../_shared/tenant.js';
import { recordUsage } from '../_shared/usage.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    const user = await requireUser();
    const locationId = await resolveTenant(req, user);
    await recordUsage(locationId, 'clients-list');
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
    const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);
    const rows = q
        ? await db().sql `
        SELECT id, full_name, date_of_birth, email, phone, status, created_at
        FROM clients
        WHERE location_id = ${locationId}
          AND status <> 'archived'
          AND full_name ILIKE ${'%' + q + '%'}
        ORDER BY full_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
        : await db().sql `
        SELECT id, full_name, date_of_birth, email, phone, status, created_at
        FROM clients
        WHERE location_id = ${locationId} AND status <> 'archived'
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    return json({ clients: rows, limit, offset });
});
//# sourceMappingURL=index.mjs.map