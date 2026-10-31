import { describe, expect, it } from 'vitest';
import { EFFECTS, Progression } from '../../src/progression';

describe('Progression', () => {
  it('starts at 0 / 5 with nothing unlocked', () => {
    const p = new Progression();
    expect(p.count).toBe(0);
    expect(p.next).toBe(5);
    expect(p.unlocked).toEqual([]);
  });

  it('unlocks fireworks → golden confetti cannon → stadium horns every 5 celebrations', () => {
    const p = new Progression();
    const unlocks: (string | null)[] = [];
    for (let i = 0; i < 20; i++) unlocks.push(p.record());
    expect(unlocks[4]).toBe('fireworks');
    expect(unlocks[9]).toBe('goldenCannon');
    expect(unlocks[14]).toBe('horns');
    expect(unlocks.filter(Boolean)).toEqual([...EFFECTS]);
    expect(p.unlocked).toEqual([...EFFECTS]);
  });

  it('next milestone moves 5 → 10 → 15 → none', () => {
    const p = new Progression();
    const nexts: (number | null)[] = [];
    for (let i = 0; i < 16; i++) {
      p.record();
      nexts.push(p.next);
    }
    expect(nexts.slice(0, 4)).toEqual([5, 5, 5, 5]);
    expect(nexts[4]).toBe(10);
    expect(nexts[9]).toBe(15);
    expect(nexts[14]).toBeNull();
    expect(nexts[15]).toBeNull();
  });

  it('effects stay unlocked for all later celebrations', () => {
    const p = new Progression();
    for (let i = 0; i < 7; i++) p.record();
    expect(p.unlocked).toEqual(['fireworks']);
  });
});
