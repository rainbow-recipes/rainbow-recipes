import { test, expect } from '@playwright/test';
import { createAuthContext, ensureAuthStorage, getBaseUrl } from './auth-utils';

const baseUrl = getBaseUrl();
let userStoragePath: string;

// Prepare storage state for john@foo.com if missing
test.beforeAll(async () => {
  userStoragePath = await ensureAuthStorage({
    storageName: 'john-storage.json',
    envEmailVar: 'TEST_USER_EMAIL',
    envPasswordVar: 'TEST_USER_PASSWORD',
    defaultEmail: 'john@foo.com',
    defaultPassword: 'changeme',
    baseUrl,
    validateSession: true,
    callbackUrl: '/recipes',
  });
});

const routes = ['/favorites', '/profile', '/recipes/add', '/recipes/my-recipes'];

routes.forEach((route) => {
  test(`user loads ${route}`, async ({ browser, baseURL }) => {
    const urlBase = baseURL ?? getBaseUrl();
    const context = await createAuthContext(browser, userStoragePath);
    const page = await context.newPage();

    const url = `${urlBase}${route}`;
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    expect(response && response.ok(), `non-ok response for ${url}: ${response?.status()}`).toBeTruthy();

    const main = page.locator('main, h1, [data-testid="page-root"]');
    await expect(main.first(), `no main/h1 visible for ${url}`).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
