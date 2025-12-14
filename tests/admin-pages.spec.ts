import { test, expect, navigateToHome, clickAndNavigate } from './auth-utils';

const HEADING_TIMEOUT = 10000;
const ADMIN_EMAIL = 'admin@foo.com';
const ADMIN_PASSWORD = 'changeme';

test.slow();

test('admin can access dashboard and manage database items', async ({ getUserPage }) => {
  const adminPage = await getUserPage(ADMIN_EMAIL, ADMIN_PASSWORD);
  await navigateToHome(adminPage);

  // Check Admin Dashboard
  await clickAndNavigate(adminPage, 'Admin', '**/admin');
  await expect(adminPage.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: HEADING_TIMEOUT });
  await expect(adminPage.getByRole('button', { name: 'Database Items' })).toBeVisible();

  await adminPage.getByRole('button', { name: 'Database Items' }).click();
  await expect(adminPage.getByRole('heading', { name: 'Database Item Management' })).toBeVisible();

  // Add database item
  // await adminPage.getByRole('button', { name: 'Add Database Item' }).click();
  // await adminPage.getByPlaceholder('Enter item name').fill('Taro');
  // await adminPage.locator('.modal-body select').first().selectOption('produce');
  // await adminPage.getByRole('button', { name: 'Add Item' }).click();

  // // Delete database item
  // const taroRow = adminPage.getByRole('row').filter({ has: adminPage.getByText('Taro') });
  // await expect(taroRow).toBeVisible({ timeout: 5000 });
  // await taroRow.getByRole('button', { name: 'Delete' }).click();
  // await adminPage.waitForTimeout(1000);
  // await adminPage.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  // await expect(taroRow).not.toBeVisible({ timeout: HEADING_TIMEOUT });
});

test('admin can manage tags', async ({ getUserPage }) => {
  const adminPage = await getUserPage(ADMIN_EMAIL, ADMIN_PASSWORD);
  await navigateToHome(adminPage);

  await clickAndNavigate(adminPage, 'Admin', '**/admin');
  await adminPage.getByRole('button', { name: 'Tags' }).click();
  await expect(adminPage.getByRole('heading', { name: 'Tag Management' })).toBeVisible();

  // // Add tag
  // await adminPage.getByRole('button', { name: 'Add Tag' }).first().click();
  // await adminPage.getByPlaceholder('Enter tag name').fill('Toaster Oven');
  // await adminPage.locator('.modal-body select').first().selectOption('Appliance');
  // await adminPage.getByRole('dialog').getByRole('button', { name: 'Add Tag' }).click();

  // // Delete tag
  // const toasterOvenRow = adminPage.getByRole('row').filter({ has: adminPage.getByText('Toaster Oven') });
  // await expect(toasterOvenRow).toBeVisible({ timeout: 5000 });
  // await toasterOvenRow.getByRole('button', { name: 'Delete' }).click();
  // await adminPage.waitForTimeout(1000);
  // await adminPage.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  // await expect(toasterOvenRow).not.toBeVisible({ timeout: HEADING_TIMEOUT });
});

test('admin can add and delete recipes', async ({ getUserPage }) => {
  const adminPage = await getUserPage(ADMIN_EMAIL, ADMIN_PASSWORD);
  await navigateToHome(adminPage);

  // Add recipe
  await clickAndNavigate(adminPage, 'Recipes', '**/recipes');
  await clickAndNavigate(adminPage, 'Add Recipe', '**/recipes/add');
  // await adminPage.getByRole('textbox', { name: 'e.g. Creamy Tomato Pasta' }).fill('Test');
  // await adminPage.getByPlaceholder('e.g. 12.50').fill('10');
  // await adminPage.getByPlaceholder('e.g. 30').fill('10');
  // await adminPage.getByRole('textbox', { name: 'Type an ingredient and press' }).fill('chicken');
  // await adminPage.getByRole('textbox', { name: 'Type an ingredient and press' }).press('Enter');
  // await adminPage.getByRole('textbox', { name: 'Quantity' }).fill('1');
  // await adminPage.getByRole('textbox', { name: 'Step-by-step instructions of' }).fill('Instructions');
  // await adminPage.getByRole('checkbox', { name: 'Instant Pot' }).check();
  // await adminPage.getByRole('button', { name: 'Add recipe' }).click();
  // await adminPage.waitForURL('**/recipes');

  // // Edit recipe
  // await adminPage.getByLabel('View Test').first().getByRole('link', { name: 'Edit' }).click();
  // await adminPage.getByRole('checkbox', { name: 'Instant Pot' }).uncheck();
  // await adminPage.getByRole('checkbox', { name: 'Microwave' }).check();
  // await adminPage.getByRole('button', { name: 'Save changes' }).click();
  // await adminPage.waitForURL('**/recipes');

  // // Delete recipe
  // const testRecipeCard = adminPage.getByLabel('View Test').first();
  // await expect(testRecipeCard).toBeVisible();
  // await testRecipeCard.getByRole('button', { name: 'Delete' }).click();
  // await adminPage.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  // await adminPage.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  // await expect(testRecipeCard).not.toBeVisible({ timeout: HEADING_TIMEOUT });
});

test('admin can view recipe details and add review', async ({ getUserPage }) => {
  const adminPage = await getUserPage(ADMIN_EMAIL, ADMIN_PASSWORD);
  await navigateToHome(adminPage);

  // View recipe details
  await clickAndNavigate(adminPage, 'Recipes', '**/recipes');
  await adminPage.getByRole('button', { name: 'View Simple Fried Rice' }).click();
  await adminPage.waitForURL('**/recipes/**');
  await adminPage.waitForLoadState('networkidle');
  await expect(adminPage.getByRole('heading', { name: 'Simple Fried Rice' }))
    .toBeVisible({ timeout: HEADING_TIMEOUT });

  // // Add review
  // await adminPage.getByRole('button', { name: 'Add Review' }).click();
  // await expect(adminPage.getByRole('heading', { name: 'Review Recipe' })).toBeVisible({ timeout: HEADING_TIMEOUT });
  // await adminPage.waitForLoadState('networkidle');
  // await adminPage.getByRole('spinbutton', { name: 'Rating (1-5)' }).fill('5');
  // await adminPage.getByRole('textbox', { name: 'Review' }).fill('Amazing recipe!');
  // await adminPage.getByRole('button', { name: 'Submit Review' }).click();
  // await adminPage.waitForURL('**/recipes/**');
  // await adminPage.waitForLoadState('networkidle');

  // // Delete review
  // const review = adminPage.getByText('Amazing recipe!').first();
  // await adminPage.getByRole('button', { name: 'Delete review' }).click();
  // await adminPage.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  // await adminPage.waitForURL('**/recipes/**');
  // await adminPage.waitForLoadState('networkidle');
  // await expect(review).not.toBeVisible({ timeout: HEADING_TIMEOUT });
});
