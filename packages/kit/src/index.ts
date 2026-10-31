// Public API of @gaze-arena/kit. Games import only from here.
export * from './core/constants';
export { getKit, type Kit, type GameDefinition } from './core/Kit';
export type { TargetInfo } from './core/Zones';
export { hasPublicAsset, publicAssets } from './core/publicAssets';
export { bootGame } from './boot';

export { InputGate } from './input/InputGate';
export { ClickDebounce } from './input/Debounce';
export { ArmingMachine } from './input/ArmingMachine';

export { GazeButton, fitText, type GazeButtonConfig, type GazeButtonState, type IconPainter } from './ui/GazeButton';
export * from './ui/layout';

export { Settings, type SettingsData, type Choices, type VolumeCategory } from './settings/Settings';
export { I18n, type Params } from './i18n/I18n';
export { bindText, type BoundText } from './i18n/bindText';
export { SUPPORTED_LOCALES, type Locale, type Dictionary, type Dictionaries } from './i18n/locales';

export { AudioBus } from './audio/AudioBus';
export type { SoundDef } from './audio/sounds';

export { intensityProfile, type Intensity, type IntensityProfile } from './fx/intensity';
export * from './fx/effects';
export { startInvitations } from './fx/inactivity';

export { START_SCENE_KEY } from './scenes/StartScene';

export * from './art/palette';
export * from './art/svg';
export { ballSvg } from './art/ball';
export * from './art/footballer';
