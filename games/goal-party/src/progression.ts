/** Extra effects unlocked every 5 celebrations, in this order, added to all later celebrations. */
export const EFFECTS = ['fireworks', 'goldenCannon', 'horns'] as const;
export type EffectId = (typeof EFFECTS)[number];
export const CELEBRATIONS_PER_UNLOCK = 5;

/** Celebration counter and unlocks. No score, no losing, nothing saved between sessions. */
export class Progression {
  private _count = 0;

  get count(): number {
    return this._count;
  }

  get unlocked(): EffectId[] {
    return EFFECTS.slice(0, Math.min(EFFECTS.length, Math.floor(this._count / CELEBRATIONS_PER_UNLOCK)));
  }

  /** Next milestone, or null once every effect is unlocked. */
  get next(): number | null {
    if (this.unlocked.length >= EFFECTS.length) return null;
    return (Math.floor(this._count / CELEBRATIONS_PER_UNLOCK) + 1) * CELEBRATIONS_PER_UNLOCK;
  }

  /** Records one celebration; returns the effect it unlocks, if any. */
  record(): EffectId | null {
    const before = this.unlocked.length;
    this._count++;
    const after = this.unlocked;
    return after.length > before ? (after[after.length - 1] as EffectId) : null;
  }
}
