import Phaser from 'phaser';
import { INVITATION_INTERVAL_MS } from '../core/constants';
import { getKit } from '../core/Kit';

/**
 * Calls `invite` after `intervalMs` without clicks, then again every `intervalMs`, until the next
 * click. It only ever triggers a decorative invitation: never a penalty, never a state change.
 * Skipped while the scene is paused (adult panel) or an action is running.
 *
 * Uses window timers rather than scene time so the period is wall-clock time regardless of
 * frame rate (and so tests can fast-forward a fake clock).
 */
export function startInvitations(scene: Phaser.Scene, invite: () => void, intervalMs = INVITATION_INTERVAL_MS): () => void {
  const kit = getKit(scene);
  let handle: ReturnType<typeof setInterval> | null = null;
  const tick = () => {
    if (!scene.sys.isActive() || kit.gate.locked || kit.paused) return;
    kit.telemetry.record('invitation');
    invite();
  };
  const schedule = () => {
    if (handle !== null) clearInterval(handle);
    handle = setInterval(tick, intervalMs);
  };
  scene.input.on(Phaser.Input.Events.POINTER_UP, schedule);
  schedule();
  const stop = () => {
    if (handle !== null) clearInterval(handle);
    handle = null;
    scene.input.off(Phaser.Input.Events.POINTER_UP, schedule);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
  return stop;
}
