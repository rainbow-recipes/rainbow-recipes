/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-extraneous-dependencies */

import { test as base, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Store sessions in a predictable place
const SESSION_STORAGE_PATH = path.join(__dirname, 'playwright-auth-sessions');
if (!fs.existsSync(SESSION_STORAGE_PATH)) {
  fs.mkdirSync(SESSION_STORAGE_PATH, { recursive: true });
}

interface AuthFixtures {
  getUserPage: (email: string, password: string) => Promise<Page>;
}

/**
 * More robust navigation helper for Next/React dev reload flakiness.
 */
async function gotoStable(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (error: any) {
    const msg = error?.message || '';
    const interrupted = msg.includes('interrupted by another navigation')
      || msg.includes('NS_BINDING_ABORTED')
      || msg.includes('frame was detached');
    if (!interrupted) throw error;
  }
  await page.waitForLoadState('networkidle').catch(() => {});
}

/**
 * Fill login inputs with light retry.
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
        await element.waitFor({ state: 'visible', timeout: 3000 });
        await element.fill(field.value);
        break;
      } catch {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to fill field ${field.selector}`);
        }
        await page.waitForTimeout(250);
      }
    }
  }
}

/**
 * Primary auth check: NextAuth session endpoint.
 */
async function sessionEmail(page: Page): Promise<string | null> {
  try {
    const res = await page.request.get(`${BASE_URL}/api/auth/session`);
    if (!res.ok()) return null;
    const data = await res.json();
    const email = data?.user?.email;
    return typeof email === 'string' ? email : null;
  } catch {
    return null;
  }
}

/**
 * Secondary auth check: navbar greeting.
 * Matches your Navbar: title={`Hello, ${session?.user?.email}`}
 */
async function hasHelloDropdown(page: Page, email: string): Promise<boolean> {
  try {
    const re = new RegExp(`Hello,\\s*${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    const helloButton = page.getByRole('button', { name: re });
    if (await helloButton.count()) return true;

    // Fallback text match in case Bootstrap renders slightly differently
    const helloText = page.getByText(re);
    return (await helloText.count()) > 0;
  } catch {
    return false;
  }
}

/**
 * Combined predicate: session email OR Navbar greeting.
 */
async function isAuthenticatedAs(page: Page, email: string): Promise<boolean> {
  const sessEmail = await sessionEmail(page);
  if (sessEmail && sessEmail.toLowerCase() === email.toLowerCase()) return true;

  // UI fallback
  await gotoStable(page, `${BASE_URL}/`);
  return hasHelloDropdown(page, email);
}

/**
 * Turn an email into a filesystem-safe name.
 */
function safeSessionName(email: string) {
  return email.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function authenticateWithUI(
  page: Page,
  email: string,
  password: string,
) {
  console.log(`Authenticating user: ${email}`);

  const sessionFile = path.join(
    SESSION_STORAGE_PATH,
    `session-${safeSessionName(email)}.json`,
  );

  // 1) Try restore cookies if we have them
  if (fs.existsSync(sessionFile)) {
    try {
      const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      if (sessionData?.cookies?.length) {
        await page.context().addCookies(sessionData.cookies);
      }

      await gotoStable(page, `${BASE_URL}/`);

      const ok = await isAuthenticatedAs(page, email);
      if (ok) {
        console.log(`✓ Restored session for ${email}`);
        return;
      }

      console.log(`× Saved session for ${email} expired, re-authenticating...`);
    } catch (error) {
      console.log(`× Error restoring session: ${String(error)}`);
    }
  }

  // 2) Fresh UI login
  try {
    console.log(`→ Authenticating ${email} via UI...`);

    await gotoStable(page, `${BASE_URL}/signin`);

    // These selectors match your app (from earlier messages)
    await fillFormWithRetry(page, [
      { selector: '#email', value: email },
      { selector: '#password', value: password },
    ]);

    const signInBtn = page.getByRole('button', { name: /sign\s*in/i });
    const logInBtn = page.getByRole('button', { name: /log\s*in/i });

    if (await signInBtn.count()) {
      await signInBtn.first().click();
    } else if (await logInBtn.count()) {
      await logInBtn.first().click();
    } else {
      await page.locator('#password').press('Enter');
    }

    // Prefer waiting until we're not stuck on /signin
    await page.waitForURL((url) => !url.pathname.endsWith('/signin'), { timeout: 15000 })
      .catch(() => {});

    await page.waitForLoadState('networkidle').catch(() => {});

    // 3) Assert session is truly established
    await expect(async () => {
      const ok = await isAuthenticatedAs(page, email);
      expect(ok).toBeTruthy();
    }).toPass({ timeout: 25000 });

    // 4) Save cookies
    const cookies = await page.context().cookies();
    fs.writeFileSync(sessionFile, JSON.stringify({ cookies }, null, 2));
    console.log(`✓ Successfully authenticated ${email} and saved session`);
  } catch (error) {
    console.error(`× Authentication failed for ${email}:`, error);
    throw new Error(`Authentication failed: ${String(error)}`);
  }
}

export const test = base.extend<AuthFixtures>({
  getUserPage: async ({ browser }, use) => {
    const getUserPage = async (email: string, password: string) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await authenticateWithUI(page, email, password);
      return page;
    };

    await use(getUserPage);
  },
});

export { expect };
