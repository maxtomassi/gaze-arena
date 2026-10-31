import { expect, test } from '@playwright/test';
import { api, startGame, state, target } from './fixtures';
import type { Rect } from '@gaze-arena/kit/core';

const overlap = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const targetScale of [0.8, 1.5]) {
  test(`targetScale ${targetScale}: buttons stay within y 108–990 and never overlap the rest area`, async ({ page }) => {
    await startGame(page, { targetScale, choices: 4 });
    for (const choices of [4, 2, 1] as const) {
      await api(page, (a, c) => a.updateSettings({ choices: c }), choices);
      const targets = await api(page, (a) => a.targets());
      const rest = await api(page, (a) => a.restArea());
      expect(targets.length).toBe(choices);
      for (const t of targets) {
        expect(t.hitbox.y).toBeGreaterThanOrEqual(108);
        expect(t.hitbox.y + t.hitbox.height).toBeLessThanOrEqual(990.001);
        if (choices !== 1 && rest) expect(overlap(t.hitbox, rest)).toBe(false);
        for (const u of targets) if (u !== t) expect(overlap(t.hitbox, u.hitbox)).toBe(false);
      }
    }
  });
}

test('all labels fit their buttons in en and it, at every level and at scales 0.8, 1 and 1.5', async ({ page }) => {
  await startGame(page, { choices: 4 });
  const play = await api(page, (a) => a.targets());
  expect(play.length).toBeGreaterThan(0);
  for (const locale of ['en', 'it'] as const) {
    for (const targetScale of [0.8, 1, 1.5]) {
      for (const choices of [4, 2, 1] as const) {
        await api(page, (a, s) => a.updateSettings(s), { locale, targetScale, choices });
        for (const t of await api(page, (a) => a.targets())) {
          const where = `${t.id} ${locale} scale ${targetScale} choices ${choices}`;
          expect(t.label, where).not.toBeNull();
          const l = t.label as NonNullable<typeof t.label>;
          expect(l.fits, where).toBe(true);
          expect(l.fontSize, where).toBeGreaterThanOrEqual(34);
          expect(l.bounds.x, where).toBeGreaterThanOrEqual(t.graphic.x);
          expect(l.bounds.x + l.bounds.width, where).toBeLessThanOrEqual(t.graphic.x + t.graphic.width);
          expect(l.bounds.y, where).toBeGreaterThanOrEqual(t.graphic.y);
          expect(l.bounds.y + l.bounds.height, where).toBeLessThanOrEqual(t.graphic.y + t.graphic.height);
        }
      }
    }
  }
});

test('switching locale in the adult panel (P) updates the scene', async ({ page }) => {
  await startGame(page, { choices: 4 });
  expect((await target(page, 'knee-slide')).label?.text).toBe('Knee slide');
  expect((await state(page)).counterText).toBe('celebrations: 0 / 5');
  await page.keyboard.press('p');
  const panel = page.locator('#ga-adult-panel');
  await expect(panel).toBeVisible();
  await panel.locator('select[data-setting="locale"]').selectOption('it');
  await page.keyboard.press('p');
  await expect(panel).toBeHidden();
  expect((await target(page, 'knee-slide')).label?.text).toBe('Scivolata');
  expect((await target(page, 'shirt-over-head')).label?.text).toBe('Maglia su');
  expect((await state(page)).counterText).toBe('feste: 0 / 5');
  await expect(page).toHaveTitle('Festa Gol!');
  expect(await api(page, (a) => a.settings().locale)).toBe('it');
});
