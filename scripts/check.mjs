// Validate content and run every visualization in headless Chromium.
//
//   node scripts/check.mjs                 # everything
//   node scripts/check.mjs pma/4           # one chapter
//   node scripts/check.mjs pma-4.19 rca    # an item and a whole collection
//   node scripts/check.mjs physics         # a whole field
//   flags: --shots (save PNGs to shots/), --modes (also every segmented-control option and every flipped toggle → shots/<id>~k.png),
//          --dark, --still, --w=860, --static (skip browser), --quiet, --jobs=N
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { loadAll, validate, printProblems, ROOT } from './lib.mjs';
// --report=path saves per-item evidence; --fail-on-warnings also gates quality.
import { createServer } from './serve.mjs';
import { findBrowser, installBrowserAssets } from './browser.mjs';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')).map((a) => a.split('=')[0]));
const flagVal = (k, d) => { const a = args.find((x) => x.startsWith(k + '=')); return a ? a.split('=')[1] : d; };
const targets = args.filter((a) => !a.startsWith('--'));
// --changed[=ref]: check the content files changed relative to ref (default origin/main)
if (flags.has('--changed')) {
  const { execSync } = await import('node:child_process');
  const ref = flagVal('--changed', 'origin/main');
  const out = execSync(`git diff --name-only ${ref}...HEAD -- content; git diff --name-only -- content; git ls-files --others --exclude-standard -- content`, { encoding: 'utf8' });
  const files = [...new Set(out.split('\n').filter((f) => /^content\/[a-z0-9]+\/ch\d{2}[\w-]*\.js$/.test(f)))];
  console.log(`changed chapter files vs ${ref}: ${files.length}`);
  if (!files.length) targets.push('--none--'); else targets.push(...files);
}

const { items, planned, collections, problems } = await loadAll();
const P = [...problems, ...validate(items, planned, collections)];
const fieldOf = new Map(collections.map((C) => [C.id, C.field]));
const matchT = (t, it) => {
  if (t.includes('*')) return new RegExp('^' + t.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(it.file);
  return t === it.id || t === it.col || t === `${it.col}/${it.chapter}` || t === it.file || (it.col && t === fieldOf.get(it.col));
};
// Resolve the requested items once, including definitions without a picture.
// Repeating this scan for every diagnostic made a large review sample quadratic
// in the number of targets and content items before Chromium could even start.
const selectedItems = items.filter((it) => !targets.length || targets.some((t) => matchT(t, it)));
const sel = selectedItems.filter((it) => typeof it.viz === 'function');
const relevant = P.filter((p) => !targets.length || targets.some((t) => matchT(t, { file: p.where.split(' ')[0], id: null, col: null })) || selectedItems.some((it) => p.where.startsWith(`${it.file} ${it.num}`) || p.where === it.file));
console.log(`static check: ${sel.length} item(s)`);
const st = printProblems(relevant, { quiet: flags.has('--quiet') });
console.log(`  ${st.errors} error(s), ${st.warnings} warning(s)`);
if (flags.has('--static')) process.exit(st.errors || (flags.has('--fail-on-warnings') && st.warnings) ? 1 : 0);

// ---------- browser run ----------
const { chromium } = await import('playwright-core');
const server = createServer({ verificationAssets: true }); await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 1000, height: 1400 }, reducedMotion: 'no-preference' });
await installBrowserAssets(ctx, { local: true });
if (flags.has('--shots') || flags.has('--modes')) mkdirSync(join(ROOT, 'shots'), { recursive: true });

const theme = flags.has('--dark') ? 'dark' : 'light';
const timeout = +flagVal('--timeout', 30000);
const verificationConfig = { width: +flagVal('--w', 860), still: flags.has('--still'), screenshots: flags.has('--shots') || flags.has('--modes'), contentFingerprinting: 'per-item-before-after-v1', assets: 'local-katex-stable-cache-v1', settling: flags.has('--still') ? 'fonts-frames-css-transitions-v1' : 'live-waits-v1' };
const results = [];
// Include shared helpers in a collection's fingerprint: changing a numerical
// helper invalidates its browser evidence just as changing a chapter does.
const hashFiles = files => {
  const hash = createHash('sha256');
  for (const file of files.sort()) { hash.update(file); hash.update(readFileSync(join(ROOT, file))); }
  return hash.digest('hex');
};
const commonFiles = ['scripts/check.mjs', 'scripts/browser.mjs', 'scripts/serve.mjs', 'tools/harness.html',
  'data/atlas.css',
  ...readdirSync(join(ROOT, 'assets/js/viz'), { recursive: true }).filter(f => f.endsWith('.js')).map(f => `assets/js/viz/${f}`),
  ...readdirSync(join(ROOT, 'assets/css'), { recursive: true }).filter(f => f.endsWith('.css')).map(f => `assets/css/${f}`)];
