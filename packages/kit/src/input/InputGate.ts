import { GATE_TAIL_MS } from '../core/constants';

type Listener = (locked: boolean) => void;

export interface TimerApi {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
}

const defaultTimers: TimerApi = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id as ReturnType<typeof setTimeout>),
};

/**
 * Global input lock. Every action holds the gate for its whole animation; when the last hold
 * is released the gate stays locked for a further tail (500 ms) before accepting input again.
 * Timers here never affect the outcome of a game: they only delay when input is accepted.
 */
export class InputGate {
  private holds = 0;
  private tailTimer: unknown = null;
  private listeners = new Set<Listener>();
  private lastLocked = false;

  constructor(
    private readonly tailMs = GATE_TAIL_MS,
    private readonly timers: TimerApi = defaultTimers,
  ) {}

  get locked(): boolean {
    return this.holds > 0 || this.tailTimer !== null;
  }

  /** Lock until the returned release function is called, then for the tail. */
  hold(): () => void {
    this.holds++;
    this.cancelTail();
    this.emit();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.holds--;
      if (this.holds === 0) this.startTail();
    };
  }

  /** Lock for `ms` plus the tail. */
  lock(ms = 0): void {
    const release = this.hold();
    this.timers.setTimeout(release, ms);
  }

  /** Lock until the promise settles, plus the tail. */
  lockUntil<T>(work: Promise<T>): Promise<T> {
    const release = this.hold();
    return work.finally(release);
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Testing/reset helper: drop all holds immediately. */
  reset(): void {
    this.holds = 0;
    this.cancelTail();
    this.emit();
  }

  private startTail(): void {
    this.cancelTail();
    if (this.tailMs <= 0) {
      this.emit();
      return;
    }
    this.tailTimer = this.timers.setTimeout(() => {
      this.tailTimer = null;
      this.emit();
    }, this.tailMs);
  }

  private cancelTail(): void {
    if (this.tailTimer !== null) {
      this.timers.clearTimeout(this.tailTimer);
      this.tailTimer = null;
    }
  }

  private emit(): void {
    const locked = this.locked;
    if (locked === this.lastLocked) return;
    this.lastLocked = locked;
    for (const l of this.listeners) l(locked);
  }
}
