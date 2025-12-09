/* eslint-disable import/no-extraneous-dependencies */
import { test, expect } from './auth-utils';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('vendor pages', () => {
  test('test access to vendor pages', async ({ getUserPage }) => {
    const email = 'vendor@foo.com';
    const password = 'changeme';

    const page = await getUserPage(email, password);

    // Land on home
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Confirm logged-in dropdown label matches your Navbar implementation
    const helloButton = page.getByRole('button', { name: new RegExp(`Hello,\\s*${email}`, 'i') });
    await expect(helloButton).toBeVisible({ timeout: 10000 });

    // ✅ Since "My Store only for vendors", require it for this account
    const myStoreLink = page.getByRole('link', { name: /^My Store$/i });
    await expect(myStoreLink).toBeVisible({ timeout: 10000 });

    // Go to My Store
    await myStoreLink.click();
    await page.waitForURL('**/my-store', { timeout: 10000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Flexible "store page isn't empty" assertion:
    // We don't assume a <main> tag exists.
    const storeHeading = page.getByRole('heading', { name: /my store|store|dashboard/i });
    const storeTextHint = page.getByText(/store|products|inventory|orders|vendor/i);

    await expect(async () => {
      const urlOk = page.url().includes('/my-store');

      const headingOk = (await storeHeading.count()) > 0
        ? await storeHeading.first().isVisible().catch(() => false)
        : false;

      const textOk = (await storeTextHint.count()) > 0
        ? await storeTextHint.first().isVisible().catch(() => false)
        : false;

      // Pass if URL is correct AND we see some store-ish signal
      expect(urlOk && (headingOk || textOk)).toBeTruthy();
    }).toPass({ timeout: 10000 });

    // --- Optional sanity: Vendors dropdown links still reachable ---
    const vendorsDropdown = page.getByRole('button', { name: /^Vendors$/i });
    if (await vendorsDropdown.count()) {
      await vendorsDropdown.click();

      const vendorsItem = page.getByRole('link', { name: /^Vendors$/i }).first();
      if (await vendorsItem.count()) {
        await vendorsItem.click();
        await page.waitForURL('**/vendors', { timeout: 10000 });
        await page.waitForLoadState('networkidle').catch(() => {});
      }

      // back to dropdown for map
      await vendorsDropdown.click();
      const mapItem = page.getByRole('link', { name: /Vendor Map/i }).first();
      if (await mapItem.count()) {
        await mapItem.click();
        await page.waitForURL('**/map', { timeout: 10000 });
        await page.waitForLoadState('networkidle').catch(() => {});
      }
    }
  });
});
