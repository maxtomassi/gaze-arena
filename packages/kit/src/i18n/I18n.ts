import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Dictionaries, type Locale } from './locales';
import kitEn from './en.json';
import kitIt from './it.json';

export const KIT_STRINGS: Dictionaries = { en: kitEn, it: kitIt };

export type Params = Record<string, string | number>;

/** Replaces {name} placeholders. Unknown placeholders are left as they are. */
export function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

/** Merges kit strings with game strings. A game may not override kit keys. */
export function mergeDictionaries(kit: Dictionaries, game: Dictionaries): Dictionaries {
  const out = {} as Dictionaries;
  for (const locale of SUPPORTED_LOCALES) {
    const g = game[locale] ?? {};
    for (const key of Object.keys(g)) {
      if (key in (kit[locale] ?? {})) throw new Error(`i18n: game key "${key}" overrides a kit key`);
    }
    out[locale] = { ...kit[locale], ...g };
  }
  return out;
}

/** Placeholder names used in a string, sorted. */
export function placeholdersOf(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string).sort();
}

/**
 * Compares locales: every key must exist everywhere with the same placeholders.
 * Returns human-readable problems (empty when everything matches).
 */
export function checkParity(dicts: Partial<Dictionaries>): string[] {
  const problems: string[] = [];
  const locales = Object.keys(dicts) as Locale[];
  const allKeys = new Set(locales.flatMap((l) => Object.keys(dicts[l] ?? {})));
  for (const key of allKeys) {
    const ref = locales.map((l) => [l, dicts[l]?.[key]] as const);
    for (const [l, v] of ref) {
      if (v === undefined) problems.push(`missing "${key}" in ${l}`);
      else if (v.trim() === '') problems.push(`empty "${key}" in ${l}`);
    }
    const present = ref.filter(([, v]) => v !== undefined) as [Locale, string][];
    const first = present[0];
    if (!first) continue;
    const expected = placeholdersOf(first[1]).join(',');
    for (const [l, v] of present) {
      if (placeholdersOf(v).join(',') !== expected) problems.push(`placeholders differ for "${key}" in ${l}`);
    }
  }
  return problems;
}

type Listener = (locale: Locale) => void;

export class I18n {
  private _locale: Locale;
  private listeners = new Set<Listener>();
  private warned = new Set<string>();

  constructor(
    private readonly dicts: Dictionaries,
    locale: Locale = DEFAULT_LOCALE,
  ) {
    this._locale = locale;
  }

  get locale(): Locale {
    return this._locale;
  }

  setLocale(locale: Locale): void {
    if (locale === this._locale) return;
    this._locale = locale;
    for (const l of this.listeners) l(locale);
  }

  has(key: string): boolean {
    return key in this.dicts[this._locale];
  }

  t(key: string, params?: Params): string {
    const text = this.dicts[this._locale][key] ?? this.dicts[DEFAULT_LOCALE][key];
    if (text === undefined) {
      if (!this.warned.has(key)) {
        this.warned.add(key);
        console.warn(`i18n: missing key "${key}"`);
      }
      return key;
    }
    return interpolate(text, params);
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
