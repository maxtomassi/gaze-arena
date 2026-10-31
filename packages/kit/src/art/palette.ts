/** "Arena Night" palette (docs/design-principles.md). */
export const PALETTE = {
  night: 0x0b1a3a,
  arena: 0x16306b,
  yellow: 0xffd60a,
  magenta: 0xff2e88,
  cyan: 0x00e5ff,
  green: 0x1faa59,
  red: 0xe63946,
  white: 0xffffff,
  black: 0x000000,
} as const;

export const PALETTE_CSS = {
  night: '#0B1A3A',
  arena: '#16306B',
  yellow: '#FFD60A',
  magenta: '#FF2E88',
  cyan: '#00E5FF',
  green: '#1FAA59',
  red: '#E63946',
  white: '#FFFFFF',
  black: '#000000',
} as const;

/** Outline width at 1920×1080. */
export const OUTLINE = 6;

export const FONT_TITLE = 'Bangers';
export const FONT_BODY = 'Inter';

export function toCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
