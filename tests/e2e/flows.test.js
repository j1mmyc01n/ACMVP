// E2E test skeleton — Playwright.
// Run: npx playwright test
import { test, expect } from '@playwright/test';
test.describe('Login flow', () => {
    test('TODO: staff can log in with OTP', async ({ page }) => {
        // await page.goto('/');
        // await page.click('[data-testid="login-button"]');
        // await page.fill('[type="email"]', 'ops@acuteconnect.health');
        // await page.click('[data-testid="send-otp"]');
        // const otp = ... // read OTP from DB or email mock
        // await page.fill('[data-testid="otp-input"]', otp);
        // await page.click('[data-testid="verify-otp"]');
        // await expect(page).toHaveURL(/admin/);
        expect(true).toBe(true); // placeholder
    });
});
test.describe('Check-in flow', () => {
    test('TODO: client can submit a check-in with valid CRN', async ({ page }) => {
        // await page.goto('/checkin');
        // await page.fill('[data-testid="crn-input"]', 'CRN-TEST-0001');
        // await page.click('[data-testid="checkin-submit"]');
        // await expect(page.locator('[data-testid="checkin-success"]')).toBeVisible();
        expect(true).toBe(true); // placeholder
    });
});
test.describe('CRN request flow', () => {
    test('TODO: client can request a CRN', async ({ page }) => {
        expect(true).toBe(true); // placeholder
    });
});
//# sourceMappingURL=flows.test.js.map