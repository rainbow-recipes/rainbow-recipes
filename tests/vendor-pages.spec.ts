import { test, expect, navigateToHome, clickAndNavigate } from './auth-utils';

const HEADING_TIMEOUT = 10000;
const VENDOR_EMAIL = 'vendor@foo.com';
const VENDOR_PASSWORD = 'changeme';

test.slow();

test('vendor can view my store', async ({ getUserPage }) => {
  const vendorPage = await getUserPage(VENDOR_EMAIL, VENDOR_PASSWORD);
  await navigateToHome(vendorPage);

  // Check My Store page
  await clickAndNavigate(vendorPage, 'My Store', '**/my-store');
  await expect(vendorPage.getByRole('heading', { name: "Bobby's Farm" })).toBeVisible({ timeout: HEADING_TIMEOUT });
});

test('vendor can edit store', async ({ getUserPage }) => {
  const vendorPage = await getUserPage(VENDOR_EMAIL, VENDOR_PASSWORD);
  await navigateToHome(vendorPage);

  // Navigate to My Store
  await clickAndNavigate(vendorPage, 'My Store', '**/my-store');

  // Click Edit My Store
  await clickAndNavigate(vendorPage, 'Edit My Store', '**/my-store/edit/**');
  await expect(vendorPage.getByRole('heading', { name: 'Edit My Store' })).toBeVisible({ timeout: HEADING_TIMEOUT });

  // Edit store fields
  await vendorPage.getByPlaceholder('Enter location').fill('2500 Campus Rd, Honolulu, HI 96822');
  await vendorPage.getByRole('button', { name: 'Submit' }).click();
  await vendorPage.waitForURL('**/my-store', { timeout: HEADING_TIMEOUT });
  await vendorPage.waitForLoadState('networkidle');
});

// Run item lifecycle test serially to avoid conflicts when parallel tests add/delete items
test.describe.serial('vendor items', () => {
  test('vendor can add, edit, and delete items', async ({ getUserPage }) => {
    const vendorPage = await getUserPage(VENDOR_EMAIL, VENDOR_PASSWORD);
    await navigateToHome(vendorPage);

    // Navigate to My Store
    await vendorPage.getByRole('link', { name: 'My Store' }).click();
    await vendorPage.waitForURL('**/my-store', { timeout: HEADING_TIMEOUT });
    await vendorPage.waitForLoadState('networkidle');

    // Add a new item
    await vendorPage.getByRole('link', { name: 'Add Item' }).click();
    await vendorPage.waitForURL('**/my-store/add-item', { timeout: HEADING_TIMEOUT });
    await vendorPage.waitForLoadState('networkidle');
    await expect(vendorPage.getByRole('heading', { name: 'Add Store Item' })).toBeVisible({ timeout: HEADING_TIMEOUT });

    await vendorPage.getByPlaceholder('Start typing to see suggestions...').fill('Orange');
    await vendorPage.locator('#additem-suggestions').getByRole('option', { name: 'Orange' }).first().click();
    await vendorPage.getByPlaceholder('e.g., 16 floz, 1 lb, 1 bunch').fill('each');
    await vendorPage.getByPlaceholder('Enter price ($)').fill('1.50');
    await vendorPage.getByRole('button', { name: 'Submit' }).click();
    await vendorPage.waitForURL('**/my-store', { timeout: HEADING_TIMEOUT });
    await vendorPage.waitForLoadState('networkidle');

    // Edit the newly added item
    await vendorPage.getByRole('row', { name: /Orange/ }).first().getByRole('link').click();
    await vendorPage.waitForURL('**/my-store/edit-item/**', { timeout: HEADING_TIMEOUT });
    await vendorPage.waitForLoadState('networkidle');
    await expect(vendorPage.getByRole('heading', { name: 'Edit Store Item' }))
      .toBeVisible({ timeout: HEADING_TIMEOUT });

    await vendorPage.getByPlaceholder('Enter price ($)').fill('2.00');
    await vendorPage.getByRole('button', { name: /Save/ }).click();
    await vendorPage.waitForURL('**/my-store', { timeout: HEADING_TIMEOUT });
    await vendorPage.waitForLoadState('networkidle');

    // Delete the edited item - use .first() to get only the most recent Orange item
    await expect(vendorPage.getByRole('button', { name: 'Delete' }).first())
      .toBeVisible({ timeout: HEADING_TIMEOUT });

    const deleteRow = vendorPage.getByRole('row', { name: /Orange/ }).first();
    await deleteRow.getByRole('button', { name: 'Delete' }).click();

    // Handle sweetalert confirmation
    await vendorPage.getByRole('button', { name: 'Delete' }).last().click();

    // Wait for the page to reload after deletion
    await vendorPage.waitForLoadState('networkidle');
    await vendorPage.waitForURL('**/my-store', { timeout: HEADING_TIMEOUT });
    await vendorPage.waitForLoadState('networkidle');
  });
});
