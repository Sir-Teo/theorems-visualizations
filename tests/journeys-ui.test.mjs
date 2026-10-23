import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, stat, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { findBrowser } from '../scripts/browser.mjs';
import { buildJourneys, prepareJourneys } from '../scripts/build-journeys.mjs';
import { deliveredTargets, renderJourneys } from '../journeys/reader.mjs';
let browser, server, origin, output, owned, prepared, unavailable;
const shots = process.env.ATLAS_JOURNEY_SCREENSHOTS || '/tmp/atlas-journeys-reader-shots';
before(async () => {
  output = process.env.ATLAS_JOURNEY_CANDIDATE;
  if (!output) { owned = await mkdtemp(join(tmpdir(), 'atlas-journey-ui-')); output = join(owned, 'site'); await buildJourneys({ out: output }); }
  output = resolve(output); prepared = await prepareJourneys();
  const a = deliveredTargets(prepared.data.targets, { mode: 'release', legacyIds: prepared.context.accepted.ids, editions: { mode: 'release', explorations: [] } });
  const states = prepared.entries.map(e => ({ ...e, state: e.id === 'water-city' ? 'withdrawn' : 'published', ...(e.id === 'water-city' ? { reason: 'Synthetic native fixture only' } : {}) }));
  unavailable = renderJourneys(prepared.data, states, a, { mode: 'release', base: 'https://example.org/project/' }).outputs;
  const types = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  server = http.createServer(async (req, res) => { try {
    let path = decodeURIComponent(new URL(req.url, 'http://local').pathname), fixture = path.startsWith('/unavailable/'); path = path.replace(/^\/(?:project|unavailable)\//, '/'); if (path.endsWith('/')) path += 'index.html';
    const file = resolve(output, '.' + path); if (!file.startsWith(output + '/')) { res.writeHead(403); res.end(); return; }
    const content = fixture && unavailable.has(path.slice(1)) ? unavailable.get(path.slice(1)) : (await stat(file).catch(() => null))?.isFile() ? await readFile(file) : null;
    if (content === null) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }); res.end(content);
  } catch { res.writeHead(500); res.end(); } });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); origin = 'http://127.0.0.1:' + server.address().port;
  const active = () => execFileSync('ps', ['-ax', '-o', 'pid=,command='], { encoding: 'utf8' }).split('\n').filter(s => /^\s*\d+\s+\//.test(s) && /chrome|chromium/i.test(s) && s.includes('--remote-debugging-pipe') && !s.includes('--type=')).length;
  const deadline = Date.now() + 45000; while (active() >= 2 && Date.now() < deadline) await new Promise(r => setTimeout(r, 1000)); assert.ok(active() < 2, 'Both shared browser lanes remain occupied');
  browser = await chromium.launch({ executablePath: findBrowser(), headless: true }); await mkdir(shots, { recursive: true });
});
after(async () => { await browser?.close(); if (server) await new Promise(r => server.close(r)); if (owned) await rm(owned, { recursive: true, force: true }); });
async function run(fn, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', ...options }), page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(origin)) errors.push(r.status() + ' ' + r.url()); });
  try { await fn(page, context); assert.deepEqual(errors, []); } finally { await context.close(); }
}
test('five journey HTML pages and every local reference resolve with no private authoring roots or drafts', async () => {
  let refs = 0; const targets = new Set();
  for (const path of ['journeys/index.html', 'journeys/about/index.html', ...prepared.entries.map(e => `journeys/${e.id}/index.html`)]) {
    const html = await readFile(join(output, path), 'utf8'); assert.ok(html.includes('noindex,nofollow')); assert.ok(!html.includes('rel="canonical"')); assert.ok(!html.includes('<script'));
    for (const forbidden of ['x-performance-0001', 'docs/journeys', 'docs/pilots', 'labs/atlas']) assert.ok(!html.includes(forbidden));
    for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|#|data:)/.test(href)) continue;
      const u = new URL(href.replaceAll('&amp;', '&'), 'https://local/' + path); let target = u.pathname.slice(1); if (!target || target.endsWith('/')) target += 'index.html'; targets.add(target); refs++;
    }
  }
  for (const path of targets) assert.ok((await stat(join(output, path)).catch(() => null))?.isFile(), path);
  console.log(JSON.stringify({ journeyHTMLPages: 5, localReferences: refs, localTargets: targets.size }));
});
test('all tasks and source limits can be read without JavaScript at root and project prefixes', () => run(async page => {
  for (const prefix of ['', '/project']) for (const r of prepared.data.plans.routes) {
    await page.goto(origin + prefix + '/journeys/' + r.id + '/'); assert.equal(await page.locator('h1').textContent(), r.title); assert.equal(await page.locator('.step').count(), r.steps.length);
    for (const s of r.steps.filter(s => s.kind !== 'gap')) {
      const box = page.locator('#step-' + s.id); assert.ok((await box.textContent()).includes(s.id === 'practice' ? 'Read the retained source descriptions below and, if accessible, their linked pages.' : s.task)); await box.locator('summary').click(); assert.ok(await box.getByText(s.check, { exact: true }).isVisible());
    }
    for (const id of new Set(r.steps.flatMap(s => s.sourceIds))) { const source = prepared.data.sources.sources.find(s => s.id === id), content = await page.locator('#source-' + id).textContent(); assert.ok(content.includes(source.limits) && content.includes(source.reuse)); }
  }
  await page.goto(origin + '/project/journeys/account-evidence/'); assert.equal(await page.locator('#step-law summary').count(), 1);
  assert.equal(await page.locator('#step-law .destination').count(), 1); assert.equal(await page.locator('input[type="checkbox"]').count(), 0);
}, { javaScriptEnabled: false }));
test('keyboard skip, stop anchors and reasoning disclosures work; private stores and network stay untouched', () => run(async page => {
  const requests = []; page.on('request', r => requests.push(r.url())); await page.goto(origin + '/project/journeys/water-city/');
  await page.evaluate(() => { localStorage.setItem('atlas.progress', 'PRESERVE'); localStorage.setItem('atlas.exploration.v1.x-history-0001.0.1.2', 'PRIVATE PRESERVE'); });
  const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
  await page.keyboard.press('Tab'); assert.equal(await page.locator(':focus').textContent(), 'Skip to content'); await page.keyboard.press('Enter'); assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
  const anchor = page.getByRole('navigation', { name: 'Journey stops' }).getByRole('link').nth(2); await anchor.focus(); await page.keyboard.press('Enter'); assert.equal(new URL(page.url()).hash, '#step-snow');
  const summary = page.locator('#step-snow summary'); await summary.focus(); await page.keyboard.press('Enter'); assert.equal(await summary.locator('..').getAttribute('open'), '');
  assert.equal(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), before); assert.ok(requests.every(u => u.startsWith(origin + '/'))); assert.ok(requests.every(u => !u.includes('PRIVATE')));
}));
test('all five entry points reach journeys, and exact retained edition links and return navigation resolve', () => run(async page => {
  for (const path of ['', 'ideas/', 'explore/', 'domains/', 'explore/notebooks/']) {
    await page.goto(origin + '/project/' + path); await page.locator('[data-journey-entry] a, a[data-journey-entry]').click(); assert.equal(new URL(page.url()).pathname, '/project/journeys/');
  }
  await page.getByRole('link', { name: 'How an account becomes evidence', exact: true }).click();
  await page.getByRole('link', { name: 'Open: What can two documents establish?', exact: true }).click(); assert.equal(new URL(page.url()).pathname, '/project/explore/x-history-0001/versions/0.1.2/');
  await page.goBack(); assert.equal(new URL(page.url()).pathname, '/project/journeys/account-evidence/');
  await page.getByRole('link', { name: 'Open: Random sample and statistic', exact: true }).click(); assert.equal(new URL(page.url()).pathname, '/project/ideas/stat-1.2/');
}));
test('missing and withdrawn routes render navigable notices without former tasks, sources or lesson links', () => run(async page => {
  await page.goto(origin + '/unavailable/journeys/'); assert.equal(await page.locator('.journey-card').count(), 0);
  await page.getByRole('link', { name: 'account-evidence · unavailable', exact: true }).click(); assert.equal(await page.locator('h1').textContent(), 'This journey is unavailable in this build'); assert.equal(await page.locator('.step,.source,.destination').count(), 0); assert.equal(await page.locator('link[rel="canonical"]').count(), 0);
  await page.getByRole('link', { name: 'Cross-field journeys', exact: true }).click(); await page.getByRole('link', { name: 'water-city · withdrawn', exact: true }).click(); assert.equal(await page.locator('h1').textContent(), 'This journey has been withdrawn'); assert.equal(await page.locator('.step,.source').count(), 0);
}));
test('all routes fit320px in both themes and enlarged text; desktop and phone captures retain readable hierarchy', async () => {
  for (const colorScheme of ['light', 'dark']) await run(async page => {
    for (const path of ['journeys/', 'journeys/about/', ...prepared.entries.map(e => `journeys/${e.id}/`)]) {
      await page.goto(origin + '/project/' + path); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, path + ' ' + colorScheme);
    }
    await page.goto(origin + '/project/journeys/'); await page.screenshot({ path: join(shots, `index-320-${colorScheme}.png`) });
    await page.goto(origin + '/project/journeys/account-evidence/#step-law'); await page.addStyleTag({ content: 'html{font-size:24px}body{font-size:24px}' }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true); await page.locator('#step-law').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.screenshot({ path: join(shots, `law-lesson-320-large-${colorScheme}.png`) });
  }, { viewport: { width: 320, height: 900 }, colorScheme });
  for (const [id, colorScheme] of [['water-city', 'light'], ['woven-cloth', 'dark']]) await run(async page => { await page.goto(origin + '/project/journeys/' + id + '/'); await page.screenshot({ path: join(shots, `${id}-1280-${colorScheme}.png`) }); }, { colorScheme });
});
