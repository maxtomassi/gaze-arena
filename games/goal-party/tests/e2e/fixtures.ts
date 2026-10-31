import { expect, type Page } from '@playwright/test';
import { api, center, clickAt, moveTo, openGame, pressPlay, target, waitUnlocked } from '@gaze-arena/kit/testing';
import type { SettingsData } from '@gaze-arena/kit/core';
import type { GoalPartyState } from '../../src/scenes/GoalPartyScene';

export const SCENE = 'goal-party';
/** A spot in the bottom dead zone: never a target. */
export const PARK = { x: 960, y: 1040 } as const;

export async function startGame(page: Page, settings: Partial<SettingsData> = {}, query?: string): Promise<void> {
  await openGame(page, { settings: { locale: 'en', ...settings }, query });
  await pressPlay(page, SCENE);
}

export function state(page: Page): Promise<GoalPartyState> {
  return api(page, (a) => a.state() as GoalPartyState);
}

export function count(page: Page, type: string): Promise<number> {
  return api(page, (a, t) => a.events().filter((e) => e.type === t).length, type);
}

export async function buttonCenter(page: Page, id: string): Promise<{ x: number; y: number }> {
  return center((await target(page, id)).hitbox);
}

/** Moves onto a button from outside and clicks once. */
export async function clickButton(page: Page, id: string): Promise<void> {
  await moveTo(page, PARK.x, PARK.y);
  const c = await buttonCenter(page, id);
  await moveTo(page, c.x, c.y);
  await clickAt(page, c.x, c.y);
}

/** Waits for the current celebration (and any unlock show) to finish and input to re-open. */
export async function waitIdle(page: Page): Promise<void> {
  await expect.poll(async () => (await state(page)).celebrating, { timeout: 45_000 }).toBeNull();
  await waitUnlocked(page);
}

export { api, clickAt, moveTo, target, waitUnlocked };
