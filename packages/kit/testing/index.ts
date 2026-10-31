/**
 * Playwright helpers shared by every game's e2e tests. Coordinates are logical (1920×1080).
 * Requires the game to be opened with ?test=1 so window.__gazeArena exists.
 */
import { expect, type Page } from '@playwright/test';
import type { GazeArenaTestApi } from '../src/core/testHooks';
import type { Rect } from '../src/core/constants';
import type { SettingsData } from '../src/settings/Settings';

export type { GazeArenaTestApi };

export const LOGICAL = { width: 1920, height: 1080 } as const;

/** Opens the game with ?test=1 (plus extra query) and optional pre-seeded settings. */
export async function openGame(page: Page, opts: { query?: string; settings?: Partial<SettingsData> } = {}): Promise<void> {
  if (opts.settings) {
    await page.addInitScript((s) => {
      localStorage.setItem('gaze-arena:settings', JSON.stringify({ version: 1, ...s }));
    }, opts.settings);
  }
  const query = ['test=1', opts.query].filter(Boolean).join('&');
  await page.goto(`./?${query}`);
  await page.waitForFunction(() => window.__gazeArena?.ready === true);
  await expect.poll(() => api(page, (a) => a.activeScenes())).toContain('ga-start');
  await expect.poll(() => api(page, (a) => a.targets().length)).toBeGreaterThan(0);
}

/** Runs a function against window.__gazeArena in the page. */
export function api<T, A = undefined>(page: Page, fn: (a: GazeArenaTestApi, arg: A) => T, arg?: A): Promise<T> {
  return page.evaluate(
    ([src, a]) => {
      const f = new Function(`return (${src})`)() as (x: GazeArenaTestApi, y: unknown) => T;
      return f(window.__gazeArena as GazeArenaTestApi, a);
    },
    [fn.toString(), arg] as const,
  ) as Promise<T>;
}

/** Converts logical coordinates to page coordinates using the canvas box. */
export async function toPage(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('canvas not found');
  return { x: box.x + (x / LOGICAL.width) * box.width, y: box.y + (y / LOGICAL.height) * box.height };
}

export async function moveTo(page: Page, x: number, y: number, steps = 1): Promise<void> {
  const p = await toPage(page, x, y);
  await page.mouse.move(p.x, p.y, { steps });
}

/** A single left click at a logical point (move, down, up), like a dwell-click device. */
export async function clickAt(page: Page, x: number, y: number): Promise<void> {
  await moveTo(page, x, y);
  await page.mouse.down();
  await page.mouse.up();
}

export function center(r: Rect): { x: number; y: number } {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

export async function target(page: Page, id: string) {
  const all = await api(page, (a) => a.targets());
  const t = all.find((x) => x.id === id);
  if (!t) throw new Error(`target ${id} not found among ${all.map((x) => x.id).join(', ')}`);
  return t;
}

export async function waitUnlocked(page: Page, timeout = 15_000): Promise<void> {
  await expect.poll(() => api(page, (a) => a.gateLocked()), { timeout }).toBe(false);
}

/** Clicks PLAY! and waits until the given scene is running and input is accepted. */
export async function pressPlay(page: Page, sceneKey: string): Promise<void> {
  const play = await target(page, 'play');
  const c = center(play.hitbox);
  await clickAt(page, c.x, c.y);
  await expect.poll(() => api(page, (a) => a.activeScenes())).toContain(sceneKey);
  await waitUnlocked(page);
  // Leave the spot where PLAY! was, so nothing starts disarmed by accident.
  await moveTo(page, 960, 1040);
}

export async function countEvents(page: Page, type: string): Promise<number> {
  return api(page, (a, t) => a.events().filter((e) => e.type === t).length, type);
}
