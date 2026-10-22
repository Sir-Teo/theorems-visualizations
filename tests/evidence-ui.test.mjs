import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { ROOT } from '../scripts/lib.mjs';
import { fixtureRecord, sealFixture, hash } from './evidence-fixture.mjs';
let server, browser, base, catalog;
const shots = process.env.ATLAS_EVIDENCE_SCREENSHOTS || '/tmp/atlas-evidence-view-20261022/screenshots';
before(async () => {
  const files = createServer();
  server = http.createServer((req, res) => { if (req.url.startsWith('/project/')) req.url = req.url.slice('/project'.length); files.emit('request', req, res); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
  catalog = JSON.parse(await readFile(join(ROOT, 'data/index.json'), 'utf8'));
  await mkdir(shots, { recursive: true });
});
after(async () => { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); });
async function run(fn, options = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', ...options });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try { await fn(page); assert.deepEqual(errors, []); } finally { await page.close(); }
}
test('home and unopened explanations do not request the evidence catalog; opening preserves the mounted visualization', () => run(async page => {
  const requests = []; page.on('request', r => requests.push(new URL(r.url()).pathname));
  await page.goto(base + '/#/'); await page.locator('#app h1').waitFor();
  assert.ok(!requests.some(x => /evidence/.test(x)));
  await page.goto(base + '/#/t/pma-4.19'); await page.locator('#viz canvas').first().waitFor();
  assert.ok(!requests.some(x => /evidence/.test(x)));
  await page.evaluate(() => { window.savedEvidenceCanvas = document.querySelector('#viz canvas'); });
  await page.locator('.evidence-disclosure summary').focus(); await page.keyboard.press('Enter');
  await page.getByText('No additional evidence record is published', { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => window.savedEvidenceCanvas === document.querySelector('#viz canvas')), true);
  assert.ok(requests.some(x => x.endsWith('/data/evidence.json')));
  assert.ok(!requests.some(x => /\/data\/evidence\//.test(x)));
}));
test('legacy compact verification flags retain uncertainty and absent flags do not become review passes', () => run(async page => {
  const flagged = catalog.items.find(x => x.verify === 1), unflagged = catalog.items.find(x => !x.verify);
  assert.ok(flagged && unflagged);
  await page.goto(base + '/#/evidence/' + flagged.id); await page.locator('.evidence-view').waitFor();
  assert.match(await page.locator('.evidence-view').textContent(), /carries a legacy verification flag/);
  await page.goto(base + '/#/evidence/' + unflagged.id); await page.locator('.evidence-view').waitFor();
  assert.match(await page.locator('.evidence-view').textContent(), /does not establish independent review or acceptance/);
}));
test('direct evidence routes retain project base, alias, embed and opaque saved-state parameters', () => run(async page => {
  const alias = catalog.collections.flatMap(c => c.chapters.flatMap(ch => (ch.cross || []).map(([num, target]) => ({ id: c.id + '-' + num, target })))).find(x => catalog.items.some(it => it.id === x.target));
  assert.ok(alias);
  const suffix = '?opaque=x%2By%3D&embed=1&unknown=a?b&empty=&dup=1&dup=2';
  await page.goto(base + '/project/?embed=1#/evidence/' + alias.id + suffix); await page.locator('.evidence-return').waitFor();
  assert.equal(await page.locator('.evidence-return').getAttribute('href'), '#/t/' + alias.id + suffix);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('embed-view')), false);
  await page.locator('.evidence-return').click(); await page.locator('.thm-page').waitFor();
  assert.equal(new URL(page.url()).pathname, '/project/');
  assert.equal(new URL(page.url()).hash, '#/t/' + alias.target + suffix);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('embed-view')), true);
}));
test('slow evidence loads cannot replace a later route; failed requests are distinguished from no reviews', () => run(async page => {
  let release, requested;
  const gate = new Promise(resolve => { release = resolve; }), request = new Promise(resolve => { requested = resolve; });
  await page.route('**/data/evidence.json', async route => { requested(); await gate; await route.fulfill({ status: 503, body: 'unavailable' }); });
  await page.goto(base + '/#/t/pma-4.19'); await page.locator('.evidence-disclosure summary').click(); await request;
  await page.evaluate(() => { location.hash = '#/about'; }); await page.getByRole('heading', { name: 'About this atlas' }).waitFor();
  const response = page.waitForResponse(r => r.url().endsWith('/data/evidence.json')); release(); await response;
  assert.equal(await page.locator('#app h1').textContent(), 'About this atlas');
  await page.goto(base + '/#/evidence/pma-4.19'); await page.locator('.evidence-view').waitFor();
  assert.match(await page.locator('.evidence-view').textContent(), /could not be verified or loaded/);
}));
test('scoped review rendering escapes authored text and rejects stale or tampered records', () => run(async page => {
  const item = catalog.items.find(x => x.id === 'pma-4.19'), collection = catalog.collections.find(x => x.id === item.col);
  const shard = JSON.parse(await readFile(join(ROOT, 'data/col/' + item.col + '.json'), 'utf8'));
  const r = fixtureRecord(item.id); r.publication = 'public'; r.claims[0].text = '<img src=x onerror="window.evidenceXss=1">';
  const { target, binding } = await sealFixture(ROOT, r, { ...item, ...shard[item.id] }, collection);
  shard[item.id].evidenceImplementationDigest = target.evidenceImplementationDigest;
  const payload = JSON.stringify({ record: r, binding }); let stale = false, corrupt = false;
  await page.route('**/data/col/pma.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(shard) }));
  await page.route('**/data/evidence.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ schemaVersion: 1, entries: [{ targetId: item.id, path: 'evidence/' + item.id + '.json', sha256: hash(payload), targetDigest: stale ? '0'.repeat(64) : binding.targetDigest, publication: 'public' }] }) }));
  await page.route('**/data/evidence/pma-4.19.json', route => route.fulfill({ contentType: 'application/json', body: corrupt ? '{}' : payload }));
  await page.goto(base + '/#/evidence/pma-4.19'); await page.getByText(r.claims[0].text, { exact: true }).waitFor();
  assert.equal(await page.locator('.evidence-view img').count(), 0); assert.equal(await page.evaluate(() => window.evidenceXss), undefined);
  assert.match(await page.locator('.evidence-view').textContent(), /Synthetic fixture only/);
  stale = true; await page.reload(); await page.locator('.evidence-view').waitFor(); assert.match(await page.locator('.evidence-view').textContent(), /earlier version/);
  stale = false; corrupt = true; await page.reload(); await page.locator('.evidence-view').waitFor(); assert.match(await page.locator('.evidence-view').textContent(), /could not be verified/);
}));
test('evidence views remain readable at phone/desktop widths in both themes', async () => {
  for (const width of [320, 1280]) for (const theme of ['light', 'dark']) await run(async page => {
    await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
    await page.goto(base + '/#/evidence/pma-4.19'); await page.locator('.evidence-view').waitFor(); await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: join(shots, 'evidence-' + width + '-' + theme + '.png'), fullPage: true });
    await page.goto(base + '/#/t/pma-4.19'); await page.locator('.evidence-disclosure summary').click(); await page.locator('.evidence-view').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }, { viewport: { width, height: 900 }, colorScheme: theme });
});
