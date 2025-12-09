import { test, expect } from './auth-utils';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

function getNavbar(page: any) {
  return page.locator('nav.navbar').first();
}

async function ensureNavbarExpanded(page: any) {
  const nav = getNavbar(page);
  const collapse = nav.locator('#basic-navbar-nav');

  if (await collapse.count()) {
    const visible = await collapse.isVisible().catch(() => true);
    if (!visible) {
      const toggler = nav.locator('.navbar-toggler');
      if (await toggler.count()) {
        await toggler.first().click();
        await collapse.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      }
    }
  }
}

test.slow();
test('test access to john pages', async ({ getUserPage }) => {
  const headingTimeout = 10000;

  const johnPage = await getUserPage('john@foo.com', 'changeme');

  await johnPage.goto(`${BASE_URL}/`);
  await johnPage.waitForLoadState('networkidle');

  const nav = getNavbar(johnPage);
  await expect(nav).toBeVisible();

  await ensureNavbarExpanded(johnPage);

  await expect(nav.getByRole('link', { name: 'Recipes', exact: true }))
    .toBeVisible({ timeout: headingTimeout });

  await expect(nav.getByRole('button', { name: 'Vendors' }))
    .toBeVisible({ timeout: headingTimeout });

  await expect(nav.getByRole('button', { name: 'Categories' }))
    .toBeVisible({ timeout: headingTimeout });

  await expect(nav.getByRole('link', { name: 'About', exact: true }))
    .toBeVisible({ timeout: headingTimeout });

  await expect(nav.getByRole('link', { name: 'Favorites' }))
    .toBeVisible({ timeout: headingTimeout });

  // Add Recipe flow
  await nav.getByRole('link', { name: 'Recipes', exact: true }).click();
  await johnPage.waitForLoadState('networkidle');
  await johnPage.getByRole('link', { name: 'Add Recipe' }).click();
  await johnPage.waitForLoadState('networkidle');
  await expect(johnPage.getByRole('heading', { name: 'Add new recipe' }))
    .toBeVisible({ timeout: headingTimeout });

  // Favorites
  await ensureNavbarExpanded(johnPage);
  await nav.getByRole('link', { name: 'Favorites' }).click();
  await johnPage.waitForLoadState('networkidle');
  await expect(johnPage.getByRole('heading', { name: 'My Favorites' }))
    .toBeVisible({ timeout: headingTimeout });

  // User dropdown actions
  const userMenuBtn = nav.getByRole('button', { name: /Hello,\s*john@foo\.com/i });
  await userMenuBtn.click();
  await johnPage.getByRole('link', { name: 'Profile' }).click();
  await johnPage.waitForLoadState('networkidle');
  await expect(johnPage.getByText('john@foo.com', { exact: true }))
    .toBeVisible({ timeout: headingTimeout });

  await userMenuBtn.click();
  await johnPage.getByRole('link', { name: 'My Recipes' }).click();
  await johnPage.waitForLoadState('networkidle');
  await expect(johnPage.getByRole('heading', { name: 'My Recipes' }))
    .toBeVisible({ timeout: headingTimeout });
});
