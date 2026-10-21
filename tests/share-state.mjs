import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { decodeState, encodeState } from '../assets/js/share-state.js';

let server, browser, base;
before(async () => {
  server = createServer(); await new Promise(resolve => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
});
after(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)); });
async function settle(page) { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(180); }
async function share(page) {
  if (!await page.locator('.viz-share').evaluate(el => el.open)) await page.locator('.viz-share summary').click();
  await page.locator('.share-create').click();
  const url = await page.locator('.share-url').inputValue(); assert.ok(url, await page.locator('.share-status').innerText());
  return { url, embed: await page.locator('.share-preview').getAttribute('href'), code: await page.locator('.share-embed').inputValue() };
}
const tokenOf = url => new URLSearchParams(new URL(url).hash.split('?')[1]).get('s');

test('real Newton visualization restores native control, 2D handle, numerical readout and paused canvas in both themes, including a real iframe', async () => {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce' }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(base + '#/t/mech-1.6'); await page.locator('.viz-controls').waitFor(); await settle(page);
      await page.locator('.ctl-select button').nth(1).click();
      await page.locator('.ctl-slider input').focus(); await page.keyboard.press('End'); await settle(page);
      const canvas = page.locator('#viz canvas').first();
      const b = await canvas.boundingBox(), scale = Math.min(b.width / 6.4, b.height / 4.2);
      await page.mouse.move(b.x + b.width / 2 + .4 * scale, b.y + b.height / 2 - .2 * scale);
      await page.mouse.down(); await page.mouse.move(b.x + b.width / 2 + 1.3 * scale, b.y + b.height / 2 + .7 * scale, { steps: 10 }); await page.mouse.up();
      await page.mouse.move(10, 10); // transient hover glow is deliberately not part of a shared state
      await settle(page);
      const before = { readout: await page.locator('.viz-readout').innerText(), canvas: await canvas.evaluate(c => c.toDataURL()) };
      const saved = await share(page), data = decodeState(tokenOf(saved.url));
      await page.locator('.viz-share').screenshot({ path: `/tmp/atlas-share-panel-${theme}.png` });
      assert.equal(data.item, 'mech-1.6');
      assert.equal(data.parts.find(([k]) => k.startsWith('slider:'))[1], 4);
      const anchor = data.parts.filter(([k]) => k.startsWith('handle:'))[1][1];
      assert.ok(Math.abs(anchor[0] - 1.3) < .03 && Math.abs(anchor[1] + .7) < .03, JSON.stringify(anchor));
      await page.goto(saved.url); await page.locator('.viz-controls').waitFor(); await settle(page);
      assert.equal(await page.locator('.viz-readout').innerText(), before.readout);
      assert.ok(await page.locator('#viz canvas').first().evaluate(c => c.toDataURL()) === before.canvas, 'restored mathematical canvas matches exactly');
      assert.equal(await page.locator('[aria-label="Play animation"]').count(), 1);
      await page.screenshot({ path: `/tmp/atlas-share-state-${theme}.png`, fullPage: true });
      await page.goto(saved.embed); await page.locator('.viz-controls').waitFor(); await settle(page);
      assert.equal(await page.locator('.site-header').isVisible(), false);
      assert.equal(await page.locator('.side-grid').isVisible(), false);
      assert.equal(await page.locator('.embed-attribution').isVisible(), true);
      assert.equal(await page.locator('.embed-attribution').getAttribute('href'), saved.url);
      assert.equal(await page.locator('.viz-readout').innerText(), before.readout);
      await page.screenshot({ path: `/tmp/atlas-share-embed-${theme}.png`, fullPage: true });
      const host = await browser.newPage({ viewport: { width: 760, height: 800 }, colorScheme: theme, reducedMotion: 'reduce' });
      try {
        await host.setContent(saved.code);
        const frame = host.frameLocator('iframe'); await frame.locator('.viz-controls').waitFor();
        assert.equal(await frame.locator('.site-header').isVisible(), false);
        assert.equal(await frame.locator('.ctl-slider input').inputValue(), '4');
        assert.match(await frame.locator('.viz-readout').innerText(), /4\.00/);
        assert.equal(await frame.locator('html').evaluate(el => el.scrollWidth > innerWidth), false);
      } finally { await host.close(); }
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  }
});

