import { expect, test } from '@playwright/test';
import { api, openGame, pressPlay } from '@gaze-arena/kit/testing';

test('starts from the PLAY! screen and only GazeButtons are interactive', async ({ page }) => {
  await openGame(page);
  await pressPlay(page, '__GAME_ID__');
  const objects = await api(page, (a) => a.interactiveObjects());
  expect(objects.length).toBeGreaterThan(0);
  expect(objects.every((o) => o.isGazeButton)).toBe(true);
});
