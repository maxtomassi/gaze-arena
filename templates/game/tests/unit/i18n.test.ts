import { describe, expect, it } from 'vitest';
import { KIT_STRINGS, checkParity, mergeDictionaries } from '@gaze-arena/kit/core';
import en from '../../src/i18n/en.json';
import it_ from '../../src/i18n/it.json';

const PREFIX = '__GAME_KEY__.';

describe('__GAME_ID__ strings', () => {
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
