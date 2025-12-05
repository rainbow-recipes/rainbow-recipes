import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function discoverRoutes(): string[] {
  const appDir = path.resolve(__dirname, '..', 'src', 'app');
  const routes = new Set<string>();

  function walk(dir: string) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      // skip API and internal folders
      if (it.name === 'api' || it.name.startsWith('_') || it.name === 'components') continue;

      const full = path.join(dir, it.name);
      if (it.isDirectory()) {
        walk(full);
      } else {
        const lower = it.name.toLowerCase();
        if (lower === 'page.tsx' || lower === 'page.jsx' || lower === 'page.ts' || lower === 'page.js') {
          const rel = path.relative(appDir, dir).replace(/\\/g, '/');
          const route = rel === '' ? '/' : `/${rel}`;
          // Ignore dynamic segments like [id]
          if (route.includes('[')) continue;
          routes.add(route);
        }
      }
    }
  }

  if (!fs.existsSync(appDir)) return ['/'];
  walk(appDir);
  return Array.from(routes).sort();
}

const routes = discoverRoutes();

// Default routes to skip because they require auth or DB fixtures.
const defaultSkips = new Set(
  [
    '/my-store',
    '/my-recipes',
    '/favorites',
    '/profile',
    '/add-item',
    '/edit-item',
    '/edit-recipe',
    '/admin',
  ],
);
const envSkips = (process.env.AVAILABILITY_SKIP || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const skipRoutes = new Set([...defaultSkips, ...envSkips]);

test.describe('Availability / smoke checks', () => {
  for (const route of routes) {
    test(route === '/' ? 'root / loads' : `loads ${route}`, async ({ page, baseURL }) => {
      // Skip routes that need authentication or fixture data unless overridden.
      if (skipRoutes.has(route)) {
        test.skip(true, `skipped ${route} in availability checks`);
      }
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      const url = (baseURL ?? 'http://127.0.0.1:3000') + route;
      const response = await page.goto(url, { waitUntil: 'networkidle' });

      expect(response && response.ok(), `non-ok response for ${url}: ${response?.status()}`).toBeTruthy();

      const main = page.locator('main, [data-testid="page-root"], h1');
      await expect(main.first(), `no main/h1 visible for ${url}`).toBeVisible({ timeout: 5000 });

      expect(errors, `console errors on ${route}`).toEqual([]);
    });
  }

  test('sanity - discovered routes', async () => {
    expect(routes.length).toBeGreaterThan(0);
  });
});
