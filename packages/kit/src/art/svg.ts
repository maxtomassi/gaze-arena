import type Phaser from 'phaser';

/** Default rasterization density: textures are drawn at 2× and displayed at 0.5 scale. */
export const SVG_RESOLUTION = 2;

export interface SvgPart {
  svg: string;
  width: number;
  height: number;
  /** Joint position inside the part, in part pixels (used as the image origin). */
  pivotX: number;
  pivotY: number;
}

export function svgDocument(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Rasterizes an SVG string into a Phaser texture. Data URIs never touch the network.
 * Resolves immediately if the key already exists.
 */
export async function addSvgTexture(
  textures: Phaser.Textures.TextureManager,
  key: string,
  part: Pick<SvgPart, 'svg' | 'width' | 'height'>,
  resolution = SVG_RESOLUTION,
): Promise<void> {
  if (textures.exists(key)) return;
  const img = new Image();
  img.src = svgDataUri(part.svg);
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(part.width * resolution);
  canvas.height = Math.ceil(part.height * resolution);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (!textures.exists(key)) textures.addCanvas(key, canvas);
}
