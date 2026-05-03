import { describe, it, expect } from 'vitest';
import {
  getRoleLevel,
  hasMinimumRole,
  isAdminRole,
  isSysadminRole,
  hasPermission,
  getRoleFromEmail,
} from '../../../packages/auth/src/roles';

describe('roles', () => {
  it('sysadmin has higher level than admin', () => {
    expect(getRoleLevel('sysadmin')).toBeGreaterThan(getRoleLevel('admin'));
  });

  it('hasMinimumRole — admin satisfies staff minimum', () => {
    expect(hasMinimumRole('admin', 'staff')).toBe(true);
  });

  it('hasMinimumRole — user does not satisfy admin minimum', () => {
    expect(hasMinimumRole('user', 'admin')).toBe(false);
  });

  it('isAdminRole — sysadmin is admin role', () => {
    expect(isAdminRole('sysadmin')).toBe(true);
  });

  it('isAdminRole — client is not admin role', () => {
    expect(isAdminRole('client')).toBe(false);
  });

  it('isSysadminRole — super_admin is sysadmin-level', () => {
    expect(isSysadminRole('super_admin')).toBe(true);
  });

  it('hasPermission — sysadmin can manage users', () => {
    expect(hasPermission('sysadmin', 'manage:users')).toBe(true);
  });

  it('hasPermission — admin cannot manage users', () => {
    expect(hasPermission('admin', 'manage:users')).toBe(false);
  });

  it('getRoleFromEmail — known staff email returns role', () => {
    expect(getRoleFromEmail('ops@acuteconnect.health')).toBe('admin');
  });

  it('getRoleFromEmail — unknown email returns null', () => {
    expect(getRoleFromEmail('unknown@example.com')).toBeNull();
  });
});
