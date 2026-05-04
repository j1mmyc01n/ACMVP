// POST /.netlify/functions/locations-invite
//
// Issue an invite for a new user. The recipient signs up via the standard
// Identity flow with the returned token in `user_metadata.invite_token` and
// the identity-signup hook redeems it: binding them to the right location
// with the right role.
//
// Authorisation:
//   - master_admin can invite anyone with any role, into any location.
//   - super_admin can invite member/admin into THEIR location only.
import { handler, json, readJson } from '../_shared/response.js';
import { requireUser, HttpError } from '../_shared/auth.js';
import { db } from '../_shared/db.js';
import { audit } from '../_shared/audit.js';
export default handler(async (req) => {
    const actor = await requireUser();
    const body = await readJson(req);
    if (!body.email || !body.role)
        throw new HttpError(422, 'email_and_role_required');
    const isMaster = actor.roles.includes('master_admin');
    const isSuper = actor.roles.includes('super_admin');
    if (!isMaster && !isSuper)
        throw new HttpError(403, 'forbidden');
    if (!isMaster && (body.role === 'master_admin' || body.role === 'super_admin')) {
        throw new HttpError(403, 'cannot_invite_at_or_above_your_role');
    }
    let locationId = body.locationId ?? null;
    if (!isMaster) {
        // super_admin must invite into their default/active location, and they
        // must already be a member of it.
        locationId = locationId ?? actor.appMetadata.default_location_id;
        if (!locationId)
            throw new HttpError(400, 'no_target_location');
        const member = await db()
            .sql `SELECT 1 FROM location_members WHERE location_id = ${locationId} AND user_id = ${actor.id} LIMIT 1`;
        if (member.length === 0)
            throw new HttpError(403, 'not_a_member_of_target_location');
    }
    const token = cryptoToken();
    const [invite] = await db().sql `
    INSERT INTO location_invites (location_id, email, role, token, invited_by)
    VALUES (${locationId}, ${body.email.toLowerCase()}, ${body.role}, ${token}, ${actor.id})
    RETURNING id, email, role, location_id, expires_at
  `;
    await audit({
        locationId,
        actor,
        action: 'invite.issued',
        entityType: 'location_invite',
        entityId: invite.id,
        metadata: { role: body.role, email: body.email },
    });
    return json({ invite: { ...invite, token } }, { status: 201 });
});
function cryptoToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
//# sourceMappingURL=index.mjs.map