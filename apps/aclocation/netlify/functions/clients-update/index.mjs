// PATCH /.netlify/functions/clients-update
// Body: { id, fullName?, email?, phone?, status?, privacyMode? }
import { handler, json, readJson } from '../_shared/response.js';
import { requireUser, HttpError } from '../_shared/auth.js';
import { resolveTenant } from '../_shared/tenant.js';
import { audit } from '../_shared/audit.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    const user = await requireUser();
    const locationId = await resolveTenant(req, user);
    const body = await readJson(req);
    if (!body.id)
        throw new HttpError(400, 'id_required');
    const [updated] = await db().sql `
    UPDATE clients SET
      full_name    = COALESCE(${body.fullName ?? null}, full_name),
      email        = COALESCE(${body.email ?? null}, email),
      phone        = COALESCE(${body.phone ?? null}, phone),
      status       = COALESCE(${body.status ?? null}, status),
      privacy_mode = COALESCE(${body.privacyMode ?? null}, privacy_mode),
      updated_at   = NOW()
    WHERE id = ${body.id} AND location_id = ${locationId}
    RETURNING id, full_name, email, phone, status, privacy_mode, updated_at
  `;
    if (!updated)
        throw new HttpError(404, 'client_not_found');
    await audit({
        locationId,
        actor: user,
        action: 'client.updated',
        entityType: 'client',
        entityId: body.id,
        metadata: { fields: Object.keys(body).filter((k) => k !== 'id') },
    });
    return json({ client: updated });
});
//# sourceMappingURL=index.mjs.map