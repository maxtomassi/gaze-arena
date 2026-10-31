import { expect, test } from '@playwright/test';
import { api, clickButton, count, startGame, state, waitIdle } from './fixtures';

test('every 5 celebrations unlocks an effect with a "NEW EFFECT!" show; it joins later celebrations', async ({ page }) => {
  test.setTimeout(120_000);
  await startGame(page, { choices: 4 });
  const order = ['knee-slide', 'somersault', 'airplane', 'shirt-over-head', 'knee-slide', 'somersault'];
  for (const [i, id] of order.entries()) {
    await clickButton(page, id);
    await expect.poll(() => count(page, 'celebration-start')).toBe(i + 1);
    await waitIdle(page);
    if (i === 3) expect((await state(page)).counterText).toBe('celebrations: 4 / 5');
  }
  const s = await state(page);
  expect(s.count).toBe(6);
  expect(s.unlocked).toEqual(['fireworks']);
  expect(s.counterText).toBe('celebrations: 6 / 10');
  const unlocks = await api(page, (a) => a.events().filter((e) => e.type === 'unlock').map((e) => e.data?.effect));
  expect(unlocks).toEqual(['fireworks']);
  const starts = await api(page, (a) => a.events().filter((e) => e.type === 'celebration-start').map((e) => e.data?.effects));
  expect(starts[4]).toEqual([]);
  expect(starts[5]).toEqual(['fireworks']);
  expect(await count(page, 'firework')).toBeGreaterThan(0);
});
