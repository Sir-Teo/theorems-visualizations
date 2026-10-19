import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const errors = [];
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: theme });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/assets/js/graph.js', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()).replace('    this._bind();', '    window.__mapAudit = this; this._bind();') });
    });
    await page.goto(`http://localhost:${server.address().port}/#/map`);
    await page.waitForFunction(() => window.__mapAudit?.mapRaster);
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(async () => {
      const m = window.__mapAudit, raf = () => new Promise(requestAnimationFrame), comparisons = [];
      const normal = document.createElement('canvas').getContext('2d');
      normal.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-bg');
      normal.fillRect(0, 0, 1, 1); const background = normal.getImageData(0, 0, 1, 1).data;
      const compare = label => {
        m._paint(); const direct = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data;
        m._draw(); const raster = m.ctx.getImageData(0, 0, m.canvas.width, m.canvas.height).data;
        let difference = 0, changed = 0;
        // Compare the pixels a reader sees. Straight RGB in almost-transparent
        // canvas pixels can differ greatly while their composited colour agrees.
        for (let i = 0; i < direct.length; i += 4) for (let k = 0; k < 3; k++) {
          const a = direct[i + 3] / 255, b = raster[i + 3] / 255;
          const d = Math.abs(direct[i + k] * a + background[k] * (1 - a) - raster[i + k] * b - background[k] * (1 - b));
          difference += d; if (d > 20) changed++;
        }
        const channels = direct.length * .75;
        comparisons.push({ label, meanChannelDifference: difference / channels, changedFraction: changed / channels });
      };
      m.hover = null; m.fit(false); await raf(); m._draw(); compare('overview');
      const first = m.mapRaster; m.tx += 32; m.ty -= 20; m._draw();
      const reused = m.mapRaster === first; compare('overview-pan');
      m.tx += first.pad + 12; m._draw(); const rebuiltAfterMargin = m.mapRaster !== first; compare('large-pan');
      const old = m.mapRaster; m.show.planned = false; m._draw(); const rebuiltAfterFilter = m.mapRaster !== old; compare('written-only');
      m.show.planned = true;
      const next = m.mapRaster; m.setHighlight(new Set(['ladr-2.30'])); await raf(); m._draw();
      const rebuiltAfterHighlight = m.mapRaster !== next; compare('highlight');
      const same = new Set(['ladr-2.30']); m.setHighlight(same); await raf(); m._draw();
      const sameCache = m.mapRaster; same.add('ladr-2.22'); m.setHighlight(same); await raf(); m._draw();
      const rebuiltAfterSameSet = m.mapRaster !== sameCache;
      m.setHighlight(null); m.fit(false); const n = m.byId.get('ladr-2.30'); m.select(n, false); await raf(); compare('selected');
      m.k = .8; m.tx = m.W / 2 - n.x * m.k; m.ty = m.H / 2 - n.y * m.k; m._draw(); compare('detail');
      const themeCache = m.mapRaster; m.onTheme(); await raf(); m._draw(); const rebuiltAfterTheme = m.mapRaster !== themeCache;
      const fontCache = m.mapRaster; document.fonts.dispatchEvent(new Event('loadingdone')); await raf(); m._draw(); const rebuiltAfterFonts = m.mapRaster !== fontCache;
      return { reused, rebuiltAfterMargin, rebuiltAfterFilter, rebuiltAfterHighlight, rebuiltAfterSameSet, rebuiltAfterTheme, rebuiltAfterFonts, comparisons, nodes: m.nodes.length };
    });
    assert.equal(result.nodes, 13574);
    for (const key of ['reused', 'rebuiltAfterMargin', 'rebuiltAfterFilter', 'rebuiltAfterHighlight', 'rebuiltAfterSameSet', 'rebuiltAfterTheme', 'rebuiltAfterFonts']) assert.ok(result[key], `${theme} ${key}`);
    for (const c of result.comparisons) {
      assert.ok(c.meanChannelDifference < 2, `${theme} ${JSON.stringify(c)}`);
      assert.ok(c.changedFraction < .02, `${theme} ${JSON.stringify(c)}`);
    }
    // Rejected tooltip/selection requests must remain usable and retry explicitly.
    await page.evaluate(() => {
      const m = window.__mapAudit, n = m.byId.get('ladr-2.30');
      n.it.st = null; let calls = 0;
      m.loadShard = async () => { if (++calls === 1) throw Error('interrupted detail'); n.it.st = 'Recovered statement'; };
      m.select(n, false);
    });
    await page.getByRole('button', { name: 'Retry statement', exact: true }).click();
    await page.locator('.map-side .st').filter({ hasText: 'Recovered statement' }).waitFor();
    await page.evaluate(() => {
      const m = window.__mapAudit, n = m.byId.get('ladr-2.30'); n.it.st = null;
      m.loadShard = async () => { throw Error('interrupted tooltip'); }; m._tip(n, [100, 100]);
    });
    await page.locator('.map-tip .st').filter({ hasText: 'Move away and return to retry' }).waitFor();
    await page.screenshot({ path: `/tmp/atlas-map-rendering-${theme}.png` });
    console.log(`PASS ${theme}: ${result.nodes} nodes; direct/raster pixel comparisons, pan/filter/highlight/theme invalidation, failed selection/tooltip retry; ${JSON.stringify(result.comparisons)}`);
    await page.close();
  }
  const large = await browser.newPage({ viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 2 });
  large.on('pageerror', error => errors.push(error.message));
  await large.route('**/assets/js/graph.js', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('    this._bind();', '    window.__mapAudit = this; this._bind();') });
  });
  await large.goto(`http://localhost:${server.address().port}/#/map`);
  await large.waitForFunction(() => window.__mapAudit?.W === 3840);
  const capped = await large.evaluate(() => {
    const m = window.__mapAudit; m._draw();
    return { dpr: m.dpr, raster: !!m.mapRaster, nodes: m.nodes.length, pixelWidth: m.canvas.width };
  });
  assert.equal(capped.dpr, 2); assert.equal(capped.raster, false); assert.equal(capped.pixelWidth, 7680); assert.equal(capped.nodes, 13574);
  console.log('PASS 3840px/DPR2: oversized raster falls back to direct full-resolution rendering without allocating a cache');
  await large.close();
  assert.deepEqual(errors, []);
} finally { await browser.close(); server.close(); }
