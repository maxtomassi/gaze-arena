import { describe, expect, it } from 'vitest';
import { DEAD_ZONE_BOTTOM, DEAD_ZONE_TOP, rectsOverlap, type Choices } from '@gaze-arena/kit/core';
import { levelLayout } from '../../src/layout';

const SCALES = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5];
const LEVELS: Choices[] = [1, 2, 4];

describe('goal-party layouts', () => {
  it('level 3 at scale 1 matches the spec columns and rest area', () => {
    const l = levelLayout(4, 1);
    expect(l.buttons).toEqual(['knee-slide', 'somersault', 'airplane', 'shirt-over-head']);
    expect(l.restArea).toEqual({ x: 580, y: 240, width: 760, height: 600 });
    const [ks, ss, ap, sh] = l.slots.map((s) => s.graphic);
    expect(ks?.x).toBe(120);
    expect(ap?.x).toBe(1460);
    expect(ks?.y).toBeLessThan(ss?.y ?? 0);
    expect(ap?.y).toBeLessThan(sh?.y ?? 0);
  });

  it('level 2 has two 340×420 buttons left and right', () => {
    const l = levelLayout(2, 1);
    expect(l.buttons).toEqual(['knee-slide', 'airplane']);
    for (const s of l.slots) expect(s.graphic).toMatchObject({ width: 340, height: 420 });
  });

  it('level 1 has one 1000×700 SCORE! button', () => {
    const l = levelLayout(1, 1);
    expect(l.buttons).toEqual(['score']);
    expect(l.slots[0]?.graphic).toMatchObject({ width: 1000, height: 700 });
  });

  for (const choices of LEVELS) {
    it.each(SCALES)(`${choices} choice(s), targetScale %s: within y 108–990 and clear of the rest area`, (s) => {
      const l = levelLayout(choices, s);
      for (const slot of l.slots) {
        expect(slot.hitbox.y).toBeGreaterThanOrEqual(DEAD_ZONE_TOP);
        expect(slot.hitbox.y + slot.hitbox.height).toBeLessThanOrEqual(DEAD_ZONE_BOTTOM + 1e-6);
        if (choices !== 1) expect(rectsOverlap(slot.hitbox, l.restArea)).toBe(false);
      }
    });
  }
});
