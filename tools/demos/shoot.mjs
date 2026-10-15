// Screenshot the runtime demo items (tools/demos/runtime.js) in light and dark themes → shots/demo-<num>[.dark].png.
//   node tools/demos/shoot.mjs [1.1 1.3 …] [--w=860]
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from '../../scripts/serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), only = args.filter((a) => !a.startsWith('--')), w = (args.find((a) => a.startsWith('--w=')) || '--w=860').slice(4);
function findBrowser() {
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH, c = [process.env.CHROME_PATH];
  if (pw && existsSync(pw)) for (const d of readdirSync(pw).sort().reverse()) {
    if (d.startsWith('chromium_headless_shell-')) c.push(join(pw, d, 'chrome-linux/headless_shell'), join(pw, d, 'chrome-headless-shell-linux64/chrome-headless-shell'));
    if (/^chromium-\d+$/.test(d)) c.push(join(pw, d, 'chrome-linux/chrome'), join(pw, d, 'chrome-linux64/chrome'));
  }
  c.push('/usr/bin/chromium', '/usr/bin/google-chrome');
  return c.filter(Boolean).find((p) => existsSync(p));
}
const { default: mod } = await import('./runtime.js');
const nums = mod.items.map((it) => it.num).filter((n) => !only.length || only.includes(n));
const server = createServer(); await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 1000, height: 1400 } });
mkdirSync(join(ROOT, 'shots'), { recursive: true });
let bad = 0;
for (const theme of ['light', 'dark']) for (const num of nums) {
  const page = await ctx.newPage(), cons = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') cons.push(`${m.type()}: ${m.text()}`); });
  const url = `http://localhost:${server.address().port}/tools/harness.html?file=tools/demos/runtime.js&id=demo-${num}&theme=${theme}&w=${w}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__done, null, { timeout: 20000 });
  const r = await page.evaluate(() => window.__done);
  const file = join(ROOT, 'shots', `demo-${num}${theme === 'dark' ? '.dark' : ''}.png`);
  await page.locator('#shot').screenshot({ path: file });
  const errs = [...r.errors, ...r.texErrors, ...cons.filter((m) => !/favicon|Failed to load resource/.test(m))];
  if (errs.length || r.blank.length) bad++;
  console.log(`${errs.length || r.blank.length ? '✗' : '✓'} demo-${num} ${theme}${r.blank.length ? ' blank:' + r.blank : ''}${errs.length ? '\n    ' + errs.join('\n    ') : ''}`);
  await page.close();
}
await browser.close(); server.close();
process.exit(bad ? 1 : 0);
