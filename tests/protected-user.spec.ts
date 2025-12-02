import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

// Prepare storage state for john@foo.com if missing
test.beforeAll(async () => {
  const sessionsDir = path.join(__dirname, 'playwright-auth-sessions');
  const storagePath = path.join(sessionsDir, 'john-storage.json');

  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

  if (!fs.existsSync(storagePath)) {
    console.log('john storage state not found; generating with Chromium...');
    const authEmail = process.env.TEST_USER_EMAIL || 'john@foo.com';
    const authPassword = process.env.TEST_USER_PASSWORD || 'changeme';
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

    await context.storageState({ path: storagePath });
    await context.close();
    await browser.close();
    console.log('Saved john storage state to', storagePath);
  }
});

const routes = ['/my-recipes', '/favorites', '/profile'];

for (const route of routes) {
  test(`user loads ${route}`, async ({ browser, baseURL }) => {
    const baseUrl = baseURL ?? 'http://127.0.0.1:3000';
    const storagePath = path.join(__dirname, 'playwright-auth-sessions', 'john-storage.json');

    // Use authenticated context
    const context = await browser.newContext({ storageState: storagePath });
    const page = await context.newPage();

    const url = `${baseUrl}${route}`;
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    expect(response && response.ok(), `non-ok response for ${url}: ${response?.status()}`).toBeTruthy();

    const main = page.locator('main, h1, [data-testid="page-root"]');
    await expect(main.first(), `no main/h1 visible for ${url}`).toBeVisible({ timeout: 5000 });

    await context.close();
  });
}
