import Phaser from 'phaser';
import { DEAD_ZONE_BOTTOM, DEAD_ZONE_TOP, LOGICAL_HEIGHT, LOGICAL_WIDTH, PALETTE } from '@gaze-arena/kit';
import { BACKGROUND_TEXTURE, PITCH_Y } from './config';

/**
 * Night stadium background. Uses the generated image when it was loaded, otherwise draws the
 * code fallback (stands #16306B, pitch #1FAA59 from y 438) so the game never depends on it.
 * Returns which one was used.
 */
export function drawBackground(scene: Phaser.Scene): 'image' | 'fallback' {
  if (scene.textures.exists(BACKGROUND_TEXTURE)) {
    scene.add.image(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, BACKGROUND_TEXTURE).setDisplaySize(LOGICAL_WIDTH, LOGICAL_HEIGHT).setDepth(-100);
    drawDeadZoneBands(scene);
    return 'image';
  }
  drawFallback(scene);
  drawDeadZoneBands(scene);
  return 'fallback';
}

function drawFallback(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  // sky
  g.fillStyle(PALETTE.night, 1).fillRect(0, 0, LOGICAL_WIDTH, PITCH_Y);
  // stands
  g.fillStyle(PALETTE.arena, 1).fillRect(0, 170, LOGICAL_WIDTH, PITCH_Y - 170);
  g.fillStyle(0x10275a, 1);
  for (let row = 0; row < 4; row++) g.fillRect(0, 200 + row * 62, LOGICAL_WIDTH, 10);
  // crowd: deterministic colored dots
  const colors = [PALETTE.yellow, PALETTE.magenta, PALETTE.cyan, PALETTE.white, PALETTE.red];
  const rnd = new Phaser.Math.RandomDataGenerator(['goal-party']);
  for (let row = 0; row < 7; row++) {
    for (let x = 10 + (row % 2) * 14; x < LOGICAL_WIDTH; x += 28) {
      g.fillStyle(rnd.pick(colors), 0.55).fillCircle(x, 190 + row * 34 + rnd.between(-3, 3), 9);
    }
  }
  // floodlights
  for (const x of [200, 700, 1220, 1720]) {
    g.fillStyle(PALETTE.white, 0.07).fillTriangle(x, 130, x - 240, PITCH_Y + 300, x + 240, PITCH_Y + 300);
    g.fillStyle(0x3a4a70, 1).fillRect(x - 6, 140, 12, 60);
    g.fillStyle(PALETTE.white, 1).fillRoundedRect(x - 50, 116, 100, 34, 8);
    g.lineStyle(6, PALETTE.black, 1).strokeRoundedRect(x - 50, 116, 100, 34, 8);
  }
  // pitch with mowing stripes and lines
  g.fillStyle(PALETTE.green, 1).fillRect(0, PITCH_Y, LOGICAL_WIDTH, LOGICAL_HEIGHT - PITCH_Y);
  for (let i = 0; i < 6; i++) g.fillStyle(0x1b9a50, 1).fillRect(0, PITCH_Y + 30 + i * 100, LOGICAL_WIDTH, 50);
  g.lineStyle(8, PALETTE.white, 0.75);
  g.lineBetween(0, PITCH_Y + 24, LOGICAL_WIDTH, PITCH_Y + 24);
  g.lineBetween(LOGICAL_WIDTH / 2, PITCH_Y + 24, LOGICAL_WIDTH / 2, DEAD_ZONE_BOTTOM);
  g.strokeEllipse(LOGICAL_WIDTH / 2, 760, 560, 220);
}

/** Darker info band on top and decorative boards at the bottom (never clickable). */
function drawDeadZoneBands(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-90);
  g.fillStyle(PALETTE.night, 0.85).fillRect(0, 0, LOGICAL_WIDTH, DEAD_ZONE_TOP);
  const colors = [PALETTE.magenta, PALETTE.cyan, PALETTE.yellow, PALETTE.arena];
  const w = LOGICAL_WIDTH / 8;
  for (let i = 0; i < 8; i++) {
    g.fillStyle(colors[i % colors.length] as number, 1).fillRect(i * w, DEAD_ZONE_BOTTOM, w, LOGICAL_HEIGHT - DEAD_ZONE_BOTTOM);
  }
  g.lineStyle(6, PALETTE.black, 1).lineBetween(0, DEAD_ZONE_BOTTOM, LOGICAL_WIDTH, DEAD_ZONE_BOTTOM);
}
