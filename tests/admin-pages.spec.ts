import { test, expect } from '@playwright/test';
import { createAuthContext, ensureAuthStorage, getBaseUrl } from './auth-utils';

const baseUrl = getBaseUrl();
let adminStoragePath: string;

test.beforeAll(async () => {
  adminStoragePath = await ensureAuthStorage({
    storageName: 'admin-storage.json',
    envEmailVar: 'TEST_ADMIN_EMAIL',
    envPasswordVar: 'TEST_ADMIN_PASSWORD',
    defaultEmail: 'admin@foo.com',
    defaultPassword: 'changeme',
    baseUrl,
    validateSession: true,
    callbackUrl: '/recipes',
  });
});

test('protected: /admin loads for admin user', async ({ browser, baseURL }) => {
  const urlBase = baseURL ?? getBaseUrl();

  const context = await createAuthContext(browser, adminStoragePath);
  const page = await context.newPage();

  const response = await page.goto(`${urlBase}/admin`, {
    waitUntil: 'load',
    timeout: 60000,
  });
  expect(response && response.ok(), `non-ok response for /admin: ${response?.status()}`).toBeTruthy();

  const main = page.locator('main, h1');
  await expect(main.first()).toBeVisible({ timeout: 5000 });

  await context.close();
});
