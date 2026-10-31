import Phaser from 'phaser';
import { FONT_TITLE, OUTLINE, PALETTE, toCss } from '../art/palette';
import { HITBOX_FACTOR, hitboxOf, rectContains, type Rect } from '../core/constants';
import { getKit, type Kit } from '../core/Kit';
import type { TargetInfo, ZoneSource } from '../core/Zones';
import { ensureKitTextures, TEX } from '../fx/effects';
import { ArmingMachine } from '../input/ArmingMachine';

/** Draws an icon centered on (0, 0), fitting a `size` × `size` box. */
export type IconPainter = (g: Phaser.GameObjects.Graphics, size: number, color: number) => void;

export interface GazeButtonConfig {
  /** Stable id used by tests and telemetry. */
  id: string;
  /** Visible graphic rect in logical coordinates. */
  graphic: Rect;
  color: number;
  /** i18n key of the label (optional; icons are preferred, labels are secondary). */
  labelKey?: string;
  labelColor?: number;
  icon?: IconPainter;
  iconColor?: number;
  /** Largest label font size; the label shrinks to fit (down to `minFontSize`). */
  maxFontSize?: number;
  minFontSize?: number;
  /**
   * Runs when the button is activated. The InputGate stays locked until the returned
   * promise settles, plus the 500 ms tail.
   */
  onActivate: () => void | Promise<unknown>;
}

export type GazeButtonState = 'idle' | 'hovered' | 'activated' | 'locked' | 'disabled';

const BORDER = 8;
const RADIUS = 32;
const PADDING = 16;
/** Duration of the activation bounce (1.2 → 0.9 → 1). */
const FEEDBACK_MS = 360;

/**
 * The only clickable element allowed in a scene.
 *
 * - Activates on a single left `pointerup` inside its hitbox (graphic + 18%).
 * - Ignores clicks while the global InputGate is locked, within the 400 ms debounce, or before
 *   the pointer has left the button since its last click (Repeat Click protection).
 * - States: idle (white border) · hovered (yellow glow, scale 1.05, soft tick) ·
 *   activated (flash, 1.2 → 0.9 → 1 bounce, loud sound, particles) · locked (opacity 0.6).
 *
 * Must be added at the top level of the scene (not inside a transformed container): its hitbox is
 * computed in logical coordinates from the graphic rect.
 */
export class GazeButton extends Phaser.GameObjects.Container implements ZoneSource {
  readonly id: string;
  readonly isGazeButton = true;
  private readonly kit: Kit;
  private readonly cfg: GazeButtonConfig;
  private readonly machine = new ArmingMachine();
  private readonly visual: Phaser.GameObjects.Container;
  private readonly glow: Phaser.GameObjects.Graphics;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly iconGfx: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text | null;
  private readonly flashOverlay: Phaser.GameObjects.Graphics;
  private graphicRect: Rect;
  private hitRect: Rect;
  private enabled = true;
  private activating = false;
  private labelFits = true;
  private offs: (() => void)[] = [];
  private shownState: GazeButtonState | null = null;

  constructor(scene: Phaser.Scene, cfg: GazeButtonConfig) {
    super(scene, 0, 0);
    this.kit = getKit(scene);
    this.cfg = cfg;
    this.id = cfg.id;
    this.graphicRect = cfg.graphic;
    this.hitRect = hitboxOf(cfg.graphic);
    ensureKitTextures(scene);

    this.visual = scene.add.container(0, 0);
    this.glow = scene.add.graphics();
    this.bg = scene.add.graphics();
    this.iconGfx = scene.add.graphics();
    this.flashOverlay = scene.add.graphics().setAlpha(0);
    this.label = cfg.labelKey
      ? scene.add
          .text(0, 0, '', {
            fontFamily: FONT_TITLE,
            padding: { x: 28, y: 6 },
            color: toCss(cfg.labelColor ?? PALETTE.white),
            align: 'center',
            stroke: '#000000',
            strokeThickness: OUTLINE,
          })
          .setOrigin(0.5)
      : null;
    this.visual.add([this.glow, this.bg, this.iconGfx, ...(this.label ? [this.label] : []), this.flashOverlay]);
    this.add(this.visual);
    scene.add.existing(this);

    this.layoutTo(cfg.graphic);

    const input = scene.input;
    const onMove = (p: Phaser.Input.Pointer) => this.updateInside(p.x, p.y);
    const onUp = (p: Phaser.Input.Pointer) => this.onPointerUp(p);
    const onOut = () => this.setInside(false);
    input.on(Phaser.Input.Events.POINTER_MOVE, onMove);
    input.on(Phaser.Input.Events.POINTER_UP, onUp);
    input.on(Phaser.Input.Events.GAME_OUT, onOut);
    this.offs.push(() => {
      input.off(Phaser.Input.Events.POINTER_MOVE, onMove);
      input.off(Phaser.Input.Events.POINTER_UP, onUp);
      input.off(Phaser.Input.Events.GAME_OUT, onOut);
    });
    this.offs.push(this.kit.gate.onChange(() => this.refresh()));
    this.offs.push(this.kit.i18n.onChange(() => this.layoutTo(this.graphicRect)));

    this.kit.zones.targets.add(this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      for (const off of this.offs) off();
      this.kit.zones.targets.delete(this);
    });

