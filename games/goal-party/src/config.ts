import { PALETTE, type Choices } from '@gaze-arena/kit/core';

export const SCENE_KEY = 'goal-party';

export const CELEBRATIONS = ['knee-slide', 'somersault', 'airplane', 'shirt-over-head'] as const;
export type CelebrationId = (typeof CELEBRATIONS)[number];

export const CELEBRATION_LABEL: Record<CelebrationId, string> = {
  'knee-slide': 'goalParty.kneeSlide',
  somersault: 'goalParty.somersault',
  airplane: 'goalParty.airplane',
  'shirt-over-head': 'goalParty.shirtOverHead',
};

export const CELEBRATION_COLOR: Record<CelebrationId, number> = {
  'knee-slide': PALETTE.magenta,
  somersault: PALETTE.cyan,
  airplane: PALETTE.magenta,
  'shirt-over-head': PALETTE.cyan,
};

/** Icon color that contrasts with each button color. Labels stay white: they carry a black outline,
 * and dark letters inside a black outline blur into one shape. */
export function inkFor(color: number): number {
  return color === PALETTE.cyan ? PALETTE.night : PALETTE.white;
}

/**
 * Buttons per level (adult setting "number of choices"), in layout slot order
 * (left column top → bottom, then right column top → bottom).
 */
export const LEVEL_BUTTONS: Record<Choices, readonly CelebrationId[]> = {
  1: [],
  2: ['knee-slide', 'airplane'],
  4: ['knee-slide', 'somersault', 'airplane', 'shirt-over-head'],
};

/** Graphic sizes at targetScale 1. Level 3 is 348 tall so two rows + 60 px gap fit the play band. */
export const SIZE_LEVEL1 = { width: 1000, height: 700 };
export const SIZE_LEVEL2 = { width: 340, height: 420 };
export const SIZE_LEVEL3 = { width: 340, height: 348 };

/** Spec rest area for the side-column levels. */
export const REST_AREA = { x: 580, y: 240, width: 760, height: 600 };

/** Pitch starts at this y (spec). */
export const PITCH_Y = 438;

export const PLAYER_LOOK = {
  shirt: '#E63946',
  trim: '#FFFFFF',
  shorts: '#FFFFFF',
  boots: '#111111',
  skin: '#F2C29B',
  hair: '#3B2416',
  number: 10,
};

export const BALL_TEXTURE = 'gp-ball';
export const BACKGROUND_TEXTURE = 'gp-stadium-night';
export const BACKGROUND_FILE = 'assets/img/stadium-night.webp';
