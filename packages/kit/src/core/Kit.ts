import type Phaser from 'phaser';
import type { AudioBus } from '../audio/AudioBus';
import type { SoundDef } from '../audio/sounds';
import type { FlashLimiter } from '../fx/FlashLimiter';
import type { I18n, Params } from '../i18n/I18n';
import type { Dictionaries } from '../i18n/locales';
import type { ClickDebounce } from '../input/Debounce';
import type { InputGate } from '../input/InputGate';
import type { Settings } from '../settings/Settings';
import type { Telemetry } from './Telemetry';
import type { Zones } from './Zones';

export interface GameDefinition {
  /** Game id, e.g. "goal-party". */
  id: string;
  /** i18n key of the game title (start screen, document title). */
  titleKey: string;
  /** Game strings; keys must be prefixed with the game key (e.g. "goalParty."). */
  strings: Dictionaries;
  sounds?: SoundDef[];
  scenes: Phaser.Types.Scenes.SceneType[];
  /** Key of the scene started after the PLAY! screen. */
  firstScene: string;
  /** Async work done while the start screen is showing (e.g. rasterizing SVG art). */
  prepare?: (scene: Phaser.Scene) => Promise<void>;
  /** Element id the canvas is mounted in (default "game"). */
  parent?: string;
}

export interface QueryFlags {
  sim: boolean;
  test: boolean;
}

/** Shared services for one running game. Reach them from a scene with `getKit(scene)`. */
export interface Kit {
  game: Phaser.Game;
  definition: GameDefinition;
  flags: QueryFlags;
  settings: Settings;
  i18n: I18n;
  audio: AudioBus;
  gate: InputGate;
  debounce: ClickDebounce;
  flash: FlashLimiter;
  telemetry: Telemetry;
  zones: Zones;
  /** True while the adult panel is open. */
  paused: boolean;
  t(key: string, params?: Params): string;
  /** Game-specific state exposed to tests (?test=1). */
  stateProvider: (() => unknown) | null;
}

export const KIT_REGISTRY_KEY = 'gaze-arena:kit';

export function getKit(scene: Phaser.Scene): Kit {
  const kit = scene.game.registry.get(KIT_REGISTRY_KEY) as Kit | undefined;
  if (!kit) throw new Error('Gaze Arena kit not initialised: start the game with bootGame()');
  return kit;
}
