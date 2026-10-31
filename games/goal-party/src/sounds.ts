import { SUPPORTED_LOCALES, hasPublicAsset, type Locale, type SoundDef } from '@gaze-arena/kit';

/** Voice line path for a locale (generated later by the asset pipeline). */
export const chantPath = (locale: Locale) => `assets/audio/${locale}/chant-goal.mp3`;

/** Only files present at build time are registered, so a missing clip never causes a 404. */
export function gameSounds(): SoundDef[] {
  const locales: Partial<Record<Locale, string>> = {};
  for (const l of SUPPORTED_LOCALES) if (hasPublicAsset(chantPath(l))) locales[l] = chantPath(l);
  return [{ id: 'goalParty.chant', category: 'voice', locales, fallback: 'chant-generic' }];
}
