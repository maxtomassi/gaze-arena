import { describe, expect, it } from 'vitest';
import { KIT_STRINGS, checkParity, mergeDictionaries } from '@gaze-arena/kit/core';
import en from '../../src/i18n/en.json';
import it_ from '../../src/i18n/it.json';

const PREFIX = 'goalParty.';

describe('goal-party strings', () => {
  it('every key exists in en and it, with the same placeholders', () => {
    expect(checkParity({ en, it: it_ })).toEqual([]);
  });

  it(`every key is prefixed with "${PREFIX}"`, () => {
    for (const key of [...Object.keys(en), ...Object.keys(it_)]) expect(key.startsWith(PREFIX)).toBe(true);
  });

  it('merges with the kit strings without overriding them', () => {
    expect(() => mergeDictionaries(KIT_STRINGS, { en, it: it_ })).not.toThrow();
  });
});

describe('goal-party spec strings', () => {
  const expected: Record<string, [string, string]> = {
    'goalParty.title': ['Goal Party!', 'Festa Gol!'],
    'goalParty.counter': ['celebrations: {count} / {next}', 'feste: {count} / {next}'],
    'goalParty.score': ['SCORE!', 'SEGNA!'],
    'goalParty.kneeSlide': ['Knee slide', 'Scivolata'],
    'goalParty.somersault': ['Somersault', 'Capriola'],
    'goalParty.airplane': ['Airplane', 'Aeroplano'],
    'goalParty.shirtOverHead': ['Shirt over head', 'Maglia su'],
    'goalParty.chant': ['GOOOAL!', 'GOOOL!'],
  };
  it.each(Object.entries(expected))('%s matches the spec', (key, [e, i]) => {
    expect((en as Record<string, string>)[key]).toBe(e);
    expect((it_ as Record<string, string>)[key]).toBe(i);
  });
});
