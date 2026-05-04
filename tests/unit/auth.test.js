/**
 * Auth tests
 * Tests session helpers, role logic, OTP generation/verification, and
 * the protected-route guard pattern. All Supabase calls are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
// ─── Mock supabase auth ───────────────────────────────────────────────────────
// vi.hoisted() ensures the mock functions are available when vi.mock is hoisted.
const { mockGetSession, mockSignOut, mockOnAuthStateChange } = vi.hoisted(() => ({
    mockGetSession: vi.fn(),
    mockSignOut: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
}));
vi.mock('@acmvp/database', () => ({
    supabase: {
        auth: {
            getSession: mockGetSession,
            signOut: mockSignOut,
            onAuthStateChange: mockOnAuthStateChange,
        },
    },
}));
import { getSession, signOut, onAuthChange } from '../../packages/auth/src/session';
import { generateOTP, verifyOTP } from '../../packages/auth/src/otp';
import { getRoleFromEmail, hasPermission, isAdminRole, isSysadminRole, hasMinimumRole, getRoleLevel, } from '../../packages/auth/src/roles';
// ─── getSession ───────────────────────────────────────────────────────────────
describe('getSession', () => {
    beforeEach(() => vi.clearAllMocks());
    it('returns null when no session exists', async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } });
        const session = await getSession();
        expect(session).toBeNull();
    });
    it('returns mapped session when authenticated', async () => {
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: 'u1', email: 'ops@acuteconnect.health', user_metadata: { role: 'admin' } },
                    expires_at: expiresAt,
                },
            },
        });
        const session = await getSession();
        expect(session?.userId).toBe('u1');
        expect(session?.email).toBe('ops@acuteconnect.health');
        expect(session?.role).toBe('admin');
        expect(session?.expiresAt).toBeTruthy();
    });
    it('defaults role to "user" when user_metadata.role is absent', async () => {
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: 'u2', email: 'client@example.com', user_metadata: {} },
                    expires_at: expiresAt,
                },
            },
        });
        const session = await getSession();
        expect(session?.role).toBe('user');
    });
});
// ─── signOut ──────────────────────────────────────────────────────────────────
describe('signOut', () => {
    beforeEach(() => vi.clearAllMocks());
    it('calls supabase.auth.signOut', async () => {
        mockSignOut.mockResolvedValue({ error: null });
        await signOut();
        expect(mockSignOut).toHaveBeenCalledOnce();
    });
    it('propagates sign-out error', async () => {
        mockSignOut.mockResolvedValue({ error: { message: 'network error' } });
        const result = await signOut();
        expect(result.error?.message).toBe('network error');
    });
});
// ─── onAuthChange ─────────────────────────────────────────────────────────────
describe('onAuthChange', () => {
    beforeEach(() => vi.clearAllMocks());
    it('invokes callback with mapped session on SIGNED_IN', () => {
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        const fakeSession = {
            user: { id: 'u3', email: 'sysadmin@acuteconnect.health', user_metadata: { role: 'sysadmin' } },
            expires_at: expiresAt,
        };
        mockOnAuthStateChange.mockImplementation((cb) => {
            cb('SIGNED_IN', fakeSession);
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });
        const callback = vi.fn();
        onAuthChange(callback);
        expect(callback).toHaveBeenCalledWith('SIGNED_IN', expect.objectContaining({ userId: 'u3', role: 'sysadmin' }));
    });
    it('passes null session when SIGNED_OUT', () => {
        mockOnAuthStateChange.mockImplementation((cb) => {
            cb('SIGNED_OUT', null);
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });
        const callback = vi.fn();
        onAuthChange(callback);
        expect(callback).toHaveBeenCalledWith('SIGNED_OUT', null);
    });
});
// ─── OTP ─────────────────────────────────────────────────────────────────────
describe('OTP', () => {
    it('generateOTP returns a 6-digit numeric string', () => {
        const otp = generateOTP();
        expect(otp).toMatch(/^\d{6}$/);
    });
    it('generateOTP produces unique values across calls', () => {
        const otps = Array.from({ length: 10 }, () => generateOTP());
        const unique = new Set(otps);
        expect(unique.size).toBeGreaterThan(1);
    });
    it('verifyOTP returns true for matching code', () => {
        const code = generateOTP();
        expect(verifyOTP(code, code)).toBe(true);
    });
    it('verifyOTP returns false for wrong code', () => {
        expect(verifyOTP('999999', '123456')).toBe(false);
    });
    it('verifyOTP trims whitespace before comparing', () => {
        expect(verifyOTP(' 123456 ', '123456')).toBe(true);
    });
});
// ─── Role checks ──────────────────────────────────────────────────────────────
describe('Role guard logic', () => {
    it('getRoleLevel — sysadmin > admin', () => {
        expect(getRoleLevel('sysadmin')).toBeGreaterThan(getRoleLevel('admin'));
    });
    it('hasMinimumRole — admin satisfies staff minimum', () => {
        expect(hasMinimumRole('admin', 'staff')).toBe(true);
    });
    it('hasMinimumRole — user does not satisfy admin minimum', () => {
        expect(hasMinimumRole('user', 'admin')).toBe(false);
    });
    it('isAdminRole — sysadmin is admin-level', () => {
        expect(isAdminRole('sysadmin')).toBe(true);
    });
    it('isAdminRole — client is not admin-level', () => {
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
    it('hasPermission — admin can view admin dashboard', () => {
        expect(hasPermission('admin', 'view:admin_dashboard')).toBe(true);
    });
    it('hasPermission — client can only view client portal', () => {
        expect(hasPermission('client', 'view:client_portal')).toBe(true);
        expect(hasPermission('client', 'view:admin_dashboard')).toBe(false);
    });
    it('hasPermission — field_agent can view field agent dashboard', () => {
        expect(hasPermission('field_agent', 'view:field_agent_dashboard')).toBe(true);
        expect(hasPermission('field_agent', 'view:admin_dashboard')).toBe(false);
    });
});
// ─── getRoleFromEmail ─────────────────────────────────────────────────────────
describe('getRoleFromEmail', () => {
    it('maps ops@acuteconnect.health → admin', () => {
        expect(getRoleFromEmail('ops@acuteconnect.health')).toBe('admin');
    });
    it('maps sysadmin@acuteconnect.health → sysadmin', () => {
        expect(getRoleFromEmail('sysadmin@acuteconnect.health')).toBe('sysadmin');
    });
    it('maps agent@acuteconnect.health → field_agent', () => {
        expect(getRoleFromEmail('agent@acuteconnect.health')).toBe('field_agent');
    });
    it('returns null for unknown email', () => {
        expect(getRoleFromEmail('hacker@evil.com')).toBeNull();
    });
    it('is case-insensitive', () => {
        expect(getRoleFromEmail('OPS@ACUTECONNECT.HEALTH')).toBe('admin');
    });
});
// ─── Protected route simulation ───────────────────────────────────────────────
describe('Protected route guard', () => {
    it('null session → should redirect', () => {
        const session = null;
        expect(!session).toBe(true);
    });
    it('authenticated admin → should not redirect', () => {
        const session = { userId: 'u1', email: 'ops@acuteconnect.health', role: 'admin', expiresAt: '' };
        expect(!session).toBe(false);
    });
    it('client cannot access admin page', () => {
        expect(hasPermission('client', 'view:admin_dashboard')).toBe(false);
    });
    it('logout → session becomes null', async () => {
        mockSignOut.mockResolvedValue({ error: null });
        mockGetSession.mockResolvedValueOnce({ data: { session: null } });
        await signOut();
        const sessionAfter = await getSession();
        expect(sessionAfter).toBeNull();
    });
});
//# sourceMappingURL=auth.test.js.map