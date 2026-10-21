import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { BRIDGE_PICTURES } from '../assets/js/bridge-models.js';
const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true }), evidence = [];
async function assertGlyphsFit(page, label) {
  const clipped = await page.evaluate(() => (window.__bridgeAuditStages || []).flatMap(s => {
    const bounds = s.o.gutter ? s._m : { l: 0, r: 0, t: 0, b: 0 };
    return (s.__auditDots || []).filter(p => {
      const x = s.X(p.x), y = s.Y(p.y), radius = p.r + .75;
      return x - radius < bounds.l - .25 || x + radius > s.W - bounds.r + .25 || y - radius < bounds.t - .25 || y + radius > s.H - bounds.b + .25;
    }).map(p => ({ title: s.o.title, point: p, pixels: [s.X(p.x), s.Y(p.y)], size: [s.W, s.H], bounds }));
  }));
  assert.deepEqual(clipped, [], `${label}: complete marker glyphs fit the actual plot clip`);
}
try {
  for (const theme of ['light', 'dark']) for (const width of [1440, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce' }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Record actual rendered markers and actual native stage transforms. Production
    // code stays unchanged; this catches clipping that model-only tests cannot see.
    await page.route('**/assets/js/bridge-viz.js', async route => {
      const response = await route.fetch();
      const source = await response.text(), needle = "return mount(host.querySelector('.bridge-picture-canvas'), v => {";
      assert.ok(source.includes(needle));
      await route.fulfill({ response, body: source.replace(needle, `${needle}
        window.__bridgeAuditStages = [];
        const stage = v.stage.bind(v);
        v.stage = options => {
          const s = stage(options); window.__bridgeAuditStages.push(s);
          const begin = s.begin.bind(s); s.begin = () => { s.__auditDots = []; return begin(); };
          const dot = s.dot.bind(s); s.dot = (x, y, style = {}) => { s.__auditDots.push({ x, y, r: style.r ?? 4 }); return dot(x, y, style); };
          return s;
        };`) });
    });
    try {
      for (const [slug, spec] of Object.entries(BRIDGE_PICTURES)) {
        await page.goto(`http://localhost:${server.address().port}/#/bridge/${slug}`);
        await page.locator('.bridge-picture .viz-readout').waitFor(); await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(100);
        await assertGlyphsFit(page, `${slug} ${theme} ${width} initial`);
        assert.equal(await page.locator('.journey > li').count() > 0, true);
        assert.equal(await page.locator('.bridge-picture-sources a').count(), spec.anchors.length);
        for (const id of spec.anchors) assert.equal(await page.locator(`.bridge-picture-sources a[href="#/t/${id}"]`).count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${slug} ${width} overflow`);
        assert.doesNotMatch(await page.locator('.bridge-picture .viz-readout').innerText(), /NaN|Infinity|undefined/);
        const shot = `/tmp/atlas-bridge-picture-${slug}-${theme}-${width}.png`;
        await page.locator('.bridge-picture').screenshot({ path: shot });
        const contexts = page.locator('.bridge-picture .ctl-select').first();
        const readouts = [];
        for (let i = 0; i < spec.contexts.length; i++) {
          await contexts.locator('button').nth(i).click(); await page.waitForTimeout(40);
          const readout = await page.locator('.bridge-picture .viz-readout').innerText(); assert.ok(readout.length > 70); assert.doesNotMatch(readout, /NaN|Infinity|undefined/); readouts.push(readout);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
          await assertGlyphsFit(page, `${slug} context ${i}`);
        }
        assert.equal(new Set(readouts).size, spec.contexts.length, `${slug}: each context has an explicit reading`);
        for (const control of await page.locator('.bridge-picture .ctl-slider input').all()) {
          for (const key of ['Home', 'End']) { await control.focus(); await page.keyboard.press(key); await page.waitForTimeout(40); assert.doesNotMatch(await page.locator('.bridge-picture .viz-readout').innerText(), /NaN|Infinity|undefined/); await assertGlyphsFit(page, `${slug} ${key}`); }
        }
        for (const group of (await page.locator('.bridge-picture .ctl-select').all()).slice(1)) for (const button of await group.locator('button').all()) { await button.click(); await page.waitForTimeout(40); }
        const canvases = await page.locator('.bridge-picture canvas').evaluateAll(list => list.map(c => { const bytes = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let ink = 0; for (let i = 3; i < bytes.length; i += 148) if (bytes[i]) ink++; return { width: c.width, height: c.height, ink }; }));
        assert.ok(canvases.length > 0 && canvases.every(c => c.width > 100 && c.height > 100 && c.ink > 5));
        await assertGlyphsFit(page, `${slug} final selectors`);
        const endpointShot = `/tmp/atlas-bridge-endpoints-${slug}-${theme}-${width}.png`;
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        await page.locator('.bridge-picture').screenshot({ path: endpointShot });
        assert.deepEqual(errors, []); assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []);
        evidence.push({ slug, theme, width, contexts: readouts.length, controls: await page.locator('.bridge-picture .ctl-slider').count(), canvases, screenshot: shot, endpointScreenshot: endpointShot, markerGlyphsContained: true });
        console.log(`PASS ${slug} ${theme} ${width}px: contexts, source links, native control endpoints, complete marker glyphs, nonblank plots, no overflow/errors`);
      }
    } finally { await page.close(); }
  }
  // A fresh page has no module-cache entry: hold the actual lazy module request,
  // navigate away while unresolved, then release it and verify its stale callback.
  const racePage = await browser.newPage(), raceErrors = [];
  racePage.on('pageerror', error => raceErrors.push(error.message));
  let release; const gate = new Promise(resolve => { release = resolve; });
  let requested; const request = new Promise(resolve => { requested = resolve; });
  try {
    await racePage.route('**/assets/js/bridge-viz.js', async route => { requested(); await gate; await route.continue(); });
    await racePage.goto(`http://localhost:${server.address().port}/#/bridge/action`);
    await request;
    assert.equal(await racePage.locator('.bridge-picture').count(), 0, 'bridge module is still pending');
    await racePage.locator('[data-nav="about"]').click();
    await racePage.locator('h1').filter({ hasText: 'About this atlas' }).waitFor();
    const response = racePage.waitForResponse(r => r.url().endsWith('/assets/js/bridge-viz.js'));
    release(); await response; await racePage.waitForTimeout(300);
    assert.equal(new URL(racePage.url()).hash, '#/about');
    assert.equal(await racePage.locator('h1').textContent(), 'About this atlas');
    assert.equal(await racePage.locator('.bridge-picture').count(), 0);
    assert.deepEqual(raceErrors, []); assert.deepEqual(await racePage.evaluate(() => window.__vizErrors || []), []);
    console.log('PASS delayed bridge module: navigate to About while response is held, release response, About persists');
  } finally { release(); await racePage.close(); }
  await writeFile('/tmp/atlas-bridge-pictures-native.json', JSON.stringify({ browser: browser.version(), evidence, delayedModuleNavigation: true }, null, 2));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
