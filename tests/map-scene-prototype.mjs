import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { mapScenePrototype } from '../scripts/lib/map-scene-prototype.mjs';
const source = await readFile(new URL('../assets/js/graph.js', import.meta.url), 'utf8'), instrumented = mapScenePrototype(source), server = createServer(); await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true, args: ['--use-angle=metal'] }), results = [];
try {
  for (const theme of ['light', 'dark']) for (const dpr of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: dpr, colorScheme: theme }), errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/assets/js/graph.js', route => route.fulfill({ body: instrumented, contentType: 'application/javascript' }));
    try {
      await page.goto(`http://localhost:${server.address().port}/#/map`); await page.waitForFunction(() => window.__mapAudit?.__scene?.status === 'ready', null, { timeout: 60_000 }); await page.evaluate(() => document.fonts.ready);
      for (const mode of ['overview', 'hover', 'selected', 'selected-hover', 'detail', 'highlight', 'filtered']) {
        const result = await page.evaluate(async mode => {
          const m = window.__mapAudit, focus = m.byId.get('ladr-2.22'), selection = m.byId.get('ladr-2.30'), scene = m.__scene; cancelAnimationFrame(m._raf); m._raf = 0;
          m.hover = null; m.select(null, false); m.hl = null; m.show.planned = m.show.defs = true; m.show.fields = new Set(m.G.fields.map(f => f.id)); m.finishZoom();
          const k = mode === 'overview' ? .1 : mode === 'detail' ? 1.6 : .65; m.k = k; m.tx = m.W / 2 - focus.x * k + .25; m.ty = m.H / 2 - focus.y * k - .125;
          if (mode.includes('selected')) m.select(selection, false); if (mode.includes('hover')) m.hover = focus;
          if (mode === 'highlight') m.hl = new Set([focus.it.id, selection.it.id]); if (mode === 'filtered') { m.show.defs = m.show.planned = false; m.show.fields = new Set(['math']); }
          const reference = document.createElement('canvas'); reference.width = Math.round(m.W * m.dpr); reference.height = Math.round(m.H * m.dpr); const ctx = reference.getContext('2d'), saved = m.ctx; m.ctx = ctx; m.mapRaster=m.focusRaster=null; m._drawCanvas(); m.mapRaster=m.focusRaster=null; m.ctx = saved;
          const painted = scene.draw(), capture = document.createElement('canvas'); capture.width = reference.width; capture.height = reference.height; const c = capture.getContext('2d'); c.drawImage(scene.canvas, 0, 0);
          const expected = ctx.getImageData(0, 0, reference.width, reference.height).data, actual = c.getImageData(0, 0, capture.width, capture.height).data, background = getComputedStyle(document.documentElement).getPropertyValue('--c-bg'); c.clearRect(0,0,1,1); c.fillStyle = background; c.fillRect(0,0,1,1); const bg = c.getImageData(0,0,1,1).data;
          let sum = 0, changed = 0; for (let i=0;i<actual.length;i+=4) for(let j=0;j<3;j++){const a=expected[i+3]/255,b=actual[i+3]/255,d=Math.abs(expected[i+j]*a+bg[j]*(1-a)-actual[i+j]*b-bg[j]*(1-b));sum+=d;if(d>20)changed++;}
          const glError=scene.gl.getError();const hit = m.hit(m.sx(focus.x), m.sy(focus.y)); return { mode, painted, glError, status: scene.status, resources: scene.resources(), hit: hit?.it.id, difference: { mean: sum/(actual.length*.75), changed: changed/(actual.length*.75) } };
        }, mode);
        results.push({theme,dpr,...result}); console.log(JSON.stringify({theme,dpr,...result})); await writeFile('/tmp/atlas-map-scene-prototype.json', JSON.stringify({complete:false,results},null,2)+'\n');
        assert.equal(result.painted,true,result.status); assert.equal(result.glError,0); assert.ok(result.resources.logicalRetainedBytes<=64_000_000); assert.equal(result.resources.primarySamples,0); assert.equal(result.resources.inputCanvasPixels,1); assert.ok(result.difference.mean<2&&result.difference.changed<.02,JSON.stringify(result.difference));
        if(mode==='overview'||mode==='selected-hover')await page.screenshot({path:`/tmp/atlas-map-scene-${mode}-${theme}-dpr${dpr}.png`});
      }
      assert.deepEqual(errors,[]); await page.evaluate(()=>window.__mapAudit.destroy());
    } finally { await page.close(); }
  }
  await writeFile('/tmp/atlas-map-scene-prototype.json',JSON.stringify({complete:true,results},null,2)+'\n');
} finally { await browser.close(); await new Promise(r=>server.close(r)); }
