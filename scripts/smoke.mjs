// Smoke test: load every kind of page in headless Chromium and fail on console errors.
//   node scripts/smoke.mjs [--shots] [--dark] [--routes=#/,#/map]
// Needs data/ (run `node scripts/build.mjs` first) and playwright-core + a Chromium (see check.mjs).
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib.mjs';
import { createServer } from './serve.mjs';
import { findBrowser } from './browser.mjs';

const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const val = (k) => args.find((a) => a.startsWith(k + '='))?.split('=').slice(1).join('=');
if (!existsSync(join(ROOT, 'data/index.json'))) { console.error('data/index.json missing — run node scripts/build.mjs'); process.exit(1); }
const idx = JSON.parse(readFileSync(join(ROOT, 'data/index.json'), 'utf8'));
const live = idx.collections.filter((C) => C.count);
const someItem = (col) => idx.items.find((it) => it.col === col && it.viz);
const routes = val('--routes')?.split(',') || [
  '#/', '#/map', '#/timeline', '#/bridges', ...(idx.bridges || []).slice(0, 2).map((B) => `#/bridge/${B.slug}`), '#/status', '#/about', '#/audit',
  ...idx.fields.slice(0, 3).map((F) => `#/f/${F.id}`), `#/f/${idx.fields[idx.fields.length - 1].id}`,
  ...live.map((C) => `#/c/${C.id}`), ...live.map((C) => `#/c/${C.id}/${C.chapters.find((c) => c.count).n}`),
  ...live.map((C) => `#/t/${someItem(C.id)?.id}`).filter((r) => !r.endsWith('undefined')),
  ...(() => { try { const P = JSON.parse(readFileSync(join(ROOT, 'data/planned.json'), 'utf8')); const c = Object.keys(P.cols)[0]; return c ? [`#/t/${c}-${P.cols[c][0][0]}`] : []; } catch { return []; } })(),
  ...(idx.collections.find((C) => !C.count && !C.planned) ? [`#/c/${idx.collections.find((C) => !C.count && !C.planned).id}`] : []),
  '#/path/fa-12.23', '#/book/pma/4', '#/nope',
];
const { chromium } = await import('playwright-core');
const server = createServer(); await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, colorScheme: flag('--dark') ? 'dark' : 'light' });
if (flag('--shots')) mkdirSync(join(ROOT, 'shots'), { recursive: true });
let bad = 0;
for (const r of routes) {
  const page = await ctx.newPage(); const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e.stack || e)));
  await page.goto(`http://localhost:${port}/index.html${r}`, { waitUntil: 'load' });
  await page.waitForTimeout(r.startsWith('#/t/') ? 1800 : 900);
  const title = await page.title();
  const crashed = await page.locator('main h1', { hasText: 'Something went wrong' }).count();
  if (crashed) errs.push('page shows "Something went wrong"');
  if (flag('--shots')) await page.screenshot({ path: join(ROOT, 'shots', `page-${r.replace(/[#/?=.]+/g, '_').replace(/^_|_$/g, '') || 'home'}${flag('--dark') ? '.dark' : ''}.png`), fullPage: !r.startsWith('#/map') });
  console.log(`${errs.length ? '✗' : '✓'} ${r.padEnd(28)} ${title}`);
  for (const e of errs) console.log(`    ${e.split('\n').slice(0, 3).join(' | ')}`);
  bad += errs.length ? 1 : 0;
  await page.close();
}
await browser.close(); server.close();
console.log(`\n${routes.length} routes, ${bad} with errors`);
process.exit(bad ? 1 : 0);
