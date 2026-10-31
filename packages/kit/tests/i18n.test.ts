import { describe, expect, it, vi } from 'vitest';
import { I18n, KIT_STRINGS, checkParity, interpolate, mergeDictionaries } from '../src/i18n/I18n';
import { detectLocale } from '../src/i18n/locales';

describe('kit strings', () => {
  it('every key exists in every locale with the same placeholders', () => {
    expect(checkParity(KIT_STRINGS)).toEqual([]);
  });

  it('kit keys are prefixed with "common."', () => {
    for (const dict of Object.values(KIT_STRINGS)) {
      for (const key of Object.keys(dict)) expect(key).toMatch(/^common\./);
    }
  });

  it('has the spec strings', () => {
    expect(KIT_STRINGS.en['common.play']).toBe('PLAY!');
    expect(KIT_STRINGS.it['common.play']).toBe('GIOCA!');
    expect(KIT_STRINGS.en['common.newEffect']).toBe('NEW EFFECT!');
    expect(KIT_STRINGS.it['common.newEffect']).toBe('NUOVO EFFETTO!');
  });
});

describe('checkParity', () => {
  it('reports missing keys, empty strings and placeholder mismatches', () => {
    const problems = checkParity({
      en: { a: 'A', b: 'B {n}', c: 'C' },
      it: { a: 'A', b: 'B', c: ' ' },
    });
    expect(problems).toContain('placeholders differ for "b" in it');
    expect(problems).toContain('empty "c" in it');
    expect(checkParity({ en: { x: '1' }, it: {} })).toEqual(['missing "x" in it']);
  });
});

describe('I18n', () => {
  const dicts = mergeDictionaries(KIT_STRINGS, {
    en: { 'demo.count': 'celebrations: {count} / {next}' },
    it: { 'demo.count': 'feste: {count} / {next}' },
  });

  it('merges kit and game strings and interpolates', () => {
    const i = new I18n(dicts, 'en');
    expect(i.t('common.play')).toBe('PLAY!');
    expect(i.t('demo.count', { count: 3, next: 5 })).toBe('celebrations: 3 / 5');
    i.setLocale('it');
    expect(i.t('demo.count', { count: 3, next: 5 })).toBe('feste: 3 / 5');
  });

  it('notifies on locale change', () => {
    const i = new I18n(dicts, 'en');
    const fn = vi.fn();
    i.onChange(fn);
    i.setLocale('it');
    i.setLocale('it');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('returns the key for missing strings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(new I18n(dicts).t('nope.key')).toBe('nope.key');
    warn.mockRestore();
  });

  it('refuses game keys that override kit keys', () => {
    expect(() => mergeDictionaries(KIT_STRINGS, { en: { 'common.play': 'x' }, it: {} })).toThrow();
  });

  it('interpolate leaves unknown placeholders', () => {
    expect(interpolate('{a} {b}', { a: 1 })).toBe('1 {b}');
  });
});

describe('detectLocale', () => {
  it('prefers the saved setting, then the browser, then en', () => {
    expect(detectLocale('it', ['en-US'])).toBe('it');
    expect(detectLocale(null, ['fr-FR', 'it-IT'])).toBe('it');
    expect(detectLocale(null, ['fr-FR'])).toBe('en');
    expect(detectLocale(null, [])).toBe('en');
  });
});
