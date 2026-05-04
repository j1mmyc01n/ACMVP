// POST /.netlify/functions/check-ins-create
import { handler, json, readJson } from '../_shared/response.js';
import { requireUser, HttpError } from '../_shared/auth.js';
import { resolveTenant } from '../_shared/tenant.js';
import { audit } from '../_shared/audit.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    const user = await requireUser();
    const locationId = await resolveTenant(req, user);
    const body = await readJson(req);
    if (!body.clientId)
        throw new HttpError(422, 'clientId_required');
    const [row] = await db().sql `
    INSERT INTO check_ins (location_id, client_id, recorded_by, template, triage_level, notes)
    VALUES (
      ${locationId},
      ${body.clientId},
      ${user.id},
      ${body.template ?? 'standard'},
      ${body.triageLevel ?? null},
      ${JSON.stringify(body.notes ?? {})}::jsonb
    )
    RETURNING id, occurred_at
  `;
    await audit({
        locationId,
        actor: user,
        action: 'check_in.recorded',
        entityType: 'check_in',
        entityId: row.id,
        metadata: { clientId: body.clientId, triageLevel: body.triageLevel ?? null },
    });
    return json({ checkIn: row }, { status: 201 });
});
//# sourceMappingURL=index.mjs.map