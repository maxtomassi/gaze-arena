import { Howl, Howler } from 'howler';
import { intensityProfile } from '../fx/intensity';
import type { I18n } from '../i18n/I18n';
import type { Settings } from '../settings/Settings';
import { formatOf, soundCandidates, type SoundDef } from './sounds';

export interface PlayOptions {
  /** Extra gain 0–1 on top of category and sound volume. */
  volume?: number;
  loop?: boolean;
}

export interface PlayLogEntry {
  id: string;
  /** The sound actually used after fallbacks. */
  resolved: string | null;
  category: string;
  volume: number;
  t: number;
}

/**
 * Plays registered sounds with per-category volumes from Settings, locale fallback
 * (locale → en → generic) and intensity rules (quiet crowd in "calm").
 */
export class AudioBus {
  private registry = new Map<string, SoundDef>();
  private howls = new Map<string, Howl>();
  private failed = new Set<string>();
  readonly log: PlayLogEntry[] = [];

  constructor(
    private readonly settings: Settings,
    private readonly i18n: I18n,
  ) {}

  register(...defs: SoundDef[]): void {
    for (const d of defs) this.registry.set(d.id, d);
  }

  /** Gain for a sound right now, before any per-call volume. */
  gainFor(def: SoundDef): number {
    const s = this.settings.value;
    const crowd = def.category === 'crowd' ? intensityProfile(s.intensity).crowdVolume : 1;
    return s.volumes[def.category] * (def.volume ?? 1) * crowd;
  }

  play(id: string, opts: PlayOptions = {}): void {
    const candidates = soundCandidates(this.registry, id, this.i18n.locale).filter((c) => !this.failed.has(c.url));
    const first = candidates[0];
    const requested = this.registry.get(id);
    const volume = first ? this.gainFor(first.def) * (opts.volume ?? 1) : 0;
    this.log.push({
      id,
      resolved: first?.def.id ?? null,
      category: requested?.category ?? 'unknown',
      volume,
      t: performance.now(),
    });
    if (this.log.length > 500) this.log.splice(0, this.log.length - 500);
    if (!first || volume <= 0) return;
    const howl = this.howlFor(first.url, () => this.play(id, opts));
    howl.volume(volume);
    howl.loop(opts.loop ?? false);
    howl.play();
  }

  stop(id: string): void {
    for (const c of soundCandidates(this.registry, id, this.i18n.locale)) this.howls.get(c.url)?.stop();
  }

  stopAll(): void {
    for (const h of this.howls.values()) h.stop();
  }

  /** Call from inside a user gesture (the PLAY! click). */
  unlock(): void {
    const ctx = Howler.ctx as AudioContext | undefined;
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    // Preload everything we know about so the first effects play on time.
    for (const id of this.registry.keys()) {
      for (const c of soundCandidates(this.registry, id, this.i18n.locale)) {
        if (!this.failed.has(c.url)) this.howlFor(c.url, () => {});
      }
    }
  }

  private howlFor(url: string, retry: () => void): Howl {
    let howl = this.howls.get(url);
    if (!howl) {
      howl = new Howl({
        src: [url],
        format: [formatOf(url)],
        preload: true,
        onloaderror: () => {
          this.failed.add(url);
          this.howls.delete(url);
          retry();
        },
      });
      this.howls.set(url, howl);
    }
    return howl;
  }
}
