import Phaser from 'phaser';
import { GazeButton, PALETTE, centeredLayout, confettiBurst, getKit, wait } from '@gaze-arena/kit';

export const GAME_SCENE_KEY = '__GAME_ID__';

/** Starting point: one big button that throws confetti. Replace with the game described in SPEC.md. */
export class GameScene extends Phaser.Scene {
  constructor() {
    super(GAME_SCENE_KEY);
  }

  create(): void {
    const kit = getKit(this);
    this.cameras.main.setBackgroundColor(PALETTE.night);
    const layout = centeredLayout({ baseSize: { width: 800, height: 500 }, targetScale: kit.settings.value.targetScale });
    kit.zones.setLayout(layout);
    const slot = layout.slots[0];
    if (!slot) return;
    new GazeButton(this, {
      id: 'go',
      graphic: slot.graphic,
      color: PALETTE.magenta,
      labelKey: '__GAME_KEY__.go',
      onActivate: async () => {
        confettiBurst(this, 960, 990, { count: 120 });
        await wait(this, 1500);
      },
    });
  }
}
