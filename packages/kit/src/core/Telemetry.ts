export interface TelemetryEvent {
  type: string;
  t: number;
  data?: Record<string, unknown>;
}

/**
 * In-memory event log. Games and the kit record what happened (activations, ignored clicks,
 * effects); tests read it through the ?test=1 hooks. Bounded, never persisted, never sent anywhere.
 */
export class Telemetry {
  readonly events: TelemetryEvent[] = [];
  private readonly counters = new Map<string, number>();

  constructor(private readonly max = 2000) {}

  record(type: string, data?: Record<string, unknown>): void {
    this.events.push({ type, t: performance.now(), data });
    if (this.events.length > this.max) this.events.splice(0, this.events.length - this.max);
    this.counters.set(type, (this.counters.get(type) ?? 0) + 1);
  }

  count(type: string): number {
    return this.counters.get(type) ?? 0;
  }

  countsSnapshot(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }
}
