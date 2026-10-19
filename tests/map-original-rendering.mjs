import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

// An immutable historical painter is the reference; comparing two revised
// drawing paths alone would not test the new decomposition against its input.
const originalCommit = '150613a', original = execFileSync('git', ['show', `${originalCommit}:assets/js/graph.js`], { encoding: 'utf8' });
const hash = value => createHash('sha256').update(value).digest('hex');
assert.equal(hash(original), '39d9c74d440994f4c36e6988b58a7589753e0f24b19fc3ab89e72ec1ec48f069');
const start = original.indexOf('  _paint() {'), end = original.indexOf('\n}\n\n// ------------------------------------------------------------ treemap', start);
assert.ok(start > 0 && end > start, 'pinned original painter boundary');
const reference = original.slice(start, end), current = await readFile(new URL('../assets/js/graph.js', import.meta.url), 'utf8');
assert.ok(current.includes('  _paint({ layer'), 'current painter boundary');
const instrumented = current.replace('  _paint({ layer', reference.replace('_paint() {', '_paintReference() {') + '\n  _paint({ layer').replace('    this._bind();', '    window.__mapAudit = this; this._bind();');
const data = new Map();
for (const name of ['index.json', 'planned.json']) data.set(name, await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const dataset = [...data].map(([name, body]) => ({ name, sha256: hash(body) }));
const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true }), results = [];
const save = complete => writeFile('/tmp/atlas-map-original-rendering.json', JSON.stringify({ complete, originalCommit, originalGraphSHA256: hash(original), originalPainterSHA256: hash(reference), currentGraphSHA256: hash(current), dataset, browser: browser.version(), method: 'Exact pinned original _paint method injected only into the test module. Same current graph geometry/closures, full inventory, transform, fonts, theme and highlight state. Compare original direct pixels with revised direct and actual cached display, composited onto the same CSS background. No timing claim.', results }, null, 2) + '\n');
try {
  for (const theme of ['light', 'dark']) for (const dpr of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: theme, deviceScaleFactor: dpr }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/assets/js/graph.js', route => route.fulfill({ body: instrumented, contentType: 'application/javascript' }));
    for (const [name, body] of data) await page.route(`**/data/${name}`, route => route.fulfill({ body, contentType: 'application/json' }));
    try {
      await page.goto(`http://localhost:${server.address().port}/#/map`); await page.waitForFunction(() => window.__mapAudit?.nodes.length === 13574); await page.evaluate(() => document.fonts.ready);
      const cases = ['hover', 'selected', 'selected-hover'].flatMap(mode => [.1, .65].flatMap(k => [false, true].map(highlight => ({ mode, k, highlight }))));
      cases.push({ mode: 'unrelated-selected-hover', k: .65, highlight: true });
      for (const { mode, k, highlight } of cases) {
        const result = await page.evaluate(async ({ mode, k, highlight }) => {
          const m = window.__mapAudit, b = m.byId.get('ladr-2.22'), closure = m.closure(b);
          const unrelated = m.nodes.filter(n => !n.ghost && n !== b && !closure.anc.has(n.it.id) && !closure.desc.has(n.it.id)).reduce((best, n) => !best || Math.hypot(n.x - b.x, n.y - b.y) < Math.hypot(best.x - b.x, best.y - b.y) ? n : best, null);
          const connected = m.nodes.filter(n => !n.ghost && n !== b && (closure.anc.has(n.it.id) || closure.desc.has(n.it.id))).reduce((best, n) => !best || Math.hypot(n.x - b.x, n.y - b.y) < Math.hypot(best.x - b.x, best.y - b.y) ? n : best, null);
          const a = mode === 'unrelated-selected-hover' ? unrelated : mode === 'selected-hover' ? connected : m.byId.get('ladr-2.30');
          if (!a || mode.endsWith('selected-hover') && Math.hypot(a.x - b.x, a.y - b.y) * k > m.W / 3) throw Error('no nearby selection for the separate body/ring comparison');
          a.it.st ??= ''; b.it.st ??= ''; m.hover = mode === 'selected' ? null : b; m._tip(null); m.select(mode === 'hover' ? null : a, false);
          m.hl = highlight ? new Set([a.it.id, b.it.id, ...m.nodes.slice(0, 5).map(n => n.it.id)]) : null;
          m.k = k; const n = m.hover || m.sel; m.tx = m.W * (m.sel ? .4 : .5) - n.x * k + .375; m.ty = m.H * .5 - n.y * k - .25;
          m.mapRaster = m.focusRaster = null; m.zooming = false; m._settledHover = m.hover;
          clearTimeout(m.zoomTimer); clearTimeout(m.hoverTimer); await document.fonts.ready; cancelAnimationFrame(m._raf); m._raf = 0;
          m._paintReference(); await document.fonts.ready; m._paintReference(); const original = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data;
          m._paint(); const direct = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data;
          m._draw(); const display = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data;
          const tmp = document.createElement('canvas').getContext('2d'); tmp.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-bg'); tmp.fillRect(0, 0, 1, 1); const bg = tmp.getImageData(0, 0, 1, 1).data;
          const compare = pixels => {
            let sum = 0, changed = 0, max = 0, changedPixels = 0;
            for (let i = 0; i < pixels.length; i += 4) {
              const a = original[i + 3] / 255, b = pixels[i + 3] / 255; let pixelChanged = false;
              for (let c = 0; c < 3; c++) { const d = Math.abs(original[i + c] * a + bg[c] * (1 - a) - pixels[i + c] * b - bg[c] * (1 - b)); sum += d; max = Math.max(max, d); if (d > 20) { changed++; pixelChanged = true; } }
              if (pixelChanged) changedPixels++;
            }
            return { meanChannelDifference: sum / (pixels.length * .75), channelsOver20: changed / (pixels.length * .75), pixelsOver20: changedPixels / (pixels.length / 4), maximumChannelDifference: max };
          };
          return { mode, k, highlight, selection: m.sel?.it.id || null, hover: m.hover?.it.id || null, selectionConnectedToHover: !!m.sel && (m.sel === b || closure.anc.has(m.sel.it.id) || closure.desc.has(m.sel.it.id)), nodes: m.nodes.length, edges: m.edges.length, direct: compare(direct), display: compare(display), rasterPixels: [m.mapRaster, m.focusRaster].reduce((sum, c) => sum + (c ? c.canvas.width * c.canvas.height : 0), 0) };
        }, { mode, k, highlight });
        results.push({ theme, dpr, ...result }); await save(false);
        assert.equal(result.nodes, 13574); assert.ok(result.rasterPixels <= 16_000_000);
        if (mode === 'selected-hover') assert.equal(result.selectionConnectedToHover, true);
        if (mode === 'unrelated-selected-hover') assert.equal(result.selectionConnectedToHover, false);
        if (dpr === 2 && k === .65 && highlight) {
          await page.screenshot({ path: `/tmp/atlas-map-original-new-${mode}-${theme}.png` });
          await page.evaluate(() => window.__mapAudit._paintReference()); await page.screenshot({ path: `/tmp/atlas-map-original-old-${mode}-${theme}.png` });
        }
        for (const kind of ['direct', 'display']) assert.ok(result[kind].meanChannelDifference < 2 && result[kind].channelsOver20 < .02, JSON.stringify({ theme, dpr, ...result }));
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${theme} DPR${dpr}: 13 original/revised state comparisons, direct and cached; hover, selected focus, connected/unrelated selected rings, two zooms and highlights`);
    } finally { await page.close(); }
  }
  await save(true);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
