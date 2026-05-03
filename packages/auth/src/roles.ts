import type { UserRole } from '@acmvp/types';
import { VALID_STAFF } from '@acmvp/config';

// Role hierarchy (higher index = higher privilege)
const ROLE_HIERARCHY: UserRole[] = [
  'user',
  'client',
  'field_agent',
  'staff',
  'admin',
  'super_admin',
  'sysadmin',
];

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(minimumRole);
}

/**
 * Derive role from a staff email using the VALID_STAFF config map.
 * Returns null if the email is not a known staff address.
 */
export function getRoleFromEmail(email: string): UserRole | null {
  const role = VALID_STAFF[email.toLowerCase()];
  return (role as UserRole) ?? null;
}

export function isAdminRole(role: UserRole): boolean {
  return ['admin', 'super_admin', 'sysadmin'].includes(role);
}

export function isSysadminRole(role: UserRole): boolean {
  return role === 'sysadmin' || role === 'super_admin';
}

export function hasPermission(role: UserRole, action: string): boolean {
  const rules: Record<string, UserRole[]> = {
    'view:admin_dashboard': ['admin', 'super_admin', 'sysadmin'],
    'view:system_dashboard': ['sysadmin', 'super_admin'],
    'manage:users': ['sysadmin', 'super_admin'],
    'manage:locations': ['sysadmin', 'super_admin'],
    'view:client_portal': ['client'],
    'view:field_agent_dashboard': ['field_agent', 'sysadmin'],
  };
  return rules[action]?.includes(role) ?? false;
}
