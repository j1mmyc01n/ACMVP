// POST /.netlify/functions/providers-create
import { handler, json, readJson } from '../_shared/response.js';
import { requireRole, HttpError } from '../_shared/auth.js';
import { resolveTenant } from '../_shared/tenant.js';
import { audit } from '../_shared/audit.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    const user = await requireRole(['admin', 'super_admin']);
    const locationId = await resolveTenant(req, user);
    const body = await readJson(req);
    if (!body.displayName?.trim())
        throw new HttpError(422, 'displayName_required');
    const [provider] = await db().sql `
    INSERT INTO providers (location_id, display_name, kind, contact_email, phone)
    VALUES (
      ${locationId},
      ${body.displayName.trim()},
      ${body.kind ?? 'clinician'},
      ${body.contactEmail ?? null},
      ${body.phone ?? null}
    )
    RETURNING id, display_name, kind, contact_email, phone, is_active
  `;
    await audit({
        locationId,
        actor: user,
        action: 'provider.created',
        entityType: 'provider',
        entityId: provider.id,
    });
    return json({ provider }, { status: 201 });
});
//# sourceMappingURL=index.mjs.map