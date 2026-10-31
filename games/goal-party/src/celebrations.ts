import type Phaser from 'phaser';
import { REST_POSE, type Footballer } from '@gaze-arena/kit';
import type { CelebrationId } from './config';

/**
 * Choreographies (about 3 s each) as tweens on the footballer's parts.
 * `range` is how far the player may move sideways from home, in rig units.
 */
export type Choreography = (scene: Phaser.Scene, f: Footballer, range: number) => Promise<void>;

/** Drives `fn(progress 0..1)` for `ms` with scene time. */
function animate(scene: Phaser.Scene, ms: number, fn: (p: number) => void, ease = 'Linear'): Promise<void> {
  return new Promise((resolve) => {
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: ms,
      ease,
      onUpdate: (tw) => fn(tw.getValue() ?? 0),
      onComplete: () => {
        fn(1);
        resolve();
      },
    });
  });
}

const kneeSlide: Choreography = async (scene, f, range) => {
  const r = Math.min(range, 260);
  await f.sequence([
    [{ x: -r, face: 1, armL: 35, armR: 35, legL: 22, legR: -12, bodyAngle: 6 }, 380, 'Sine.easeOut'],
    [{ legL: -12, legR: 22 }, 160],
  ]);
  // Drop to the knees, lean back, arms up, and slide across.
  await f.to({ bodyY: 120, legL: 78, legR: -78, bodyAngle: -16, armL: 160, armR: 160, head: -10 }, 220, 'Quad.easeOut');
  await animate(scene, 1300, (p) => f.setPose({ x: -r + 2 * r * p }), 'Cubic.easeOut');
  await f.to({ head: 8, armL: 175, armR: 175 }, 260, 'Sine.easeInOut');
  await f.to({ ...REST_POSE, x: r }, 420, 'Back.easeOut');
  await f.to({ x: 0 }, 300);
};

const somersault: Choreography = async (scene, f) => {
  await f.to({ bodyY: 50, armL: 40, armR: 40, legL: 10, legR: 10 }, 260, 'Quad.easeOut');
  const air = 900;
  const jump = (async () => {
    await f.to({ y: -230, bodyY: 0, armL: 150, armR: 150, legL: -30, legR: -30 }, air / 2, 'Quad.easeOut');
    await f.to({ y: 0 }, air / 2, 'Quad.easeIn');
  })();
  const spin = animate(scene, air, (p) => f.setPose({ bodyAngle: 360 * p }), 'Sine.easeInOut');
  await Promise.all([jump, spin]);
  f.setPose({ bodyAngle: 0 });
  await f.to({ bodyY: 60, legL: 14, legR: 14, armL: 60, armR: 60 }, 160, 'Quad.easeOut');
  await f.to({ bodyY: 0, armL: 155, armR: 155, legL: 8, legR: 8 }, 300, 'Back.easeOut');
  for (let i = 0; i < 2; i++) {
    await f.to({ y: -60, armL: 175, armR: 175 }, 220, 'Quad.easeOut');
    await f.to({ y: 0, armL: 150, armR: 150 }, 220, 'Quad.easeIn');
  }
  await f.rest(320);
};

const airplane: Choreography = async (scene, f, range) => {
  const r = Math.min(range, 230);
  await f.to({ armL: 92, armR: 92, bodyAngle: 0 }, 300, 'Back.easeOut');
  // Run a loop: sideways swing with depth (higher = farther), banking into the turn.
  await animate(scene, 2200, (p) => {
    const t = p * Math.PI * 2;
    const vx = Math.cos(t);
    f.setPose({
      x: r * Math.sin(t),
      y: -40 * (1 - Math.cos(t)) * 0.5,
      face: vx >= 0 ? 1 : -1,
      bodyAngle: 14 * Math.sin(t * 2),
      armL: 92 + 18 * Math.sin(t),
      armR: 92 - 18 * Math.sin(t),
      legL: 22 * Math.sin(t * 10),
      legR: -22 * Math.sin(t * 10),
      bodyY: -10 * Math.abs(Math.sin(t * 10)),
    });
  });
  await f.rest(380);
};

const shirtOverHead: Choreography = async (scene, f, range) => {
  const r = Math.min(range, 200);
  await f.to({ armL: 170, armR: 170 }, 260, 'Quad.easeOut');
  await f.to({ hood: 1, armL: 150, armR: 150 }, 240, 'Quad.easeOut');
  await animate(scene, 1800, (p) => {
    const t = p * Math.PI * 2;
    f.setPose({
      x: r * Math.sin(t),
      face: Math.cos(t) >= 0 ? 1 : -1,
      armL: 150 + 25 * Math.sin(t * 6),
      armR: 150 - 25 * Math.sin(t * 6),
      legL: 24 * Math.sin(t * 9),
      legR: -24 * Math.sin(t * 9),
      bodyY: -8 * Math.abs(Math.sin(t * 9)),
      head: 8 * Math.sin(t * 3),
    });
  });
  await f.to({ hood: 0, armL: 120, armR: 120 }, 260);
  await f.rest(380);
};

export const CHOREOGRAPHIES: Record<CelebrationId, Choreography> = {
  'knee-slide': kneeSlide,
  somersault,
  airplane,
  'shirt-over-head': shirtOverHead,
};
