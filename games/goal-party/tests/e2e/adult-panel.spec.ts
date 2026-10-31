import { expect, test } from '@playwright/test';
import { api, clickButton, count, startGame, waitUnlocked } from './fixtures';

test('the adult panel opens only from the keyboard and pauses the game', async ({ page }) => {
  await startGame(page, { choices: 4 });
  const panel = page.locator('#ga-adult-panel');
  await expect(panel).toBeHidden();
  // Mouse clicks anywhere never open it.
  for (const [x, y] of [
    [10, 10],
    [1900, 10],
    [960, 540],
    [960, 1070],
  ] as const) {
    await page.mouse.click((x / 1920) * 1280, (y / 1080) * 720);
  }
  await expect(panel).toBeHidden();

  await page.keyboard.press('p');
  await expect(panel).toBeVisible();
  expect(await api(page, (a) => a.paused())).toBe(true);
  expect(await api(page, (a) => a.gateLocked())).toBe(true);
  await page.keyboard.press('p');
  await expect(panel).toBeHidden();
  await expect.poll(() => api(page, (a) => a.gateLocked())).toBe(false);

  // Esc opens it too when not in fullscreen (in fullscreen the browser uses Esc to leave it).
  await page.evaluate(() => (document.fullscreenElement ? document.exitFullscreen() : undefined));
  await page.keyboard.press('Escape');
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('buttons are locked while the panel is open', async ({ page }) => {
  await startGame(page, { choices: 4 });
  await page.keyboard.press('p');
  await page.locator('#ga-adult-panel').waitFor();
  await page.keyboard.press('p');
  await page.keyboard.press('p'); // open again
  await expect(page.locator('#ga-adult-panel')).toBeVisible();
  expect(await api(page, (a) => a.targets().every((t) => t.state === 'locked'))).toBe(true);
  await page.keyboard.press('p');
  await waitUnlocked(page);
  expect(await api(page, (a) => a.activeScenes())).toEqual(['goal-party']);
  await clickButton(page, 'knee-slide');
  await expect.poll(() => count(page, 'celebration-start')).toBe(1);
});

test('changing the number of choices in the panel rebuilds the level', async ({ page }) => {
  await startGame(page, { choices: 4 });
  await page.keyboard.press('p');
  await page.locator('select[data-setting="choices"]').selectOption('2');
  await page.keyboard.press('p');
  expect(await api(page, (a) => a.targets().map((t) => t.id))).toEqual(['knee-slide', 'airplane']);
});
