// Measure the actual map renderer at overview, collection and item scales.
// Run after other CPU-intensive jobs finish; VM results do not certify user hardware.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from './serve.mjs';
import { findBrowser, installBrowserAssets } from './browser.mjs';
import { ROOT } from './lib.mjs';

const inputHashes = () => Object.fromEntries([
  'scripts/measure-map.mjs', 'scripts/browser.mjs', 'scripts/serve.mjs',
  'index.html', 'package-lock.json', 'data/index.json', 'data/planned.json', 'data/atlas.css',
  ...readdirSync(join(ROOT, 'assets'), { recursive: true })
    .filter(file => /\.(?:js|css)$/.test(file)).map(file => `assets/${file}`),
].sort().map(file => [file, createHash('sha256').update(readFileSync(join(ROOT, file))).digest('hex')]));
const fingerprints = inputHashes();

const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await installBrowserAssets(context);
const page = await context.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
const output = { schemaVersion: 2, measuredAt: new Date().toISOString(), browserVersion: browser.version(), nodeVersion: process.version, fingerprints,
  viewport: { width: 1280, height: 900, dpr: 1 }, environment: 'Headless Chromium in a shared four-core cloud VM', scenarios: [] };
try {
  await page.goto(`http://localhost:${server.address().port}/index.html#/about`);
  await page.locator('h1').filter({ hasText: 'About this atlas' }).waitFor();
  await page.evaluate(async () => {
    const { MapView } = await import('/assets/js/graph.js');
    const draw = MapView.prototype._draw;
    MapView.prototype._draw = function () { window.__measuredMap = this; return draw.call(this); };
    location.hash = '#/map';
  });
  await page.waitForFunction(() => window.__measuredMap?.nodes.length > 13000, null, { timeout: 60000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  for (const [name, scale, wide] of [['overview', null, false], ['collections', .5, false], ['items', 1.5, false], ['overview-wide-pan', null, true], ['items-wide-pan', 1.5, true]]) {
    const result = await page.evaluate(async ({ name, scale, wide }) => {
      const map = window.__measuredMap;
      if (scale) map.k = scale; else map.fit(false);
      const tx = map.tx, ty = map.ty, draws = [], frames = [];
      let previous, cacheRebuilds = 0;
      for (let i = 0; i < 100; i++) {
        const timestamp = await new Promise(requestAnimationFrame);
        const start = performance.now();
        // Same movement entry point used by pointer dragging, including its
        // progressive detail policy. Every written/planned node remains drawn.
        map.panTo(tx + (wide ? 1200 : 30) * Math.sin(i / 20), ty + (wide ? 500 : 20) * Math.cos(i / 20));
        const cache = map.panCache;
        map._draw();
        if (i >= 10) { draws.push(performance.now() - start); frames.push(timestamp - previous); if (map.panCache !== cache) cacheRebuilds++; }
        previous = timestamp;
      }
      const quantile = (values, p) => [...values].sort((a,b) => a-b)[Math.floor((values.length-1)*p)];
      clearTimeout(map.detailTimer); map.interacting = false;
      const detailStart = performance.now(); map._draw(); const settledDetailMs = performance.now() - detailStart;
      return { name, scale: map.k, nodes: map.nodes.length, edges: map.edges.length, settledDetailMs,
        cacheRebuilds, drawMedianMs: quantile(draws,.5), drawP95Ms: quantile(draws,.95), drawMaxMs: Math.max(...draws),
        frameMedianMs: quantile(frames,.5), frameP95Ms: quantile(frames,.95),
        framesWithinBudget: frames.filter(t => t <= 1000/60 + 1).length, frames: frames.length };
    }, { name, scale, wide });
    output.scenarios.push(result); console.log(JSON.stringify(result));
  }
  output.errors = errors;
  output.inputsStable = JSON.stringify(fingerprints) === JSON.stringify(inputHashes());
  if (!output.inputsStable) errors.push('Map inputs changed during measurement; rerun against stable inputs.');
  output.passes60Fps = errors.length === 0 && output.scenarios.every(s => s.drawP95Ms <= 1000/60 && s.frameP95Ms <= 1000/60 + 1);
  const report = process.argv.find(a => a.startsWith('--report='))?.slice(9) || '/tmp/atlas-map-performance.json';
  writeFileSync(report, JSON.stringify(output, null, 2) + '\n');
  console.log(`60 fps gate: ${output.passes60Fps ? 'passed in this environment' : 'not demonstrated'}; ${report}`);
  if (!output.passes60Fps) process.exitCode = 1;
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
