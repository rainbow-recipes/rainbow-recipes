import { test } from '@playwright/test';
import { getBaseUrl, checkPageLoads } from './auth-utils';

const routes = ['/about', '/recipes', '/vendors', '/signin', '/signup', '/vendor-signup'];

routes.forEach((route) => {
  test(`guest loads ${route}`, async ({ browser, baseURL }) => {
    const urlBase = baseURL ?? getBaseUrl();
    await checkPageLoads(browser, `${urlBase}${route}`);
  });
});
