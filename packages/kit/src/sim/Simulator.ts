import { DEAD_ZONE_BOTTOM, DEAD_ZONE_TOP, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../core/constants';
import type { Kit } from '../core/Kit';

export const SIM_JITTER = 25;
export const SIM_REPEAT_MS = 1100;
const TREMOR_MS = 120;

export interface SimLogEntry {
  kind: 'move' | 'click';
  /** Real (unjittered) logical position. */
  rx: number;
  ry: number;
  /** Dispatched logical position. */
  x: number;
  y: number;
  t: number;
}

/**
 * Eye-gaze simulator for testing with a normal mouse (?sim=1 or the adult panel):
 * - pointer jitter ±25 logical px (also while the mouse is still: gaze tremor);
 * - Repeat Click every 1100 ms at the jittered position, toggled with R;
 * - overlay showing hitboxes, dead zones and the rest area.
 *
 * Real mouse events on the canvas are swallowed and re-dispatched as synthetic, jittered ones.
 */
export class Simulator {
  readonly log: SimLogEntry[] = [];
  private real: { x: number; y: number } | null = null;
  private jittered: { x: number; y: number } | null = null;
  private repeatTimer: ReturnType<typeof setInterval> | null = null;
  private tremorTimer: ReturnType<typeof setInterval> | null = null;
  private overlay: HTMLCanvasElement | null = null;
  private badge: HTMLDivElement | null = null;
  private raf = 0;
  private running = false;
  private offLocale: (() => void) | null = null;

  constructor(
    private readonly kit: Kit,
    private readonly random: () => number = Math.random,
  ) {}

  get active(): boolean {
    return this.running;
  }

  get repeating(): boolean {
    return this.repeatTimer !== null;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    for (const type of ['mousemove', 'mousedown', 'mouseup'] as const) {
      window.addEventListener(type, this.onMouse, { capture: true });
    }
    window.addEventListener('keydown', this.onKey, { capture: true });
    this.tremorTimer = setInterval(() => this.tremor(), TREMOR_MS);

    this.overlay = document.createElement('canvas');
    this.overlay.className = 'ga-sim-overlay';
    this.overlay.width = LOGICAL_WIDTH / 2;
    this.overlay.height = LOGICAL_HEIGHT / 2;
    document.body.appendChild(this.overlay);
    this.badge = document.createElement('div');
    this.badge.className = 'ga-sim-badge';
    this.badge.id = 'ga-sim-badge';
    document.body.appendChild(this.badge);
    this.offLocale = this.kit.i18n.onChange(() => this.updateBadge());
    this.updateBadge();
    const loop = () => {
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.kit.telemetry.record('sim-start');
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    for (const type of ['mousemove', 'mousedown', 'mouseup'] as const) {
      window.removeEventListener(type, this.onMouse, { capture: true });
    }
    window.removeEventListener('keydown', this.onKey, { capture: true });
    this.setRepeat(false);
    if (this.tremorTimer) clearInterval(this.tremorTimer);
    this.tremorTimer = null;
    cancelAnimationFrame(this.raf);
    this.overlay?.remove();
    this.badge?.remove();
    this.overlay = null;
    this.badge = null;
    this.offLocale?.();
    this.kit.telemetry.record('sim-stop');
  }

  setRepeat(on: boolean): void {
    if (on === this.repeating) return;
    if (on) this.repeatTimer = setInterval(() => this.repeatClick(), SIM_REPEAT_MS);
    else if (this.repeatTimer) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }
    this.kit.telemetry.record('sim-repeat', { on });
    this.updateBadge();
  }

  private get canvas(): HTMLCanvasElement {
    return this.kit.game.canvas;
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key === 'r' || e.key === 'R') && !this.kit.paused) {
      e.preventDefault();
      this.setRepeat(!this.repeating);
    }
  };

  private onMouse = (e: MouseEvent): void => {
    if (!e.isTrusted || e.target !== this.canvas) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    const p = this.toLogical(e.clientX, e.clientY);
    this.real = p;
    if (e.type === 'mousemove') this.dispatchMove();
    else if (e.button === 0) this.dispatchButton(e.type as 'mousedown' | 'mouseup');
  };

  private tremor(): void {
    if (this.real && !this.kit.paused) this.dispatchMove();
  }

  private repeatClick(): void {
    if (!this.real || this.kit.paused) return;
    this.dispatchMove();
    this.dispatchButton('mousedown');
    this.dispatchButton('mouseup');
  }

  private jitter(): { x: number; y: number } {
    const r = this.real as { x: number; y: number };
    const j = () => (this.random() * 2 - 1) * SIM_JITTER;
    return { x: r.x + j(), y: r.y + j() };
  }

  private dispatchMove(): void {
    this.jittered = this.jitter();
    this.record('move');
    this.fire('mousemove', 0);
  }

  private dispatchButton(type: 'mousedown' | 'mouseup'): void {
    if (!this.jittered) this.jittered = this.jitter();
    if (type === 'mouseup') this.record('click');
    this.fire(type, type === 'mousedown' ? 1 : 0);
  }

  private fire(type: string, buttons: number): void {
    const p = this.jittered as { x: number; y: number };
    const { clientX, clientY } = this.toClient(p.x, p.y);
    this.canvas.dispatchEvent(
      new MouseEvent(type, { clientX, clientY, button: 0, buttons, bubbles: true, cancelable: true, view: window }),
    );
  }

  private record(kind: SimLogEntry['kind']): void {
    const r = this.real as { x: number; y: number };
    const j = this.jittered as { x: number; y: number };
    this.log.push({ kind, rx: r.x, ry: r.y, x: j.x, y: j.y, t: performance.now() });
    if (this.log.length > 400) this.log.splice(0, this.log.length - 400);
  }

  private toLogical(clientX: number, clientY: number): { x: number; y: number } {
    const b = this.canvas.getBoundingClientRect();
    return { x: ((clientX - b.left) / b.width) * LOGICAL_WIDTH, y: ((clientY - b.top) / b.height) * LOGICAL_HEIGHT };
  }

  private toClient(x: number, y: number): { clientX: number; clientY: number } {
    const b = this.canvas.getBoundingClientRect();
    return { clientX: b.left + (x / LOGICAL_WIDTH) * b.width, clientY: b.top + (y / LOGICAL_HEIGHT) * b.height };
  }

  private updateBadge(): void {
    if (!this.badge) return;
    const state = this.kit.t(this.repeating ? 'common.sim.on' : 'common.sim.off');
    this.badge.textContent = this.kit.t('common.sim.badge', { state });
  }

  private draw(): void {
    const o = this.overlay;
    if (!o) return;
    const b = this.canvas.getBoundingClientRect();
    Object.assign(o.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px` });
    const ctx = o.getContext('2d');
    if (!ctx) return;
    const k = o.width / LOGICAL_WIDTH;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = 'rgba(230,57,70,0.28)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, DEAD_ZONE_TOP);
    ctx.fillRect(0, DEAD_ZONE_BOTTOM, LOGICAL_WIDTH, LOGICAL_HEIGHT - DEAD_ZONE_BOTTOM);
    const rest = this.kit.zones.restArea;
    if (rest) {
      ctx.setLineDash([18, 12]);
      ctx.strokeStyle = '#FFD60A';
      ctx.lineWidth = 6;
      ctx.strokeRect(rest.x, rest.y, rest.width, rest.height);
      ctx.setLineDash([]);
    }
    for (const t of this.kit.zones.describeTargets()) {
      if (!t.enabled) continue;
      ctx.fillStyle = 'rgba(0,229,255,0.18)';
      ctx.fillRect(t.hitbox.x, t.hitbox.y, t.hitbox.width, t.hitbox.height);
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 4;
      ctx.strokeRect(t.hitbox.x, t.hitbox.y, t.hitbox.width, t.hitbox.height);
    }
    if (this.real) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.real.x, this.real.y, SIM_JITTER * Math.SQRT2, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.jittered) {
      ctx.fillStyle = '#FF2E88';
      ctx.beginPath();
      ctx.arc(this.jittered.x, this.jittered.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
