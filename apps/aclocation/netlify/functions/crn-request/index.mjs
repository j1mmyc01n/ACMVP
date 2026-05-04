// POST /.netlify/functions/crn-request
// Creates a CRN request. Public endpoint — does NOT require an Identity
// session, because community members may request a CRN before staff has
// invited them. Requires `x-aclocation-id` header (or a `slug` body field)
// to scope the request to a tenant.
import { handler, json, readJson } from '../_shared/response.js';
import { HttpError } from '../_shared/auth.js';
import { db } from '../_shared/db.js';
import { recordUsage } from '../_shared/usage.js';
export default handler(async (req) => {
    const body = await readJson(req);
    if (!body.fullName?.trim())
        throw new HttpError(422, 'full_name_required');
    const slug = body.slug;
    const headerId = req.headers.get('x-aclocation-id');
    let locationId = headerId;
    if (!locationId && slug) {
        const [row] = await db()
            .sql `SELECT id FROM locations WHERE slug = ${slug} AND status = 'active' LIMIT 1`;
        locationId = row?.id ?? null;
    }
    if (!locationId)
        throw new HttpError(400, 'location_unresolved');
    const [request] = await db().sql `
    INSERT INTO crn_requests (location_id, channel, full_name, date_of_birth, reason)
    VALUES (
      ${locationId},
      ${body.channel ?? 'web'},
      ${body.fullName.trim()},
      ${body.dateOfBirth ?? null},
      ${body.reason ?? null}
    )
    RETURNING id, status, created_at
  `;
    await recordUsage(locationId, 'crn-request');
    return json({ request }, { status: 201 });
});
//# sourceMappingURL=index.mjs.map