import { join } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { ROOT } from './helpers';

const eslint = new ESLint({ cwd: ROOT });

async function messages(code: string, file: string): Promise<string[]> {
  const [res] = await eslint.lintText(code, { filePath: join(ROOT, file) });
  return (res?.messages ?? []).map((m) => m.message);
}

describe('golden-rule lint checks', () => {
  it('forbids setInteractive outside GazeButton', async () => {
    const m = await messages('declare const s: any;\ns.setInteractive();\n', 'games/goal-party/src/x.ts');
    expect(m.join()).toMatch(/GazeButton/);
  });

  it('forbids dblclick / contextmenu handlers', async () => {
    const m = await messages("window.addEventListener('dblclick', () => {});\n", 'packages/kit/src/x.ts');
    expect(m.join()).toMatch(/single left clicks/);
  });

  it('forbids direct pointer listeners in games', async () => {
    const m = await messages("declare const scene: any;\nscene.input.on('pointerdown', () => {});\n", 'games/goal-party/src/x.ts');
    expect(m.join()).toMatch(/GazeButton/);
  });

  it('forbids importing kit internals or other games from a game', async () => {
    const a = await messages("import '@gaze-arena/kit/src/ui/GazeButton';\n", 'games/goal-party/src/x.ts');
    const b = await messages("import '../../../games/other/src/x';\n", 'games/goal-party/src/x.ts');
    const c = await messages("import '@gaze-arena/game-other';\n", 'games/goal-party/src/x.ts');
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
    expect(c.length).toBeGreaterThan(0);
  });

  it('forbids the kit importing games', async () => {
    const m = await messages("import '../../../games/goal-party/src/config';\n", 'packages/kit/src/x.ts');
    expect(m.join()).toMatch(/never imports from games/);
  });
});
