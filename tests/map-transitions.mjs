import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
try {
  for (const theme of ['light', 'dark']) for (const dpr of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: theme, deviceScaleFactor: dpr }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/assets/js/graph.js', async route => {
      const response = await route.fetch(); await route.fulfill({ response, body: (await response.text()).replace('    this._bind();', '    window.__mapAudit = this; this._bind();') });
    });
    try {
      await page.goto(`http://localhost:${server.address().port}/#/map`); await page.waitForFunction(() => window.__mapAudit?.nodes.length === 13574); await page.evaluate(() => document.fonts.ready);
      const hitChecks = await page.evaluate(() => {
        const m = window.__mapAudit, original = { fields: new Set(m.show.fields), defs: m.show.defs, planned: m.show.planned }, target = m.byId.get('ladr-2.30');
        let state = 48971, checked = 0; const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
        const brute = (px, py) => { let best = null, distance = 12; for (const n of m.nodes) { if (!m.visible(n)) continue; const d = Math.hypot(n.x * m.k + m.tx - px, n.y * m.k + m.ty - py) - Math.max(2, n.r * Math.min(1.4, m.k)) + (n.ghost ? 3 : 0); if (d < distance) { distance = d; best = n; } } return best?.it.id; };
        for (const k of [.01, .06, .1299, .13, .35, 1.15, 1.6, 8]) for (const filter of [0, 1, 2]) {
          m.k = k; m.tx = m.W / 2 - target.x * k + .375; m.ty = m.H / 2 - target.y * k - .25;
          m.show.defs = filter !== 1; m.show.planned = filter !== 1; m.show.fields = filter === 2 ? new Set(['math', 'engineering']) : new Set(original.fields);
          for (let i = 0; i < 100; i++) { const n = m.nodes[Math.floor(random() * m.nodes.length)], x = i < 60 ? m.sx(n.x) + (random() - .5) * 50 : random() * m.W, y = i < 60 ? m.sy(n.y) + (random() - .5) * 50 : random() * m.H;
            if (m.hit(x, y)?.it.id !== brute(x, y)) throw Error(`hit mismatch at zoom ${k}, filter ${filter}, point ${x},${y}`); checked++;
          }
        }
        Object.assign(m.show, original); m.hover = null; m.select(null, false); m.k = .6; m.tx = m.W / 2 - target.x * m.k; m.ty = m.H / 2 - target.y * m.k; m.mapRaster = null; m._draw();
        return checked;
      });
      assert.equal(hitChecks, 2400);
      await page.evaluate(() => document.fonts.ready);
      const wheel = await page.evaluate(async () => {
        const m = window.__mapAudit; m._draw(); const old = m.mapRaster, r = m.canvas.getBoundingClientRect(), x = m.W / 2 + .25, y = m.H / 2 - .375;
        const event = new WheelEvent('wheel', { clientX: r.left + x, clientY: r.top + y, deltaY: -Math.log(1.1) / .0018, cancelable: true });
        const ex = event.clientX - r.left, ey = event.clientY - r.top, world = [(ex - m.tx) / m.k, (ey - m.ty) / m.k];
        m.canvas.dispatchEvent(event);
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
        return { reused: m.mapRaster === old, zooming: m.zooming, scale: m.k / old.k, anchorError: Math.hypot(m.sx(world[0]) - ex, m.sy(world[1]) - ey), lod: m.mapRaster.lod };
      });
      assert.equal(wheel.reused, true); assert.equal(wheel.zooming, true); assert.ok(Math.abs(wheel.scale - 1.1) < 1e-10); assert.ok(wheel.anchorError < 1e-7);
      await page.waitForFunction(() => { const m = window.__mapAudit; return !m.zooming && m.mapRaster?.k === m.k && m.mapRaster.tx === m.tx && m.mapRaster.ty === m.ty; });
      const comparison = await page.evaluate(() => {
        const m = window.__mapAudit, tmp = document.createElement('canvas').getContext('2d'); tmp.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-bg'); tmp.fillRect(0, 0, 1, 1); const bg = tmp.getImageData(0, 0, 1, 1).data;
        m._paint(); const direct = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data; m._draw(); const raster = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data;
        let sum = 0, changed = 0; for (let i = 0; i < direct.length; i += 4) for (let k = 0; k < 3; k++) { const a = direct[i + 3] / 255, b = raster[i + 3] / 255, difference = Math.abs(direct[i + k] * a + bg[k] * (1 - a) - raster[i + k] * b - bg[k] * (1 - b)); sum += difference; if (difference > 20) changed++; }
        return { mean: sum / (direct.length * .75), changed: changed / (direct.length * .75) };
      });
      assert.ok(comparison.mean < 2 && comparison.changed < .02, JSON.stringify(comparison));
      const layering = await page.evaluate(() => {
        const m = window.__mapAudit, a = m.byId.get('ladr-2.30'), b = m.byId.get('ladr-2.22');
        m.hover = a; m._draw(); const base = m.focusRaster;
        m.hover = b; m._draw(); const reused = m.focusRaster === base;
        const pixels = [m.mapRaster, m.focusRaster].reduce((s, c) => s + c.canvas.width * c.canvas.height, 0);
        const before = m.tip.innerHTML; m._tip(b, [300, 300]); const child = m.tip.firstElementChild; m._tip(b, [310, 310]); const tipReused = m.tip.firstElementChild === child;
        b.it.st = 'A freshly loaded statement'; m._tip(b, [310, 310]); const tipRefreshed = m.tip.querySelector('.st').textContent === b.it.st;
        return { reused, pixels, tipReused, tipRefreshed, previousTipLength: before.length };
      });
      assert.equal(layering.reused, true); assert.ok(layering.pixels <= 16_000_000); assert.equal(layering.tipReused, true); assert.equal(layering.tipRefreshed, true);
      await page.screenshot({ path: `/tmp/atlas-map-focus-layers-${theme}-dpr${dpr}.png` });
      await page.waitForFunction(() => { const m = window.__mapAudit; return m.mapRaster?.focus === m.hover; });
      const failedTip = await page.evaluate(async () => {
        const m = window.__mapAudit, n = m.byId.get('ladr-2.22'), originalLoad = m.loadShard; await originalLoad(n.it.col); const originalStatement = n.it.st; let release;
        try {
          n.it.st = undefined; m.loadShard = () => Promise.reject(new Error('injected statement outage')); m._tip(n, [m.W - 1, m.H - 1]); const oldHeight = m._tipMeasure[1];
          await new Promise(resolve => setTimeout(resolve, 0)); const invalidated = m._tipMeasure === null;
          m.loadShard = () => new Promise(resolve => { release = resolve; }); m._tip(n, [m.W - 1, m.H - 1]);
          const actual = [m.tip.offsetWidth, m.tip.offsetHeight], measured = m._tipMeasure;
          return { invalidated, measured, actual, grew: actual[1] > oldHeight, contained: parseFloat(m.tip.style.left) >= 8 && parseFloat(m.tip.style.top) >= 8 && parseFloat(m.tip.style.left) + actual[0] <= m.W - 8 && parseFloat(m.tip.style.top) + actual[1] <= m.H - 8, message: m.tip.querySelector('.st').textContent };
        } finally { n.it.st = originalStatement; m.loadShard = originalLoad; m._tip(null); release?.(); }
      });
      assert.equal(failedTip.invalidated, true); assert.deepEqual(failedTip.measured, failedTip.actual); assert.equal(failedTip.grew, true); assert.equal(failedTip.contained, true); assert.match(failedTip.message, /Statement unavailable/);
      await page.evaluate(() => { const m = window.__mapAudit; m.hover = null; m.select(null, false); m.k = .12; const n = m.byId.get('ladr-2.30'); m.tx = m.W / 2 - n.x * m.k; m.ty = m.H / 2 - n.y * m.k; m.mapRaster = null; m._draw(); window.__lodCache = m.mapRaster; });
      const cross = await page.evaluate(async () => { const m = window.__mapAudit; m.zoom(1.2); await new Promise(requestAnimationFrame); return { rebuilt: m.mapRaster !== window.__lodCache, lod: m.mapRaster.lod }; });
      assert.equal(cross.rebuilt, true); assert.equal(cross.lod, 1);
      await page.waitForFunction(() => !window.__mapAudit.zooming);
      const cancelled = await page.evaluate(async () => { const m = window.__mapAudit; m.focusNode(m.byId.get('ladr-2.30')); await new Promise(requestAnimationFrame); m.zoom(1.1); const result = m.anim === 0 && m.zooming; m.finishZoom(); return result; });
      assert.equal(cancelled, true, 'manual zoom cancels the old animated transition');
      const caughtUp = await page.evaluate(async () => {
        const m = window.__mapAudit, original = window.requestAnimationFrame, staleStamp = performance.now() + 100; let callback;
        try { window.requestAnimationFrame = cb => { if (callback) return original(cb); callback = cb; return 2147483647; }; m.flyTo(.2, 100, 200, true); await new Promise(resolve => setTimeout(resolve, 650)); }
        finally { window.requestAnimationFrame = original; }
        callback(staleStamp);
        return m.anim === 0 && !m.zooming && Math.abs(m.k - .2) < 1e-12 && Math.abs(m.tx - 100) < 1e-8 && Math.abs(m.ty - 200) < 1e-8;
      });
      assert.equal(caughtUp, true, 'a delayed animation callback reaches the elapsed wall-clock target despite a stale RAF timestamp');
      const selected = await page.evaluate(() => {
        const m = window.__mapAudit, n = m.byId.get('ladr-2.30'); m.hover = null; m._tip(null); m.select(n, false); m.mapRaster = null;
        const original = m._paint, layers = []; m._paint = function (options) { layers.push(options?.layer || 'all'); return original.call(this, options); };
        try { m._draw(); } finally { m._paint = original; }
        const singleRaster = !m.focusRaster; m.focusNode(n); m._draw();
        return { layers, singleRaster, directMotion: m.zooming && !m.mapRaster && !m.focusRaster };
      });
      assert.deepEqual(selected.layers, ['all']); assert.equal(selected.singleRaster, true); assert.equal(selected.directMotion, true);
      await page.waitForFunction(() => { const m = window.__mapAudit, n = m.byId.get('ladr-2.30'); return m.anim === 0 && !m.zooming && m.mapRaster?.k === m.k && Math.abs(m.tx - (m.W / 2 - n.x * m.k - (m.W > 700 ? 180 : 0))) < 1e-8 && Math.abs(m.ty - (m.H / 2 - n.y * m.k)) < 1e-8; });
      const directFit = await page.evaluate(() => { const m = window.__mapAudit; m.fit(true); m._draw(); return m.zooming && !m.mapRaster && !m.focusRaster; });
      assert.equal(directFit, true);
      await page.waitForFunction(() => { const m = window.__mapAudit; return m.anim === 0 && !m.zooming && m.mapRaster?.k === m.k; });
      const selectedHover = await page.evaluate(() => {
        const m = window.__mapAudit, selection = m.sel; m.hover = m.byId.get('ladr-2.22'); m._draw(); const base = m.focusRaster;
        m.hover = m.byId.get('ladr-2.15'); m._draw();
        const result = { reused: m.focusRaster === base, selected: m.sel === selection, pixels: [m.mapRaster, m.focusRaster].reduce((sum, c) => sum + c.canvas.width * c.canvas.height, 0) };
        clearTimeout(m.hoverTimer); m.hoverTimer = 0; m.hover = null; m.mapRaster = null; m._draw(); return result;
      });
      assert.equal(selectedHover.reused, true); assert.equal(selectedHover.selected, true); assert.ok(selectedHover.pixels <= 16_000_000);
      await page.screenshot({ path: `/tmp/atlas-map-transitions-${theme}-dpr${dpr}.png` });
      const cleanup = await page.evaluate(() => { const m = window.__mapAudit; for (const n of m.nodes.slice(0, 20)) m.closure(n); const closureEntries = m.closures.size; m.startZoom(); m.destroy(); return { closureEntries, cachesReleased: !m.mapRaster && !m.focusRaster, frame: m._raf, animation: m.anim, dead: m.dead }; });
      assert.equal(cleanup.closureEntries, 8); assert.equal(cleanup.cachesReleased, true); assert.equal(cleanup.frame, 0); assert.equal(cleanup.animation, 0); assert.equal(cleanup.dead, true); assert.deepEqual(errors, []);
      console.log(`PASS ${theme} DPR${dpr}: ${hitChecks} indexed/brute hit comparisons; anchored wheel reuse, exact settled image, LOD rebuild, bounded hover layers, tip reuse/refresh/failure remeasure, wall-clock catch-up, single-pass selected focus/fit, cleanup`);
    } finally { await page.close(); }
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
