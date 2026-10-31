import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..', '..');

export function walk(dir: string, filter: (f: string) => boolean = () => true): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === 'dist') return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full, filter) : filter(full) ? [full] : [];
  });
}

export function games(): string[] {
  const dir = join(ROOT, 'games');
  return readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory());
}

/** Static and dynamic import specifiers in a TS/JS file. */
export function importsOf(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  const out: string[] = [];
  const re = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|@import\s+['"]([^'"]+)['"]/g;
  for (const m of src.matchAll(re)) out.push((m[1] ?? m[2] ?? m[3]) as string);
  return out;
}

export function readJson<T = Record<string, unknown>>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}
