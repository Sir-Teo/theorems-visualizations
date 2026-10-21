import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true }), results = [];
try {
  for (const theme of ['light', 'dark']) for (const dpr of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: dpr, colorScheme: theme });
    try {
      await page.goto(`http://localhost:${server.address().port}/tools/harness.html`);
      const result = await page.evaluate(async ({ theme, dpr }) => {
        const { WebGLEdges } = await import('/assets/js/map-webgl-edges.js');
        const width = 320, height = 240, make = () => { const canvas = document.createElement('canvas'); canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = width + 'px'; canvas.style.height = height + 'px'; document.body.append(canvas); const context = canvas.getContext('2d'); context.setTransform(dpr, 0, 0, dpr, 0, 0); return context; };
        document.body.replaceChildren(); document.body.style.background = theme === 'light' ? '#fff' : '#111';
        const actual = make(), expected = make(), tiled = make(), bg = theme === 'light' ? 255 : 17;
        const backend = new WebGLEdges(), tiles = new WebGLEdges({ maxPixels: 20_000 });
        const groups = [
          { key: 'cross', paths: [[[20, 120], [100, 120], [220, 120], [300, 120]], [[160, 20], [160, 90], [160, 160], [160, 220]], [[20, 120], [100, 120], [220, 120], [300, 120]]], width: 9, rgba: [1, .1, .2, .55], style: 'rgba(255,25.5,51,.55)', cap: 'butt' },
          { key: 'curve', paths: [[[20, 200], [120, -100], [200, 340], [300, 30]]], width: 3.5, rgba: [.1, .7, .3, .65], style: 'rgba(25.5,178.5,76.5,.65)', cap: 'round' },
          { key: 'bundle', paths: [[[10, 10], [160, 120], [310, 10]]], width: 7, rgba: [.2, .4, .9, .4], style: 'rgba(51,102,229.5,.4)', cap: 'round' },
        ];
        const view = { width, height, dpr, k: 1, tx: .25, ty: -.125 };
        for (const group of groups) backend.canvasStroke(expected, group, view);
        const stats = backend.draw(actual, groups, view), tileStats = tiles.draw(tiled, groups, view), reference = expected.getImageData(0, 0, width * dpr, height * dpr).data;
        const compare = context => { const pixels = context.getImageData(0, 0, width * dpr, height * dpr).data; let total = 0, changed = 0, maximum = 0; for (let i = 0; i < pixels.length; i += 4) for (let c = 0; c < 3; c++) { const difference = Math.abs(reference[i + c] * reference[i + 3] / 255 + bg * (1 - reference[i + 3] / 255) - pixels[i + c] * pixels[i + 3] / 255 - bg * (1 - pixels[i + 3] / 255)); total += difference; maximum = Math.max(maximum, difference); if (difference > 20) changed++; } return { mean: total / (pixels.length * .75), changed: changed / (pixels.length * .75), maximum }; };
        // The crossing contains three subpaths in one stroke. Its alpha must
        // stay .55, rather than accumulate per edge/triangle/duplicated path.
        const union = make(); backend.draw(union, [groups[0]], view); const alpha = union.getImageData(160 * dpr, 120 * dpr, 1, 1).data[3];
        const fallback = make(), tiny = new WebGLEdges({ maxBytes: 1 }), fallbackStats = tiny.draw(fallback, groups, view), fallbackDiff = compare(fallback);
        const dashed = { ...groups[0], key: 'dashed', dash: [3, 3] }, dashActual = make(), dashExpected = make(); backend.canvasStroke(dashExpected, dashed, view); const dashStats = backend.draw(dashActual, [dashed], view);
        const a = dashActual.getImageData(0, 0, width * dpr, height * dpr).data, b = dashExpected.getImageData(0, 0, width * dpr, height * dpr).data, dashedEqual = a.every((v, i) => v === b[i]);
        const capabilities = backend.capabilities, available = backend.available, tiledDifference = compare(tiled), difference = compare(actual), bytes = backend.bytes;
        const extension = backend.gl?.getExtension('WEBGL_lose_context'); let lossFallback = false, restored = false;
        if (extension) {
          const lost = new Promise(resolve => backend.canvas.addEventListener('webglcontextlost', resolve, { once: true })); extension.loseContext(); await lost;
          const context = make(), failure = backend.draw(context, [groups[0]], view); lossFallback = failure.gpuGroups === 0 && failure.canvasGroups === 1 && backend.bytes === 0;
          const ready = new Promise(resolve => backend.canvas.addEventListener('webglcontextrestored', resolve, { once: true })); await new Promise(resolve => setTimeout(resolve, 100)); extension.restoreContext(); await Promise.race([ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Context restore timeout')), 5000))]); restored = backend.available && backend.draw(context, [groups[0]], view).gpuGroups === 1;
        }
        for (const renderer of [backend, tiles, tiny]) renderer.destroy(); const released = backend.bytes === 0 && backend.canvas.width === 1 && !backend.available;
        return { theme, dpr, available, capabilities, stats, tileStats, alpha, difference, tiledDifference, fallbackStats, fallbackDiff, dashStats, dashedEqual, bytes, lossFallback, restored, released };
      }, { theme, dpr });
      results.push(result); console.log(JSON.stringify(result));
      assert.equal(result.available, true); assert.equal(result.stats.gpuGroups, 3); assert.equal(result.stats.canvasGroups, 0); assert.ok(Math.abs(result.alpha - 140) <= 1, 'group alpha union');
      for (const diff of [result.difference, result.tiledDifference]) assert.ok(diff.mean < 2 && diff.changed < .02, JSON.stringify(diff));
      assert.ok(result.tileStats.tiles > 1 && result.tileStats.pixels <= 20_000); assert.ok(result.bytes <= 32 * 1024 * 1024);
      assert.equal(result.fallbackStats.canvasGroups, 3); assert.ok(result.fallbackDiff.mean < 1e-10); assert.equal(result.dashStats.canvasGroups, 1); assert.equal(result.dashedEqual, true);
      assert.equal(result.lossFallback, true); assert.equal(result.restored, true); assert.equal(result.released, true);
      await page.screenshot({ path: `/tmp/atlas-map-webgl-edges-${theme}-dpr${dpr}.png` });
    } finally { await page.close(); }
  }
  await writeFile('/tmp/atlas-map-webgl-edges.json', JSON.stringify({ complete: true, browser: browser.version(), results }, null, 2) + '\n');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
