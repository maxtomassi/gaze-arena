// Phaser-free part of the kit: safe to import from pure game modules and from unit tests (Node).
export * from './core/constants';
export * from './ui/layout';
export {
  Settings,
  sanitizeSettings,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  STORAGE_PREFIX,
  type SettingsData,
  type Choices,
  type VolumeCategory,
} from './settings/Settings';
export { I18n, KIT_STRINGS, checkParity, interpolate, mergeDictionaries, placeholdersOf, type Params } from './i18n/I18n';
export { SUPPORTED_LOCALES, detectLocale, type Locale, type Dictionary, type Dictionaries } from './i18n/locales';
export { InputGate } from './input/InputGate';
export { ClickDebounce } from './input/Debounce';
export { ArmingMachine } from './input/ArmingMachine';
export { FlashLimiter } from './fx/FlashLimiter';
export { intensityProfile, INTENSITY_PROFILES, type Intensity, type IntensityProfile } from './fx/intensity';
export { soundCandidates, type SoundDef } from './audio/sounds';
export * from './art/palette';
