import { test } from '@playwright/test';
import { ensureAuthStorage, getBaseUrl, checkPageLoads, checkProtectedEditPage } from './auth-utils';

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
  await checkPageLoads(browser, `${urlBase}/my-store`, { storagePath: vendorStoragePath });
});

test('protected: /my-store/add-item loads for vendor user', async ({ browser, baseURL }) => {
  const urlBase = baseURL ?? getBaseUrl();
  await checkPageLoads(browser, `${urlBase}/my-store/add-item`, { storagePath: vendorStoragePath });
});

test('protected: /my-store/edit/[id] loads for vendor user with their store id', async ({
  browser,
  baseURL,
}) => {
  const urlBase = baseURL ?? getBaseUrl();

  await checkProtectedEditPage({
    browser,
    storagePath: vendorStoragePath,
    baseUrl: urlBase,
    listPath: '/my-store',
    editHrefContains: '/my-store/edit/',
    editPathPrefix: '/my-store/edit/',
  });
});

test('protected: /my-store/edit-item/[id] loads for vendor user with their item id', async ({
  browser,
  baseURL,
}) => {
  const urlBase = baseURL ?? getBaseUrl();

  await checkProtectedEditPage({
    browser,
    storagePath: vendorStoragePath,
    baseUrl: urlBase,
    listPath: '/my-store',
    editHrefContains: '/my-store/edit-item/',
    editPathPrefix: '/my-store/edit-item/',
  });
});
