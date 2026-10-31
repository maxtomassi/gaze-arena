import { expect, test } from '@playwright/test';
import { api, count, startGame, state } from './fixtures';

test('5 minutes without clicks: no state change, only an invitation every 30 s', async ({ page }) => {
  await page.clock.install();
  await startGame(page, { choices: 4 });
  const before = await state(page);
  const activations = await count(page, 'activate');
  // Step through 5 minutes in 30 s jumps of the page clock.
  const base = await count(page, 'invitation');
  let last = base;
  for (let i = 1; i <= 10; i++) {
    await page.clock.fastForward(30_000);
    await expect.poll(() => count(page, 'invitation')).toBeGreaterThan(last);
    last = await count(page, 'invitation');
  }
  // One per 30 s: 10 in 5 minutes (11 if real time crossed one more boundary while stepping).
  expect(last - base).toBeGreaterThanOrEqual(10);
  expect(last - base).toBeLessThanOrEqual(11);
  // Let the last invitation animation play out.
  await page.waitForTimeout(2500);
  expect(await state(page)).toEqual(before);
  expect(await count(page, 'activate')).toBe(activations);
  expect(await count(page, 'celebration-start')).toBe(0);
  expect(await api(page, (a) => a.activeScenes())).toEqual(['goal-party']);
  // Invitations are decoration: the crowd calls quietly.
  const calls = await api(page, (a) => a.audioLog().filter((e) => e.id === 'crowd-roar').length);
  expect(calls).toBeGreaterThanOrEqual(10);
});
