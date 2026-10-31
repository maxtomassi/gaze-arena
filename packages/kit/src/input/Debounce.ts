import { DEBOUNCE_MS, DEBOUNCE_RADIUS } from '../core/constants';

/** Ignores a click that comes within `ms` and `radius` of the previous accepted or rejected click. */
export class ClickDebounce {
  private last: { x: number; y: number; t: number } | null = null;

  constructor(
    private readonly ms = DEBOUNCE_MS,
    private readonly radius = DEBOUNCE_RADIUS,
  ) {}

  /** Returns true if the click should be processed. Every call updates the reference click. */
  accept(x: number, y: number, now: number): boolean {
    const prev = this.last;
    this.last = { x, y, t: now };
    if (!prev) return true;
    const close = Math.hypot(x - prev.x, y - prev.y) <= this.radius;
    return !(close && now - prev.t < this.ms);
  }

  reset(): void {
    this.last = null;
  }
}
