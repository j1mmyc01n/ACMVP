import type { UserRole } from '@acmvp/types';
export declare function getRoleLevel(role: UserRole): number;
export declare function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean;
/**
 * Derive role from a staff email using the VALID_STAFF config map.
 * Returns null if the email is not a known staff address.
 */
export declare function getRoleFromEmail(email: string): UserRole | null;
export declare function isAdminRole(role: UserRole): boolean;
export declare function isSysadminRole(role: UserRole): boolean;
export declare function hasPermission(role: UserRole, action: string): boolean;
//# sourceMappingURL=roles.d.ts.map