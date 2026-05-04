// Identity signup hook.
//
// Flow:
//   1. The very first user across the platform is auto-promoted to
//      `master_admin` (the platform sysadmin) so the system is bootstrappable.
//   2. Every subsequent signup MUST present a valid invite token in
//      `user_metadata.invite_token`. Open public signup is disabled.
//   3. On successful invite redemption, the new user is bound to the invite's
//      location with the invite's role.
//
// Identity event functions use the legacy named `handler` export, not a
// default export, because the runtime delivers the user payload in
// `event.body`.
import { db } from '../_shared/db.js';
const handler = async (event) => {
    try {
        const payload = JSON.parse(event.body || '{}');
        const user = payload.user;
        if (!user)
            return { statusCode: 200, body: JSON.stringify({}) };
        // Bootstrap path: first user across the platform becomes master_admin.
        const [{ count }] = (await db()
            .sql `SELECT COUNT(*)::int AS count FROM location_members`);
        const isBootstrap = count === 0;
        if (isBootstrap) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    app_metadata: {
                        ...(user.app_metadata ?? {}),
                        roles: ['master_admin'],
                        default_location_id: null,
                    },
                }),
            };
        }
        // Non-bootstrap: an invite token is required.
        const inviteToken = user.user_metadata?.invite_token;
        if (!inviteToken) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    error: 'invite_required',
                    message: 'Public signup is disabled. Ask the platform administrator for an invite.',
                }),
            };
        }
        const [invite] = await db().sql `
      SELECT id, location_id, role, status, expires_at, LOWER(email) AS email
      FROM location_invites
      WHERE token = ${inviteToken}
      LIMIT 1
    `;
        if (!invite || invite.status !== 'pending') {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'invite_invalid' }),
            };
        }
        if (new Date(invite.expires_at) < new Date()) {
            await db().sql `UPDATE location_invites SET status = 'expired' WHERE id = ${invite.id}`;
            return { statusCode: 403, body: JSON.stringify({ error: 'invite_expired' }) };
        }
        if (invite.email && invite.email !== (user.email ?? '').toLowerCase()) {
            return { statusCode: 403, body: JSON.stringify({ error: 'invite_email_mismatch' }) };
        }
        if (invite.location_id) {
            await db().sql `
        INSERT INTO location_members (location_id, user_id, role, invited_by)
        VALUES (${invite.location_id}, ${user.id}, ${invite.role}, NULL)
        ON CONFLICT (location_id, user_id) DO UPDATE SET role = EXCLUDED.role
      `;
        }
        await db().sql `
      UPDATE location_invites
      SET status = 'accepted', accepted_by = ${user.id}, accepted_at = NOW()
      WHERE id = ${invite.id}
    `;
        return {
            statusCode: 200,
            body: JSON.stringify({
                app_metadata: {
                    ...(user.app_metadata ?? {}),
                    roles: [invite.role],
                    default_location_id: invite.location_id,
                },
            }),
        };
    }
    catch (err) {
        console.error('[identity-signup]', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'signup_hook_failed' }) };
    }
};
export { handler };
//# sourceMappingURL=index.mjs.map