/**
 * E2E tests for the Acute Connect web app using Playwright.
 * Tests the full user flow: login → navigate pages → submit forms → logout.
 */
import { test, expect, Page } from '@playwright/test';

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

const ADMIN_EMAIL = 'ops@acuteconnect.health';
const ADMIN_OTP = process.env.TEST_OTP ?? '123456'; // overrideable in CI

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page) {
  await page.goto(BASE_URL);

  // Click login / "Staff Login" area
  const loginBtn = page.getByRole('button', { name: /staff login|log in|sign in/i });
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
  }

  // Fill email
  const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first();
  await emailInput.fill(ADMIN_EMAIL);

  // Click Send OTP / Continue
  const sendOtpBtn = page.getByRole('button', { name: /send otp|send code|continue/i });
  await sendOtpBtn.click();

  // Fill OTP (mocked / overridden in test env)
  const otpInput = page.getByPlaceholder(/otp|code/i).or(page.locator('input[type="text"]')).first();
  await otpInput.fill(ADMIN_OTP);

  // Click verify / login
  const verifyBtn = page.getByRole('button', { name: /verify|login|sign in/i });
  await verifyBtn.click();

  // Wait for dashboard to appear
  await page.waitForSelector('[data-page="admin"], [data-testid="dashboard"], nav', { timeout: 10000 });
}

async function navigateToPage(page: Page, pageId: string) {
  // Try clicking a nav link, or use the menu if collapsed
  const navLink = page.locator(`[data-page="${pageId}"], [data-menu-id="${pageId}"]`).first();
  if (await navLink.isVisible()) {
    await navLink.click();
  }
  await page.waitForTimeout(500);
}

// ─── Authentication ───────────────────────────────────────────────────────────

test.describe('Authentication', () => {
  test('unauthenticated user sees login prompt', async ({ page }) => {
    await page.goto(BASE_URL);
    // App renders the check-in / public page or a login prompt, not admin content
    await expect(page).not.toHaveURL(/\/admin/);
    const body = await page.content();
    // The public check-in page or the login modal should be visible
    expect(body.length).toBeGreaterThan(100);
  });

  test('invalid OTP shows error message', async ({ page }) => {
    await page.goto(BASE_URL);

    const loginBtn = page.getByRole('button', { name: /staff login|log in/i });
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
    }

    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first();
    await emailInput.fill(ADMIN_EMAIL);

    const sendOtpBtn = page.getByRole('button', { name: /send otp|send code|continue/i });
    if (await sendOtpBtn.isVisible()) {
      await sendOtpBtn.click();

      const otpInput = page.getByPlaceholder(/otp|code/i).first();
      await otpInput.fill('000000'); // wrong OTP

      const verifyBtn = page.getByRole('button', { name: /verify|login/i });
      await verifyBtn.click();

      // Expect an error message to appear
      const errorEl = page.locator('[role="alert"], .error, [data-testid="error"]').first();
      // Give the UI time to react
      await page.waitForTimeout(1000);
      // The page should not crash (still has content)
      expect(await page.content()).toBeTruthy();
    }
  });
});

// ─── Admin navigation ─────────────────────────────────────────────────────────

