import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ROOT, walk } from './helpers';
// @ts-expect-error plain JS script without types
import { createGame, toKey, toTitle, validateId } from '../../scripts/new-game.mjs';

describe('new-game script', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'gaze-arena-'));
    cpSync(join(ROOT, 'templates'), join(root, 'templates'), { recursive: true });
    mkdirSync(join(root, 'games'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('derives the string-key prefix and title from the id', () => {
    expect(toKey('penalty-blast')).toBe('penaltyBlast');
    expect(toKey('goal-party-2')).toBe('goalParty2');
    expect(toTitle('penalty-blast')).toBe('Penalty Blast');
  });

  it('rejects invalid ids', () => {
    for (const bad of ['', 'Bad', 'with space', '-x', 'x-', 'a--b', '1game']) expect(validateId(bad)).not.toBeNull();
    expect(validateId('penalty-blast')).toBeNull();
  });

  it('creates a complete game with every placeholder replaced', () => {
    const { dest } = createGame({ id: 'penalty-blast', root });
    const files = walk(dest);
    for (const f of ['package.json', 'vite.config.ts', 'src/main.ts', 'src/i18n/en.json', 'src/i18n/it.json', 'SPEC.md', 'ASSETS.md', 'assets.yaml', 'tests/unit/i18n.test.ts', 'tests/e2e/smoke.spec.ts', 'playwright.config.ts']) {
      expect(existsSync(join(dest, f))).toBe(true);
    }
    for (const f of files) expect(readFileSync(f, 'utf8')).not.toMatch(/__GAME_(ID|KEY|TITLE)__/);
    const en = JSON.parse(readFileSync(join(dest, 'src/i18n/en.json'), 'utf8')) as Record<string, string>;
    expect(Object.keys(en).every((k) => k.startsWith('penaltyBlast.'))).toBe(true);
    expect(JSON.parse(readFileSync(join(dest, 'package.json'), 'utf8')).name).toBe('@gaze-arena/game-penalty-blast');
  });

  it('refuses to overwrite an existing game unless asked, and never overwrites files', () => {
    mkdirSync(join(root, 'games', 'demo'));
    writeFileSync(join(root, 'games', 'demo', 'SPEC.md'), 'my spec');
    expect(() => createGame({ id: 'demo', root })).toThrow(/already exists/);
    const { added } = createGame({ id: 'demo', root, existing: true });
    expect(added.length).toBeGreaterThan(5);
    expect(readFileSync(join(root, 'games', 'demo', 'SPEC.md'), 'utf8')).toBe('my spec');
  });
});
