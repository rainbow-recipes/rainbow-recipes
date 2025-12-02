import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';

test.beforeAll(async () => {
  // The test assumes both the vendor user and their store already exist.
  // Do not create or upsert users/stores here.

  // Ensure storage state exists for the vendor sign-in and create it if missing
  const sessionsDir = path.join(__dirname, 'playwright-auth-sessions');
  const storagePath = path.join(sessionsDir, 'vendor-storage.json');

  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

  if (!fs.existsSync(storagePath)) {
    console.log('Storage state not found; generating vendor storage state using Chromium...');
    const authEmail = process.env.TEST_VENDOR_EMAIL || 'vendor@foo.com';
    const authPassword = process.env.TEST_VENDOR_PASSWORD || 'changeme';
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${baseUrl}/signin?callbackUrl=/recipes`);
    await page.fill('input[type="email"]', authEmail);
    await page.fill('input[type="password"]', authPassword);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      page.click('button:has-text("Sign in")'),
    ]);

    // Save storage state for reuse across browsers
    await context.storageState({ path: storagePath });
    await context.close();
    await browser.close();
    console.log('Saved vendor storage state to', storagePath);
  }
});

test('protected: /my-store loads for vendor user', async ({ browser, baseURL }) => {
  const baseUrl = baseURL ?? 'http://127.0.0.1:3000';

  // Reuse the generated storage state for authenticated vendor session
  const storagePath = path.join(__dirname, 'playwright-auth-sessions', 'vendor-storage.json');
  const context = await browser.newContext({ storageState: storagePath });
  const page = await context.newPage();

  // Navigate directly to /my-store using the authenticated context
  const response = await page.goto(`${baseUrl}/my-store`, { waitUntil: 'networkidle' });
  expect(response && response.ok(), `non-ok response for /my-store: ${response?.status()}`).toBeTruthy();

  const main = page.locator('main, h1');
  await expect(main.first()).toBeVisible({ timeout: 5000 });

  await context.close();
});
