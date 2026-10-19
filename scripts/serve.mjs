// Minimal static file server for local development: `npm run serve` → http://localhost:8173
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

export function createServer({ verificationAssets = false } = {}) {
  return http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = normalize(join(ROOT, p));
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      const s = await stat(file).catch(() => null);
      if (!s || !s.isFile()) { res.writeHead(404); res.end('not found'); return; }
      let body = await readFile(file);
      if (verificationAssets && p === '/tools/harness.html') {
        // Private checker transport: preserve the production harness URLs and
        // use the same pinned renderer locally without request interception.
        body = body.toString('utf8')
          .replace(/<link[^>]+fonts\.googleapis\.com[^>]*>\n/, '')
          .replaceAll('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/', '/node_modules/katex/dist/');
      }
      const cacheable = verificationAssets && (p.startsWith('/assets/') || p.startsWith('/node_modules/katex/'));
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': cacheable ? 'public, max-age=3600' : 'no-store' });
      res.end(body);
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = +(process.env.PORT || 8173);
  createServer().listen(port, () => console.log(`serving ${ROOT} at http://localhost:${port}/`));
}
