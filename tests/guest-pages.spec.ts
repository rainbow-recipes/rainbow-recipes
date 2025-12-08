import { test, expect } from './auth-utils';

test.slow();
test('test access to guest pages', async ({ page }) => {
  // Navigate to the home page
  await page.goto('http://localhost:3000/');

  // Check for navigation elements
  await expect(page.getByRole('link', { name: 'Recipes', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vendors', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Categories' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vendor Sign Up' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();

  // Check Recipes page
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Recipes', level: 2 })).toBeVisible();

  // Check Vendors page
  await page.getByRole('link', { name: 'Vendors', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Vendors', level: 2 })).toBeVisible();

  // Check About page
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'About Rainbow Recipes', level: 1 })).toBeVisible();

  // Check Vendor Sign Up page
  await page.getByRole('link', { name: 'Vendor Sign Up' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Vendor sign up', level: 2 })).toBeVisible();

  // Check Sign In page
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('link', { name: 'Sign In', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Sign in', level: 2 })).toBeVisible();

  // Check Sign Up page
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('link', { name: 'Sign Up', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Sign up', level: 2 })).toBeVisible();
});
