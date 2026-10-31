import type { Locale } from '../i18n/locales';
import type { VolumeCategory } from '../settings/Settings';

export interface SoundDef {
  id: string;
  category: VolumeCategory;
  /** Locale-independent file. */
  src?: string;
  /** Locale-specific files (voice lines). */
  locales?: Partial<Record<Locale, string>>;
  /** Generic sound id used when no file is available for this one. */
  fallback?: string;
  /** Base gain 0–1 (default 1). */
  volume?: number;
}

export interface SoundCandidate {
  def: SoundDef;
  url: string;
}

/**
 * Ordered list of files to try for a sound: the current locale, then `en`, then the
 * locale-independent file, then the same chain for the generic fallback sound.
 */
export function soundCandidates(
  registry: ReadonlyMap<string, SoundDef>,
  id: string,
  locale: Locale,
  seen = new Set<string>(),
): SoundCandidate[] {
  const def = registry.get(id);
  if (!def || seen.has(id)) return [];
  seen.add(id);
  const urls: string[] = [];
  const add = (u: string | undefined) => {
    if (u && !urls.includes(u)) urls.push(u);
  };
  add(def.locales?.[locale]);
  add(def.locales?.en);
  add(def.src);
  const own = urls.map((url) => ({ def, url }));
  return def.fallback ? [...own, ...soundCandidates(registry, def.fallback, locale, seen)] : own;
}

export function formatOf(url: string): string {
  const dataMatch = /^data:audio\/(?:x-)?([a-z0-9]+)/i.exec(url);
  if (dataMatch) return (dataMatch[1] as string).replace('mpeg', 'mp3').toLowerCase();
  const ext = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(url);
  return (ext?.[1] ?? 'mp3').toLowerCase();
}
