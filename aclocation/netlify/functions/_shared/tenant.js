import { db } from './db.js';
import { HttpError } from './auth.js';
/**
 * Resolve the active tenant (location) for a request.
 *
 * Strategy:
 *   1. `x-aclocation-id` header set by the SPA after the user picks a location.
 *   2. `app_metadata.default_location_id` set during identity-signup.
 *   3. Reject if neither is present and the route requires tenancy.
 *
 * Membership is enforced by checking `location_members` (created in the
 * tenancy migration). Super-admins bypass the membership check.
 */
export async function resolveTenant(req, user) {
    const headerId = req.headers.get('x-aclocation-id');
    const metaId = user.appMetadata.default_location_id || null;
    const candidate = headerId || metaId;
    if (!candidate)
        throw new HttpError(400, 'no_location_selected');
    // master_admin (platform sysadmin) and super_admin bypass membership.
    if (user.roles.includes('master_admin') || user.roles.includes('super_admin'))
        return candidate;
    const rows = await db()
        .sql `SELECT 1 FROM location_members WHERE location_id = ${candidate} AND user_id = ${user.id} LIMIT 1`;
    if (rows.length === 0)
        throw new HttpError(403, 'not_a_member_of_location');
    return candidate;
}
//# sourceMappingURL=tenant.js.map