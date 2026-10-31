// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- needed by games that compile kit sources
/// <reference path="../virtual.d.ts" />
import files from 'virtual:gaze-arena/public-assets';

/**
 * Files shipped in the game's public/ folder, known at build time. Lets a scene skip loading a
 * generated asset that does not exist yet (and use its code-drawn fallback) without a 404.
 */
export function hasPublicAsset(path: string): boolean {
  return files.includes(path.replace(/^\.?\//, ''));
}

export function publicAssets(): readonly string[] {
  return files;
}
