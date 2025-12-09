import { test, expect } from './auth-utils';

test.slow();
test('test access to admin page', async ({ getUserPage }) => {
  const headingTimeout = 10000;

  // Call the getUserPage fixture with admin signin info to get authenticated session for admin
  const adminPage = await getUserPage('admin@foo.com', 'changeme');

  // Navigate to the home adminPage
  try {
    await adminPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  } catch (error: any) {
    const msg = error?.message || '';
    const isNavigationError = msg.includes('interrupted by another navigation')
      || msg.includes('NS_BINDING_ABORTED')
      || msg.includes('frame was detached');
    if (!isNavigationError) {
      throw error;
    }
    await adminPage.waitForLoadState('networkidle');
  }
  await adminPage.waitForLoadState('networkidle');

  // If redirected to error page, go home again
  if (adminPage.url().includes('/api/auth/error')) {
    await adminPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await adminPage.waitForLoadState('networkidle');
  }

  // Give page time to stabilize and avoid mid-check redirects
  await adminPage.waitForTimeout(1000);

  // Final check - if still on error page, retry once more
  if (adminPage.url().includes('/api/auth/error')) {
    await adminPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(500);
  }

  // Check for navigation elements
  await expect(adminPage.getByRole('link', { name: 'Admin' })).toBeVisible({ timeout: headingTimeout });
  await expect(adminPage.getByRole('link', { name: 'Recipes', exact: true })).toBeVisible({ timeout: headingTimeout });
  await expect(adminPage.getByRole('link', { name: 'Vendors', exact: true })).toBeVisible({ timeout: headingTimeout });
  await expect(adminPage.getByRole('button', { name: 'Categories' })).toBeVisible({ timeout: headingTimeout });
  await expect(adminPage.getByRole('link', { name: 'About', exact: true })).toBeVisible({ timeout: headingTimeout });
  await expect(adminPage.getByRole('link', { name: 'Favorites' })).toBeVisible({ timeout: headingTimeout });

  // Expand the Vendors dropdown
  await adminPage.getByRole('button', { name: 'Vendors' }).click();
  await expect(adminPage.getByRole('link', { name: 'Vendors', exact: true })).toBeVisible({ timeout: headingTimeout });

  // Test Admin adminPage
  await adminPage.getByRole('link', { name: 'Admin' }).click();
  await adminPage.waitForURL('**/admin');
  await adminPage.waitForLoadState('networkidle');
  await expect(adminPage.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: headingTimeout });
});
