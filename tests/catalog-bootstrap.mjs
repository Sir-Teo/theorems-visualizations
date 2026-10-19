import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

// Use the normal static server with actual gzip HTTP responses, so resource timing measures encoded bytes.
const server = createServer(), sent = [], measurements = [];
server.prependListener('request', (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (!path.endsWith('.json')) return;
  const writeHead = res.writeHead.bind(res), end = res.end.bind(res);
  let encoded = false;
  res.writeHead = (status, headers) => { encoded = status === 200; return writeHead(status, encoded ? { ...headers, 'content-encoding': 'gzip', vary: 'Accept-Encoding' } : headers); };
  res.end = (data, ...args) => { if (encoded && data) { const body = gzipSync(data); sent.push({ path, bytes: body.length }); return end(body, ...args); } return end(data, ...args); };
});
await new Promise(resolve => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}/`, browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const index = JSON.parse(await readFile(new URL('../data/index.json', import.meta.url)));
try {
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: scheme }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const begin = sent.length;
    await page.goto(base + '#/'); await page.locator('.hero-stats').waitFor(); await page.locator('#home-ptl canvas').waitFor();
    await page.evaluate(() => document.fonts.ready);
    // Let both native idle callbacks and the former 1200ms idle fallback pass; scroll every home section.
    await page.waitForTimeout(2500); await page.locator('#pillars').scrollIntoViewIfNeeded();
    await page.locator('.tm-field-control[aria-label="Zoom into Mathematics"]').focus(); await page.keyboard.press('Space');
    await page.locator('#tm-crumbs').filter({ hasText: 'Mathematics' }).waitFor();
    await page.locator('#tm-crumbs [data-tm-up]').click();
    await page.keyboard.press('/'); await page.waitForTimeout(300); // an empty search focus downloads nothing
    await page.locator('#search').blur(); await page.waitForTimeout(300);
    const requests = sent.slice(begin), timing = await page.evaluate(() => performance.getEntriesByType('resource').filter(x => x.name.endsWith('.json')).map(x => ({ path: new URL(x.name).pathname, bytes: x.encodedBodySize })));
    assert.deepEqual(requests.map(x => x.path), ['/data/home.json']);
    assert.deepEqual(timing.map(x => x.path), ['/data/home.json']);
    assert.ok(timing[0].bytes > 0 && timing[0].bytes <= 300000); assert.equal(timing[0].bytes, requests[0].bytes);
    assert.equal(await page.locator('.hero-stats b').first().innerText(), index.items.length.toLocaleString('en'));
    assert.equal(await page.locator('#chain a').count(), 1 + Math.max(...index.items.map(it => it.depth)));
    assert.equal(await page.locator('#pillars > a').count(), 12);
    assert.equal(await page.locator('#home-papers > a').count(), 6);
    assert.equal(await page.locator('#field-grid .col-list li').count(), 85);
    measurements.push({ theme: scheme, homeJSON: timing, requests, itemCount: index.items.length, collectionCount: 85, paperCount: index.paperCount });
    await page.screenshot({ path: `/tmp/atlas-home-catalog-${scheme}.png`, fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/atlas-home-catalog-hero-${scheme}.png` });
    console.log(`PASS ${scheme}: actual home HTTP JSON ${timing[0].bytes} gzip bytes, one response through idle/scroll/treemap/empty-search interactions`);
    // A real query upgrades to the complete graph and details, including a phrase found only in a statement.
    await page.locator('#search').fill('"pole separation alone"');
    await page.locator('#search-results a[href="#/t/ctrl-4.8"]').waitFor({ timeout: 60000 });
    assert.ok(sent.slice(begin).some(x => x.path === '/data/index.json'));
    assert.equal(new Set(sent.slice(begin).filter(x => x.path.startsWith('/data/col/')).map(x => x.path)).size, 85);
    await page.locator('#search-results a[href="#/t/ctrl-4.8"]').click();
    await page.locator('h1').filter({ hasText: 'Dominant-pole approximation' }).waitFor();
    await page.locator('.viz-controls').waitFor();
    await page.goto(base + '#/map'); await page.locator('.map-q input').waitFor();
    await page.locator('.map-q input').fill('"pole separation alone"');
    await page.locator('.map-q-n').filter({ hasText: /^1 match$/ }).waitFor({ timeout: 60000 });
    await page.goto(base + '#/papers'); await page.locator('.papers-q input').waitFor();
    assert.equal(await page.locator('#app .stats-row b').first().innerText(), String(index.paperCount));
    assert.deepEqual(errors, []); console.log(`PASS ${scheme}: complete statement search, all85 detail shards on demand, item visualization, full map and paper routes`);
    await page.close();
  }
  const page = await browser.newPage();
  const before = sent.length;
  await page.goto(base + '#/c/ctrl');
  await page.locator('h1').filter({ hasText: 'Control' }).waitFor();
  assert.ok(sent.slice(before).some(x => x.path === '/data/col/ctrl.json'));
  assert.ok(!sent.slice(before).some(x => x.path === '/data/planned.json'));
  await page.locator('#search').fill('"integrator state keeps growing"');
  await page.locator('#search-results a[href="#/t/ctrl-5.2"]').waitFor({ timeout: 60000 });
  await page.locator('#search-results a[href="#/t/ctrl-5.2"]').click();
  await page.locator('h1').filter({ hasText: 'Integral' }).waitFor();
  await page.goto(base + '#/'); await page.locator('.hero-stats').waitFor();
  await page.locator('#home-ptl canvas').waitFor();
  assert.equal(await page.locator('#home-papers > a').count(), 6);
  await page.close();
  console.log('PASS cold collection detail → planned-description query → planned item → complete home return; cached details replay after planned hydration');
  const retryPage = await browser.newPage(), retryErrors = [];
  retryPage.on('pageerror', error => retryErrors.push(error.message));
  let failOnce = true;
  await retryPage.route('**/data/col/ctrl.json', route => { if (failOnce) { failOnce = false; return route.abort('failed'); } return route.continue(); });
  await retryPage.goto(base + '#/'); await retryPage.locator('.hero-stats').waitFor();
  await retryPage.locator('#search').fill('"pole separation alone"');
  await retryPage.locator('#search-results').filter({ hasText: 'Search could not load. Try again.' }).waitFor({ timeout: 60000 });
  await retryPage.locator('#search').fill('"pole separation alone" ');
  await retryPage.locator('#search-results a[href="#/t/ctrl-4.8"]').waitFor({ timeout: 60000 });
  failOnce = true;
  await retryPage.goto(base + '#/map'); await retryPage.reload();
  await retryPage.locator('.map-q input').waitFor();
  await retryPage.locator('.map-q input').fill('"pole separation alone"');
  await retryPage.locator('.map-q-n').filter({ hasText: 'Search could not load' }).waitFor({ timeout: 60000 });
  await retryPage.locator('.map-q input').fill('"pole separation alone" ');
  await retryPage.locator('.map-q-n').filter({ hasText: /^1 match$/ }).waitFor({ timeout: 60000 });
  assert.deepEqual(retryErrors, []);
  await retryPage.close();
  console.log('PASS interrupted global and map detail fetches retry on the next query without incomplete results or unhandled errors');
  await writeFile('/tmp/atlas-home-json-budget-network.json', JSON.stringify({ browser: browser.version(), measurements }, null, 2));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
