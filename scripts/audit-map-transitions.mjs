import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cpus, platform, arch } from 'node:os';
import { chromium } from 'playwright-core';
import { createServer } from './serve.mjs';
import { findBrowser } from './browser.mjs';
import { mapWebGLPrototype } from './lib/map-webgl-prototype.mjs';

const output = process.argv[2] || '/tmp/atlas-map-transitions.json';
const baseline = process.argv.includes('--baseline'), framesArg = process.argv.find(x => x.startsWith('--frames='));
const frames = framesArg ? Number(framesArg.slice(9)) : baseline ? 24 : 60;
assert.ok(Number.isInteger(frames) && frames >= 8 && frames <= 240, 'input frames must be an integer between 8 and 240');
const modesArg = process.argv.find(x => x.startsWith('--modes='));
const allowedModes = ['overview-zoom', 'detail-zoom', 'focus', 'fit', 'hover', 'selected-hover', 'pan-overview', 'pan-overview-selected', 'pan-detail', 'pan-selected'];
const modes = modesArg ? modesArg.slice(8).split(',') : allowedModes;
assert.ok(modes.length && modes.every(mode => allowedModes.includes(mode)), 'unknown benchmark mode');
const regimeArg = process.argv.find(x => x.startsWith('--regime='));
const regimes = [{ width: 1440, height: 1000, dpr: 1 }, { width: 1440, height: 1000, dpr: 2 }, { width: 3840, height: 2160, dpr: 2 }].filter(v => !regimeArg || `${v.width}x${v.height}@${v.dpr}` === regimeArg.slice(9));
assert.ok(regimes.length, 'unknown viewport/DPR regime');
const sourceArg = process.argv.find(x => x.startsWith('--graph='));
const inputSource = await readFile(sourceArg ? sourceArg.slice(8) : new URL('../assets/js/graph.js', import.meta.url), 'utf8');
const experimentalWebGL = process.argv.includes('--webgl-prototype'), graphSource = experimentalWebGL ? mapWebGLPrototype(inputSource) : inputSource;
const executablePath = process.argv.includes('--full-chrome') ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : findBrowser();
const launchArgs = process.argv.includes('--metal') ? ['--use-angle=metal'] : [];
const helperSource = experimentalWebGL ? await readFile(new URL('../assets/js/map-webgl-edges.js', import.meta.url), 'utf8') : null;
const frozenData = new Map(), datasetFiles = [], datasetHash = createHash('sha256');
for (const name of ['index.json', 'planned.json']) {
  const bytes = await readFile(new URL(`../data/${name}`, import.meta.url));
  frozenData.set(name, bytes);
  datasetFiles.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  datasetHash.update(name + '\0').update(bytes);
}
const dataset = { sha256: datasetHash.digest('hex'), files: datasetFiles };
const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath, headless: true, args: launchArgs }), results = [];
let renderer = null, gpuInfo = null;
try { const session = await browser.newBrowserCDPSession(), info = await session.send('SystemInfo.getInfo'); gpuInfo = { devices: info.gpu.devices, featureStatus: info.gpu.featureStatus, auxAttributes: info.gpu.auxAttributes }; await session.detach(); } catch (error) { gpuInfo = { unavailable: error.message }; }
const save = complete => writeFile(output, JSON.stringify({ complete, executablePath, launchArgs, experimentalWebGL, renderer, gpuInfo, panFrames: 60, inputGraphSHA256: createHash('sha256').update(inputSource).digest('hex'), helperSHA256: helperSource ? createHash('sha256').update(helperSource).digest('hex') : null, dataset, modes, inputFrames: frames, animationDrainFrames: 2, postSettleDrainFrames: 1, date: new Date().toISOString(), graphSHA256: createHash('sha256').update(graphSource).digest('hex'), browser: browser.version(), host: { platform: platform(), arch: arch(), cpu: cpus()[0]?.model, logicalCPUs: cpus().length }, method: `Real browser RAF; modes ${modes.join(", ")}; ${frames} sinusoidal wheel-input zoom frames across LOD thresholds; actual requested 600ms focus/fit animations measured through their exact final target and two drained RAFs for final submission/render (10s timeout); ${frames} native PointerEvent hover positions with exact hit testing; 60 RAF pan inputs per pan mode after eight warm-up draws and a separately recorded cold raster setup; trusted wheel and pointer preflights; all ${results[0]?.nodes ?? 0} nodes and ${results[0]?.edges ?? 0} edges loaded, all ${results[0]?.fields ?? 0} fields/planned/definitions enabled. Oversized DPR2 uses full-resolution direct fallback. Additional settled-raster latency and final draw costs are reported separately. CPU submission time and browser frame cadence use performance.now after callbacks, including the final drained paint, rather than pre-paint RAF timestamps. No universal-device performance claim.`, results }, null, 2) + '\n');
try {
  for (const theme of baseline ? ['light'] : ['light', 'dark']) for (const viewport of regimes) {
    const page = await browser.newPage({ viewport, colorScheme: theme, deviceScaleFactor: viewport.dpr }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [name, body] of frozenData) await page.route(`**/data/${name}`, route => route.fulfill({ body, contentType: 'application/json' }));
    if (helperSource) await page.route('**/assets/js/map-webgl-edges.js', route => route.fulfill({ body: helperSource, contentType: 'application/javascript' }));
    await page.route('**/assets/js/graph.js', async route => {
      const response = await route.fetch(); await route.fulfill({ response, body: graphSource.replace('    this._bind();', '    window.__mapAudit = this; this._bind();') });
    });
    try {
      await page.goto(`http://localhost:${server.address().port}/#/map`); await page.waitForFunction(() => window.__mapAudit?.nodes.length === 13574); await page.evaluate(() => document.fonts.ready);
      renderer = await page.evaluate(() => { const canvas = document.createElement('canvas'), gl = canvas.getContext('webgl2'); if (!gl) return { available: false }; const debug = gl.getExtension('WEBGL_debug_renderer_info'), result = { available: true, renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER), version: gl.getParameter(gl.VERSION) }; gl.getExtension('WEBGL_lose_context')?.loseContext(); return result; });
      // Confirm a genuine browser wheel input reaches the transform under test.
      const canvas = page.locator('.map-page > canvas'), box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      const before = await page.evaluate(() => window.__mapAudit.k); await page.mouse.wheel(0, -120);
      await page.waitForFunction(before => window.__mapAudit.k !== before, before);
      const panBefore = await page.evaluate(() => window.__mapAudit.tx);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * .7); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height * .7, { steps: 4 }); await page.mouse.up();
      assert.ok(Math.abs(await page.evaluate(() => window.__mapAudit.tx) - panBefore) > 30, 'trusted pointer pan preflight');
      for (const mode of modes) {
        const measured = await page.evaluate(async ({ mode, frames }) => {
          const m = window.__mapAudit, pan = mode.startsWith('pan-'), raf = () => new Promise(requestAnimationFrame), target = m.byId.get('ladr-2.30');
          const stats = values => { const s = [...values].sort((a, b) => a - b); return { samples: s.length, mean: s.reduce((a, b) => a + b, 0) / s.length, p50: s[Math.floor(s.length * .5)], p95: s[Math.floor(s.length * .95)], max: s.at(-1) }; };
          clearTimeout(m.hoverTimer); m.hoverTimer = null; m.dragging = false; m.hover = null; m._tip(null); m.select(null, false); m.fit(false); await raf(); await document.fonts.ready;
          const overview = { k: m.k, tx: m.tx, ty: m.ty }, center = [(m.W / 2 - m.tx) / m.k, (m.H / 2 - m.ty) / m.k];
          if (mode === 'focus' || mode === 'fit' || mode === 'selected-hover' || ['pan-overview-selected', 'pan-selected'].includes(mode)) { target.it.st ??= ''; m.select(target, false); }
          if (['detail-zoom', 'fit', 'pan-detail', 'pan-selected'].includes(mode)) { m.k = pan ? .8 : 1.6; m.tx = m.W / 2 - target.x * m.k - (mode === 'fit' && m.W > 700 ? 180 : 0); m.ty = m.H / 2 - target.y * m.k; }
          if (mode.endsWith('hover')) { m.k = .10; m.tx = m.W / 2 - target.x * m.k; m.ty = m.H / 2 - target.y * m.k; }
          m.mapRaster = m.focusRaster = null; m._settledHover = null; const setupStart = performance.now(); m._draw(); const setupDrawMS = performance.now() - setupStart; await document.fonts.ready; await raf(); await raf(); const setupThroughMS = performance.now() - setupStart, setupRasterPixels = [m.mapRaster,m.focusRaster].reduce((sum,cache)=>sum+(cache?cache.canvas.width*cache.canvas.height:0),0);
          if (pan) for (let i=0;i<8;i++) { m.draw(); await raf(); }
          const panOrigin = { tx:m.tx,ty:m.ty };
          const candidates = m.top.filter(n => m.sx(n.x) > 120 && m.sx(n.x) < m.W - (m.sel && m.W > 700 ? 480 : 120) && m.sy(n.y) > 180 && m.sy(n.y) < m.H - 100).slice(0, 8);
          if (mode.endsWith('hover')) for (const n of candidates) n.it.st ??= '';
          const originalDraw = m._draw, originalPaint = m._paint, drawMS = [], paintMS = [], frameMS = [], hitMS = [], zooms = [], rasterPixels = [], rasterEdges = []; let paintDepth = 0;
          m._draw = function () { const t = performance.now(); const value = originalDraw.call(this); drawMS.push(performance.now() - t); rasterPixels.push([this.mapRaster, this.focusRaster].reduce((sum, cache) => sum + (cache ? cache.canvas.width * cache.canvas.height : 0), 0)); rasterEdges.push(Math.max(0,...[this.mapRaster,this.focusRaster].filter(Boolean).flatMap(cache=>[cache.canvas.width,cache.canvas.height]))); return value; };
          m._paint = function (...args) { const t = performance.now(), outer = paintDepth++ === 0; try { return originalPaint.apply(this, args); } finally { paintDepth--; if (outer) paintMS.push(performance.now() - t); } };
          await raf(); let previous = performance.now(), start = previous, hoverChanges = 0, oldHover = null;
          if (mode === 'focus') m.select(target, true); else if (mode === 'fit') m.fit(true);
          for (let i = 0; i < (pan ? 60 : mode === 'focus' || mode === 'fit' ? 100 : frames); i++) {
            if (pan) { m.dragging=true; m.tx=panOrigin.tx+32*Math.sin(i/20); m.ty=panOrigin.ty+24*Math.sin(i/17); m.draw(); } else if (mode.endsWith('zoom')) {
              const lo = mode === 'overview-zoom' ? .06 : .5, hi = mode === 'overview-zoom' ? .2 : 1.8;
              const k = lo + (hi - lo) * (.5 - .5 * Math.cos(i * Math.PI * 4 / (frames - 1)));
              const anchor = mode === 'overview-zoom' ? center : [target.x, target.y], r = m.canvas.getBoundingClientRect();
              if (!i) { m.k = lo; m.tx = m.W / 2 - anchor[0] * lo; m.ty = m.H / 2 - anchor[1] * lo; }
              m.canvas.dispatchEvent(new WheelEvent('wheel', { clientX: r.left + m.W / 2, clientY: r.top + m.H / 2, deltaY: -Math.log(k / m.k) / .0018, bubbles: true, cancelable: true }));
            } else if (mode.endsWith('hover')) {
              const n = candidates[i % candidates.length]; {
                const r = m.canvas.getBoundingClientRect(), t = performance.now();
                m.canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + m.sx(n.x), clientY: r.top + m.sy(n.y), pointerId: 1, bubbles: true })); hitMS.push(performance.now() - t);
                if (m.hover !== oldHover) hoverChanges++; oldHover = m.hover;
              }
            }
            await raf(); const now = performance.now(); frameMS.push(now - previous); previous = now; zooms.push(m.k);
            if (mode === 'focus' || mode === 'fit') {
              const expected = mode === 'focus' ? { k: 1.6, tx: m.W / 2 - target.x * 1.6 - (m.W > 700 ? 180 : 0), ty: m.H / 2 - target.y * 1.6 } : overview;
              if (Math.abs(m.k - expected.k) < 1e-10 && Math.abs(m.tx - expected.tx) < 1e-7 && Math.abs(m.ty - expected.ty) < 1e-7 && (typeof m.startZoom !== 'function' || !m.zooming)) break;
              if (performance.now() - start > 10000) throw Error('animation did not reach its exact target within 10 seconds');
            }
          }
          const inputFrameMS = [...frameMS];
          if (pan) { m.dragging=false; m.mapRaster=null; m.draw(); }
          // The final animation callback schedules its exact paint for the next
          // RAF. Drain that submission, then another frame for browser rendering.
          for (let i = 0; i < 2; i++) {
            await raf(); const drained = performance.now(); frameMS.push(drained - previous); previous = drained;
          }
          const interactionDraws = [...drawMS], interactionPaints = [...paintMS], settleStart = performance.now();
          while (m.zooming || m._raf || m.hover && m.mapRaster?.focus !== m.hover && m.hoverTimer && typeof m.startZoom === 'function') { await raf(); if (performance.now() - settleStart > 10000) throw Error('settled raster did not become ready within 10 seconds'); }
          await raf(); // Drain browser rendering after a timer-triggered settled paint.
          const settleMS = performance.now() - settleStart; m._draw = originalDraw; m._paint = originalPaint;
          return { mode, canvas: { width:m.W,height:m.H,dpr:m.dpr,pixelWidth:m.canvas.width,pixelHeight:m.canvas.height }, nodes: m.nodes.length, edges: m.edges.length, fields: m.show.fields.size, planned: m.show.planned, definitions: m.show.defs, selected: !!m.sel, setupDrawMS, setupThroughMS, setupRasterPixels, inputFrameMS: stats(inputFrameMS), inputFPS: 1000/stats(inputFrameMS).mean, framesOver20MS: frameMS.filter(ms=>ms>20).length, zoomRange: [Math.min(...zooms), Math.max(...zooms)], drawMS: stats(interactionDraws), paintMS: interactionPaints.length ? stats(interactionPaints) : null, frameMS: stats(frameMS), fps: 1000 / stats(frameMS).mean, interactionMS: frameMS.reduce((sum, ms) => sum + ms, 0), renderThroughMS: frameMS.reduce((sum, ms) => sum + ms, 0) + settleMS, settleMS, finalDrawMS: drawMS.length > interactionDraws.length ? stats(drawMS.slice(interactionDraws.length)) : null, hitMS: hitMS.length ? stats(hitMS) : null, hoverChanges, rasterPixels: Math.max(setupRasterPixels,...rasterPixels), maximumRasterEdge: Math.max(0,...rasterEdges), fallback: !m.mapRaster && !m.__gpuStats?.gpuGroups, experimentalBackend: m.__gpuStats ? { ...m.__gpuStats, capabilities: m.__gpu.capabilities } : null, overview };
        }, { mode, frames });
        assert.equal(measured.nodes, 13574); assert.equal(measured.edges, 23073); assert.equal(measured.fields, 13); assert.ok(measured.planned && measured.definitions); assert.ok(measured.rasterPixels <= 16_000_000); assert.ok(measured.maximumRasterEdge <= 8192);
        if (!experimentalWebGL && viewport.width===3840) { assert.equal(measured.rasterPixels,0); assert.equal(measured.maximumRasterEdge,0); assert.equal(measured.fallback,true); }
        assert.equal(measured.selected, ['focus', 'fit', 'selected-hover', 'pan-overview-selected', 'pan-selected'].includes(mode));
        if (mode.endsWith('hover')) assert.ok(measured.hoverChanges > 5);
        results.push({ theme, viewport, ...measured });
        await save(false);
        console.log(`${theme} ${viewport.width}px DPR${viewport.dpr} ${mode}: ${measured.fps.toFixed(1)}fps; draw p95 ${measured.drawMS.p95.toFixed(2)}ms; paint ${measured.paintMS?.samples || 0}; settle ${measured.settleMS.toFixed(1)}ms; fallback ${measured.fallback}`);
      }
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  }
  await save(true);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
