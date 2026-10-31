/** Logical canvas and layout rules shared by every game (see docs/design-principles.md). */
export const LOGICAL_WIDTH = 1920;
export const LOGICAL_HEIGHT = 1080;

/** Targets must stay within this vertical band (dead zones above and below). */
export const DEAD_ZONE_TOP = 108;
export const DEAD_ZONE_BOTTOM = 990;

/** Hitbox = graphic + 18% (per dimension, centered on the graphic). */
export const HITBOX_FACTOR = 1.18;
/** Minimum hitbox side at targetScale 1. */
export const MIN_HITBOX = 340;
/** Minimum spacing between targets (and between targets and the rest area). */
export const MIN_TARGET_GAP = 60;

/** InputGate tail after every action. */
export const GATE_TAIL_MS = 500;
/** Clicks closer than this in time and space to the previous one are ignored. */
export const DEBOUNCE_MS = 400;
export const DEBOUNCE_RADIUS = 40;

/** Inactivity: invitation animation period. Never a penalty. */
export const INVITATION_INTERVAL_MS = 30_000;

/** Full-screen flashes per second, upper bound. */
export const MAX_FLASHES_PER_SECOND = 3;

export const TARGET_SCALE_MIN = 0.8;
export const TARGET_SCALE_MAX = 1.5;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectContains(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** Hitbox rect for a graphic rect: grown by HITBOX_FACTOR around its center. */
export function hitboxOf(graphic: Rect, factor = HITBOX_FACTOR): Rect {
  const width = graphic.width * factor;
  const height = graphic.height * factor;
  return {
    x: graphic.x - (width - graphic.width) / 2,
    y: graphic.y - (height - graphic.height) / 2,
    width,
    height,
  };
}
