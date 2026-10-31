import type Phaser from 'phaser';
import type { Kit } from './Kit';
import type { Simulator } from '../sim/Simulator';
import type { AdultPanel } from '../adult/AdultPanel';
import type { SettingsData } from '../settings/Settings';

export interface InteractiveObjectInfo {
  scene: string;
  type: string;
  isGazeButton: boolean;
  id: string | null;
}

/** Read-only inspection API installed on window.__gazeArena when the URL has ?test=1. */
export interface GazeArenaTestApi {
  ready: boolean;
  activeScenes(): string[];
  settings(): SettingsData;
  updateSettings(patch: Partial<SettingsData>): void;
  locale(): string;
  gateLocked(): boolean;
  paused(): boolean;
  targets(): ReturnType<Kit['zones']['describeTargets']>;
  restArea(): Kit['zones']['restArea'];
  layout(): Kit['zones']['layout'];
  interactiveObjects(): InteractiveObjectInfo[];
  events(): Kit['telemetry']['events'];
  counts(): Record<string, number>;
  audioLog(): Kit['audio']['log'];
  sim(): { active: boolean; repeating: boolean; log: Simulator['log'] } | null;
  adultOpen(): boolean;
  state(): unknown;
}

declare global {
  interface Window {
    __gazeArena?: GazeArenaTestApi;
  }
}

export function installTestHooks(kit: Kit, panel: AdultPanel, sim: () => Simulator | null): GazeArenaTestApi {
  const api: GazeArenaTestApi = {
    ready: false,
    activeScenes: () => kit.game.scene.getScenes(true).map((s) => s.scene.key),
    settings: () => structuredClone(kit.settings.value) as SettingsData,
    updateSettings: (patch) => kit.settings.update(patch),
    locale: () => kit.i18n.locale,
    gateLocked: () => kit.gate.locked,
    paused: () => kit.paused,
    targets: () => kit.zones.describeTargets(),
    restArea: () => kit.zones.restArea,
    layout: () => kit.zones.layout,
    interactiveObjects: () =>
      kit.game.scene.getScenes(false).flatMap((scene) => {
        const input = scene.input as unknown as {
          _list?: Phaser.GameObjects.GameObject[];
          _pendingRemoval?: Phaser.GameObjects.GameObject[];
          _pendingInsertion?: Phaser.GameObjects.GameObject[];
        };
        const removed = new Set(input._pendingRemoval ?? []);
        // Phaser applies insertions and removals on the next frame; report the settled list.
        const all = new Set([...(input._list ?? []), ...(input._pendingInsertion ?? [])]);
        const list = [...all].filter((o) => o.scene && o.input && !removed.has(o));
        return list.map((o) => {
          const g = o as Phaser.GameObjects.GameObject & { isGazeButton?: boolean; id?: string };
          return { scene: scene.scene.key, type: g.type, isGazeButton: g.isGazeButton === true, id: g.id ?? null };
        });
      }),
    events: () => kit.telemetry.events,
    counts: () => kit.telemetry.countsSnapshot(),
    audioLog: () => kit.audio.log,
    sim: () => {
      const s = sim();
      return s ? { active: s.active, repeating: s.repeating, log: s.log } : null;
    },
    adultOpen: () => panel.isOpen,
    state: () => kit.stateProvider?.() ?? null,
  };
  window.__gazeArena = api;
  return api;
}
