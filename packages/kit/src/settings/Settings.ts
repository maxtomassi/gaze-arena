import { TARGET_SCALE_MAX, TARGET_SCALE_MIN } from '../core/constants';
import type { Intensity } from '../fx/intensity';
import { SUPPORTED_LOCALES, type Locale } from '../i18n/locales';

export const STORAGE_PREFIX = 'gaze-arena:';
export const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;
export const SETTINGS_VERSION = 1;

export type VolumeCategory = 'ui' | 'effects' | 'crowd' | 'voice';
export const VOLUME_CATEGORIES: readonly VolumeCategory[] = ['ui', 'effects', 'crowd', 'voice'];

export type Choices = 1 | 2 | 4;
export const CHOICES: readonly Choices[] = [1, 2, 4];
export const MATCH_MINUTES = [3, 4, 5] as const;
export type MatchMinutes = (typeof MATCH_MINUTES)[number];
export const INTENSITIES: readonly Intensity[] = ['calm', 'normal', 'max'];

export interface SettingsData {
  version: number;
  /** null = automatic (browser language, else en). */
  locale: Locale | null;
  targetScale: number;
  intensity: Intensity;
  volumes: Record<VolumeCategory, number>;
  choices: Choices;
  matchMinutes: MatchMinutes;
  simulator: boolean;
}

export const DEFAULT_SETTINGS: Readonly<SettingsData> = Object.freeze({
  version: SETTINGS_VERSION,
  locale: null,
  targetScale: 1,
  intensity: 'normal',
  volumes: Object.freeze({ ui: 0.6, effects: 0.8, crowd: 0.7, voice: 1 }),
  choices: 4,
  matchMinutes: 3,
  simulator: false,
}) as SettingsData;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Turns anything (old versions, corrupt data, partial objects) into valid settings. */
export function sanitizeSettings(raw: unknown): SettingsData {
  const d = DEFAULT_SETTINGS;
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const vols = (r.volumes && typeof r.volumes === 'object' ? r.volumes : {}) as Record<string, unknown>;
  const volumes = {} as Record<VolumeCategory, number>;
  for (const c of VOLUME_CATEGORIES) volumes[c] = clamp(num(vols[c], d.volumes[c]), 0, 1);
  const choices = CHOICES.includes(r.choices as Choices) ? (r.choices as Choices) : d.choices;
  const matchMinutes = MATCH_MINUTES.includes(r.matchMinutes as MatchMinutes)
    ? (r.matchMinutes as MatchMinutes)
    : d.matchMinutes;
  return {
    version: SETTINGS_VERSION,
    locale: SUPPORTED_LOCALES.includes(r.locale as Locale) ? (r.locale as Locale) : null,
    targetScale: Math.round(clamp(num(r.targetScale, d.targetScale), TARGET_SCALE_MIN, TARGET_SCALE_MAX) * 100) / 100,
    intensity: INTENSITIES.includes(r.intensity as Intensity) ? (r.intensity as Intensity) : d.intensity,
    volumes,
    choices,
    matchMinutes,
    simulator: typeof r.simulator === 'boolean' ? r.simulator : d.simulator,
  };
}

/** Upgrades stored data from older versions before sanitizing. */
export function migrateSettings(raw: unknown): unknown {
  // Version 1 is the first version; future migrations go here, keyed on raw.version.
  return raw;
}

export type SettingsListener = (next: SettingsData, prev: SettingsData) => void;

/** Persistent adult settings, shared by every game on the same origin. */
export class Settings {
  private data: SettingsData;
  private listeners = new Set<SettingsListener>();

  constructor(private readonly storage: Storage | null = safeLocalStorage()) {
    this.data = this.load();
  }

  get value(): Readonly<SettingsData> {
    return this.data;
  }

  update(patch: Partial<Omit<SettingsData, 'volumes'>> & { volumes?: Partial<SettingsData['volumes']> }): void {
    const prev = this.data;
    const next = sanitizeSettings({ ...prev, ...patch, volumes: { ...prev.volumes, ...patch.volumes } });
    if (JSON.stringify(next) === JSON.stringify(prev)) return;
    this.data = next;
    this.save();
    for (const l of this.listeners) l(next, prev);
  }

  onChange(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private load(): SettingsData {
    try {
      const text = this.storage?.getItem(SETTINGS_KEY);
      if (!text) return sanitizeSettings({});
      return sanitizeSettings(migrateSettings(JSON.parse(text)));
    } catch {
      return sanitizeSettings({});
    }
  }

  private save(): void {
    try {
      this.storage?.setItem(SETTINGS_KEY, JSON.stringify(this.data));
    } catch {
      // Storage full or blocked: settings still apply for this session.
    }
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
