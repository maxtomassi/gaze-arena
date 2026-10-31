export const SUPPORTED_LOCALES = ['en', 'it'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Flat dictionary: dotted keys to strings, e.g. { "common.play": "PLAY!" }. */
export type Dictionary = Record<string, string>;
export type Dictionaries = Record<Locale, Dictionary>;

export function isLocale(v: unknown): v is Locale {
  return SUPPORTED_LOCALES.includes(v as Locale);
}

/** Saved setting, else the first supported browser language, else en. */
export function detectLocale(saved: Locale | null, languages: readonly string[]): Locale {
  if (saved) return saved;
  for (const lang of languages) {
    const base = lang.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
