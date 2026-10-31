import { describe, expect, it } from 'vitest';
import { FlashLimiter } from '../src/fx/FlashLimiter';
import { INTENSITY_PROFILES } from '../src/fx/intensity';

describe('FlashLimiter', () => {
  it('allows at most 3 flashes in any 1 s window', () => {
    const f = new FlashLimiter();
    const allowed = Array.from({ length: 10 }, (_, i) => f.tryFlash(i * 100)).filter(Boolean).length;
    expect(allowed).toBe(3);
    expect(f.tryFlash(1000)).toBe(true);
  });

  it('a steady 3/s is allowed, 4/s is not', () => {
    const f = new FlashLimiter();
    const ok = Array.from({ length: 30 }, (_, i) => f.tryFlash(i * 334)).every(Boolean);
    expect(ok).toBe(true);
    const g = new FlashLimiter();
    expect(Array.from({ length: 8 }, (_, i) => g.tryFlash(i * 250)).every(Boolean)).toBe(false);
  });
});

describe('intensity profiles', () => {
  it('calm: no shake, no flashes, fewer particles, quiet crowd', () => {
    const c = INTENSITY_PROFILES.calm;
    const n = INTENSITY_PROFILES.normal;
    expect(c.shake).toBe(0);
    expect(c.flashes).toBe(false);
    expect(c.particles).toBeLessThan(n.particles);
    expect(c.crowdVolume).toBeLessThan(n.crowdVolume);
    expect(INTENSITY_PROFILES.max.shake).toBeGreaterThan(n.shake);
  });
});