    // A button that appears under a still pointer starts as if the pointer were already inside it.
    const p = input.activePointer;
    if (p && p.x !== 0 && p.y !== 0 && rectContains(this.hitRect, p.x, p.y)) {
      this.machine.setInside(true);
      this.machine.disarm();
    }
    this.refresh();
  }

  get buttonState(): GazeButtonState {
    if (!this.enabled || !this.visible) return 'disabled';
    if (this.activating) return 'activated';
    if (this.kit.gate.locked || this.kit.paused) return 'locked';
    return this.machine.hovered(false) ? 'hovered' : 'idle';
  }

  get hitbox(): Rect {
    return this.hitRect;
  }

  get graphic(): Rect {
    return this.graphicRect;
  }

  /** Moves/resizes the button and redraws it (layout changes, targetScale, locale). */
  layoutTo(graphic: Rect): this {
    this.graphicRect = graphic;
    this.hitRect = hitboxOf(graphic);
    const w = graphic.width;
    const h = graphic.height;
    this.setPosition(graphic.x + w / 2, graphic.y + h / 2);

    // Interactive area is registered for completeness (cursor, input lists); activation logic
    // uses our own hit test so arming works even while the button is disabled or hidden.
    const hw = w * HITBOX_FACTOR;
    const hh = h * HITBOX_FACTOR;
    this.setSize(hw, hh);
    const area = this.input?.hitArea as Phaser.Geom.Rectangle | undefined;
    if (area) area.setTo(0, 0, hw, hh);
    else this.setInteractive(new Phaser.Geom.Rectangle(0, 0, hw, hh), Phaser.Geom.Rectangle.Contains);

    this.glow.clear();
    this.glow.lineStyle(26, PALETTE.yellow, 0.45).strokeRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, RADIUS + 6);
    this.glow.lineStyle(10, PALETTE.yellow, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, RADIUS);

    this.bg.clear();
    this.bg.fillStyle(this.cfg.color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, RADIUS);
    this.bg.lineStyle(BORDER, PALETTE.white, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, RADIUS);

    this.flashOverlay.clear();
    this.flashOverlay.fillStyle(PALETTE.white, 1).fillRoundedRect(-w / 2, -h / 2, w, h, RADIUS);

    const innerW = w - 2 * (BORDER + PADDING);
    const innerH = h - 2 * (BORDER + PADDING);
    const hasIcon = Boolean(this.cfg.icon);
    const iconSize = hasIcon ? Math.min(innerW, innerH * (this.label ? 0.42 : 1)) : 0;
    this.iconGfx.clear();
    if (this.cfg.icon) {
      const iconY = this.label ? -innerH / 2 + iconSize / 2 : 0;
      this.iconGfx.setPosition(0, iconY);
      this.cfg.icon(this.iconGfx, iconSize, this.cfg.iconColor ?? PALETTE.white);
    }

    if (this.label) {
      const areaH = hasIcon ? innerH - iconSize - 8 : innerH;
      const areaCenterY = hasIcon ? innerH / 2 - areaH / 2 : 0;
      this.label.setText(this.kit.t(this.cfg.labelKey as string));
      this.labelFits = fitText(
        this.label,
        innerW,
        areaH,
        this.cfg.maxFontSize ?? Math.round(Math.min(96, h * 0.2)),
        this.cfg.minFontSize ?? 34,
      );
      this.label.setPosition(0, areaCenterY);
    }
    this.shownState = null;
    this.refresh();
    return this;
  }

  /** Disabled buttons are not clickable (used e.g. while a button steps aside). */
  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    this.refresh();
    return this;
  }

  /** Forces the disarmed state until the pointer leaves the hitbox. */
  disarm(): this {
    this.machine.disarm();
    this.refresh();
    return this;
  }

  describe(): TargetInfo {
    const label = this.label
      ? {
          text: this.label.text,
          bounds: this.labelBounds(),
          fontSize: Number.parseFloat(String(this.label.style.fontSize)),
          fits: this.labelFits,
        }
      : null;
    return {
      id: this.id,
      hitbox: { ...this.hitRect },
      graphic: { ...this.graphicRect },
      state: this.buttonState,
      enabled: this.enabled && this.visible,
      alpha: this.visual.alpha * this.alpha,
      label,
    };
  }

  private labelBounds(): Rect {
    const l = this.label as Phaser.GameObjects.Text;
    return {
      x: this.x + l.x - l.displayWidth / 2,
      y: this.y + l.y - l.displayHeight / 2,
      width: l.displayWidth,
      height: l.displayHeight,
    };
  }

  private updateInside(x: number, y: number): void {
    this.setInside(rectContains(this.hitRect, x, y));
  }

  private setInside(inside: boolean): void {
    const change = this.machine.setInside(inside);
    if (change === 'enter' && this.buttonState === 'hovered') this.kit.audio.play('tick');
    if (change) this.refresh();
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (p.button !== 0) return;
    this.updateInside(p.x, p.y);
    if (!this.machine.inside) return;
    const usable = this.enabled && this.visible && !this.kit.paused;
    if (!usable) {
      this.kit.telemetry.record('click-ignored', { id: this.id, reason: 'disabled' });
      return;
    }
    if (!this.kit.debounce.accept(p.x, p.y, performance.now())) {
      this.kit.telemetry.record('click-ignored', { id: this.id, reason: 'debounce' });
      return;
    }
    const result = this.machine.click(this.kit.gate.locked);
    if (result !== 'activate') {
      this.kit.telemetry.record('click-ignored', { id: this.id, reason: result });
      this.refresh();
      return;
    }
    this.activate();
  }

  private activate(): void {
    const kit = this.kit;
    const release = kit.gate.hold();
    this.activating = true;
    kit.telemetry.record('activate', { id: this.id });
    kit.audio.play('whoosh');
    this.refresh();

    const feedback = new Promise<void>((resolve) => {
      // The gate must always be released: resolve when the bounce ends, when the button is
      // destroyed (e.g. PLAY! starts the game) or, as a last resort, after a fixed time.
      this.once(Phaser.GameObjects.Events.DESTROY, () => resolve());
      this.scene.time.delayedCall(FEEDBACK_MS + 100, () => resolve());
      this.scene.tweens.killTweensOf(this.visual);
      this.scene.tweens.chain({
        targets: this.visual,
        tweens: [
          { scale: 1.2, duration: 110, ease: 'Quad.easeOut' },
          { scale: 0.9, duration: 110, ease: 'Quad.easeInOut' },
          { scale: 1, duration: 140, ease: 'Back.easeOut' },
        ],
        onComplete: () => resolve(),
      });
      this.flashOverlay.setAlpha(0.85);
      this.scene.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 300 });
      const burst = this.scene.add.particles(this.x, this.y, TEX.star, {
        emitting: false,
        speed: { min: 300, max: 700 },
        scale: { start: 1, end: 0 },
        lifespan: 600,
        tint: [PALETTE.yellow, PALETTE.white, this.cfg.color],
      });
      burst.setDepth(this.depth + 1);
      burst.explode(18);
      this.scene.time.delayedCall(800, () => burst.destroy());
    });

    let action: Promise<unknown>;
    try {
      action = Promise.resolve(this.cfg.onActivate());
    } catch (err) {
      action = Promise.reject(err);
    }
    void feedback.then(() => {
      this.activating = false;
      if (this.scene) this.refresh();
    });
    void Promise.allSettled([feedback, action]).then(([, a]) => {
      if (a.status === 'rejected') console.error(a.reason);
      release();
    });
  }

  private refresh(): void {
    if (!this.scene) return;
    // Never interrupt the activation bounce; the final state is applied when it ends.
    if (this.activating) {
      this.glow.setVisible(false);
      this.shownState = null;
      return;
    }
    const state = this.buttonState;
    if (state === this.shownState) return;
    this.shownState = state;
    this.glow.setVisible(state === 'hovered');
    this.visual.setAlpha(state === 'locked' ? 0.6 : 1);
    this.scene.tweens.killTweensOf(this.visual);
    this.scene.tweens.add({
      targets: this.visual,
      scale: state === 'hovered' ? 1.05 : 1,
      duration: 120,
      ease: 'Quad.easeOut',
    });
  }
}

/**
 * Shrinks a Text (word-wrapping first) until it fits the box. Returns false if it still
 * overflows at the minimum font size.
 */
export function fitText(text: Phaser.GameObjects.Text, maxWidth: number, maxHeight: number, maxSize: number, minSize: number): boolean {
  for (let size = maxSize; size >= minSize; size -= 2) {
    text.setFontSize(size);
    text.setWordWrapWidth(maxWidth, true);
    if (text.width <= maxWidth && text.height <= maxHeight) return true;
  }
  return text.width <= maxWidth && text.height <= maxHeight;
}
