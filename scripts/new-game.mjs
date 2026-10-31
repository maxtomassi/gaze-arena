#!/usr/bin/env node
// Creates games/<id>/ from templates/game/.
// Usage: npm run new-game <game-id> [-- --title "Display Title"] [--existing] [--root <repo root>]
//   --existing  the folder already exists (e.g. SPEC.md written first): add the missing template
//               files and never overwrite anything that is already there.
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT_EXT = /\.(ts|json|md|yaml|yml|html|svg|css|mjs|js)$/;

export function toKey(id) {
  return id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function toTitle(id) {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function validateId(id) {
  if (!id) return 'missing game id';
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) return `invalid id "${id}": use kebab-case (e.g. penalty-blast)`;
  if (id.length > 40) return 'id too long';
  return null;
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

export function createGame({ id, title = toTitle(id), root, existing = false }) {
  const problem = validateId(id);
  if (problem) throw new Error(problem);
  const template = join(root, 'templates', 'game');
  const dest = join(root, 'games', id);
  if (existsSync(dest) && !existing) throw new Error(`games/${id} already exists (use --existing to fill it in)`);
  const added = [];
  for (const src of walk(template)) {
    const target = join(dest, relative(template, src));
    if (existsSync(target)) continue;
    cpSync(src, target);
    added.push(target);
  }
  const replacements = { __GAME_ID__: id, __GAME_KEY__: toKey(id), __GAME_TITLE__: title };
  for (const file of added) {
    if (!TEXT_EXT.test(file)) continue;
    let text = readFileSync(file, 'utf8');
    for (const [k, v] of Object.entries(replacements)) text = text.split(k).join(v);
    writeFileSync(file, text);
  }
  return { dest, added };
}

function main(argv) {
  const args = [...argv];
  const opt = (name) => {
    const i = args.indexOf(name);
    if (i === -1) return undefined;
    const [, value] = args.splice(i, 2);
    return value;
  };
  const existingIdx = args.indexOf('--existing');
  const existing = existingIdx !== -1;
  if (existing) args.splice(existingIdx, 1);
  const title = opt('--title');
  const root = resolve(opt('--root') ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
  const id = args[0];
  try {
    const { dest, added } = createGame({ id, title, root, existing });
    console.log(`Created ${added.length} files in ${dest}
Next steps:
  1. npm install            (links the new workspace)
  2. Translate the strings in src/i18n/it.json and write SPEC.md
  3. npm run dev -w games/${id}`);
  } catch (err) {
    console.error(`new-game: ${err.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
