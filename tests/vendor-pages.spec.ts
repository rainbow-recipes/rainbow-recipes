import { test, expect, navigateToHome, clickAndNavigate } from './auth-utils';

const HEADING_TIMEOUT = 10000;
const VENDOR_EMAIL = 'vendor@foo.com';
const VENDOR_PASSWORD = 'changeme';

test.slow();

test('vendor can view and edit store', async ({ getUserPage }) => {
  const vendorPage = await getUserPage(VENDOR_EMAIL, VENDOR_PASSWORD);
  await navigateToHome(vendorPage);

  // Check My Store
  await clickAndNavigate(vendorPage, 'My Store', '**/my-store');
  await expect(vendorPage.getByRole('heading', { name: "Bobby's Farm" })).toBeVisible({ timeout: HEADING_TIMEOUT });

  // Check Edit My Store
  await clickAndNavigate(vendorPage, 'Edit My Store', '**/my-store/edit/**');
  await expect(vendorPage.getByRole('heading', { name: 'Edit My Store' })).toBeVisible({ timeout: HEADING_TIMEOUT });
  await vendorPage.getByPlaceholder('Enter location').fill('2500 Campus Rd, Honolulu, HI 96822');
  await vendorPage.getByRole('button', { name: 'Submit' }).click();
  await vendorPage.waitForLoadState('networkidle');
});

test('vendor can add, edit, and delete store items', async ({ getUserPage }) => {
  const vendorPage = await getUserPage(VENDOR_EMAIL, VENDOR_PASSWORD);
  await navigateToHome(vendorPage);
  await clickAndNavigate(vendorPage, 'My Store', '**/my-store');

  // Add a new item
  await clickAndNavigate(vendorPage, 'Add Item', '**/my-store/add-item');
  await expect(vendorPage.getByRole('heading', { name: 'Add Store Item' })).toBeVisible({ timeout: HEADING_TIMEOUT });
  await vendorPage.getByPlaceholder('Start typing to see suggestions...').fill('Orange');
  await vendorPage.locator('#additem-suggestions').getByRole('option', { name: 'Orange' }).first().click();
  await vendorPage.getByPlaceholder('e.g., 16 floz, 1 lb, 1 bunch').fill('each');
  await vendorPage.getByPlaceholder('Enter price ($)').fill('1.50');
  await vendorPage.getByRole('button', { name: 'Submit' }).click();
  await vendorPage.waitForURL('**/my-store', { timeout: HEADING_TIMEOUT });
  await vendorPage.waitForLoadState('networkidle');

  // // Edit item
  // await vendorPage.getByRole('row', { name: /Orange/ }).first().getByRole('link').click();
  // await vendorPage.waitForURL('**/my-store/edit-item/**', { timeout: HEADING_TIMEOUT });
  // await vendorPage.waitForLoadState('networkidle');
  // await expect(vendorPage.getByRole('heading', { name: 'Edit Store Item' }))
  //   .toBeVisible({ timeout: HEADING_TIMEOUT });
  // await vendorPage.getByPlaceholder('Enter price ($)').fill('2.00');
  // await vendorPage.getByRole('button', { name: /Save/ }).click();
  // await vendorPage.waitForURL('**/my-store', { timeout: HEADING_TIMEOUT });
  // await vendorPage.waitForLoadState('networkidle');

  // Delete item
  await expect(vendorPage.getByRole('button', { name: 'Delete' }).first())
    .toBeVisible({ timeout: HEADING_TIMEOUT });
  const deleteRow = vendorPage.getByRole('row', { name: /Orange/ }).first();
  await deleteRow.getByRole('button', { name: 'Delete' }).click();
  await vendorPage.getByRole('button', { name: 'Delete' }).last().click();
  await vendorPage.waitForLoadState('networkidle');
  await vendorPage.waitForURL('**/my-store', { timeout: HEADING_TIMEOUT });
  await vendorPage.waitForLoadState('networkidle');
});
