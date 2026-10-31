import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, games, importsOf, readJson, walk } from './helpers';

const isCode = (f: string) => /\.(ts|mts|js|mjs|css)$/.test(f);
const KIT_ENTRY_POINTS = Object.keys(
  readJson<{ exports: Record<string, string> }>(join(ROOT, 'packages/kit/package.json')).exports,
).map((k) => (k === '.' ? '@gaze-arena/kit' : `@gaze-arena/kit/${k.slice(2)}`));

describe.each(games())('game "%s" imports', (id) => {
  const gameDir = join(ROOT, 'games', id);
  const pkg = readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
    join(gameDir, 'package.json'),
  );
  const rootPkg = readJson<{ devDependencies?: Record<string, string> }>(join(ROOT, 'package.json'));
  const allowedPackages = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(rootPkg.devDependencies ?? {}),
  ]);
  const files = walk(gameDir, isCode);

  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('only from its own folder, @gaze-arena/kit entry points, or its declared packages', () => {
    const problems: string[] = [];
    for (const file of files) {
      for (const spec of importsOf(file)) {
        const where = `${relative(ROOT, file)}: "${spec}"`;
        if (spec.startsWith('.') || spec.startsWith('/')) {
          const target = resolve(dirname(file), spec);
          if (!(target + sep).startsWith(gameDir + sep)) problems.push(`${where} leaves the game folder`);
        } else if (spec.startsWith('@gaze-arena/')) {
          if (!KIT_ENTRY_POINTS.includes(spec)) problems.push(`${where} is not a public kit entry point`);
        } else if (spec.startsWith('node:') || spec.startsWith('virtual:')) {
          continue;
        } else {
          const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : (spec.split('/')[0] as string);
          if (!allowedPackages.has(name)) problems.push(`${where} is not a declared dependency`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('kit imports', () => {
  it('never import from games', () => {
    const kitDir = join(ROOT, 'packages/kit');
    const problems: string[] = [];
    for (const file of walk(kitDir, isCode)) {
      for (const spec of importsOf(file)) {
        const target = spec.startsWith('.') ? resolve(dirname(file), spec) : '';
        if (spec.includes('@gaze-arena/game') || (target && !(target + sep).startsWith(kitDir + sep))) {
          problems.push(`${relative(ROOT, file)}: "${spec}"`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
