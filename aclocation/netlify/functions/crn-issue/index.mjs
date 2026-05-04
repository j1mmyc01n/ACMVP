// POST /.netlify/functions/crn-issue
// Body: { requestId, clientId } — converts a pending crn_request into an
// issued CRN row tied to a client. Admin/super_admin only.
//
// CRN format: ACL-<YYYY>-<8-char base32 of random bytes>. Globally unique
// per location via the uq_crns_number_per_location index.
import { handler, json, readJson } from '../_shared/response.js';
import { requireRole, HttpError } from '../_shared/auth.js';
import { resolveTenant } from '../_shared/tenant.js';
import { audit } from '../_shared/audit.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    const user = await requireRole(['admin', 'super_admin']);
    const locationId = await resolveTenant(req, user);
    const body = await readJson(req);
    if (!body.requestId || !body.clientId)
        throw new HttpError(400, 'request_and_client_required');
    const number = generateCrnNumber();
    const client = await db().pool.connect();
    try {
        await client.query('BEGIN');
        const r = await client.query(`SELECT id, status FROM crn_requests WHERE id = $1 AND location_id = $2 FOR UPDATE`, [body.requestId, locationId]);
        if (r.rowCount === 0)
            throw new HttpError(404, 'request_not_found');
        if (r.rows[0].status !== 'pending')
            throw new HttpError(409, 'request_not_pending');
        const issued = await client.query(`INSERT INTO crns (location_id, client_id, request_id, number, issued_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, number, issued_at`, [locationId, body.clientId, body.requestId, number, user.id]);
        await client.query(`UPDATE crn_requests SET status = 'issued', resolved_at = NOW() WHERE id = $1`, [body.requestId]);
        await client.query('COMMIT');
        await audit({
            locationId,
            actor: user,
            action: 'crn.issued',
            entityType: 'crn',
            entityId: issued.rows[0].id,
            metadata: { number, requestId: body.requestId, clientId: body.clientId },
        });
        return json({ crn: issued.rows[0] }, { status: 201 });
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
});
function generateCrnNumber() {
    const year = new Date().getUTCFullYear();
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    // Crockford-ish base32 of 5 bytes → 8 chars
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let bits = 0;
    let value = 0;
    let out = '';
    for (const byte of bytes) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            out += alphabet[(value >> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    return `ACL-${year}-${out}`;
}
//# sourceMappingURL=index.mjs.map