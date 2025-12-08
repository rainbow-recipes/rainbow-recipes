import { test, expect } from './auth-utils';

test.slow();
test('test access to vendor pages', async ({ getUserPage }) => {
  // Call the getUserPage fixture with users signin info to get authenticated session for user
  const vendorPage = await getUserPage('vendor@foo.com', 'changeme');

  // Navigate to the home vendorPage
  await vendorPage.goto('http://localhost:3000/');

  // Check for navigation elements
  await expect(vendorPage.getByRole('link', { name: 'My Store' })).toBeVisible();
  await expect(vendorPage.getByRole('link', { name: 'Recipes', exact: true })).toBeVisible();
  await expect(vendorPage.getByRole('link', { name: 'Vendors', exact: true })).toBeVisible();
  await expect(vendorPage.getByRole('button', { name: 'Categories' })).toBeVisible();
  await expect(vendorPage.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  await expect(vendorPage.getByRole('link', { name: 'Favorites' })).toBeVisible();

  // Check My Store vendorPage
  await vendorPage.getByRole('link', { name: 'My Store' }).click();
  await expect(vendorPage.getByRole('heading', { name: 'Bobby\'s Farm' })).toBeVisible();

  // Check Add Item vendorPage
  await vendorPage.getByRole('link', { name: 'Add Item' }).click();
  await expect(vendorPage.getByRole('heading', { name: 'Add Store Item' })).toBeVisible();

  // Check Edit My Store vendorPage
  await vendorPage.getByRole('link', { name: 'My Store' }).click();
  await vendorPage.getByRole('link', { name: 'Edit My Store' }).click();
  await expect(vendorPage.getByRole('heading', { name: 'Edit My Store' })).toBeVisible();
});
