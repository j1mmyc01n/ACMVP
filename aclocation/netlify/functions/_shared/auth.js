import { getUser } from '@netlify/identity';
/**
 * Resolve the caller's Identity user. Returns null when no valid session
 * cookie or bearer token is present.
 */
export async function currentUser() {
    const user = await getUser();
    if (!user)
        return null;
    const appMeta = (user.app_metadata ?? {});
    const roles = Array.isArray(appMeta.roles) ? appMeta.roles : [];
    return {
        id: user.id,
        email: user.email ?? '',
        roles,
        appMetadata: appMeta,
        userMetadata: (user.user_metadata ?? {}),
    };
}
export async function requireUser() {
    const user = await currentUser();
    if (!user)
        throw new HttpError(401, 'unauthorised');
    return user;
}
/**
 * Role hierarchy (highest to lowest):
 *   master_admin  : platform sysadmin — implicitly satisfies every role gate
 *                   below. Sees and controls everything across all locations.
 *   super_admin   : a single location's senior administrator. Higher
 *                   visibility than admin within their tenant.
 *   admin         : day-to-day administrator within a single location.
 *   member        : standard staff user within a single location.
 */
export const ROLES = ['member', 'admin', 'super_admin', 'master_admin'];
export function isMaster(user) {
    return user.roles.includes('master_admin');
}
export async function requireRole(role) {
    const user = await requireUser();
    const allowed = Array.isArray(role) ? role : [role];
    // master_admin implicitly satisfies any role gate.
    if (user.roles.includes('master_admin'))
        return user;
    if (!user.roles.some((r) => allowed.includes(r))) {
        throw new HttpError(403, 'forbidden');
    }
    return user;
}
export async function requireMaster() {
    const user = await requireUser();
    if (!user.roles.includes('master_admin')) {
        throw new HttpError(403, 'master_admin_only');
    }
    return user;
}
export class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}
//# sourceMappingURL=auth.js.map