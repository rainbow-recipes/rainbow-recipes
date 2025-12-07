import { test, expect } from '@playwright/test';
import { getBaseUrl, checkPageLoads } from './auth-utils';

const routes = ['/about', '/recipes', '/vendors', '/signin', '/signup', '/vendor-signup'];

routes.forEach((route) => {
  test(`guest loads ${route}`, async ({ browser, baseURL }) => {
    const urlBase = baseURL ?? getBaseUrl();
    await checkPageLoads(browser, `${urlBase}${route}`);
  });
});

test('guest loads /recipes/[id]', async ({ browser, baseURL }) => {
  const urlBase = baseURL ?? getBaseUrl();

  const page = await browser.newPage();
  await page.goto(`${urlBase}/recipes`, { waitUntil: 'load', timeout: 60000 });

  const recipeLink = page.locator('a[href*="/recipes/"]').first();
  const href = await recipeLink.getAttribute('href');

  expect(href, 'Recipe link not found on /recipes page').toBeTruthy();

  if (href) {
    const recipeId = href.split('/recipes/')[1];
    expect(recipeId, 'Failed to extract recipe id from href').toBeTruthy();

    await checkPageLoads(browser, `${urlBase}/recipes/${recipeId}`);
  }

  await page.close();
});
