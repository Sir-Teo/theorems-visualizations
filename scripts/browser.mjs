// Locate a Chromium for headless checks: $CHROME_PATH, Playwright's browser cache
// ($PLAYWRIGHT_BROWSERS_PATH or ~/Library/Caches/ms-playwright), or a system Chrome.
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

/** Use the pinned real renderer in browser checks, even without browser egress.
 * Production URLs stay unchanged. Fonts and CSS come from the same KaTeX release.
 */
export async function installBrowserAssets(context, { local = false } = {}) {
  const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../node_modules/katex/dist');
  if (!existsSync(join(dist, 'katex.min.js'))) throw new Error('Install dev dependencies before browser verification (KaTeX 0.16.11 is required).');
  // createServer({ verificationAssets: true }) already serves these exact
  // pinned files. Avoid routing there: Playwright routing disables HTTP cache.
  if (local) return;
  await context.route('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/**', async route => {
    const prefix = '/npm/katex@0.16.11/dist/';
    const relative = decodeURIComponent(new URL(route.request().url()).pathname.slice(prefix.length));
    const path = resolve(dist, relative);
    if (!path.startsWith(dist + sep) || !existsSync(path)) return route.abort();
    const contentType = path.endsWith('.js') ? 'application/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.woff2') ? 'font/woff2' : path.endsWith('.woff') ? 'font/woff' : 'font/ttf';
    await route.fulfill({ path, contentType, headers: { 'access-control-allow-origin': '*' } });
  });
  // Optional display fonts are irrelevant to numeric/TeX checks and can stall load.
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
}

export function findBrowser() {
  const cands = [process.env.CHROME_PATH];
  for (const dir of [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), 'Library/Caches/ms-playwright'), join(homedir(), '.cache/ms-playwright')]) {
    if (!dir || !existsSync(dir)) continue;
    for (const d of readdirSync(dir).sort().reverse()) {
      if (d.startsWith('chromium_headless_shell-')) cands.push(join(dir, d, 'chrome-linux/headless_shell'), join(dir, d, 'chrome-headless-shell-linux64/chrome-headless-shell'), join(dir, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'));
      if (/^chromium-\d+$/.test(d)) cands.push(join(dir, d, 'chrome-linux/chrome'), join(dir, d, 'chrome-linux64/chrome'));
    }
  }
  cands.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome');
  return cands.filter(Boolean).find((p) => existsSync(p));
}
