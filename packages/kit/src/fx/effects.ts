import Phaser from 'phaser';
import { getKit } from '../core/Kit';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../core/constants';
import { PALETTE } from '../art/palette';
import { intensityProfile } from './intensity';

export const TEX = {
  spark: 'ga-spark',
  confetti: 'ga-confetti',
  star: 'ga-star',
  pixel: 'ga-pixel',
} as const;

/** Creates the small particle textures used by kit effects (idempotent). */
export function ensureKitTextures(scene: Phaser.Scene): void {
  const make = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make(TEX.spark, 24, 24, (g) => g.fillStyle(0xffffff).fillCircle(12, 12, 12));
  make(TEX.confetti, 18, 10, (g) => g.fillStyle(0xffffff).fillRect(0, 0, 18, 10));
  make(TEX.pixel, 4, 4, (g) => g.fillStyle(0xffffff).fillRect(0, 0, 4, 4));
  make(TEX.star, 40, 40, (g) => {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 20 : 8;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(new Phaser.Math.Vector2(20 + r * Math.cos(a), 20 + r * Math.sin(a)));
    }
    g.fillStyle(0xffffff).fillPoints(pts, true);
  });
}

export const CONFETTI_COLORS = [PALETTE.yellow, PALETTE.magenta, PALETTE.cyan, PALETTE.green, PALETTE.red, PALETTE.white];
export const GOLD_COLORS = [0xffd60a, 0xffc300, 0xffe066, 0xfff3b0];

export interface ConfettiOptions {
  /** Particle count at "normal" intensity. */
  count: number;
  colors?: number[];
  /** Launch angle range in degrees (Phaser: 270 = up). */
  angle?: { min: number; max: number };
  speed?: { min: number; max: number };
  lifespan?: number;
  depth?: number;
}

/** One-shot confetti burst scaled by intensity. Returns the number of particles emitted. */
export function confettiBurst(scene: Phaser.Scene, x: number, y: number, o: ConfettiOptions): number {
  const kit = getKit(scene);
  ensureKitTextures(scene);
  const count = Math.max(1, Math.round(o.count * intensityProfile(kit.settings.value.intensity).particles));
  const emitter = scene.add.particles(x, y, TEX.confetti, {
    emitting: false,
    angle: o.angle ?? { min: 220, max: 320 },
    speed: o.speed ?? { min: 500, max: 1100 },
    gravityY: 900,
    rotate: { min: 0, max: 360 },
    scale: { min: 0.8, max: 1.6 },
    lifespan: o.lifespan ?? 2200,
    tint: o.colors ?? CONFETTI_COLORS,
  });
  emitter.setDepth(o.depth ?? 50);
  emitter.explode(count);
  scene.time.delayedCall((o.lifespan ?? 2200) + 200, () => emitter.destroy());
  kit.telemetry.record('confetti', { count });
  return count;
}

/** Firework burst: a ring of sparks. Particle count scales with intensity. */
export function fireworkBurst(scene: Phaser.Scene, x: number, y: number, color: number, baseCount = 60): number {
  const kit = getKit(scene);
  ensureKitTextures(scene);
  const count = Math.max(8, Math.round(baseCount * intensityProfile(kit.settings.value.intensity).particles));
  const emitter = scene.add.particles(x, y, TEX.spark, {
    emitting: false,
    speed: { min: 250, max: 520 },
    gravityY: 220,
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 1300,
    tint: [color, PALETTE.white],
    blendMode: Phaser.BlendModes.ADD,
  });
  emitter.setDepth(40);
  emitter.explode(count);
  scene.time.delayedCall(1500, () => emitter.destroy());
  kit.telemetry.record('firework', { count });
  return count;
}

/** Camera shake, skipped entirely in "calm". */
export function shake(scene: Phaser.Scene, durationMs = 350): boolean {
  const kit = getKit(scene);
  const intensity = intensityProfile(kit.settings.value.intensity).shake;
  if (intensity <= 0) return false;
  scene.cameras.main.shake(durationMs, intensity);
  kit.telemetry.record('shake', { intensity });
  return true;
}

/** Full-screen flash, limited to 3 per second and disabled in "calm". */
export function flash(scene: Phaser.Scene, color: number = PALETTE.white, durationMs = 220, alpha = 0.55): boolean {
  const kit = getKit(scene);
  if (!intensityProfile(kit.settings.value.intensity).flashes) return false;
  if (!kit.flash.tryFlash(performance.now())) return false;
  const rect = scene.add.rectangle(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, LOGICAL_WIDTH, LOGICAL_HEIGHT, color, alpha);
  rect.setDepth(1000).setScrollFactor(0);
  scene.tweens.add({ targets: rect, alpha: 0, duration: durationMs, onComplete: () => rect.destroy() });
  kit.telemetry.record('flash');
  return true;
}

/** Resolves after `ms` of scene time (pauses with the scene). */
export function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((resolve) => scene.time.delayedCall(ms, () => resolve()));
}

/** Promise wrapper around a tween. */
export function tweenAsync(scene: Phaser.Scene, config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise((resolve) => {
    scene.tweens.add({ ...config, onComplete: () => resolve() });
  });
}
