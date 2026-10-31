import { expect, test, type Page } from '@playwright/test';
import { api, clickButton, startGame, waitIdle } from './fixtures';

async function oneCelebration(page: Page, intensity: 'calm' | 'normal') {
  await startGame(page, { choices: 4, intensity });
  await clickButton(page, 'airplane');
  await waitIdle(page);
  return api(page, (a) => {
    const ev = a.events();
    const confetti = ev.filter((e) => e.type === 'confetti').reduce((s, e) => s + Number(e.data?.count ?? 0), 0);
    const crowd = a.audioLog().find((e) => e.id === 'crowd-roar' && e.volume > 0 && e.t > 0);
    return {
      shakes: ev.filter((e) => e.type === 'shake').length,
      flashes: ev.filter((e) => e.type === 'flash').length,
      confetti,
      crowdVolume: a.audioLog().filter((e) => e.id === 'crowd-roar').at(-1)?.volume ?? -1,
      hadCrowd: Boolean(crowd),
    };
  });
}

test('intensity "calm": no shake, fewer confetti, quiet crowd (compared with "normal")', async ({ browser }) => {
  const normalPage = await browser.newPage();
  const calmPage = await browser.newPage();
  test.setTimeout(120_000);
  const normal = await oneCelebration(normalPage, 'normal');
  const calm = await oneCelebration(calmPage, 'calm');
  expect(normal.shakes).toBeGreaterThan(0);
  expect(calm.shakes).toBe(0);
  expect(calm.flashes).toBe(0);
  expect(calm.confetti).toBeGreaterThan(0);
  expect(calm.confetti).toBeLessThan(normal.confetti * 0.5);
  expect(calm.crowdVolume).toBeGreaterThan(0);
  expect(calm.crowdVolume).toBeLessThan(normal.crowdVolume * 0.5);
  await normalPage.close();
  await calmPage.close();
});
