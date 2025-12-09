import { test, expect } from './auth-utils';

test.slow();
test('test access to vendor pages', async ({ getUserPage }) => {
  const headingTimeout = 10000;

  // Call the getUserPage fixture with users signin info to get authenticated session for user
  const vendorPage = await getUserPage('vendor@foo.com', 'changeme');

  // Navigate to the home vendorPage
  try {
    await vendorPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  } catch (error: any) {
    const msg = error?.message || '';
    const isNavigationError = msg.includes('interrupted by another navigation')
      || msg.includes('NS_BINDING_ABORTED')
      || msg.includes('frame was detached');
    if (!isNavigationError) {
      throw error;
    }
    await vendorPage.waitForLoadState('networkidle');
  }
  await vendorPage.waitForLoadState('networkidle');

  // If redirected to error page, go home again
  if (vendorPage.url().includes('/api/auth/error')) {
    await vendorPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await vendorPage.waitForLoadState('networkidle');
  }

  // Give page time to stabilize and avoid mid-check redirects
  await vendorPage.waitForTimeout(1000);

  // Final check - if still on error page, retry once more
  if (vendorPage.url().includes('/api/auth/error')) {
    await vendorPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await vendorPage.waitForLoadState('networkidle');
    await vendorPage.waitForTimeout(500);
  }

  // Check for navigation elements
  await expect(vendorPage.getByRole('link', { name: 'My Store' })).toBeVisible({ timeout: headingTimeout });
  await expect(vendorPage.getByRole('link', { name: 'Recipes', exact: true })).toBeVisible({ timeout: headingTimeout });
  await expect(vendorPage.getByRole('link', { name: 'Vendors', exact: true })).toBeVisible({ timeout: headingTimeout });
  await expect(vendorPage.getByRole('button', { name: 'Categories' })).toBeVisible({ timeout: headingTimeout });
  await expect(vendorPage.getByRole('link', { name: 'About', exact: true })).toBeVisible({ timeout: headingTimeout });
  await expect(vendorPage.getByRole('link', { name: 'Favorites' })).toBeVisible({ timeout: headingTimeout });

  // Expand the Vendors dropdown
  await vendorPage.getByRole('button', { name: 'Vendors' }).click();
  await expect(vendorPage.getByRole('link', { name: 'Vendors', exact: true })).toBeVisible({ timeout: headingTimeout });

  // Check My Store vendorPage
  await vendorPage.getByRole('link', { name: 'My Store' }).click();
  await vendorPage.waitForURL('**/my-store', { timeout: headingTimeout });
  await vendorPage.waitForLoadState('networkidle');
  await expect(vendorPage.getByRole('heading', { name: 'Bobby\'s Farm' })).toBeVisible({ timeout: headingTimeout });

  // Check Add Item vendorPage
  await vendorPage.getByRole('link', { name: 'Add Item' }).click();
  await vendorPage.waitForURL('**/add-item', { timeout: headingTimeout });
  await vendorPage.waitForLoadState('networkidle');
  await expect(vendorPage.getByRole('heading', { name: 'Add Store Item' })).toBeVisible({ timeout: headingTimeout });

  // Check Edit My Store vendorPage
  await vendorPage.getByRole('link', { name: 'My Store' }).click();
  await vendorPage.waitForURL('**/my-store', { timeout: headingTimeout });
  await vendorPage.waitForLoadState('networkidle');
  await vendorPage.getByRole('link', { name: 'Edit My Store' }).click();
  await vendorPage.waitForURL('**/my-store', { timeout: headingTimeout });
  await vendorPage.waitForLoadState('networkidle');
  await expect(vendorPage.getByRole('heading', { name: 'Edit My Store' })).toBeVisible({ timeout: headingTimeout });
});
