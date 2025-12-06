import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import type { Browser } from '@playwright/test';

const defaultBaseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const sessionsDir = path.join(__dirname, 'playwright-auth-sessions');

export type AuthConfig = {
  storageName: string;
  envEmailVar: string;
  envPasswordVar: string;
  defaultEmail: string;
  defaultPassword: string;
  baseUrl?: string;
  validateSession?: boolean;
  callbackUrl?: string;
};

async function signInAndSave({
  storagePath,
  email,
  password,
  baseUrl,
  callbackUrl = '/recipes',
}: {
  storagePath: string;
  email: string;
  password: string;
  baseUrl: string;
  callbackUrl?: string;
}) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseUrl}/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
    page.click('button:has-text("Sign in")'),
  ]);

  await context.storageState({ path: storagePath });
  await context.close();
  await browser.close();
}

async function validateStorage({
  storagePath,
  email,
  baseUrl,
}: {
  storagePath: string;
  email: string;
  baseUrl: string;
}) {
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: storagePath });
    const page = await context.newPage();
    await page.goto(baseUrl);
    const session = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    });
    await context.close();
    await browser.close();
    return !!(session && (session as any).user && (session as any).user.email === email);
  } catch (e) {
    return false;
  }
}

export async function ensureAuthStorage(config: AuthConfig): Promise<string> {
  const baseUrl = config.baseUrl || defaultBaseUrl;
  const storagePath = path.join(sessionsDir, config.storageName);

  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  const email = process.env[config.envEmailVar] || config.defaultEmail;
  const password = process.env[config.envPasswordVar] || config.defaultPassword;

  const needsGenerate = !fs.existsSync(storagePath);

  if (needsGenerate) {
    await signInAndSave({ storagePath, email, password, baseUrl, callbackUrl: config.callbackUrl });
    return storagePath;
  }

  if (config.validateSession) {
    const valid = await validateStorage({ storagePath, email, baseUrl });
    if (!valid) {
      try { fs.unlinkSync(storagePath); } catch (e) { /* ignore */ }
      await signInAndSave({ storagePath, email, password, baseUrl, callbackUrl: config.callbackUrl });
    }
  }

  return storagePath;
}

export function createAuthContext(browser: Browser, storagePath: string) {
  return browser.newContext({ storageState: storagePath });
}

export function getBaseUrl(fallback?: string) {
  return fallback || defaultBaseUrl;
}
