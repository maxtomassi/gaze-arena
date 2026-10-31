import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, games, readJson } from './helpers';

describe.each(games())('game "%s" structure', (id) => {
  const dir = join(ROOT, 'games', id);

  it.each(['SPEC.md', 'ASSETS.md', 'assets.yaml', 'index.html', 'vite.config.ts', 'src/i18n/en.json', 'src/i18n/it.json'])(
    'has %s',
    (file) => {
      expect(existsSync(join(dir, file))).toBe(true);
    },
  );

  it('uses the shared Vite config (relative base, local assets, own PWA)', () => {
    const cfg = readFileSync(join(dir, 'vite.config.ts'), 'utf8');
    expect(cfg).toContain('defineGameConfig');
    expect(cfg).toContain(`id: '${id}'`);
  });

  it('has build, test, e2e and typecheck scripts', () => {
    const pkg = readJson<{ scripts: Record<string, string> }>(join(dir, 'package.json'));
    for (const s of ['build', 'test', 'e2e', 'typecheck']) expect(pkg.scripts[s]).toBeTruthy();
  });

  it('index.html references only relative URLs', () => {
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) expect(m[1]).toMatch(/^\.\//);
  });
});

describe('shared Vite config', () => {
  it("builds with base './' so a game works under any path", () => {
    const src = readFileSync(join(ROOT, 'packages/kit/vite/index.ts'), 'utf8');
    expect(src).toMatch(/base:\s*'\.\/'/);
    expect(src).toMatch(/start_url:\s*'\.\/'/);
    expect(src).toMatch(/scope:\s*'\.\/'/);
  });
});
