// POST /.netlify/functions/clients-create
// Creates a new client/patient record for the active tenant.
import { handler, json, readJson } from '../_shared/response.js';
import { requireUser, HttpError } from '../_shared/auth.js';
import { resolveTenant } from '../_shared/tenant.js';
import { audit } from '../_shared/audit.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    const user = await requireUser();
    const locationId = await resolveTenant(req, user);
    const body = await readJson(req);
    if (!body.fullName?.trim())
        throw new HttpError(422, 'full_name_required');
    const [client] = await db().sql `
    INSERT INTO clients (location_id, full_name, date_of_birth, email, phone, privacy_mode, created_by)
    VALUES (
      ${locationId},
      ${body.fullName.trim()},
      ${body.dateOfBirth ?? null},
      ${body.email ?? null},
      ${body.phone ?? null},
      ${body.privacyMode ?? false},
      ${user.id}
    )
    RETURNING id, full_name, date_of_birth, email, phone, status, created_at
  `;
    await audit({
        locationId,
        actor: user,
        action: 'client.created',
        entityType: 'client',
        entityId: client.id,
    });
    return json({ client }, { status: 201 });
});
//# sourceMappingURL=index.mjs.map