test('runtime callbacks, constraints, custom graph adapter, proof step, animation time and 3D camera survive a native round trip', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' }), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.route('**/share-fixture.html', route => route.fulfill({ contentType: 'text/html', body: '<link rel="stylesheet" href="assets/css/style.css"><div id="viz" style="width:1100px;padding:20px"></div>' }));
    await page.goto(base + 'share-fixture.html');
    await page.evaluate(async () => {
      const { mount } = await import('/assets/js/viz/core.js');
      const { encodeState, decodeState } = await import('/assets/js/share-state.js');
      window.makeFixture = state => {
        window.fixture?.destroy();
        const fixture = {}; window.fixture = fixture;
        fixture.destroy = mount(document.getElementById('viz'), v => {
          const model = { scale: 2, bold: false, offset: 0, formula: 3, angle: 0, handleX: 1, step: 0 }; fixture.model = model;
          fixture.v = v;
          v.slider('scale', 1, 9, 2, { int: true, onChange: x => { model.scale = x; v.restart(); } });
          fixture.exact = v.slider('exact value', .01, 10, Math.PI, { step: .1 });
          v.toggle('bold', false, { onChange: x => { model.bold = x; } });
          v.select('offset', ['zero', 'five'], 'zero', { onChange: x => { model.offset = x === 'five' ? 5 : 0; } });
          v.input('formula', 'x+1', { vars: ['x'], onChange: (src, fn) => { model.formula = fn(2); } });
          const s = v.stage({ x: [-3, 3], y: [-2, 2], height: 300, axes: false }); fixture.s = s;
          const h = s.handle(1, 0, { constrain: (x, y) => { model.angle = Math.atan2(y, x); return [x, y]; }, onDrag: p => { model.handleX = p.x; } }); fixture.h = h;
          const g = v.graph(s, { nodes: [{ id: 'a', x: -2, y: 1 }, { id: 'b', x: -1, y: 1 }], edges: [], layout: 'none' }); fixture.g = g;
          v.button('Add custom edge', () => g.addEdge('a', 'b'));
          v.shareState('edited graph', { get: () => ({ nodes: g.nodes.map(({ id, x, y }) => ({ id, x, y })), edges: g.edges.map(({ from, to }) => ({ from, to })) }),
            validate: x => Array.isArray(x.nodes) && Array.isArray(x.edges), set: x => g.set({ ...x, layout: 'none' }) });
          const camera = v.stage3d({ height: 300 }); fixture.camera = camera;
          const steps = v.steps({ frames: [{ note: 'one' }, { note: 'two' }, { note: 'three' }], onChange: (f, i) => { model.step = i; } }); fixture.steps = steps;
          v.animate(t => { g.draw(); s.dot(h.x, h.y, { r: model.scale }); camera.line([0, 0, 0], [1, 1, 1]); }, { autoplay: false, period: 10 });
          v.readout(() => JSON.stringify({ ...model, edges: g.edges.length, step: steps.i, time: v.t, camera: [camera.yaw, camera.pitch, camera.zoom] }));
        }, { state });
      };
      window.roundTrip = () => { const saved = encodeState(window.fixture.destroy.snapshot()); window.makeFixture(decodeState(saved)); return saved; };
      window.makeFixture();
    });
    await page.locator('.viz-controls').waitFor(); await settle(page);
    await page.locator('.ctl-slider input').first().focus(); await page.keyboard.press('End');
    await page.locator('.ctl-toggle .switch-track').click(); await page.locator('.ctl-select button').nth(1).click();
    await page.locator('.ctl-input input').fill('x^2+1'); await page.waitForTimeout(250);
    const drag = await page.evaluate(() => { const { s, h } = window.fixture, b = s.canvas.getBoundingClientRect(); return [[b.x + s.X(h.x), b.y + s.Y(h.y)], [b.x + s.X(1.7), b.y + s.Y(-.8)]]; });
    await page.mouse.move(...drag[0]); await page.mouse.down(); await page.mouse.move(...drag[1], { steps: 10 }); await page.mouse.up();
    await page.getByRole('button', { name: 'Add custom edge', exact: true }).click();
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    const camera = await page.locator('.stage-3d canvas').boundingBox();
    await page.mouse.move(camera.x + 100, camera.y + 100); await page.mouse.down(); await page.mouse.move(camera.x + 160, camera.y + 135, { steps: 8 }); await page.mouse.up();
    await page.getByRole('button', { name: 'Play animation', exact: true }).click(); await page.waitForTimeout(160);
    await page.getByRole('button', { name: 'Pause animation', exact: true }).click(); await settle(page);
    const before = JSON.parse(await page.locator('.viz-readout').innerText());
    assert.equal(await page.evaluate(() => window.fixture.exact.value), Math.PI);
    assert.notEqual(await page.locator('.ctl-slider input').nth(1).inputValue(), String(Math.PI));
    assert.equal(before.scale, 9); assert.equal(before.bold, true); assert.equal(before.offset, 5); assert.equal(before.formula, 5);
    assert.ok(Math.abs(before.angle - Math.atan2(-.8, 1.7)) < .01); assert.ok(Math.abs(before.handleX - 1.7) < .02);
    assert.equal(before.edges, 1); assert.equal(before.step, 1); assert.ok(before.time > .05);
    assert.ok(Math.abs(before.camera[0] + .65) > .4);
    await page.evaluate(() => window.roundTrip()); await settle(page);
    const restored = JSON.parse(await page.locator('.viz-readout').innerText());
    assert.deepEqual(restored, before);
    assert.equal(await page.evaluate(() => window.fixture.exact.value), Math.PI, 'the runtime double survives even though the DOM thumb is snapped to its step grid');
    assert.equal(await page.getByRole('button', { name: 'Play animation', exact: true }).count(), 1);
    assert.deepEqual(errors, []); await page.screenshot({ path: '/tmp/atlas-share-adapter-camera.png', fullPage: true });
    await page.evaluate(() => {
      const state = window.fixture.destroy.snapshot();
      state.parts.find(([k]) => k.startsWith('steps:'))[1][1]++;
      window.makeFixture(state);
    });
    await settle(page);
    assert.match(await page.locator('.viz-state-notice').innerText(), /saved proof steps no longer match/);
    const fresh = JSON.parse(await page.locator('.viz-readout').innerText());
    assert.deepEqual(fresh, { scale: 2, bold: false, offset: 0, formula: 3, angle: 0, handleX: 1, step: 0, edges: 0, time: 0, camera: [-.65, .42, 1] }, 'late step inventory rejection remounts all defaults, including previously replayed controls, handles, graph, camera and clock');
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('malformed, future, oversized, wrong-item and changed-component links leave a usable item and report the problem', async () => {
  const page = await browser.newPage({ reducedMotion: 'reduce' }), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    for (const token of ['bad!', 'a'.repeat(24001), btoa('{"v":2,"parts":[]}'), encodeState({ v: 1, parts: [], item: 'other-1.1' }), encodeState({ v: 1, parts: [], item: 'mech-1.6' })]) {
      await page.goto(base + '#/t/mech-1.6?s=' + token); await page.locator('.viz-controls').waitFor();
      assert.match(await page.locator('.share-status').innerText(), /Saved state could not/);
      assert.equal(await page.locator('.ctl-slider input').inputValue(), '1.5');
      assert.equal(await page.locator('#viz canvas').count(), 1);
    }
    const saved = await share(page), state = decodeState(tokenOf(saved.url));
    for (const kind of ['slider:', 'select:']) {
      const bad = structuredClone(state);
      bad.parts.find(([k]) => k.startsWith(kind))[1] = kind === 'slider:' ? -5 : [0, ['changed options']];
      await page.goto(base + '#/t/mech-1.6?s=' + encodeState(bad)); await page.locator('.viz-controls').waitFor();
      assert.match(await page.locator('.share-status').innerText(), /invalid visualization value/);
      assert.equal(await page.locator('.ctl-slider input').inputValue(), '1.5');
    }
    await page.goto(base + '?embed=1#/t/mech-1.6?s=bad!'); await page.locator('.viz-controls').waitFor();
    assert.equal(await page.locator('.viz-state-notice').isVisible(), true, 'embedded fallback is visibly explained');
    assert.match(await page.locator('.viz-state-notice').innerText(), /could not be read/);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('share fields and embedded controls stay within a narrow course-page viewport', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 900 }, reducedMotion: 'reduce' });
  try {
    await page.goto(base + '#/t/mech-1.6'); await page.locator('.viz-controls').waitFor();
    const saved = await share(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    await page.goto(saved.embed); await page.locator('.viz-controls').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    await page.screenshot({ path: '/tmp/atlas-share-embed-mobile.png', fullPage: true });
  } finally { await page.close(); }
});