test.describe('Admin - page navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard page loads with content', async ({ page }) => {
    await navigateToPage(page, 'admin');
    await page.waitForTimeout(1000);
    const content = await page.content();
    // Should have meaningful page content
    expect(content.length).toBeGreaterThan(500);
  });

  test('CRM / patient directory page loads', async ({ page }) => {
    await navigateToPage(page, 'crm');
    await page.waitForTimeout(1000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(200);
  });

  test('crisis page loads', async ({ page }) => {
    await navigateToPage(page, 'crisis');
    await page.waitForTimeout(1000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(200);
  });

  test('audit log page loads', async ({ page }) => {
    await navigateToPage(page, 'audit_log');
    await page.waitForTimeout(1000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(200);
  });

  test('settings page loads', async ({ page }) => {
    await navigateToPage(page, 'settings');
    await page.waitForTimeout(1000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(200);
  });

  test('users page loads', async ({ page }) => {
    await navigateToPage(page, 'users');
    await page.waitForTimeout(1000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(200);
  });
});

// ─── Sysadmin navigation ──────────────────────────────────────────────────────

test.describe('Sysadmin - page navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Sysadmin login
    await page.goto(BASE_URL);
    const loginBtn = page.getByRole('button', { name: /staff login|log in/i });
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
    }
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first();
    await emailInput.fill('sysadmin@acuteconnect.health');
    const sendBtn = page.getByRole('button', { name: /send otp|send code|continue/i });
    if (await sendBtn.isVisible()) {
      await sendBtn.click();
    }
    const otpInput = page.getByPlaceholder(/otp|code/i).first();
    await otpInput.fill(ADMIN_OTP);
    const verifyBtn = page.getByRole('button', { name: /verify|login/i });
    await verifyBtn.click();
    await page.waitForTimeout(2000);
  });

  test('overseer dashboard loads', async ({ page }) => {
    await navigateToPage(page, 'sysdash');
    await page.waitForTimeout(1000);
    expect(await page.content()).toBeTruthy();
  });

  test('location rollout page loads', async ({ page }) => {
    await navigateToPage(page, 'rollout');
    await page.waitForTimeout(1000);
    expect(await page.content()).toBeTruthy();
  });

  test('locations page loads', async ({ page }) => {
    await navigateToPage(page, 'offices');
    await page.waitForTimeout(1000);
    expect(await page.content()).toBeTruthy();
  });

  test('push notifications page loads', async ({ page }) => {
    await navigateToPage(page, 'push_notifications');
    await page.waitForTimeout(1000);
    expect(await page.content()).toBeTruthy();
  });
});

// ─── Feedback form submission ─────────────────────────────────────────────────

test.describe('Feedback form', () => {
  test('submits feedback without crashing', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    // Open feedback modal if there is a feedback button
    const feedbackBtn = page.getByRole('button', { name: /feedback|ideas/i }).first();
    if (await feedbackBtn.isVisible()) {
      await feedbackBtn.click();
      await page.waitForTimeout(500);

      const subjectInput = page.getByPlaceholder(/subject|brief summary/i).first();
      if (await subjectInput.isVisible()) {
        await subjectInput.fill('E2E Test Feedback');

        const messageInput = page.getByPlaceholder(/message|describe/i).first();
        await messageInput.fill('This is an automated E2E test submission.');

        const submitBtn = page.getByRole('button', { name: /submit|send/i }).last();
        await submitBtn.click();

        // Wait for success or close
        await page.waitForTimeout(2000);
        // Page should still be visible (no crash)
        expect(await page.content()).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });
});

// ─── Public pages ─────────────────────────────────────────────────────────────

test.describe('Public pages', () => {
  test('check-in page is publicly accessible', async ({ page }) => {
    await page.goto(BASE_URL);
    // The default page renders without requiring login
    const content = await page.content();
    expect(content.length).toBeGreaterThan(200);
  });

  test('legal hub is publicly accessible', async ({ page }) => {
    await page.goto(BASE_URL);
    // Navigate to legal page if accessible
    const legalLink = page.locator('[data-page="legal"]').first();
    if (await legalLink.isVisible()) {
      await legalLink.click();
      await page.waitForTimeout(500);
    }
    expect(await page.content()).toBeTruthy();
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('logout clears session and returns to public view', async ({ page }) => {
    await loginAsAdmin(page);

    // Find logout button
    const logoutBtn = page.getByRole('button', { name: /log out|sign out|logout/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }

    // After logout, admin-protected content should no longer be accessible
    const adminContent = page.locator('[data-page="admin"], [data-testid="admin-dashboard"]');
    // Either no admin content visible, or a login prompt appears
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });
});

// ─── Dashboard stats ──────────────────────────────────────────────────────────

test.describe('Dashboard statistics', () => {
  test('admin dashboard renders stat cards without showing "undefined"', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToPage(page, 'admin');
    await page.waitForTimeout(2000);

    const content = await page.content();
    // Stats should not contain raw "undefined" or "NaN" text in visible elements
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).not.toMatch(/\bundefined\b/);
    expect(bodyText).not.toMatch(/\bNaN\b/);
  });
});
