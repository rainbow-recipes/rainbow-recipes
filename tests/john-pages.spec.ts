import { test, expect, navigateToHome, clickAndNavigate } from './auth-utils';

const HEADING_TIMEOUT = 10000;
const JOHN_EMAIL = 'john@foo.com';
const JOHN_PASSWORD = 'changeme';

test.slow();

// test('john can see navigation elements', async ({ getUserPage }) => {
//   const johnPage = await getUserPage(JOHN_EMAIL, JOHN_PASSWORD);
//   await navigateToHome(johnPage);

//   await expect(johnPage.getByRole('link', { name: 'Recipes', exact: true }))
//     .toBeVisible({ timeout: HEADING_TIMEOUT });
//   await expect(johnPage.getByRole('button', { name: 'Vendors', exact: true }))
//     .toBeVisible({ timeout: HEADING_TIMEOUT });
//   await expect(johnPage.getByRole('button', { name: 'Categories' })).toBeVisible({ timeout: HEADING_TIMEOUT });
//   await expect(johnPage.getByRole('link', { name: 'About', exact: true })).toBeVisible({ timeout: HEADING_TIMEOUT });
//   await expect(johnPage.getByRole('link', { name: 'Favorites' })).toBeVisible({ timeout: HEADING_TIMEOUT });
// });

test('john can edit own recipe', async ({ getUserPage }) => {
  const johnPage = await getUserPage(JOHN_EMAIL, JOHN_PASSWORD);
  await navigateToHome(johnPage);

  // Check Edit Recipe page
  await clickAndNavigate(johnPage, 'Recipes', '**/recipes');
  await johnPage.getByLabel('View Simple Fried Rice').getByRole('link', { name: 'Edit' }).click();
  await johnPage.waitForURL('**/recipes/edit/**');
  await johnPage.waitForLoadState('networkidle');
  await expect(johnPage.getByRole('heading', { name: 'Edit recipe' })).toBeVisible({ timeout: HEADING_TIMEOUT });
});

test('john can view vendor store', async ({ getUserPage }) => {
  const johnPage = await getUserPage(JOHN_EMAIL, JOHN_PASSWORD);
  await navigateToHome(johnPage);

  // Check Vendor Store page
  await johnPage.getByRole('button', { name: 'Vendors' }).click();
  await clickAndNavigate(johnPage, 'Vendors', '**/vendors');
  await clickAndNavigate(johnPage, "Bobby's Farm Bobby's Farm", '**/vendors/**');
  await expect(johnPage.getByRole('heading', { name: "Bobby's Farm" }))
    .toBeVisible({ timeout: HEADING_TIMEOUT });
});

test('john can view favorites and profile', async ({ getUserPage }) => {
  const johnPage = await getUserPage(JOHN_EMAIL, JOHN_PASSWORD);
  await navigateToHome(johnPage);

  // Check Favorites page
  await clickAndNavigate(johnPage, 'Favorites', '**/favorites');
  await expect(johnPage.getByRole('heading', { name: 'My Favorites' })).toBeVisible({ timeout: HEADING_TIMEOUT });

  // Check Profile page
  await johnPage.getByRole('button', { name: `Hello, ${JOHN_EMAIL}` }).click();
  await clickAndNavigate(johnPage, 'Profile', '**/profile');
  await expect(johnPage.getByText(JOHN_EMAIL, { exact: true })).toBeVisible({ timeout: HEADING_TIMEOUT });

  // Check My Recipes page
  await johnPage.getByRole('button', { name: `Hello, ${JOHN_EMAIL}` }).click();
  await clickAndNavigate(johnPage, 'My Recipes', '**/recipes/my-recipes');
  await expect(johnPage.getByRole('heading', { name: 'My Recipes' })).toBeVisible({ timeout: HEADING_TIMEOUT });
});
