import { test, expect } from './auth-utils';

test.slow();
test('test access to vendor pages', async ({ getUserPage }) => {
  const headingTimeout = 10000;

  // Call the getUserPage fixture with users signin info to get authenticated session for user
  const vendorPage = await getUserPage('vendor@foo.com', 'changeme');

  // Navigate to the home vendorPage
  await vendorPage.goto('http://localhost:3000/');
  await vendorPage.waitForLoadState('networkidle');

  // Check for navigation elements
  await expect(vendorPage.getByRole('link', { name: 'My Store' })).toBeVisible();
  await expect(vendorPage.getByRole('link', { name: 'Recipes', exact: true })).toBeVisible();
  await expect(vendorPage.getByRole('link', { name: 'Vendors', exact: true })).toBeVisible();
  await expect(vendorPage.getByRole('button', { name: 'Categories' })).toBeVisible();
  await expect(vendorPage.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  await expect(vendorPage.getByRole('link', { name: 'Favorites' })).toBeVisible();

  // Check My Store vendorPage
  await vendorPage.getByRole('link', { name: 'My Store' }).click();
  await vendorPage.waitForLoadState('networkidle');
  await expect(vendorPage.getByRole('heading', { name: 'Bobby\'s Farm' })).toBeVisible({ timeout: headingTimeout });

  // Check Add Item vendorPage
  await vendorPage.getByRole('link', { name: 'Add Item' }).click();
  await vendorPage.waitForLoadState('networkidle');
  await expect(vendorPage.getByRole('heading', { name: 'Add Store Item' })).toBeVisible({ timeout: headingTimeout });

  // Check Edit My Store vendorPage
  await vendorPage.getByRole('link', { name: 'My Store' }).click();
  await vendorPage.waitForLoadState('networkidle');
  await vendorPage.getByRole('link', { name: 'Edit My Store' }).click();
  await vendorPage.waitForLoadState('networkidle');
  await expect(vendorPage.getByRole('heading', { name: 'Edit My Store' })).toBeVisible({ timeout: headingTimeout });
});
