import { describe, expect, it } from 'vitest';
import { formatOf, soundCandidates, type SoundDef } from '../src/audio/sounds';

const registry = new Map<string, SoundDef>(
  [
    { id: 'chant', category: 'voice', locales: { en: 'en/chant.mp3', it: 'it/chant.mp3' }, fallback: 'generic' },
    { id: 'chant-en-only', category: 'voice', locales: { en: 'en/only.mp3' }, fallback: 'generic' },
    { id: 'chant-none', category: 'voice', locales: {}, fallback: 'generic' },
    { id: 'generic', category: 'voice', src: 'common/generic.wav' },
    { id: 'loop-a', category: 'ui', src: 'a.wav', fallback: 'loop-b' },
    { id: 'loop-b', category: 'ui', fallback: 'loop-a' },
  ].map((d) => [d.id, d as SoundDef]),
);

describe('soundCandidates (locale → en → generic)', () => {
  it('uses the current locale first', () => {
    expect(soundCandidates(registry, 'chant', 'it').map((c) => c.url)).toEqual([
      'it/chant.mp3',
      'en/chant.mp3',
      'common/generic.wav',
    ]);
  });

  it('falls back to en when the locale is missing', () => {
    expect(soundCandidates(registry, 'chant-en-only', 'it').map((c) => c.url)).toEqual(['en/only.mp3', 'common/generic.wav']);
  });

  it('falls back to the generic sound when no clip exists', () => {
    const c = soundCandidates(registry, 'chant-none', 'it');
    expect(c.map((x) => x.url)).toEqual(['common/generic.wav']);
    expect(c[0]?.def.id).toBe('generic');
  });

  it('survives fallback cycles and unknown ids', () => {
    expect(soundCandidates(registry, 'loop-a', 'en').map((c) => c.url)).toEqual(['a.wav']);
    expect(soundCandidates(registry, 'missing', 'en')).toEqual([]);
  });
});

describe('formatOf', () => {
  it('reads extensions and data URIs', () => {
    expect(formatOf('a/b/tick.wav')).toBe('wav');
    expect(formatOf('x.mp3?v=1')).toBe('mp3');
    expect(formatOf('data:audio/mpeg;base64,AAA')).toBe('mp3');
    expect(formatOf('data:audio/x-wav;base64,AAA')).toBe('wav');
  });
});
