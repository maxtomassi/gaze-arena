import Phaser from 'phaser';
import { AdultPanel } from './adult/AdultPanel';
import { AudioBus } from './audio/AudioBus';
import { COMMON_SOUNDS } from './audio/commonSounds';
import { PALETTE_CSS } from './art/palette';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './core/constants';
import { KIT_REGISTRY_KEY, type GameDefinition, type Kit, type QueryFlags } from './core/Kit';
import { Telemetry } from './core/Telemetry';
import { installTestHooks } from './core/testHooks';
import { Zones } from './core/Zones';
import { FlashLimiter } from './fx/FlashLimiter';
import { I18n, KIT_STRINGS, mergeDictionaries } from './i18n/I18n';
import { detectLocale } from './i18n/locales';
import { ClickDebounce } from './input/Debounce';
import { InputGate } from './input/InputGate';
import { StartScene } from './scenes/StartScene';
import { Settings } from './settings/Settings';
import { Simulator } from './sim/Simulator';

export function readFlags(search = location.search): QueryFlags {
  const q = new URLSearchParams(search);
  const on = (k: string) => q.get(k) === '1' || q.get(k) === 'true';
  return { sim: on('sim'), test: on('test') };
}

/** Blocks double click, context menu, text selection and drag for the whole page. */
function lockDownPage(): void {
  const block = (e: Event) => {
    if ((e.target as Element | null)?.closest?.('.ga-adult')) return;
    e.preventDefault();
  };
  for (const type of ['dblclick', 'contextmenu', 'selectstart', 'dragstart']) {
    document.addEventListener(type, block, { capture: true });
  }
}

async function loadFonts(): Promise<void> {
  if (!document.fonts) return;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
  await Promise.race([
    Promise.all([document.fonts.load('64px Bangers'), document.fonts.load('32px Inter'), document.fonts.load('700 32px Inter')]),
    timeout,
  ]).catch(() => undefined);
}

/**
 * Starts a Gaze Arena game: settings, i18n, audio, input gate, the PLAY! start screen,
 * the adult panel (P), the simulator (?sim=1) and test hooks (?test=1).
 */
export async function bootGame(definition: GameDefinition): Promise<Kit> {
  const flags = readFlags();
  const settings = new Settings();
  const i18n = new I18n(
    mergeDictionaries(KIT_STRINGS, definition.strings),
    detectLocale(settings.value.locale, navigator.languages ?? [navigator.language]),
  );
  settings.onChange((next) => i18n.setLocale(detectLocale(next.locale, navigator.languages ?? [navigator.language])));

  const audio = new AudioBus(settings, i18n);
  audio.register(...COMMON_SOUNDS, ...(definition.sounds ?? []));

  const applyDocumentLocale = () => {
    document.documentElement.lang = i18n.locale;
    document.title = i18n.t(definition.titleKey);
  };
  applyDocumentLocale();
  i18n.onChange(applyDocumentLocale);
  lockDownPage();
  await loadFonts();

  const kit = {
    definition,
    flags,
    settings,
    i18n,
    audio,
    gate: new InputGate(),
    debounce: new ClickDebounce(),
    flash: new FlashLimiter(),
    telemetry: new Telemetry(),
    zones: new Zones(),
    paused: false,
    stateProvider: null,
    t: (key, params) => i18n.t(key, params),
  } as Omit<Kit, 'game'> as Kit;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: definition.parent ?? 'game',
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
    backgroundColor: PALETTE_CSS.night,
    disableContextMenu: true,
    banner: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { mouse: { preventDefaultWheel: true }, touch: true, keyboard: false, gamepad: false },
    render: { antialias: true, preserveDrawingBuffer: flags.test },
    callbacks: {
      preBoot: (g) => {
        kit.game = g;
        g.registry.set(KIT_REGISTRY_KEY, kit);
      },
    },
    scene: [StartScene, ...definition.scenes],
  });
  kit.game = game;

  const panel = new AdultPanel(kit);
  let simulator: Simulator | null = null;
  const syncSimulator = () => {
    const want = flags.sim || settings.value.simulator;
    if (want && !simulator) {
      simulator = new Simulator(kit);
      simulator.start();
    } else if (!want && simulator) {
      simulator.stop();
      simulator = null;
    }
  };
  game.events.once(Phaser.Core.Events.READY, syncSimulator);
  settings.onChange(syncSimulator);

  if (flags.test) {
    const api = installTestHooks(kit, panel, () => simulator);
    game.events.once(Phaser.Core.Events.READY, () => {
      api.ready = true;
    });
  }
  return kit;
}
