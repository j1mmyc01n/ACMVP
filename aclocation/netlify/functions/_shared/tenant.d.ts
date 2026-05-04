import type { AuthedUser } from './auth.js';
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
export declare function resolveTenant(req: Request, user: AuthedUser): Promise<string>;
//# sourceMappingURL=tenant.d.ts.map