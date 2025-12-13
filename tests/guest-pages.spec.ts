import { test, expect, navigateToHome, clickAndNavigate } from './auth-utils';

const HEADING_TIMEOUT = 10000;

test.slow();

test('guest can see navigation elements', async ({ page }) => {
  await navigateToHome(page);

  await expect(page.getByRole('link', { name: 'Recipes', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vendors', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Categories' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vendor Sign Up' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});

test('guest can view recipes and public profile', async ({ page }) => {
  await navigateToHome(page);

  // Check Recipes page
  await clickAndNavigate(page, 'Recipes', '**/recipes');
  await expect(page.getByRole('heading', { name: 'Recipes', level: 2 })).toBeVisible({ timeout: HEADING_TIMEOUT });

  // Check Public Profile page
  await page.getByRole('link', { name: 'Anonymous User' }).first().click();
  await page.waitForURL('**/profile/**');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Unknown User', exact: true })).toBeVisible();
});

test('guest can view vendors and map', async ({ page }) => {
  await navigateToHome(page);

  // Check Vendors page
  await page.getByRole('button', { name: 'Vendors', exact: true }).click();
  await clickAndNavigate(page, 'Vendors', '**/vendors');
  await expect(page.locator('h2', { hasText: 'Vendors' })).toBeVisible({ timeout: HEADING_TIMEOUT });

  // Check Vendor Map page
  await page.getByRole('button', { name: 'Vendors', exact: true }).click();
  await clickAndNavigate(page, 'Vendor Map', '**/map');
  await expect(page.getByRole('heading', { name: 'Vendor Map' })).toBeVisible({ timeout: HEADING_TIMEOUT });
});

test('guest can view about and authentication pages', async ({ page }) => {
  await navigateToHome(page);

  // Check About page
  await clickAndNavigate(page, 'About', '**/about');
  await expect(
    page.getByRole('heading', { name: 'About Rainbow Recipes', level: 1 }),
  ).toBeVisible({ timeout: HEADING_TIMEOUT });

  // Check Vendor Sign Up page
  await clickAndNavigate(page, 'Vendor Sign Up', '**/vendor-signup');
  await expect(
    page.getByRole('heading', { name: 'Vendor sign up', level: 2 }),
  ).toBeVisible({ timeout: HEADING_TIMEOUT });

  // Check Sign In page
  await page.getByRole('button', { name: 'Log In' }).click();
  await clickAndNavigate(page, 'Sign In', '**/signin');
  await expect(page.getByRole('heading', { name: 'Sign in', level: 2 })).toBeVisible({ timeout: HEADING_TIMEOUT });

  // Check Sign Up page
  await page.getByRole('button', { name: 'Log In' }).click();
  await clickAndNavigate(page, 'Sign Up', '**/signup');
  await expect(page.getByRole('heading', { name: 'Sign up', level: 2 })).toBeVisible({ timeout: HEADING_TIMEOUT });
});
