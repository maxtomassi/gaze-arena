import { MAX_FLASHES_PER_SECOND } from '../core/constants';

/** Sliding-window limiter for full-screen flashes (≤ 3 per second). */
export class FlashLimiter {
  private times: number[] = [];

  constructor(private readonly perSecond = MAX_FLASHES_PER_SECOND) {}

  tryFlash(now: number): boolean {
    this.times = this.times.filter((t) => now - t < 1000);
    if (this.times.length >= this.perSecond) return false;
    this.times.push(now);
    return true;
  }
}
