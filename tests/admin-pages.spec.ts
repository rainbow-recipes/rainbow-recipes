import { test } from '@playwright/test';
import { ensureAuthStorage, getBaseUrl, checkPageLoads, checkProtectedEditPage } from './auth-utils';

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
  await checkPageLoads(browser, `${urlBase}/admin`, { storagePath: adminStoragePath });
});

test('protected: /admin/add-database-item loads for admin user', async ({ browser, baseURL }) => {
  const urlBase = baseURL ?? getBaseUrl();
  await checkPageLoads(browser, `${urlBase}/admin/add-database-item`, {
    storagePath: adminStoragePath,
    contentCheck: 'Add Database Item',
  });
});

test('protected: /recipes/edit/[id] loads for admin user', async ({ browser, baseURL }) => {
  const urlBase = baseURL ?? getBaseUrl();

  await checkProtectedEditPage({
    browser,
    storagePath: adminStoragePath,
    baseUrl: urlBase,
    listPath: '/recipes',
    editHrefContains: '/recipes/edit/',
    editPathPrefix: '/recipes/edit/',
  });
});
