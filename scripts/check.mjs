// Validate content and run every visualization in headless Chromium.
//
//   node scripts/check.mjs                 # everything
//   node scripts/check.mjs pma/4           # one chapter
//   node scripts/check.mjs pma-4.19 rca    # an item and a whole book
//   flags: --shots (save PNGs to shots/), --modes (also every segmented-control option → shots/<id>~k.png),
//          --dark, --still, --w=860, --static (skip browser), --quiet, --jobs=N
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { loadAll, validate, printProblems, ROOT } from './lib.mjs';
import { createServer } from './serve.mjs';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')).map((a) => a.split('=')[0]));
const flagVal = (k, d) => { const a = args.find((x) => x.startsWith(k + '=')); return a ? a.split('=')[1] : d; };
const targets = args.filter((a) => !a.startsWith('--'));

const { items, problems } = await loadAll();
const P = [...problems, ...validate(items)];
const matchT = (t, it) => {
  if (t.includes('*')) return new RegExp('^' + t.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(it.file);
  return t === it.id || t === it.book || t === `${it.book}/${it.chapter}` || t === it.file;
};
const sel = items.filter((it) => typeof it.viz === 'function').filter((it) => !targets.length || targets.some((t) => matchT(t, it)));
const relevant = P.filter((p) => !targets.length || targets.some((t) => matchT(t, { file: p.where.split(' ')[0], id: null, book: null })) || items.filter((it) => targets.some((t) => matchT(t, it))).some((it) => p.where.startsWith(`${it.file} ${it.num}`) || p.where === it.file));
console.log(`static check: ${sel.length} item(s)`);
const st = printProblems(relevant, { quiet: flags.has('--quiet') });
console.log(`  ${st.errors} error(s), ${st.warnings} warning(s)`);
if (flags.has('--static')) process.exit(st.errors ? 1 : 0);

// ---------- browser run ----------
function findBrowser() {
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  const cands = [
    process.env.CHROME_PATH,
    ...['1243', '1223', '1181'].map((v) => join(cache, `chromium_headless_shell-${v}/chrome-headless-shell-mac-arm64/chrome-headless-shell`)),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/chromium', '/usr/bin/google-chrome',
  ].filter(Boolean);
  return cands.find((p) => existsSync(p));
}
const { chromium } = await import('playwright-core');
const server = createServer(); await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 1000, height: 1400 }, reducedMotion: 'no-preference' });
if (flags.has('--shots')) mkdirSync(join(ROOT, 'shots'), { recursive: true });

const theme = flags.has('--dark') ? 'dark' : 'light';
const results = [];
const queue = sel.slice();
async function worker() {
  const page = await ctx.newPage();
  const consoleErrs = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });
  while (queue.length) {
    const it = queue.shift(); consoleErrs.length = 0;
    const url = `http://localhost:${port}/tools/harness.html?file=${encodeURIComponent(it.file)}&id=${encodeURIComponent(it.id)}&theme=${theme}&w=${flagVal('--w', 860)}${flags.has('--still') ? '&still=1' : ''}`;
    let r;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(() => window.__done, null, { timeout: 20000 });
      r = await page.evaluate(() => window.__done);
      if (flags.has('--shots')) await page.locator('#shot').screenshot({ path: join(ROOT, 'shots', `${it.id}${theme === 'dark' ? '.dark' : ''}.png`) });
      if (flags.has('--modes')) {
        // click through every option of every segmented control and screenshot each state
        const segs = await page.locator('#viz .seg').count(); let k = 0;
        for (let i = 0; i < segs; i++) {
          const btns = page.locator('#viz .seg').nth(i).locator('button'); const n = await btns.count();
          for (let j = 0; j < n; j++) {
            if (await btns.nth(j).evaluate((b) => b.classList.contains('on'))) continue;
            await btns.nth(j).click(); await page.waitForTimeout(700);
            await page.evaluate(() => window.dispatchEvent(new Event('vizpause'))); await page.waitForTimeout(80);
            k++; await page.locator('#shot').screenshot({ path: join(ROOT, 'shots', `${it.id}~${k}${theme === 'dark' ? '.dark' : ''}.png`) });
          }
          await btns.nth(0).click(); await page.waitForTimeout(150);
        }
        const errsNow = await page.evaluate(() => window.__vizErrors || []);
        if (errsNow.length) r.errors = [...(r.errors || []), ...errsNow];
      }
    } catch (e) { r = { ok: false, errors: [String(e.message || e)], texErrors: [] }; }
    const errs = [...new Set([...(r.errors || []), ...consoleErrs.filter((m) => !/favicon|Failed to load resource/.test(m))])];
    results.push({ it, errs, tex: r.texErrors || [], blank: r.blank || [], canvases: r.canvases || 0 });
    const flag = errs.length ? '✗' : (r.texErrors?.length || r.blank?.length) ? '!' : '✓';
    if (!flags.has('--quiet') || flag !== '✓') {
      console.log(`${flag} ${it.id.padEnd(12)} ${it.name.slice(0, 60)}`);
      for (const e of errs) console.log(`    error: ${e.split('\n').slice(0, 3).join(' | ')}`);
      for (const e of r.texErrors || []) console.log(`    tex: ${e}`);
      if (r.blank?.length) console.log(`    blank canvas(es): ${r.blank.join(', ')} of ${r.canvases}`);
    }
  }
  await page.close();
}
await Promise.all(Array.from({ length: Math.min(+flagVal('--jobs', 4), sel.length || 1) }, worker));
await browser.close(); server.close();
const bad = results.filter((r) => r.errs.length).length, warn = results.filter((r) => !r.errs.length && (r.tex.length || r.blank.length)).length;
console.log(`\nbrowser check: ${results.length} run, ${bad} failed, ${warn} with TeX/blank warnings` + (flags.has('--shots') ? `; screenshots in shots/` : ''));
process.exit(bad || st.errors ? 1 : 0);