const commonHash = hashFiles(commonFiles);
const hashCollection = col => hashFiles(readdirSync(join(ROOT, 'content', col)).filter(f => f.endsWith('.js')).map(f => `content/${col}/${f}`));
const fingerprints = Object.fromEntries([...new Set(sel.map(it => it.col))].map(col => [col, hashCollection(col)]));
const passes = r => !r.errs.length && !r.tex.length && !r.blank.length && !r.qual.length;
if (flags.has('--resume')) {
  const previous = JSON.parse(readFileSync(resolve(flagVal('--resume', 'verification-report.json')), 'utf8'));
  if (previous.theme !== theme || previous.modes !== flags.has('--modes')) throw new Error('Resume report uses a different theme or mode setting');
  if (previous.commonHash === commonHash && JSON.stringify(previous.verificationConfig) === JSON.stringify(verificationConfig)) {
    const byId = new Map(sel.map(it => [it.id, it]));
    for (const r of previous.results) {
      const it = byId.get(r.id);
      const suffix = theme === 'dark' ? '.dark' : '';
      const shotsPresent = !verificationConfig.screenshots || [join(ROOT, 'shots', `${r.id}${suffix}.png`),
        ...Array.from({ length: r.modeStates || 0 }, (_, k) => join(ROOT, 'shots', `${r.id}~${k+1}${suffix}.png`))].every(existsSync);
      if (it && shotsPresent && passes(r) && r.contentHash === fingerprints[it.col]) results.push({ it, ...r });
    }
  }
  console.log(`resuming: ${results.length} unchanged passing items; changed collections and failures will run again`);
}
const completed = new Set(results.map(r => r.it.id));
const queue = sel.filter(it => !completed.has(it.id));
const saveReport = complete => {
  if (!flags.has('--report')) return;
  const path = resolve(flagVal('--report', 'verification-report.json'));
  mkdirSync(dirname(path), { recursive: true });
  const failed = results.filter(r => r.errs.length).length;
  const warnings = results.filter(r => !r.errs.length && (r.tex.length || r.blank.length)).length;
  writeFileSync(path, JSON.stringify({ schemaVersion: 2, theme, targets, modes: flags.has('--modes'), verificationConfig,
    complete, commonHash, fingerprints, static: st,
    summary: { run: results.length, total: sel.length, failed, warnings, qualityWarnings: results.filter(r => r.qual.length).length },
    results: results.map(({ it, ...r }) => ({ id: it.id, file: it.file, ...r })),
  }, null, 2) + '\n');
};
saveReport(false);
async function settleStill(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.dispatchEvent(new Event('vizpause'));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations()
      .filter(a => typeof CSSTransition !== 'undefined' && a instanceof CSSTransition && a.playState === 'running')
      .map(a => a.finished.catch(() => {})));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
