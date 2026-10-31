import Phaser from 'phaser';
import {
  DEAD_ZONE_BOTTOM,
  FONT_TITLE,
  GOLD_COLORS,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  OUTLINE,
  PALETTE,
  confettiBurst,
  fireworkBurst,
  flash,
  getKit,
  shake,
  wait,
} from '@gaze-arena/kit';
import type { EffectId } from './progression';

/** Effects that run during every celebration. */
export function baseCelebrationEffects(scene: Phaser.Scene, chantText: string): void {
  const kit = getKit(scene);
  kit.audio.play('crowd-roar');
  kit.audio.play('goalParty.chant');
  shake(scene, 400);
  flash(scene, PALETTE.white, 200, 0.35);
  confettiBurst(scene, LOGICAL_WIDTH * 0.3, 0, { count: 70, angle: { min: 30, max: 150 }, speed: { min: 200, max: 600 } });
  confettiBurst(scene, LOGICAL_WIDTH * 0.7, 0, { count: 70, angle: { min: 30, max: 150 }, speed: { min: 200, max: 600 } });
  chantBanner(scene, chantText);
}

/** Big "GOOOAL!" popping over the stands. Decoration only. */
function chantBanner(scene: Phaser.Scene, text: string): void {
  const t = scene.add
    .text(LOGICAL_WIDTH / 2, 190, text, {
      fontFamily: FONT_TITLE,
            padding: { x: 16, y: 8 },
      fontSize: '150px',
      color: '#FFD60A',
      stroke: '#000000',
      strokeThickness: OUTLINE * 2,
    })
    .setOrigin(0.5)
    .setDepth(60)
    .setScale(0.2)
    .setAngle(-6);
  scene.tweens.chain({
    targets: t,
    tweens: [
      { scale: 1.15, duration: 260, ease: 'Back.easeOut' },
      { scale: 1, angle: 4, duration: 900, ease: 'Sine.easeInOut', yoyo: true },
      { alpha: 0, scale: 1.3, duration: 300 },
    ],
    onComplete: () => t.destroy(),
  });
}

/** Unlocked effects, added to every later celebration. Each returns after its main beat. */
export const UNLOCKED_EFFECTS: Record<EffectId, (scene: Phaser.Scene) => Promise<void>> = {
  fireworks: async (scene) => {
    const kit = getKit(scene);
    const spots: [number, number, number][] = [
      [380, 230, PALETTE.yellow],
      [1540, 210, PALETTE.magenta],
      [960, 150, PALETTE.cyan],
    ];
    for (const [x, y, c] of spots) {
      kit.audio.play('fireworks', { volume: 0.8 });
      fireworkBurst(scene, x, y, c);
      flash(scene, c, 160, 0.2);
      await wait(scene, 380);
    }
  },
  goldenCannon: async (scene) => {
    const kit = getKit(scene);
    kit.audio.play('whoosh', { volume: 0.8 });
    const opts = { count: 90, colors: GOLD_COLORS, speed: { min: 900, max: 1500 }, lifespan: 2400 };
    confettiBurst(scene, 40, DEAD_ZONE_BOTTOM, { ...opts, angle: { min: 285, max: 315 } });
    confettiBurst(scene, LOGICAL_WIDTH - 40, DEAD_ZONE_BOTTOM, { ...opts, angle: { min: 225, max: 255 } });
    await wait(scene, 300);
  },
  horns: async (scene) => {
    const kit = getKit(scene);
    kit.audio.play('horn');
    hornGraphic(scene, 140, -1);
    hornGraphic(scene, LOGICAL_WIDTH - 140, 1);
    await wait(scene, 700);
    kit.audio.play('horn', { volume: 0.8 });
  },
};

/** A stadium horn blasting in the bottom dead zone (decoration only). */
function hornGraphic(scene: Phaser.Scene, x: number, dir: -1 | 1): void {
  const g = scene.add.graphics().setDepth(55);
  g.fillStyle(PALETTE.red, 1);
  g.lineStyle(OUTLINE, PALETTE.black, 1);
  const pts = [
    new Phaser.Math.Vector2(0, -16),
    new Phaser.Math.Vector2(-dir * 110, -60),
    new Phaser.Math.Vector2(-dir * 110, 60),
    new Phaser.Math.Vector2(0, 16),
  ];
  g.fillPoints(pts, true).strokePoints(pts, true);
  g.fillStyle(PALETTE.white, 1).fillCircle(dir * 18, 0, 22).strokeCircle(dir * 18, 0, 22);
  g.setPosition(x, LOGICAL_HEIGHT - 45).setScale(0.2);
  scene.tweens.chain({
    targets: g,
    tweens: [
      { scale: 0.75, duration: 200, ease: 'Back.easeOut' },
      { scale: 0.65, duration: 150, yoyo: true, repeat: 3 },
      { alpha: 0, duration: 300 },
    ],
    onComplete: () => g.destroy(),
  });
}
