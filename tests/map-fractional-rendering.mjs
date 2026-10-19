// Independent high-zoom check: motion blits are device-pixel aligned; pointer-up
// rebuilds at the full-precision transform rather than retaining quantized geometry.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
try {
  for (const theme of ['light', 'dark']) for (const dpr of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: theme, deviceScaleFactor: dpr, reducedMotion: 'reduce' }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/assets/js/graph.js', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()).replace('    this._bind();', '    window.__mapAudit = this; this._bind();') });
    });
    try {
      await page.goto(`http://localhost:${server.address().port}/#/map`);
      await page.waitForFunction(() => window.__mapAudit?.mapRaster); await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(100, 350);
      await page.evaluate(() => {
        const m = window.__mapAudit, node = m.byId.get('ladr-2.30');
        m.select(null); m.hover = null; m.k = 1.6; m.tx = m.W / 2 - node.x * m.k; m.ty = m.H / 2 - node.y * m.k;
        m.mapRaster = null; m._draw(); window.__panCache = m.mapRaster;
        const draw = m.ctx.drawImage.bind(m.ctx);
        m.ctx.drawImage = (...args) => { window.__blit = { x: args[1], y: args[2] }; return draw(...args); };
      });
      // High zoom first uses the row-heading font, which may start a new font load.
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); const m = window.__mapAudit; m.mapRaster = null; m._draw(); window.__panCache = m.mapRaster; });
      await page.mouse.down(); await page.mouse.move(133.25, 327.5);
      const moving = await page.evaluate(async () => {
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
        const m = window.__mapAudit, b = window.__blit, dx = m.tx - window.__panCache.tx, dy = m.ty - window.__panCache.ty;
        return { reused: m.mapRaster === window.__panCache, dpr: m.dpr, dx, dy, pixelX: (b.x + m.mapRaster.pad) * m.dpr, pixelY: (b.y + m.mapRaster.pad) * m.dpr,
          errorX: Math.abs((b.x + m.mapRaster.pad - dx) * m.dpr), errorY: Math.abs((b.y + m.mapRaster.pad - dy) * m.dpr) };
      });
      assert.equal(moving.reused, true); assert.equal(moving.dpr, dpr);
      assert.ok(Math.abs(moving.dx - 33.25) < 1e-6 && Math.abs(moving.dy + 22.5) < 1e-6, JSON.stringify(moving));
      assert.ok(Number.isInteger(moving.pixelX) && Number.isInteger(moving.pixelY));
      assert.ok(moving.errorX <= .5 + 1e-8 && moving.errorY <= .5 + 1e-8, JSON.stringify(moving));
      await page.mouse.up();
      const settled = await page.evaluate(async () => {
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
        const m = window.__mapAudit, cache = m.mapRaster;
        const compositedDifference = () => {
          const ctx = document.createElement('canvas').getContext('2d'); ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-bg'); ctx.fillRect(0, 0, 1, 1);
          const bg = ctx.getImageData(0, 0, 1, 1).data;
          m._paint(); const a = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data;
          m._draw(); const b = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data;
          let sum = 0, changed = 0, count = 0;
          for (let i = 0; i < a.length; i += 4) for (let k = 0; k < 3; k++) {
            const aa = a[i + 3] / 255, bb = b[i + 3] / 255, d = Math.abs(a[i + k] * aa + bg[k] * (1 - aa) - b[i + k] * bb - bg[k] * (1 - bb));
            sum += d; if (d > 20) changed++; count++;
          }
          return { mean: sum / count, changedFraction: changed / count };
        };
        return { rebuilt: cache !== window.__panCache, exactTransform: cache.tx === m.tx && cache.ty === m.ty, pixels: cache.canvas.width * cache.canvas.height, comparison: compositedDifference() };
      });
      assert.equal(settled.rebuilt, true); assert.equal(settled.exactTransform, true);
      assert.ok(settled.pixels <= 16000000); assert.ok(settled.comparison.mean < 2 && settled.comparison.changedFraction < .02, JSON.stringify(settled));
      await page.screenshot({ path: `/tmp/atlas-map-fractional-${theme}-dpr${dpr}.png` });
      const old = await page.evaluate(() => { window.__resizeCache = window.__mapAudit.mapRaster; return window.__mapAudit.W; });
      await page.setViewportSize({ width: 1150, height: 850 });
      await page.waitForFunction(old => window.__mapAudit.W !== old && window.__mapAudit.mapRaster && window.__mapAudit.mapRaster !== window.__resizeCache, old);
      const cleanup = await page.evaluate(() => { const m = window.__mapAudit; m.destroy(); document.fonts.dispatchEvent(new Event('loadingdone')); m.onFonts(); return { cacheReleased: m.mapRaster === null, frame: m._raf }; });
      assert.equal(cleanup.cacheReleased, true); assert.equal(cleanup.frame, 0); assert.deepEqual(errors, []);
      console.log(`PASS ${theme} DPR${dpr}: full-precision fractional pan, crisp moving blit within half a device pixel, exact-transform pointer-up rebuild, highzoom pixel comparison, resize and font-listener cleanup; ${JSON.stringify({ moving, settled })}`);
    } finally { await page.close(); }
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
