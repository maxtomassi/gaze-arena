import { describe, expect, it } from 'vitest';
import {
  DEAD_ZONE_BOTTOM,
  DEAD_ZONE_TOP,
  HITBOX_FACTOR,
  LOGICAL_WIDTH,
  MIN_HITBOX,
  MIN_TARGET_GAP,
  rectsOverlap,
  type Rect,
} from '../src/core/constants';
import { centeredLayout, sideColumnsLayout, type LayoutResult } from '../src/ui/layout';

const SCALES = Array.from({ length: 15 }, (_, i) => Math.round((0.8 + i * 0.05) * 100) / 100);

function gapBetween(a: Rect, b: Rect): number {
  const dx = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), 0);
  const dy = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height), 0);
  return Math.max(dx, dy);
}

function checkRules(l: LayoutResult, restIsExclusive: boolean) {
  const eps = 1e-6;
  for (const s of l.slots) {
    expect(s.hitbox.y).toBeGreaterThanOrEqual(DEAD_ZONE_TOP - eps);
    expect(s.hitbox.y + s.hitbox.height).toBeLessThanOrEqual(DEAD_ZONE_BOTTOM + eps);
    expect(s.hitbox.x).toBeGreaterThanOrEqual(0);
    expect(s.hitbox.x + s.hitbox.width).toBeLessThanOrEqual(LOGICAL_WIDTH);
    expect(s.hitbox.width).toBeCloseTo(s.graphic.width * HITBOX_FACTOR, 6);
    expect(s.hitbox.height).toBeCloseTo(s.graphic.height * HITBOX_FACTOR, 6);
    // Never below the baseline minimum, whatever the cap.
    expect(Math.min(s.hitbox.width, s.hitbox.height)).toBeGreaterThanOrEqual(MIN_HITBOX * Math.min(l.requestedScale, 1) - eps);
    if (restIsExclusive) {
      expect(rectsOverlap(s.hitbox, l.restArea)).toBe(false);
      expect(gapBetween(s.hitbox, l.restArea)).toBeGreaterThanOrEqual(MIN_TARGET_GAP - eps);
    }
  }
  for (let i = 0; i < l.slots.length; i++) {
    for (let j = i + 1; j < l.slots.length; j++) {
      const a = l.slots[i]?.hitbox as Rect;
      const b = l.slots[j]?.hitbox as Rect;
      expect(rectsOverlap(a, b)).toBe(false);
      expect(gapBetween(a, b)).toBeGreaterThanOrEqual(MIN_TARGET_GAP - eps);
    }
  }
}

describe('sideColumnsLayout', () => {
  it.each(SCALES)('4 buttons at scale %s follow every rule', (s) => {
    const l = sideColumnsLayout({ rowsPerSide: 2, baseSize: { width: 340, height: 348 }, targetScale: s });
    expect(l.slots).toHaveLength(4);
    checkRules(l, true);
    expect(l.restArea.width).toBeGreaterThanOrEqual(520);
  });

  it.each(SCALES)('2 buttons at scale %s follow every rule', (s) => {
    const l = sideColumnsLayout({ rowsPerSide: 1, baseSize: { width: 340, height: 420 }, targetScale: s });
    expect(l.slots).toHaveLength(2);
    checkRules(l, true);
  });

  it('at scale 1 keeps the spec rest area and the 4-button size', () => {
    const l = sideColumnsLayout({ rowsPerSide: 2, baseSize: { width: 340, height: 348 }, targetScale: 1 });
    expect(l.restArea).toEqual({ x: 580, y: 240, width: 760, height: 600 });
    expect(l.slots[0]?.graphic.width).toBe(340);
    expect(l.slots[0]?.graphic.height).toBe(348);
    expect(l.capped).toBe(false);
  });

  it('caps height but keeps growing width when 4 buttons cannot grow taller', () => {
    const l = sideColumnsLayout({ rowsPerSide: 2, baseSize: { width: 340, height: 348 }, targetScale: 1.5 });
    expect(l.capped).toBe(true);
    expect(l.effectiveScale.x).toBeCloseTo(1.5, 2);
    expect(l.effectiveScale.y).toBeLessThan(1.01);
  });

  it('2 buttons reach full scale 1.5', () => {
    const l = sideColumnsLayout({ rowsPerSide: 1, baseSize: { width: 340, height: 420 }, targetScale: 1.5 });
    expect(l.capped).toBe(false);
  });

  it('slots are mirrored left/right', () => {
    const l = sideColumnsLayout({ rowsPerSide: 2, baseSize: { width: 340, height: 348 }, targetScale: 1.2 });
    const [lt, , rt] = l.slots;
    expect((lt?.graphic.x ?? 0) + (rt?.graphic.x ?? 0) + (lt?.graphic.width ?? 0)).toBeCloseTo(LOGICAL_WIDTH, 6);
  });
});

describe('centeredLayout', () => {
  it.each(SCALES)('1 button at scale %s stays in the play band', (s) => {
    const l = centeredLayout({ baseSize: { width: 1000, height: 700 }, targetScale: s });
    checkRules(l, false);
    expect(l.restArea).toEqual({ x: 0, y: DEAD_ZONE_TOP, width: LOGICAL_WIDTH, height: DEAD_ZONE_BOTTOM - DEAD_ZONE_TOP });
  });

  it('is 1000×700 at scale 1', () => {
    const l = centeredLayout({ baseSize: { width: 1000, height: 700 }, targetScale: 1 });
    expect(l.slots[0]?.graphic).toMatchObject({ width: 1000, height: 700 });
  });
});
