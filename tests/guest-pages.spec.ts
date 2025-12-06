import { test, expect } from '@playwright/test';
import { getBaseUrl } from './auth-utils';

const routes = ['/about', '/recipes', '/vendors', '/signin', '/signup', '/vendor-signup', '/not-authorized'];

routes.forEach((route) => {
  test(`guest loads ${route}`, async ({ browser, baseURL }) => {
    const urlBase = baseURL ?? getBaseUrl();
    const page = await browser.newPage();

    const url = `${urlBase}${route}`;
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    expect(response && response.ok(), `non-ok response for ${url}: ${response?.status()}`).toBeTruthy();

    const main = page.locator('main, h1, [data-testid="page-root"]');
    await expect(main.first(), `no main/h1 visible for ${url}`).toBeVisible({ timeout: 5000 });

    await page.close();
  });
});
