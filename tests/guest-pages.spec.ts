import { test, expect } from './auth-utils';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

function getNavbar(page: any) {
  // Bootstrap typically renders <nav class="navbar ...">
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
test('test access to guest pages', async ({ page }) => {
  const headingTimeout = 10000;

  await page.goto(`${BASE_URL}/`);
  await page.waitForLoadState('networkidle');

  const nav = getNavbar(page);
  await expect(nav).toBeVisible();

  await ensureNavbarExpanded(page);

  // Navbar-scoped checks (avoid footer duplicates)
  await expect(nav.getByRole('link', { name: 'Recipes', exact: true }))
    .toBeVisible({ timeout: headingTimeout });

  await expect(nav.getByRole('button', { name: 'Vendors' }))
    .toBeVisible({ timeout: headingTimeout });

  await expect(nav.getByRole('button', { name: 'Categories' }))
    .toBeVisible({ timeout: headingTimeout });

  await expect(nav.getByRole('link', { name: 'About', exact: true }))
    .toBeVisible({ timeout: headingTimeout });

  await expect(nav.getByRole('link', { name: 'Vendor Sign Up' }))
    .toBeVisible({ timeout: headingTimeout });

  await expect(nav.getByRole('button', { name: 'Log In' }))
    .toBeVisible({ timeout: headingTimeout });

  // Recipes page
  await nav.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Recipes', level: 2 }))
    .toBeVisible({ timeout: headingTimeout });

  // Vendors page
  await ensureNavbarExpanded(page);
  await nav.getByRole('button', { name: 'Vendors' }).click();
  await page.getByRole('link', { name: 'Vendors', exact: true }).click();
  await page.waitForURL('**/vendors', { timeout: headingTimeout });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h2', { hasText: 'Vendors' }))
    .toBeVisible({ timeout: headingTimeout });

  // About page (navbar-scoped click)
  await ensureNavbarExpanded(page);
  await nav.getByRole('link', { name: 'About', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'About Rainbow Recipes', level: 1 }))
    .toBeVisible({ timeout: headingTimeout });

  // Vendor Sign Up
  await ensureNavbarExpanded(page);
  await nav.getByRole('link', { name: 'Vendor Sign Up' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Vendor sign up', level: 2 }))
    .toBeVisible({ timeout: headingTimeout });

  // Sign In
  await ensureNavbarExpanded(page);
  await nav.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('link', { name: 'Sign In', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Sign in', level: 2 }))
    .toBeVisible({ timeout: headingTimeout });

  // Sign Up
  await ensureNavbarExpanded(page);
  await nav.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('link', { name: 'Sign Up', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Sign up', level: 2 }))
    .toBeVisible({ timeout: headingTimeout });
});
