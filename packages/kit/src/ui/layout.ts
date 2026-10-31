import {
  DEAD_ZONE_BOTTOM,
  DEAD_ZONE_TOP,
  HITBOX_FACTOR,
  LOGICAL_WIDTH,
  MIN_TARGET_GAP,
  hitboxOf,
  type Rect,
} from '../core/constants';

export interface Size {
  width: number;
  height: number;
}

export interface LayoutSlot {
  /** Visible button graphic. */
  graphic: Rect;
  /** Clickable area: graphic + 18%. */
  hitbox: Rect;
}

export interface LayoutResult {
  slots: LayoutSlot[];
  /** Never clickable; where the show happens. */
  restArea: Rect;
  requestedScale: number;
  /** Scale actually applied per axis after fitting the screen rules. */
  effectiveScale: { x: number; y: number };
  /** True when the requested targetScale could not be fully applied. */
  capped: boolean;
}

const BAND_HEIGHT = DEAD_ZONE_BOTTOM - DEAD_ZONE_TOP;

export interface SideColumnsOptions {
  /** Buttons per side (1 → 2 buttons total, 2 → 4 buttons total). */
  rowsPerSide: 1 | 2;
  /** Graphic size at targetScale 1. */
  baseSize: Size;
  targetScale: number;
  /** Preferred x center of the left column (mirrored on the right). */
  preferredColumnX?: number;
  /** Preferred rest area; it only shrinks horizontally when the buttons need the room. */
  preferredRest?: Rect;
  /** Minimum rest area width; buttons stop growing in width beyond this. */
  minRestWidth?: number;
  /** Distance between a hitbox and the screen edge. */
  edgeMargin?: number;
  gap?: number;
}

/**
 * Buttons in two side columns around a central rest area.
 * Slots are ordered left column top → bottom, then right column top → bottom.
 *
 * Fitting rules, applied after scaling the base size by targetScale:
 * - hitboxes stay inside the play band (y 108–990) with `gap` between rows;
 * - hitboxes keep `gap` from the rest area, which never gets narrower than `minRestWidth`.
 * Height and width are capped independently, so a button that cannot grow taller still grows wider.
 */
export function sideColumnsLayout(o: SideColumnsOptions): LayoutResult {
  const gap = o.gap ?? MIN_TARGET_GAP;
  const edge = o.edgeMargin ?? 24;
  const minRest = o.minRestWidth ?? 520;
  const preferredRest = o.preferredRest ?? { x: 580, y: 240, width: 760, height: 600 };
  const preferredColumnX = o.preferredColumnX ?? 290;
  const n = o.rowsPerSide;
  const s = o.targetScale;

  const maxHeight = (BAND_HEIGHT - (n - 1) * gap) / n / HITBOX_FACTOR;
  const maxWidth = (LOGICAL_WIDTH - 2 * edge - 2 * gap - minRest) / 2 / HITBOX_FACTOR;
  const width = Math.floor(Math.min(o.baseSize.width * s, maxWidth));
  const height = Math.floor(Math.min(o.baseSize.height * s, maxHeight));
  const hitW = width * HITBOX_FACTOR;
  const hitH = height * HITBOX_FACTOR;

  const leftX = Math.max(preferredColumnX, edge + hitW / 2);
  const rightX = LOGICAL_WIDTH - leftX;
  const total = n * hitH + (n - 1) * gap;
  const top = DEAD_ZONE_TOP + (BAND_HEIGHT - total) / 2;

  const slots: LayoutSlot[] = [];
  for (const cx of [leftX, rightX]) {
    for (let i = 0; i < n; i++) {
      const cy = top + i * (hitH + gap) + hitH / 2;
      const graphic = { x: cx - width / 2, y: cy - height / 2, width, height };
      slots.push({ graphic, hitbox: hitboxOf(graphic) });
    }
  }

  const innerLeft = leftX + hitW / 2 + gap;
  const restX = Math.max(preferredRest.x, innerLeft);
  const restRight = Math.min(preferredRest.x + preferredRest.width, LOGICAL_WIDTH - innerLeft);
  const restArea = { x: restX, y: preferredRest.y, width: restRight - restX, height: preferredRest.height };

  return finish(slots, restArea, o.baseSize, width, height, s);
}

export interface CenteredOptions {
  baseSize: Size;
  targetScale: number;
  edgeMargin?: number;
}

/**
 * One big button centered in the play band. The rest area is the whole play band:
 * the button steps aside while the show runs.
 */
export function centeredLayout(o: CenteredOptions): LayoutResult {
  const edge = o.edgeMargin ?? 24;
  const s = o.targetScale;
  const width = Math.floor(Math.min(o.baseSize.width * s, (LOGICAL_WIDTH - 2 * edge) / HITBOX_FACTOR));
  const height = Math.floor(Math.min(o.baseSize.height * s, BAND_HEIGHT / HITBOX_FACTOR));
  const cx = LOGICAL_WIDTH / 2;
  const cy = DEAD_ZONE_TOP + BAND_HEIGHT / 2;
  const graphic = { x: cx - width / 2, y: cy - height / 2, width, height };
  const restArea = { x: 0, y: DEAD_ZONE_TOP, width: LOGICAL_WIDTH, height: BAND_HEIGHT };
  return finish([{ graphic, hitbox: hitboxOf(graphic) }], restArea, o.baseSize, width, height, s);
}

function finish(
  slots: LayoutSlot[],
  restArea: Rect,
  base: Size,
  width: number,
  height: number,
  s: number,
): LayoutResult {
  const effectiveScale = { x: width / base.width, y: height / base.height };
  const capped = effectiveScale.x < s - 0.01 || effectiveScale.y < s - 0.01;
  return { slots, restArea, requestedScale: s, effectiveScale, capped };
}
