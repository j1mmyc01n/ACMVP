export type AuthedUser = {
    id: string;
    email: string;
    roles: string[];
    appMetadata: Record<string, unknown>;
    userMetadata: Record<string, unknown>;
};
/**
 * Resolve the caller's Identity user. Returns null when no valid session
 * cookie or bearer token is present.
 */
export declare function currentUser(): Promise<AuthedUser | null>;
export declare function requireUser(): Promise<AuthedUser>;
/**
 * Role hierarchy (highest to lowest):
 *   master_admin  : platform sysadmin — implicitly satisfies every role gate
 *                   below. Sees and controls everything across all locations.
 *   super_admin   : a single location's senior administrator. Higher
 *                   visibility than admin within their tenant.
 *   admin         : day-to-day administrator within a single location.
 *   member        : standard staff user within a single location.
 */
export declare const ROLES: readonly ["member", "admin", "super_admin", "master_admin"];
export type Role = (typeof ROLES)[number];
export declare function isMaster(user: AuthedUser): boolean;
export declare function requireRole(role: string | string[]): Promise<AuthedUser>;
export declare function requireMaster(): Promise<AuthedUser>;
export declare class HttpError extends Error {
    status: number;
    details?: unknown | undefined;
    constructor(status: number, message: string, details?: unknown | undefined);
}
//# sourceMappingURL=auth.d.ts.map