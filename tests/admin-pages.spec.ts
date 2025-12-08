import { test, expect } from './auth-utils';

test.slow();
test('test access to admin page', async ({ getUserPage }) => {
  const headingTimeout = 10000;

  // Call the getUserPage fixture with admin signin info to get authenticated session for admin
  const adminPage = await getUserPage('admin@foo.com', 'changeme');

  // Navigate to the home adminPage
  await adminPage.goto('http://localhost:3000/');
  await adminPage.waitForLoadState('networkidle');

  // Check for navigation elements
  await expect(adminPage.getByRole('link', { name: 'Admin' })).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'Recipes', exact: true })).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'Vendors', exact: true })).toBeVisible();
  await expect(adminPage.getByRole('button', { name: 'Categories' })).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'Favorites' })).toBeVisible();

  // Test Admin adminPage
  await adminPage.getByRole('link', { name: 'Admin' }).click();
  await adminPage.waitForURL('**/admin');
  await adminPage.waitForLoadState('networkidle');
  await expect(adminPage.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: headingTimeout });
});
