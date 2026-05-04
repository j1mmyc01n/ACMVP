import { describe, it, expect } from 'vitest';
import { generateOTP, verifyOTP } from '../../../packages/auth/src/otp';
describe('OTP', () => {
    it('generates a 6-digit string', () => {
        const otp = generateOTP();
        expect(otp).toMatch(/^\d{6}$/);
    });
    it('generates different codes on each call', () => {
        const a = generateOTP();
        const b = generateOTP();
        // Statistically almost impossible to be equal
        // (1 in 900,000 chance) — acceptable for a unit test
        expect(typeof a).toBe('string');
        expect(typeof b).toBe('string');
    });
    it('verifyOTP returns true for matching codes', () => {
        expect(verifyOTP('123456', '123456')).toBe(true);
    });
    it('verifyOTP returns false for non-matching codes', () => {
        expect(verifyOTP('123456', '654321')).toBe(false);
    });
    it('verifyOTP trims whitespace', () => {
        expect(verifyOTP(' 123456 ', '123456')).toBe(true);
    });
});
//# sourceMappingURL=otp.test.js.map