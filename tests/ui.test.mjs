// Browser regressions for responsive layouts, navigation races, and input methods.
// Requires generated data and the same Chromium used by scripts/smoke.mjs.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

let browser, server, base;
before(async () => {
  server = createServer(); await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
});
after(async () => { await browser?.close(); await new Promise((resolve) => server?.close(resolve)); });
async function pageTest(fn, options = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce', ...options });
  await installBrowserAssets(page.context());
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  try { await fn(page); assert.deepEqual(errors, [], 'browser runtime errors'); }
  finally { await page.close(); }
}
async function open(page, route) {
  await page.goto(base + route);
  await page.waitForFunction(() => document.querySelector('#app')?.dataset.route === (location.hash || '#/'));
}

test('home keeps its paper timeline without background detail downloads', async () => {
  await pageTest(async page => {
    const jsonRequests = [];
    page.on('request', request => { if (/\/data\/.*\.json(?:\?|$)/.test(request.url())) jsonRequests.push(new URL(request.url()).pathname); });
    await open(page, '#/');
    await page.locator('#home-ptl canvas').waitFor();
    await page.waitForTimeout(1600);
    assert.deepEqual(jsonRequests, ['/data/index.json']);
    assert.ok(await page.locator('#home-papers .paper-row').count() > 0);
    const details = page.waitForResponse(response => response.url().endsWith('/data/col/pma.json'));
    await page.locator('#search').focus();
    await details;
  });
});

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
    await page.locator('.search-page').waitFor();
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

test('map panning preserves pixels and picking, and filters and theme invalidate the raster', async () => {
  await pageTest(async page => {
    await open(page, '#/about');
    const result = await page.evaluate(async () => {
      const { MapView } = await import('/assets/js/graph.js');
      await document.fonts.ready;
      const host = document.createElement('div'); host.style.height = '600px'; document.querySelector('#app').replaceChildren(host);
      const a = { id: 'pma-1.1', col: 'pma', num: '1.1', kind: 'Definition', name: 'First', deps: [], x: 0, y: 0 };
      const b = { id: 'pma-1.2', col: 'pma', num: '1.2', kind: 'Theorem', name: 'Second', deps: [a.id], x: 400, y: 0 };
      const p = { id: 'pma-1.3', col: 'pma', num: '1.3', kind: 'Theorem', name: 'Planned', deps: [b.id], planned: true, x: 0, y: 400 };
      const G = { items: [a,b], planned: [p], collections: [{ id: 'pma', field: 'math', chapters: [] }], fields: [{ id: 'math', short: 'Math' }],
        byId: new Map([a,b,p].map(it => [it.id,it])), allChildren: new Map([[a.id,[b.id]], [b.id,[p.id]]]), map: { fields: [], rows: [] } };
      const map = new MapView(host,G);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      map._draw(); const cache = map.panCache, width = map.canvas.width, height = map.canvas.height;
      const before = map.ctx.getImageData(0,0,width,height).data;
      map.tx += 20; map.ty += 12; map._draw();
      const after = map.ctx.getImageData(0,0,width,height).data;
      let differences = 0;
      for (let y=30; y<height-30; y++) for (let x=30; x<width-30; x++) for (let c=0;c<4;c++)
        if (after[(y*width+x)*4+c] !== before[((y-12)*width+x-20)*4+c]) differences++;
      const reused = map.panCache === cache;
      const node = map.byId.get(b.id), picked = map.hit(map.sx(node.x),map.sy(node.y))?.it.id;
      map.show.defs = false; map._draw(); const filtered = map.panCache !== cache;
      const filterPixels = map.canvas.toDataURL();
      map.show.defs = true; map._draw(); const restored = map.canvas.toDataURL() !== filterPixels;
      const themeCache = map.panCache; map.onTheme(); map._draw(); const themeInvalidated = map.panCache !== themeCache;
      map.tx += 500; const old = map.panCache; map._draw(); const extended = map.panCache !== old;
      map.destroy();
      return { differences, reused, picked, filtered, restored, themeInvalidated, extended };
    });
    assert.deepEqual(result, { differences: 0, reused: true, picked: 'pma-1.2', filtered: true, restored: true, themeInvalidated: true, extended: true });
  });
});

test('native map dragging keeps all nodes and restores details after movement', async () => {
  await pageTest(async page => {
    await open(page, '#/about');
    await page.evaluate(async () => {
      const {MapView}=await import('/assets/js/graph.js');
      const draw=MapView.prototype._draw,paint=MapView.prototype._paint,pan=MapView.prototype.panTo;
      MapView.prototype._draw=function(){window.__testMap=this;return draw.call(this)};
      MapView.prototype._paint=function(){if(!this.interacting)this.__fullPaints=(this.__fullPaints||0)+1;return paint.call(this)};
      MapView.prototype.panTo=function(...args){const value=pan.apply(this,args);this.__movedWithAllNodes=this.interacting&&this.nodes.length>13000;return value};
      location.hash='#/map';
    });
    await page.waitForFunction(()=>window.__testMap?.panCache);
    const before=await page.evaluate(()=>({tx:__testMap.tx,ty:__testMap.ty,paints:__testMap.__fullPaints||0,nodes:__testMap.nodes.length}));
    const r=await page.locator('.map-page canvas').boundingBox();
    const x=r.x+r.width*.6,y=r.y+r.height*.55;
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+80,y+30,{steps:6});await page.mouse.up();
    await page.waitForFunction(paints=>!window.__testMap.interacting&&window.__testMap.__fullPaints>paints,before.paints);
    const after=await page.evaluate(()=>({tx:__testMap.tx,ty:__testMap.ty,paints:__testMap.__fullPaints||0,nodes:__testMap.nodes.length,moved:__testMap.__movedWithAllNodes}));
    assert.ok(after.moved,'native pointer events enter progressive movement rendering');
    assert.equal(after.nodes,before.nodes);assert.ok(Math.abs(after.tx-before.tx-80)<1);assert.ok(Math.abs(after.ty-before.ty-30)<1);
    assert.ok(after.paints>before.paints,'full link/text details are repainted after input settles');
  });
});
