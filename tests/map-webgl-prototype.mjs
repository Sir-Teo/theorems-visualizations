import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { mapWebGLPrototype } from '../scripts/lib/map-webgl-prototype.mjs';
const source = await readFile(new URL('../assets/js/graph.js', import.meta.url), 'utf8'), instrumented = mapWebGLPrototype(source), hash = value => createHash('sha256').update(value).digest('hex');
await writeFile('/tmp/atlas-map-webgl-prototype-graph.js', instrumented);
const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const executablePath = process.argv.includes('--full-chrome') ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : findBrowser();
const browser = await chromium.launch({ executablePath, headless: true, args: process.argv.includes('--metal') ? ['--use-angle=metal'] : [] }), results = [], data = [];
for (const name of ['index.json', 'planned.json']) data.push({ name, sha256: hash(await readFile(new URL(`../data/${name}`, import.meta.url))) });
const save = async complete => writeFile(process.argv.includes('--metal') ? '/tmp/atlas-map-webgl-prototype-metal.json' : '/tmp/atlas-map-webgl-prototype.json', JSON.stringify({ complete, diagnostic: true, timingLimit: 'CPU submission diagnostics during pixel comparison; canvas reads may change acceleration, not an FPS measurement.', executablePath, launchArgs: process.argv.includes('--metal') ? ['--use-angle=metal'] : [], browser: browser.version(), graphSHA256: hash(source), prototypeSHA256: hash(instrumented), helperSHA256: hash(await readFile(new URL('../assets/js/map-webgl-edges.js', import.meta.url))), data, results }, null, 2) + '\n');
try {
  for (const theme of ['light', 'dark']) for (const dpr of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: theme, deviceScaleFactor: dpr }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/assets/js/graph.js', route => route.fulfill({ body: instrumented, contentType: 'application/javascript' }));
    try {
      await page.goto(`http://localhost:${server.address().port}/#/map`); await page.waitForFunction(() => window.__mapAudit?.nodes.length === 13574); await page.evaluate(() => document.fonts.ready);
      for (const mode of ['overview', 'hover', 'selected', 'selected-hover', 'detail', 'highlight', 'filtered']) {
        const result = await page.evaluate(async mode => {
          const m = window.__mapAudit, focus = m.byId.get('ladr-2.22'), selection = m.byId.get('ladr-2.30');
          m.hover = null; m.select(null, false); m.hl = null; m.show.planned = true; m.show.defs = true; m.show.fields = new Set(m.G.fields.map(f => f.id)); m.finishZoom();
          const k = mode === 'overview' ? .1 : mode === 'detail' ? 1.6 : .65;
          m.k = k; m.tx = m.W / 2 - focus.x * k + .25; m.ty = m.H / 2 - focus.y * k - .125;
          if (mode.includes('selected')) m.select(selection, false);
          if (mode.includes('hover')) m.hover = focus;
          if (mode === 'highlight') m.hl = new Set([focus.it.id, selection.it.id]);
          if (mode === 'filtered') { m.show.defs = false; m.show.planned = false; m.show.fields = new Set(['math']); }
          m._paintCanvas(); const reference = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data, background = getComputedStyle(document.documentElement).getPropertyValue('--c-bg'), scratch = document.createElement('canvas').getContext('2d'); scratch.fillStyle = background; scratch.fillRect(0, 0, 1, 1); const bg = scratch.getImageData(0, 0, 1, 1).data;
          const start = performance.now(); m._paint(); const coldMS = performance.now() - start, firstStats = m.__gpuStats;
          const warmStart = performance.now(); m._paint(); const warmMS = performance.now() - warmStart, pixels = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data;
          let sum = 0, changed = 0, maximum = 0;
          for (let i = 0; i < pixels.length; i += 4) for (let c = 0; c < 3; c++) { const a = reference[i + 3] / 255, b = pixels[i + 3] / 255, diff = Math.abs(reference[i + c] * a + bg[c] * (1 - a) - pixels[i + c] * b - bg[c] * (1 - b)); sum += diff; maximum = Math.max(maximum, diff); if (diff > 20) changed++; }
          return { mode, k, nodes: m.nodes.length, edges: m.edges.length, firstStats, coldMS, warmMS, meshBytes: m.__gpu.bytes, capabilities: m.__gpu.capabilities, difference: { mean: sum / (pixels.length * .75), changed: changed / (pixels.length * .75), maximum } };
        }, mode);
        results.push({ theme, dpr, ...result }); console.log(JSON.stringify({ theme, dpr, ...result })); await save(false);
        assert.equal(result.nodes, 13574); assert.ok(result.firstStats.available && result.firstStats.gpuGroups > 0); assert.ok(result.meshBytes <= 32 * 1024 * 1024); assert.ok(result.firstStats.pixels <= 4_000_000);
        assert.ok(result.difference.mean < 2 && result.difference.changed < .02, JSON.stringify(result.difference));
        if (mode === 'selected-hover' || mode === 'overview') await page.screenshot({ path: `/tmp/atlas-map-webgl-${mode}-${theme}-dpr${dpr}.png` });
      }
      assert.deepEqual(errors, []);
      await page.evaluate(() => window.__mapAudit.destroy());
    } finally { await page.close(); }
  }
  await save(true);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
