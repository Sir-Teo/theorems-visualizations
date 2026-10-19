import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from './serve.mjs';
import { findBrowser } from './browser.mjs';

// Measure real MapView drawing and browser frame cadence with the full graph loaded.
// A controlled RAF pan avoids timing the automation transport instead of the renderer.
const server = createServer();
await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [], errors = [];
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: theme });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/assets/js/graph.js', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace('    this._bind();', '    window.__mapAudit = this; this._bind();');
      await route.fulfill({ response, body });
    });
    await page.goto(`http://localhost:${server.address().port}/#/map`);
    await page.waitForFunction(() => window.__mapAudit?.G.planned.length > 0);
    await page.evaluate(() => document.fonts.ready);
    const counts = await page.evaluate(() => {
      const m = window.__mapAudit;
      return { written: m.G.items.length, planned: m.G.planned.length, nodes: m.nodes.length,
        edges: m.edges.length, fields: m.show.fields.size, plannedEnabled: m.show.planned, definitionsEnabled: m.show.defs };
    });
    assert.equal(counts.nodes, counts.written + counts.planned);
    assert.ok(counts.written >= 6684 && counts.planned >= 6890 && counts.fields === 13);
    assert.ok(counts.plannedEnabled && counts.definitionsEnabled);
    // First confirm native pointer panning changes the same transform measured below.
    const canvas = page.locator('.map-page > canvas'), rect = await canvas.boundingBox();
    const before = await page.evaluate(() => window.__mapAudit.tx);
    await page.mouse.move(rect.x + rect.width * .5, rect.y + rect.height * .7);
    await page.mouse.down(); await page.mouse.move(rect.x + rect.width * .5 + 40, rect.y + rect.height * .7, { steps: 8 }); await page.mouse.up();
    assert.ok(Math.abs(await page.evaluate(() => window.__mapAudit.tx) - before) > 30);
    for (const mode of ['overview', 'overview-selected', 'detail', 'selected']) {
      const measured = await page.evaluate(async mode => {
        const m = window.__mapAudit, raf = () => new Promise(requestAnimationFrame);
        m.fit(false); m.hover = null; m.select(null, false);
        const n = m.byId.get('ladr-2.30') || m.nodes[0];
        if (mode === 'overview-selected') m.select(n, false);
        if (mode === 'detail' || mode === 'selected') {
          m.k = .8; m.tx = m.W / 2 - n.x * m.k; m.ty = m.H / 2 - n.y * m.k;
          if (mode === 'selected') m.select(n, false);
        }
        for (let i = 0; i < 20; i++) { m.draw(); await raf(); }
        const drawMS = [], frameMS = [], original = m._draw, tx = m.tx;
        m._draw = function () { const start = performance.now(); original.call(this); drawMS.push(performance.now() - start); };
        let prior = await raf();
        for (let i = 0; i < 120; i++) {
          m.tx = tx + 32 * Math.sin(i / 20); m.draw();
          const now = await raf(); frameMS.push(now - prior); prior = now;
        }
        await raf(); m._draw = original; m.tx = tx; m.draw();
        const stats = values => {
          const sorted = [...values].sort((a, b) => a - b), mean = values.reduce((s, v) => s + v, 0) / values.length;
          return { samples: values.length, mean, p50: sorted[Math.floor(sorted.length * .5)], p95: sorted[Math.floor(sorted.length * .95)], max: sorted.at(-1) };
        };
        return { mode, zoom: m.k, drawMS: stats(drawMS), frameMS: stats(frameMS), fps: 1000 / stats(frameMS).mean };
      }, mode);
      results.push({ theme, counts, ...measured });
      console.log(`${theme} ${mode}: ${counts.nodes} nodes, draw p95 ${measured.drawMS.p95.toFixed(2)}ms; ${measured.fps.toFixed(2)} RAF fps`);
    }
    await page.screenshot({ path: `/tmp/atlas-map-performance-${theme}.png` });
    await page.close();
  }
  assert.deepEqual(errors, []);
  const report = { date: new Date().toISOString(), browser: browser.version(), viewport: { width: 1440, height: 1000 },
    method: '120 controlled RAF pan frames per mode, 20 warm-up draws; all fields, written/planned nodes and definitions enabled. Native pointer pan checked separately. Draw timings are CPU submission time, frame cadence includes browser scheduling; headless results do not certify every GPU or device. Warm-up excludes cache reconstruction; this is steady panning evidence, not every hover/zoom transition.', results };
  await writeFile('/tmp/atlas-map-performance.json', JSON.stringify(report, null, 2) + '\n');
} finally { await browser.close(); server.close(); }
