import { test, expect } from '@playwright/test';
import { createAuthContext, ensureAuthStorage, getBaseUrl } from './auth-utils';

const baseUrl = getBaseUrl();
let vendorStoragePath: string;

test.beforeAll(async () => {
  vendorStoragePath = await ensureAuthStorage({
    storageName: 'vendor-storage.json',
    envEmailVar: 'TEST_VENDOR_EMAIL',
    envPasswordVar: 'TEST_VENDOR_PASSWORD',
    defaultEmail: 'vendor@foo.com',
    defaultPassword: 'changeme',
    baseUrl,
    validateSession: true,
    callbackUrl: '/recipes',
  });
});

test('protected: /my-store loads for vendor user', async ({ browser, baseURL }) => {
  const urlBase = baseURL ?? getBaseUrl();

  // Reuse the generated storage state for authenticated vendor session
  const context = await createAuthContext(browser, vendorStoragePath);
  const page = await context.newPage();

  // Navigate directly to /my-store using the authenticated context
  // Use 'load' instead of 'networkidle' to avoid hanging on long-lived requests
  // and increase timeout for slower CI/dev machines.
  const response = await page.goto(`${urlBase}/my-store`, { waitUntil: 'load', timeout: 60000 });
  expect(response && response.ok(), `non-ok response for /my-store: ${response?.status()}`).toBeTruthy();

  const main = page.locator('main, h1');
  await expect(main.first()).toBeVisible({ timeout: 5000 });

  await context.close();
});

test('protected: /my-store/add-item loads for vendor user', async ({ browser, baseURL }) => {
  const urlBase = baseURL ?? getBaseUrl();

  const context = await createAuthContext(browser, vendorStoragePath);
  const page = await context.newPage();

  const response = await page.goto(`${urlBase}/my-store/add-item`, {
    waitUntil: 'load',
    timeout: 60000,
  });
  expect(response && response.ok(), `non-ok response for /my-store/add-item: ${response?.status()}`).toBeTruthy();
  const main = page.locator('main, h1');
  await expect(main.first()).toBeVisible({ timeout: 5000 });

  await context.close();
});

test('protected: /my-store/edit/[id] loads for vendor user with their store id', async ({
  browser,
  baseURL,
}) => {
  const urlBase = baseURL ?? getBaseUrl();

  const context = await createAuthContext(browser, vendorStoragePath);
  const page = await context.newPage();

  // Navigate to /my-store to find the edit link
  await page.goto(`${urlBase}/my-store`, { waitUntil: 'load', timeout: 60000 });

  // Look for a link or button that contains 'edit' and extract the store id from its href
  const editLink = page.locator('a[href*="/my-store/edit/"]').first();
  const href = await editLink.getAttribute('href');

  expect(href, 'Edit store link not found on /my-store page').toBeTruthy();

  if (href) {
    // Extract the id from the href (e.g., /my-store/edit/abc123)
    const storeId = href.split('/my-store/edit/')[1];
    expect(storeId, 'Failed to extract store id from href').toBeTruthy();

    const response = await page.goto(`${urlBase}/my-store/edit/${storeId}`, {
      waitUntil: 'load',
      timeout: 60000,
    });
    expect(response && response.ok(), `non-ok response for /my-store/edit/${storeId}:
      ${response?.status()}`).toBeTruthy();
    const main = page.locator('main, h1');
    await expect(main.first()).toBeVisible({ timeout: 5000 });
  }

  await context.close();
});

test('protected: /my-store/edit-item/[id] loads for vendor user with their item id', async ({
  browser,
  baseURL,
}) => {
  const urlBase = baseURL ?? getBaseUrl();

  const context = await createAuthContext(browser, vendorStoragePath);
  const page = await context.newPage();

  // Navigate to /my-store to find an edit item link
  await page.goto(`${urlBase}/my-store`, { waitUntil: 'load', timeout: 60000 });

  // Look for a link that contains '/my-store/edit-item/' to extract an item id
  const editItemLink = page.locator('a[href*="/my-store/edit-item/"]').first();
  const href = await editItemLink.getAttribute('href');

  expect(href, 'Edit item link not found on /my-store page').toBeTruthy();

  if (href) {
    // Extract the id from the href (e.g., /edit-item/123)
    const itemId = href.split('/edit-item/')[1];
    expect(itemId, 'Failed to extract item id from href').toBeTruthy();

    const response = await page.goto(`${urlBase}/my-store/edit-item/${itemId}`, {
      waitUntil: 'load',
      timeout: 60000,
    });
    expect(response && response.ok(), `non-ok response for /my-store/edit-item/${itemId}:
      ${response?.status()}`).toBeTruthy();
    const main = page.locator('main, h1');
    await expect(main.first()).toBeVisible({ timeout: 5000 });
  }

  await context.close();
});
