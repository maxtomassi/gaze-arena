import { expect, test } from '@playwright/test';
import { PARK, api, buttonCenter, clickAt, clickButton, count, moveTo, startGame, state, target, waitIdle } from './fixtures';
import { openGame } from '@gaze-arena/kit/testing';

test.describe('interaction rules', () => {
  test('every button is a GazeButton and nothing else is interactive (start screen and every level)', async ({ page }) => {
    await openGame(page, { settings: { locale: 'en' } });
    let objs = await api(page, (a) => a.interactiveObjects().filter((o) => o.scene === 'ga-start'));
    expect(objs.map((o) => o.id)).toEqual(['play']);
    expect(objs.every((o) => o.isGazeButton)).toBe(true);

    await startGame(page, { choices: 4 });
    for (const choices of [4, 2, 1] as const) {
      await api(page, (a, c) => a.updateSettings({ choices: c }), choices);
      objs = await api(page, (a) => a.interactiveObjects().filter((o) => o.scene === 'goal-party'));
      expect(objs.length).toBe(choices);
      expect(objs.every((o) => o.isGazeButton)).toBe(true);
      const ids = (await state(page)).buttons;
      expect(objs.map((o) => o.id).sort()).toEqual([...ids].sort());
    }
  });

  test('clicks in the rest area and dead zones cause no reaction', async ({ page }) => {
    await startGame(page, { choices: 4 });
    const rest = await api(page, (a) => a.restArea());
    if (!rest) throw new Error('no rest area');
    const points: [number, number][] = [];
    for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.1, 0.5, 0.9]) points.push([rest.x + rest.width * fx, rest.y + rest.height * fy]);
    points.push([100, 40], [960, 40], [1820, 40], [100, 1050], [960, 1050], [1820, 1050]);
    // Gap between the two left buttons.
    const top = await target(page, 'knee-slide');
    const bottom = await target(page, 'somersault');
    points.push([top.hitbox.x + top.hitbox.width / 2, (top.hitbox.y + top.hitbox.height + bottom.hitbox.y) / 2]);
    const before = await state(page);
    for (const [x, y] of points) {
      await clickAt(page, x, y);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(500);
    expect(await count(page, 'activate')).toBe(1); // only the PLAY! click
    expect(await count(page, 'celebration-start')).toBe(0);
    const after = await state(page);
    expect(after).toEqual(before);
    expect(await api(page, (a) => a.gateLocked())).toBe(false);
  });

  test('level 1: dead zones and the sides of the SCORE! button cause no reaction', async ({ page }) => {
    await startGame(page, { choices: 1 });
    for (const [x, y] of [
      [960, 40],
      [960, 1050],
      [60, 549],
      [1860, 549],
    ] as const) {
      await clickAt(page, x, y);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(400);
    expect(await count(page, 'celebration-start')).toBe(0);
  });

  test('10 clicks in a row on the same button without leaving it: exactly one celebration', async ({ page }) => {
    test.setTimeout(60_000);
    await startGame(page, { choices: 4 });
    const c = await buttonCenter(page, 'knee-slide');
    await moveTo(page, c.x, c.y);
    for (let i = 0; i < 10; i++) {
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForTimeout(1100); // like a device in Repeat Click mode
    }
    await waitIdle(page);
    expect(await count(page, 'celebration-start')).toBe(1);
    expect((await state(page)).count).toBe(1);
  });

  test('during a celebration other buttons ignore clicks and look locked', async ({ page }) => {
    await startGame(page, { choices: 4 });
    await clickButton(page, 'knee-slide');
    await expect.poll(async () => (await state(page)).celebrating).toBe('knee-slide');
    for (const id of ['somersault', 'airplane', 'shirt-over-head']) {
      const t = await target(page, id);
      expect(t.state).toBe('locked');
      expect(t.alpha).toBeCloseTo(0.6, 2);
    }
    await clickButton(page, 'airplane');
    await clickButton(page, 'somersault');
    await waitIdle(page);
    expect(await count(page, 'celebration-start')).toBe(1);
    const ignored = await api(page, (a) => a.events().filter((e) => e.type === 'click-ignored').map((e) => e.data?.reason));
    expect(ignored).toContain('ignored-locked');
    for (const id of ['somersault', 'airplane', 'shirt-over-head', 'knee-slide']) expect((await target(page, id)).state).not.toBe('locked');
  });

  test('after the celebration, leaving and re-entering a button re-arms it', async ({ page }) => {
    await startGame(page, { choices: 4 });
    await clickButton(page, 'somersault');
    await waitIdle(page);
    // Still on the button: another click does nothing.
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(700);
    expect(await count(page, 'celebration-start')).toBe(1);
    // Leave and come back: it works again.
    await moveTo(page, PARK.x, PARK.y);
    const c = await buttonCenter(page, 'somersault');
    await moveTo(page, c.x, c.y);
    expect((await target(page, 'somersault')).state).toBe('hovered');
    await page.mouse.down();
    await page.mouse.up();
    await expect.poll(() => count(page, 'celebration-start')).toBe(2);
  });

  test('hover shows the hovered state and plays one tick, without activating', async ({ page }) => {
    await startGame(page, { choices: 2 });
    const ticks = () => api(page, (a) => a.audioLog().filter((e) => e.id === 'tick').length);
    const before = await ticks();
    const c = await buttonCenter(page, 'airplane');
    await moveTo(page, c.x, c.y);
    await moveTo(page, c.x + 10, c.y + 10);
    expect((await target(page, 'airplane')).state).toBe('hovered');
    expect((await ticks()) - before).toBe(1);
    await page.waitForTimeout(1500);
    expect(await count(page, 'celebration-start')).toBe(0);
  });

  test('level 1: SCORE! steps aside during the celebration and comes back disarmed under a still pointer', async ({ page }) => {
    await startGame(page, { choices: 1 });
    await clickButton(page, 'score');
    await expect.poll(async () => (await state(page)).celebrating).not.toBeNull();
    expect((await target(page, 'score')).enabled).toBe(false);
    expect((await state(page)).playerVisible).toBe(true);
    await waitIdle(page);
    expect((await target(page, 'score')).enabled).toBe(true);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(600);
    expect(await count(page, 'celebration-start')).toBe(1);
    await clickButton(page, 'score');
    await expect.poll(() => count(page, 'celebration-start')).toBe(2);
  });
});
