/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-extraneous-dependencies */

import { test as base, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Base configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const SESSION_STORAGE_PATH = path.join(__dirname, 'playwright-auth-sessions');

// Ensure session directory exists
if (!fs.existsSync(SESSION_STORAGE_PATH)) {
  fs.mkdirSync(SESSION_STORAGE_PATH, { recursive: true });
}

// Define our custom fixtures
interface AuthFixtures {
  getUserPage: (email: string, password: string) => Promise<Page>;
}

/**
 * Helper to fill form fields with retry logic
 */
async function fillFormWithRetry(
  page: Page,
  fields: Array<{ selector: string; value: string }>,
): Promise<void> {
  for (const field of fields) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const element = page.locator(field.selector);
        await element.waitFor({ state: 'visible', timeout: 2000 });
        await element.clear();
        await element.fill(field.value);
        await element.evaluate((el) => el.blur()); // Trigger blur event
        break;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to fill field ${field.selector} after ${maxAttempts} attempts`);
        }
        await page.waitForTimeout(500);
      }
    }
  }
}

/**
 * Authenticate using the UI with robust waiting and error handling
 */
async function authenticateWithUI(
  page: Page,
  email: string,
  password: string,
  sessionName: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeGoto = async (url: string, label: string): Promise<void> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle');
        return;
      } catch (error: any) {
        const msg = error?.message || '';
        const interrupted = msg.includes('interrupted by another navigation');
        if (!interrupted || attempt === 1) {
          throw error;
        }
        // Give the ongoing navigation a moment to settle, then retry
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);
      }
    }
  };

  const sessionPath = path.join(SESSION_STORAGE_PATH, `${sessionName}.json`);

  // Try to restore session from storage if available
  if (fs.existsSync(sessionPath)) {
    try {
      const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      await page.context().addCookies(sessionData.cookies);

      // Navigate to homepage to verify session
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check if we're authenticated by looking for a sign-out option or user email
      const isAuthenticated = await Promise.race([
        page.getByText(email).isVisible().then((visible) => visible),
        page.getByRole('button', { name: email }).isVisible().then((visible) => visible),
        page.getByText('Sign out').isVisible().then((visible) => visible),
        page.getByRole('button', { name: 'Sign out' }).isVisible().then((visible) => visible),
        // eslint-disable-next-line no-promise-executor-return
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)),
      ]);

      if (isAuthenticated) {
        console.log(`✓ Restored session for ${email}`);
        return;
      }

      console.log(`× Saved session for ${email} expired, re-authenticating...`);
    } catch (error) {
      console.log(`× Error restoring session: ${error}`);
    }
  }

  // If session restoration fails, authenticate via UI
  try {
    console.log(`→ Authenticating ${email} via UI...`);

    // Navigate to login page
    await safeGoto(`${BASE_URL}/signin`, 'signin');

    // Fill in credentials with retry logic
    await fillFormWithRetry(page, [
      { selector: '#email', value: email },
      { selector: '#password', value: password },
    ]);

    // Click submit button and wait for navigation
    const submitButton = page.getByRole('button', { name: /sign[ -]?in/i });
    if (!await submitButton.isVisible({ timeout: 1000 })) {
      // Try alternative selector if the first one doesn't work
      await page.getByRole('button', { name: /log[ -]?in/i }).click();
    } else {
      await submitButton.click();
    }

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Verify authentication was successful
    await expect(async () => {
      const authState = await Promise.race([
        page.getByText(email).isVisible().then((visible) => ({ success: visible })),
        page.getByRole('button', { name: email }).isVisible().then((visible) => ({ success: visible })),
        page.getByText('Sign out').isVisible().then((visible) => ({ success: visible })),
        page.getByRole('button', { name: 'Sign out' }).isVisible().then((visible) => ({ success: visible })),
        // eslint-disable-next-line no-promise-executor-return
        new Promise<{ success: boolean }>((resolve) => setTimeout(() => resolve({ success: false }), 5000)),
      ]);

      expect(authState.success).toBeTruthy();
    }).toPass({ timeout: 10000 });

    // Save session for future tests
    const cookies = await page.context().cookies();
    fs.writeFileSync(sessionPath, JSON.stringify({ cookies }));
    console.log(`✓ Successfully authenticated ${email} and saved session`);
  } catch (error) {
    console.error(`× Authentication failed for ${email}:`, error);
  }
}

// Create custom test with authenticated fixtures
export const test = base.extend<AuthFixtures>({
  getUserPage: async ({ browser }, use) => {
    const createUserPage = async (email: string, password: string) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await authenticateWithUI(page, email, password, `session-${email}`);
      return page;
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(createUserPage);
  },
});

export { expect } from '@playwright/test';

// ============ Helper Functions for Tests ============

const TEST_BASE_URL = 'http://localhost:3000';

/**
 * Safely navigate to home and handle auth errors
 */
export async function navigateToHome(page: Page) {
  const isWebKit = page.context().browser()?.browserType().name() === 'webkit';
  try {
    await page.goto(`${TEST_BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  } catch (error: any) {
    const msg = error?.message || '';
    const isNavigationError = msg.includes('interrupted by another navigation')
      || msg.includes('NS_BINDING_ABORTED')
      || msg.includes('frame was detached');
    if (!isNavigationError) {
      throw error;
    }
    await page.waitForLoadState('networkidle');
  }
  await page.waitForLoadState('networkidle');

  // Retry if on error page
  if (page.url().includes('/api/auth/error')) {
    await page.goto(`${TEST_BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
  }

  // Final check
  if (page.url().includes('/api/auth/error')) {
    await page.goto(`${TEST_BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Click link and wait for navigation
 */
export async function clickAndNavigate(page: Page, name: string, urlPattern: string) {
  await page.getByRole('link', { name, exact: true }).click();
  await page.waitForURL(urlPattern);
  await page.waitForLoadState('networkidle');
}
