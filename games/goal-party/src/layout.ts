import { centeredLayout, sideColumnsLayout, type Choices, type LayoutResult } from '@gaze-arena/kit/core';
import { LEVEL_BUTTONS, REST_AREA, SIZE_LEVEL1, SIZE_LEVEL2, SIZE_LEVEL3, type CelebrationId } from './config';

export interface LevelLayout extends LayoutResult {
  choices: Choices;
  /** Celebration bound to each slot; level 1 has a single "score" slot. */
  buttons: (CelebrationId | 'score')[];
}

export function levelLayout(choices: Choices, targetScale: number): LevelLayout {
  if (choices === 1) {
    return { ...centeredLayout({ baseSize: SIZE_LEVEL1, targetScale }), choices, buttons: ['score'] };
  }
  const rowsPerSide = choices === 2 ? 1 : 2;
  const base = choices === 2 ? SIZE_LEVEL2 : SIZE_LEVEL3;
  return {
    ...sideColumnsLayout({ rowsPerSide, baseSize: base, targetScale, preferredRest: REST_AREA }),
    choices,
    buttons: [...LEVEL_BUTTONS[choices]],
  };
}
