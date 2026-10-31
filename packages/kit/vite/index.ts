import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin, UserConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const VIRTUAL_ID = 'virtual:gaze-arena/public-assets';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

function listFiles(dir: string, root = dir): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full, root) : [relative(root, full).split(sep).join('/')];
  });
}

/** Exposes the list of files in public/ as `virtual:gaze-arena/public-assets`. */
export function publicAssetsPlugin(publicDir: string): Plugin {
  return {
    name: 'gaze-arena:public-assets',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export default ${JSON.stringify(listFiles(publicDir))};`;
    },
    configureServer(server) {
      server.watcher.add(publicDir);
      const invalidate = (file: string) => {
        if (!file.startsWith(publicDir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
      };
      server.watcher.on('add', invalidate);
      server.watcher.on('unlink', invalidate);
    },
  };
}

export interface GameViteOptions {
  /** Directory of the game (pass `import.meta.dirname`). */
  root: string;
  /** Game id, e.g. "goal-party". */
  id: string;
  /** Installed app name (English; the in-game title is localized). */
  name: string;
  shortName?: string;
  description?: string;
}

/**
 * Shared Vite config for a game: relative base (works from any subpath), everything bundled
 * locally, its own PWA manifest and service worker.
 */
export function defineGameConfig(o: GameViteOptions): UserConfig {
  const publicDir = join(o.root, 'public');
  return {
    root: o.root,
    base: './',
    publicDir,
    build: {
      outDir: join(o.root, 'dist'),
      emptyOutDir: true,
      target: 'es2022',
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
    },
    server: { port: 5173 },
    preview: { port: 4173 },
    plugins: [
      publicAssetsPlugin(publicDir),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        includeAssets: ['icon.svg'],
        manifest: {
          id: `./?app=${o.id}`,
          name: o.name,
          short_name: o.shortName ?? o.name,
          description: o.description ?? o.name,
          start_url: './',
          scope: './',
          display: 'fullscreen',
          orientation: 'landscape',
          background_color: '#0B1A3A',
          theme_color: '#0B1A3A',
          icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webp,woff,woff2,wav,mp3,ogg,json}'],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          navigateFallback: null,
        },
      }),
    ],
  };
}
