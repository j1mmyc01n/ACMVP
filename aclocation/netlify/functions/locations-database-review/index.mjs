// POST /.netlify/functions/locations-database-review
//
// master_admin approves or rejects a pending BYOD database request.
// Approval flips `locations.database_status` to 'approved' and writes the
// connection URL into the location row; rejection leaves the location on
// the shared database.
import { handler, json, readJson } from '../_shared/response.js';
import { requireMaster, HttpError } from '../_shared/auth.js';
import { db } from '../_shared/db.js';
import { audit } from '../_shared/audit.js';
export default handler(async (req) => {
    const actor = await requireMaster();
    const body = await readJson(req);
    if (!body.requestId || !['approve', 'reject'].includes(body.decision)) {
        throw new HttpError(422, 'request_id_and_decision_required');
    }
    const [request] = await db().sql `
    SELECT id, location_id, provider, connection_url, status
    FROM location_database_requests
    WHERE id = ${body.requestId}
    LIMIT 1
  `;
    if (!request)
        throw new HttpError(404, 'request_not_found');
    if (request.status !== 'pending')
        throw new HttpError(409, 'request_not_pending');
    const newRequestStatus = body.decision === 'approve' ? 'approved' : 'rejected';
    await db().sql `
    UPDATE location_database_requests
    SET status = ${newRequestStatus},
        reviewed_by = ${actor.id},
        reviewed_at = NOW(),
        review_notes = ${body.notes ?? null}
    WHERE id = ${request.id}
  `;
    if (body.decision === 'approve') {
        await db().sql `
      UPDATE locations
      SET database_mode    = 'dedicated',
          database_status  = 'approved',
          database_provider = ${request.provider},
          database_url      = ${request.connection_url},
          updated_at        = NOW()
      WHERE id = ${request.location_id}
    `;
    }
    else {
        await db().sql `
      UPDATE locations
      SET database_status = 'shared',
          database_mode   = 'shared',
          database_url    = NULL,
          database_provider = NULL,
          updated_at      = NOW()
      WHERE id = ${request.location_id}
    `;
    }
    await audit({
        locationId: request.location_id,
        actor,
        action: `location.database.${body.decision}d`,
        entityType: 'location_database_request',
        entityId: request.id,
        metadata: { provider: request.provider, notes: body.notes ?? null },
    });
    return json({ ok: true, status: newRequestStatus });
});
//# sourceMappingURL=index.mjs.map