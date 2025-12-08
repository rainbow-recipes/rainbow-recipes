import { test } from '@playwright/test';
import { ensureAuthStorage, getBaseUrl, checkPageLoads, checkProtectedEditPage } from './auth-utils';

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
    await checkPageLoads(browser, `${urlBase}${route}`, { storagePath: userStoragePath });
  });
});

test('protected: /recipes/edit/[id] loads for john user', async ({ browser, baseURL }) => {
  const urlBase = baseURL ?? getBaseUrl();

  await checkProtectedEditPage({
    browser,
    storagePath: userStoragePath,
    baseUrl: urlBase,
    listPath: '/recipes',
    editHrefContains: '/recipes/edit/',
    editPathPrefix: '/recipes/edit/',
  });
});
