import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, footballerParts, lookKey } from '../src/art/footballer/parts';
import { ballSvg } from '../src/art/ball';

function parse(svg: string): Document {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
}

describe('footballer parts', () => {
  const parts = footballerParts(DEFAULT_LOOK);

  it('has every separate part', () => {
    expect(Object.keys(parts).sort()).toEqual(['arm', 'boot', 'hair', 'head', 'hood', 'leg', 'shorts', 'torso']);
  });

  it('every part is valid SVG with its declared size and a pivot inside it', () => {
    for (const p of Object.values(parts)) {
      const svg = parse(p.svg).documentElement;
      expect(svg.getAttribute('width')).toBe(String(p.width));
      expect(svg.getAttribute('height')).toBe(String(p.height));
      expect(p.pivotX).toBeGreaterThanOrEqual(0);
      expect(p.pivotX).toBeLessThanOrEqual(p.width);
      expect(p.pivotY).toBeGreaterThanOrEqual(0);
      expect(p.pivotY).toBeLessThanOrEqual(p.height);
    }
  });

  it('uses thick black outlines', () => {
    for (const p of Object.values(parts)) expect(p.svg).toContain('stroke-width="6"');
  });

  it('team colors are parameters', () => {
    const blue = footballerParts({ ...DEFAULT_LOOK, shirt: '#00E5FF' });
    expect(blue.torso.svg).toContain('#00E5FF');
    expect(blue.arm.svg).toContain('#00E5FF');
    expect(blue.torso.svg).not.toContain(DEFAULT_LOOK.shirt);
    expect(lookKey(DEFAULT_LOOK)).not.toBe(lookKey({ ...DEFAULT_LOOK, shirt: '#00E5FF' }));
  });

  it('the number does not change textures (it is drawn as text)', () => {
    expect(lookKey(DEFAULT_LOOK)).toBe(lookKey({ ...DEFAULT_LOOK, number: 7 }));
  });
});

describe('ball', () => {
  it('is valid SVG', () => {
    parse(ballSvg().svg);
  });
});
