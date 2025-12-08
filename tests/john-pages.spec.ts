import { test, expect } from './auth-utils';

test.slow();
test('test access to john pages', async ({ getUserPage }) => {
  const headingTimeout = 10000;

  // Call the getUserPage fixture with users signin info to get authenticated session for user
  const johnPage = await getUserPage('john@foo.com', 'changeme');

  // Navigate to the home johnPage
  await johnPage.goto('http://localhost:3000/');
  await johnPage.waitForLoadState('networkidle');

  // Check for navigation elements
  await expect(johnPage.getByRole('link', { name: 'Recipes', exact: true })).toBeVisible();
  await expect(johnPage.getByRole('link', { name: 'Vendors', exact: true })).toBeVisible();
  await expect(johnPage.getByRole('button', { name: 'Categories' })).toBeVisible();
  await expect(johnPage.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  await expect(johnPage.getByRole('link', { name: 'Favorites' })).toBeVisible();

  // Check Add Recipe johnPage
  await johnPage.getByRole('link', { name: 'Recipes', exact: true }).click();
  await johnPage.waitForLoadState('networkidle');
  await johnPage.getByRole('link', { name: 'Add Recipe' }).click();
  await johnPage.waitForLoadState('networkidle');
  await expect(johnPage.getByRole('heading', { name: 'Add new recipe' })).toBeVisible({ timeout: headingTimeout });

  // Check Favorites johnPage
  await johnPage.getByRole('link', { name: 'Favorites' }).click();
  await johnPage.waitForLoadState('networkidle');
  await expect(johnPage.getByRole('heading', { name: 'My Favorites' })).toBeVisible({ timeout: headingTimeout });

  // Check Profile johnPage
  await johnPage.getByRole('button', { name: 'Hello, john@foo.com' }).click();
  await johnPage.getByRole('link', { name: 'Profile' }).click();
  await johnPage.waitForLoadState('networkidle');
  await expect(johnPage.getByText('john@foo.com', { exact: true })).toBeVisible({ timeout: headingTimeout });

  // Check My Recipes johnPage
  await johnPage.getByRole('button', { name: 'Hello, john@foo.com' }).click();
  await johnPage.getByRole('link', { name: 'My Recipes' }).click();
  await johnPage.waitForLoadState('networkidle');
  await expect(johnPage.getByRole('heading', { name: 'My Recipes' })).toBeVisible({ timeout: headingTimeout });
});
