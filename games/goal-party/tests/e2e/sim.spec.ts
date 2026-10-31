import { expect, test } from '@playwright/test';
import { api, clickAt, moveTo, startGame } from './fixtures';

test.describe('?sim=1 simulator', () => {
  test('shows the hitbox / zone overlay and a badge', async ({ page }) => {
    await startGame(page, { choices: 4 }, 'sim=1');
    await expect(page.locator('.ga-sim-overlay')).toBeVisible();
    await expect(page.locator('#ga-sim-badge')).toContainText('SIM');
    expect((await api(page, (a) => a.sim()))?.active).toBe(true);
  });

  test('pointer jitter stays within ±25 px', async ({ page }) => {
    await startGame(page, { choices: 4 }, 'sim=1');
    for (let i = 0; i < 12; i++) {
      await clickAt(page, 960, 1040);
      await page.waitForTimeout(30);
    }
    const log = (await api(page, (a) => a.sim()))?.log ?? [];
    const clicks = log.filter((e) => e.kind === 'click');
    expect(clicks.length).toBeGreaterThanOrEqual(12);
    for (const e of log) {
      expect(Math.abs(e.x - e.rx)).toBeLessThanOrEqual(25.001);
      expect(Math.abs(e.y - e.ry)).toBeLessThanOrEqual(25.001);
    }
    const distinct = new Set(clicks.map((e) => `${Math.round(e.x)},${Math.round(e.y)}`));
    expect(distinct.size).toBeGreaterThan(3);
  });

  test('R toggles a repeat-click every 1100 ms', async ({ page }) => {
    await startGame(page, { choices: 4 }, 'sim=1');
    await moveTo(page, 960, 1040);
    const clickTimes = async () =>
      ((await api(page, (a) => a.sim()))?.log ?? []).filter((e) => e.kind === 'click').map((e) => e.t);
    await page.keyboard.press('r');
    expect((await api(page, (a) => a.sim()))?.repeating).toBe(true);
    await expect(page.locator('#ga-sim-badge')).toContainText('on');
    await expect.poll(async () => (await clickTimes()).length, { timeout: 15_000 }).toBeGreaterThanOrEqual(5);
    await page.keyboard.press('r');
    await expect(page.locator('#ga-sim-badge')).toContainText('off');
    const times = await clickTimes();
    const gaps = times
      .slice(1)
      .map((t, i) => t - (times[i] as number))
      .sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)] as number;
    expect(median).toBeGreaterThan(1000);
    expect(median).toBeLessThan(1300);
    // Off means off.
    await page.waitForTimeout(2500);
    expect((await clickTimes()).length).toBe(times.length);
  });

  test('repeat-click resting on a button gives one celebration only', async ({ page }) => {
    test.setTimeout(60_000);
    await startGame(page, { choices: 2 }, 'sim=1');
    const t = (await api(page, (a) => a.targets())).find((x) => x.id === 'knee-slide');
    if (!t) throw new Error('missing');
    await moveTo(page, t.hitbox.x + t.hitbox.width / 2, t.hitbox.y + t.hitbox.height / 2);
    await page.keyboard.press('r');
    await page.waitForTimeout(9000);
    await page.keyboard.press('r');
    const starts = await api(page, (a) => a.events().filter((e) => e.type === 'celebration-start').length);
    expect(starts).toBe(1);
  });
});
