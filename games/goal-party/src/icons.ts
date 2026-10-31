import Phaser from 'phaser';
import { PALETTE, type IconPainter } from '@gaze-arena/kit';
import type { CelebrationId } from './config';

/** Line-art icons drawn in code, centered on (0, 0) inside a size × size box. */

const line = (g: Phaser.GameObjects.Graphics, size: number, color: number) => {
  g.lineStyle(Math.max(6, size * 0.075), color, 1);
};

const kneeSlide: IconPainter = (g, size, color) => {
  const s = size / 2;
  line(g, size, color);
  // ground and speed lines
  g.lineBetween(-s * 0.85, s * 0.75, s * 0.85, s * 0.75);
  g.lineBetween(-s * 0.85, s * 0.45, -s * 0.55, s * 0.45);
  g.lineBetween(-s * 0.9, s * 0.15, -s * 0.6, s * 0.15);
  // kneeling body leaning back, arms up
  g.strokeCircle(s * 0.05, -s * 0.5, s * 0.17);
  g.lineBetween(s * 0.15, -s * 0.32, s * 0.3, s * 0.3); // torso
  g.lineBetween(s * 0.3, s * 0.3, -s * 0.15, s * 0.55); // thigh
  g.lineBetween(-s * 0.15, s * 0.55, -s * 0.45, s * 0.72); // shin on ground
  g.lineBetween(s * 0.2, -s * 0.15, s * 0.65, -s * 0.75); // arm up
  g.lineBetween(s * 0.2, -s * 0.15, -s * 0.35, -s * 0.7); // arm up
};

const somersault: IconPainter = (g, size, color) => {
  const s = size / 2;
  line(g, size, color);
  const r = s * 0.62;
  g.beginPath();
  g.arc(0, 0, r, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(230), false);
  g.strokePath();
  const a = Phaser.Math.DegToRad(-60);
  const tip = new Phaser.Math.Vector2(Math.cos(a) * r, Math.sin(a) * r);
  g.fillStyle(color, 1);
  g.fillTriangle(tip.x + s * 0.24, tip.y - s * 0.04, tip.x - s * 0.12, tip.y - s * 0.26, tip.x - s * 0.06, tip.y + s * 0.2);
  // tucked player in the middle
  g.fillCircle(-s * 0.08, -s * 0.12, s * 0.15);
  g.lineBetween(-s * 0.02, 0, s * 0.18, s * 0.2);
};

const airplane: IconPainter = (g, size, color) => {
  const s = size / 2;
  line(g, size, color);
  g.strokeCircle(0, -s * 0.5, s * 0.17);
  g.lineBetween(0, -s * 0.32, 0, s * 0.25); // body
  g.lineBetween(-s * 0.85, -s * 0.12, s * 0.85, -s * 0.12); // wings (arms out)
  g.lineBetween(0, s * 0.25, -s * 0.3, s * 0.75);
  g.lineBetween(0, s * 0.25, s * 0.3, s * 0.75);
  // circular motion
  g.lineStyle(Math.max(4, size * 0.04), color, 0.8);
  g.beginPath();
  g.arc(0, s * 0.62, s * 0.8, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
  g.strokePath();
};

const shirtOverHead: IconPainter = (g, size, color) => {
  const s = size / 2;
  line(g, size, color);
  // shirt pulled up over the head: a T-shirt shape with the head inside
  const pts = [
    [-0.32, -0.75],
    [0.32, -0.75],
    [0.8, -0.45],
    [0.62, -0.15],
    [0.38, -0.3],
    [0.38, 0.35],
    [-0.38, 0.35],
    [-0.38, -0.3],
    [-0.62, -0.15],
    [-0.8, -0.45],
  ].map(([x, y]) => new Phaser.Math.Vector2((x as number) * s, (y as number) * s));
  g.strokePoints(pts, true, true);
  // arms raised and legs below
  g.lineBetween(-s * 0.2, s * 0.35, -s * 0.3, s * 0.85);
  g.lineBetween(s * 0.2, s * 0.35, s * 0.3, s * 0.85);
};

const ball: IconPainter = (g, size) => {
  const r = size / 2 - 4;
  g.fillStyle(PALETTE.white, 1).fillCircle(0, 0, r);
  const patch = (cx: number, cy: number, pr: number, rot: number) => {
    const pts = Array.from({ length: 5 }, (_, i) => {
      const t = rot + (i * 2 * Math.PI) / 5;
      return new Phaser.Math.Vector2(cx + Math.cos(t) * pr, cy + Math.sin(t) * pr);
    });
    g.fillStyle(PALETTE.night, 1).fillPoints(pts, true);
  };
  patch(0, 0, r * 0.3, -Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    patch(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, r * 0.2, a);
  }
  g.lineStyle(6, PALETTE.black, 1).strokeCircle(0, 0, r);
};

export const ICONS: Record<CelebrationId | 'score', IconPainter> = {
  'knee-slide': kneeSlide,
  somersault,
  airplane,
  'shirt-over-head': shirtOverHead,
  score: ball,
};
