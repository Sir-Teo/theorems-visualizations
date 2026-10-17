// Browser regressions for responsive layouts, navigation races, and input methods.
// Requires generated data and the same Chromium used by scripts/smoke.mjs.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

let browser, server, base;
before(async () => {
  server = createServer(); await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
});
after(async () => { await browser?.close(); await new Promise((resolve) => server?.close(resolve)); });
async function pageTest(fn, options = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce', ...options });
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  try { await fn(page); assert.deepEqual(errors, [], 'browser runtime errors'); }
  finally { await page.close(); }
}
async function open(page, route) {
  await page.goto(base + route);
  await page.waitForFunction(() => document.querySelector('#app').children.length && !document.querySelector('#app > .loading'));
}

// The original failure needs an unfinished request, not a timing-dependent rapid click.
test('a pending page cannot replace a newer navigation', async () => {
  for (const [resource, destination] of [['planned.json', '#/map'], ['col/pma.json', '#/c/pma']]) {
    await pageTest(async (page) => {
      let release; const gate = new Promise((resolve) => { release = resolve; });
      let requested; const request = new Promise((resolve) => { requested = resolve; });
      await page.route(`**/data/${resource}`, async (route) => { requested(); await gate; await route.continue(); });
      await open(page, '#/');
      await page.evaluate((hash) => { location.hash = hash; }, destination);
      await request;
      await page.locator('[data-nav="about"]').click();
      await page.locator('h1').filter({ hasText: 'About this atlas' }).waitFor();
      const response = page.waitForResponse((r) => r.url().endsWith(`/data/${resource}`));
      release(); await response; await page.waitForTimeout(300);
      assert.equal(new URL(page.url()).hash, '#/about');
      assert.equal(await page.locator('h1').textContent(), 'About this atlas');
      assert.equal(await page.locator('#app').evaluate((el) => el === document.activeElement), true);
    });
  }
});

test('pending map and paper queries stop when leaving their pages', async () => {
  for (const [route, selector] of [['#/map', '.map-q input'], ['#/papers', '.papers-q input']]) {
    await pageTest(async (page) => {
      await open(page, route); await page.locator(selector).waitFor();
      await page.evaluate((selector) => {
        const input = document.querySelector(selector); input.value = 'entropy'; input.dispatchEvent(new Event('input', { bubbles: true }));
        location.hash = '#/about';
      }, selector);
      await page.locator('h1').filter({ hasText: 'About this atlas' }).waitFor();
      await page.waitForTimeout(350);
      assert.equal(new URL(page.url()).hash, '#/about');
    });
  }
});

test('small screens contain tables, formulas, readouts, and long toggles', async () => {
  await pageTest(async (page) => {
    const routes = ['#/status', '#/t/num-1.1', '#/t/astro-1.1', '#/t/aero-1.1', '#/path/fa-12.23', '#/bridge/fourier'];
    for (const route of routes) {
      await open(page, route);
      if (route.startsWith('#/t/')) await page.locator('.viz-controls').waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, route);
    }
    await open(page, '#/search?q=zzzzunfindable');
    assert.equal(await page.locator('.facet-panel').isVisible(), false);
    assert.equal(await page.locator('.empty-note').isVisible(), true);
  }, { viewport: { width: 320, height: 900 } });
});

test('treemap fields and chapters can be opened with the keyboard', async () => {
  await pageTest(async (page) => {
    await open(page, '#/');
    await page.locator('.tm-field-control[aria-label="Zoom into Mathematics"]').focus();
    await page.keyboard.press('Space');
    await page.locator('#tm-crumbs').filter({ hasText: 'Mathematics' }).waitFor();
    const chapter = page.locator('.tm-col[aria-label^="Principles of Mathematical Analysis:"] .tm-ch').first();
    await chapter.focus(); await page.keyboard.press('Enter');
    await page.waitForURL((url) => /^#\/c\/pma\/\d+$/.test(url.hash));
    await page.locator('.ch-graph-card').waitFor();
  });
});

test('map and timeline expose zoom controls and keyboard zoom', async () => {
  for (const route of ['#/map', '#/timeline']) await pageTest(async (page) => {
    await open(page, route); const canvas = page.locator('#app canvas'); await canvas.waitFor();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const before = await canvas.evaluate((el) => el.toDataURL());
    await page.locator('.canvas-tools [aria-label="Zoom in"]').click();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const afterClick = await canvas.evaluate((el) => el.toDataURL());
    assert.ok(afterClick !== before, `${route}: zoom button`);
    await canvas.focus(); await page.keyboard.press('+');
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.ok(await canvas.evaluate((el) => el.toDataURL()) !== afterClick, `${route}: keyboard zoom`);
    await page.keyboard.press('0');
  }, { viewport: { width: 390, height: 844 } });
});

test('a timeline touch tap opens a point without a preceding hover', async () => {
  await pageTest(async (page) => {
    await open(page, '#/');
    const point = await page.evaluate(async () => {
      const { TimelineView } = await import('./assets/js/graph.js');
      const host = document.createElement('div'); host.style.height = '360px'; document.querySelector('#app').replaceChildren(host);
      const item = { id: 'pma-1.1', col: 'pma', num: '1.1', kind: 'Theorem', name: 'Example', yr: 1900, desc: 0 };
      const G = { fields: [{ id: 'math', short: 'Math' }], items: [item], colById: new Map([['pma', { field: 'math', short: 'PMA' }]]) };
      const view = new TimelineView(host, G, { onOpen: (id) => { host.dataset.opened = id; } });
      const p = view.lanes[0].pts[0], r = view.canvas.getBoundingClientRect();
      return { x: r.x + p.x, y: r.y + p.y };
    });
    await page.touchscreen.tap(point.x, point.y);
    assert.equal(await page.locator('#app > div').getAttribute('data-opened'), 'pma-1.1');
  }, { viewport: { width: 390, height: 844 }, hasTouch: true });
});
