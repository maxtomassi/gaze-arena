#!/usr/bin/env node
// Minimal static server that serves a built game from a subpath, like a real deployment.
// Usage: node scripts/serve-subpath.mjs --dir dist --base /goal-party/ [--port 4310]
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const dir = resolve(opt('--dir', 'dist'));
let base = opt('--base', '/');
if (!base.startsWith('/')) base = `/${base}`;
if (!base.endsWith('/')) base = `${base}/`;
const port = Number(opt('--port', process.env.PORT ?? 4173));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(join(dir, 'index.html'))) {
  console.error(`serve-subpath: ${dir}/index.html not found — build the game first`);
  process.exit(1);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === base.slice(0, -1)) {
    res.writeHead(301, { location: base + url.search });
    res.end();
    return;
  }
  if (!url.pathname.startsWith(base)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end(`Not under ${base}`);
    return;
  }
  let rel = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = normalize(join(dir, rel));
  if (!file.startsWith(dir + sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Serving ${dir} at http://localhost:${port}${base}`);
});
