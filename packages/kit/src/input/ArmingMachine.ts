/**
 * Per-button arming rules, independent of rendering.
 *
 * - A button starts armed.
 * - A click on the button disarms it, whether or not the click was accepted (accepted clicks start
 *   an action; clicks rejected because the InputGate was locked still count, so a device in
 *   Repeat Click mode can never chain actions while the gaze rests on a button).
 * - Only leaving the button (pointer out) re-arms it.
 */
export type ClickResult = 'activate' | 'ignored-locked' | 'ignored-disarmed' | 'ignored-disabled';

export class ArmingMachine {
  private _armed = true;
  private _inside = false;

  get armed(): boolean {
    return this._armed;
  }

  get inside(): boolean {
    return this._inside;
  }

  /** Should the button show the hovered state? */
  hovered(gateLocked: boolean, enabled = true): boolean {
    return this._inside && this._armed && !gateLocked && enabled;
  }

  /** Feed the current pointer containment. Returns 'enter' / 'leave' on transitions. */
  setInside(inside: boolean): 'enter' | 'leave' | null {
    if (inside === this._inside) return null;
    this._inside = inside;
    if (!inside) {
      this._armed = true;
      return 'leave';
    }
    return 'enter';
  }

  click(gateLocked: boolean, enabled = true): ClickResult {
    if (!enabled) return 'ignored-disabled';
    if (!this._armed) return 'ignored-disarmed';
    this._armed = false;
    return gateLocked ? 'ignored-locked' : 'activate';
  }

  /** Force the disarmed state (e.g. a button that reappears under a still pointer). */
  disarm(): void {
    this._armed = false;
  }
}