async function worker() {
  const page = await ctx.newPage();
  const consoleErrs = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });
  page.on('pageerror', (e) => consoleErrs.push(String(e.stack || e)));
  while (queue.length) {
    const it = queue.shift(); consoleErrs.length = 0;
    const url = `http://localhost:${port}/tools/harness.html?file=${encodeURIComponent(it.file)}&id=${encodeURIComponent(it.id)}&col=${it.col}&theme=${theme}&w=${flagVal('--w', 860)}${flags.has('--still') ? '&still=1' : ''}`;
    let r;
    const contentHash = hashCollection(it.col);
    try {
      await page.goto(url, { waitUntil: 'load', timeout });
      await page.waitForFunction(() => window.__done, null, { timeout: flags.has('--timeout') ? timeout : 20000 });
      r = await page.evaluate(() => window.__done);
      if (flags.has('--shots') || flags.has('--modes')) await page.locator('#shot').screenshot({ path: join(ROOT, 'shots', `${it.id}${theme === 'dark' ? '.dark' : ''}.png`), timeout });
      if (flags.has('--modes')) {
        // click through every option of every segmented control, and flip every toggle, screenshotting each state
        const snap = async () => {
          if (flags.has('--still')) await settleStill(page);
          else {
            await page.waitForTimeout(700); await page.evaluate(() => window.dispatchEvent(new Event('vizpause'))); await page.waitForTimeout(80);
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          }
          k++;
          const blank = await page.evaluate(() => window.__inspectCanvases?.() || []);
          r.blank = [...(r.blank || []), ...blank.map(i => `mode${k}:canvas${i}`)];
          await page.locator('#shot').screenshot({ path: join(ROOT, 'shots', `${it.id}~${k}${theme === 'dark' ? '.dark' : ''}.png`), timeout });
        };
        const segs = await page.locator('#viz .seg').count(); let k = 0;
        for (let i = 0; i < segs; i++) {
          if (!(await page.locator('#viz .seg').nth(i).isVisible())) continue;
          const btns = page.locator('#viz .seg').nth(i).locator('button'); const n = await btns.count();
          let def = 0; for (let j = 0; j < n; j++) if (await btns.nth(j).evaluate((b) => b.classList.contains('on'))) def = j;
          for (let j = 0; j < n; j++) {
            if (j === def || !(await btns.nth(j).isVisible())) continue;
            await btns.nth(j).click({ timeout: 30000, noWaitAfter: true }); await snap();
          }
          await btns.nth(def).click({ timeout: 30000, noWaitAfter: true }); // back to the default
          if (flags.has('--still')) await settleStill(page); else await page.waitForTimeout(150);
        }
        const togs = page.locator('#viz .ctl-toggle input'); const nt = await togs.count();
        for (let i = 0; i < nt; i++) {
          const lab = page.locator('#viz .ctl-toggle label').nth(i);
          if (!(await lab.isVisible())) continue;
          await lab.click({ timeout: 30000, noWaitAfter: true }); await snap();
          await lab.click({ timeout: 30000, noWaitAfter: true });
          if (flags.has('--still')) await settleStill(page); else await page.waitForTimeout(150);
        }
        const errsNow = await page.evaluate(() => window.__vizErrors || []);
        if (errsNow.length) r.errors = [...(r.errors || []), ...errsNow];
        r.texErrors = [...new Set([...(r.texErrors || []), ...await page.evaluate(() => window.__texErrors || [])])];
        r.modeStates = k;
      }
    } catch (e) { r = { ok: false, errors: [String(e.message || e)], texErrors: [] }; }
    let contentChanged;
    try { contentChanged = hashCollection(it.col) !== contentHash; } catch { contentChanged = true; }
    if (contentChanged) r.errors = [...(r.errors || []), 'Collection source changed during this item; rerun it against stable content.'];
    const errs = [...new Set([...(r.errors || []), ...consoleErrs.filter((m) => !/favicon|Failed to load resource/.test(m))])];
    const q = r.quality || {}; const qual = [];
    if (r.ok && q.interactive === 0) qual.push('static picture: no control, handle, drag, click or hover');
    if (r.ok && !q.readout && it.kind !== 'Definition') qual.push('no live readout');
    results.push({ it, contentHash, renderer: r.renderer, modeStates: r.modeStates || 0, errs, tex: r.texErrors || [], blank: r.blank || [], canvases: r.canvases || 0, qual });
    const flag = errs.length ? '✗' : (r.texErrors?.length || r.blank?.length || qual.length) ? '!' : '✓';
    if (!flags.has('--quiet') || flag !== '✓') {
      console.log(`${flag} ${it.id.padEnd(12)} ${it.name.slice(0, 60)}`);
      for (const e of errs) console.log(`    error: ${e.split('\n').slice(0, 3).join(' | ')}`);
      for (const e of r.texErrors || []) console.log(`    tex: ${e}`);
      if (r.blank?.length) console.log(`    blank canvas(es): ${r.blank.join(', ')} of ${r.canvases}`);
      for (const w of qual) console.log(`    quality: ${w}`);
    }
    if (flags.has('--quiet') && results.length % 100 === 0) console.log(`progress: ${results.length}/${sel.length} (${theme})`);
    if (results.length % 25 === 0) saveReport(false);
  }
  await page.close();
}
await Promise.all(Array.from({ length: Math.min(+flagVal('--jobs', 4), sel.length || 1) }, worker));
await browser.close(); server.close();
const bad = results.filter((r) => r.errs.length).length, warn = results.filter((r) => !r.errs.length && (r.tex.length || r.blank.length)).length;
const qwarn = results.filter((r) => r.qual.length).length;
console.log(`\nbrowser check: ${results.length} run, ${bad} failed, ${warn} with TeX/blank warnings, ${qwarn} with quality warnings` + (flags.has('--shots') ? `; screenshots in shots/` : ''));
saveReport(true);
process.exit(bad || st.errors || (flags.has('--fail-on-warnings') && (st.warnings || warn || qwarn)) ? 1 : 0);
