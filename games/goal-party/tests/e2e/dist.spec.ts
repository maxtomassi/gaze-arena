import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { clickButton, startGame, state, waitIdle } from './fixtures';

const DIST = join(import.meta.dirname, '..', '..', 'dist');

test('the built dist/ works from /goal-party/ with no requests to other origins', async ({ page, baseURL }) => {
  const base = new URL(baseURL as string);
  const offending: string[] = [];
  const failed: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol === 'data:' || u.protocol === 'blob:') return;
    if (u.origin !== base.origin || !u.pathname.startsWith(base.pathname)) offending.push(r.url());
  });
  page.on('requestfailed', (r) => failed.push(r.url()));
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await startGame(page, { choices: 4 });
  await clickButton(page, 'airplane');
  await waitIdle(page);
  expect((await state(page)).count).toBe(1);

  expect(offending).toEqual([]);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});

test('the PWA manifest is local and scoped relative to the game folder', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  expect(href).not.toMatch(/^(https?:)?\/\//);
  expect(href?.startsWith('/')).toBe(false);
  const res = await request.get(new URL(href as string, page.url()).toString());
  expect(res.ok()).toBe(true);
  const manifest = (await res.json()) as { start_url: string; scope: string; icons: { src: string }[] };
  expect(manifest.start_url).toBe('./');
  expect(manifest.scope).toBe('./');
  for (const icon of manifest.icons) expect(icon.src).not.toMatch(/^(\/|https?:)/);
});

test.describe('service worker', () => {
  test.use({ serviceWorkers: 'allow' });
  test('registers under the subpath', async ({ page, baseURL }) => {
    await page.goto('./');
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(scope).toBe(baseURL);
  });
});

test('built files reference no absolute paths or remote origins', () => {
  const files = readdirSync(DIST, { recursive: true, encoding: 'utf8' }).filter((f) => /\.(html|css|webmanifest)$/.test(f));
  expect(files.length).toBeGreaterThan(0);
  for (const f of files) {
    const text = readFileSync(join(DIST, f), 'utf8');
    expect(text, f).not.toMatch(/(?:src|href)="\/(?!\/)/);
    expect(text, f).not.toMatch(/url\(\s*['"]?(?:https?:)?\/\//);
    expect(text, f).not.toMatch(/(?:src|href)="(?:https?:)?\/\//);
  }
});

test('the game runs with the code-drawn background when stadium-night.webp is missing', async ({ page }) => {
  // The file is not generated yet; also block it in case it exists in a later build.
  await page.route('**/stadium-night.webp', (r) => r.abort());
  await startGame(page, { choices: 4 });
  expect((await state(page)).background).toBe('fallback');
  await clickButton(page, 'knee-slide');
  await waitIdle(page);
  expect((await state(page)).count).toBe(1);
});
