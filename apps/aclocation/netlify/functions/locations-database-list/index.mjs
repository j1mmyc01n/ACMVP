// GET /.netlify/functions/locations-database-list
//
// master_admin pending-queue view: every BYOD database request in 'pending'
// status, plus optional ?status=approved|rejected filtering for history.
import { handler, json } from '../_shared/response.js';
import { requireMaster, HttpError } from '../_shared/auth.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    await requireMaster();
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status') ?? 'pending';
    if (!['pending', 'approved', 'rejected', 'revoked', 'all'].includes(statusFilter)) {
        throw new HttpError(422, 'invalid_status_filter');
    }
    const rows = statusFilter === 'all'
        ? await db().sql `
        SELECT r.id, r.location_id, r.provider, r.status, r.reason,
               r.created_at, r.reviewed_at, r.review_notes,
               l.name AS location_name, l.slug AS location_slug
        FROM location_database_requests r
        JOIN locations l ON l.id = r.location_id
        ORDER BY r.created_at DESC
        LIMIT 200
      `
        : await db().sql `
        SELECT r.id, r.location_id, r.provider, r.status, r.reason,
               r.created_at, r.reviewed_at, r.review_notes,
               l.name AS location_name, l.slug AS location_slug
        FROM location_database_requests r
        JOIN locations l ON l.id = r.location_id
        WHERE r.status = ${statusFilter}
        ORDER BY r.created_at DESC
        LIMIT 200
      `;
    return json({ requests: rows });
});
//# sourceMappingURL=index.mjs.map