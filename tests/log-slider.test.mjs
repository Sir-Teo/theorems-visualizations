import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

test('native logarithmic slider keyboard and pointer endpoints reach exact configured bounds', async () => {
  const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
  const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const ranges = [[.005, 5000, 2], [.01, 20000, 3], [1e-9, 7, 3], [.3, Math.PI, 3], [1.23456, 1.23459, 2], [1e-12, 1e18, 3]];
  try {
    await page.route('**/log-slider-fixture.html', route => route.fulfill({ contentType: 'text/html', body: '<link rel="stylesheet" href="/assets/css/style.css"><div id="viz"></div>' }));
    await page.goto(`http://localhost:${server.address().port}/log-slider-fixture.html`);
    await page.evaluate(async ranges => {
      const { mount } = await import('/assets/js/viz/core.js');
      window.controls = []; window.changed = [];
      window.dispose = mount(document.querySelector('#viz'), v => {
        for (const [i, [min, max, sig]] of ranges.entries()) window.controls.push(v.slider(`range${i}`, min, max, Math.sqrt(min * max), { log: true, sig, onChange: x => { window.changed[i] = x; } }));
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false }); v.render(() => s.line(0, 0, 1, 1));
      });
    }, ranges);
    for (let i = 0; i < ranges.length; i++) {
      const [min, max] = ranges[i], input = page.locator('.ctl-slider input').nth(i);
      const value = () => page.evaluate(i => window.controls[i].value, i);
      await input.press('End'); assert.equal(await value(), max, `End range${i}`);
      assert.equal(await page.evaluate(i => window.changed[i], i), max);
      await input.press('Home'); assert.equal(await value(), min, `Home range${i}`);
      assert.equal(await page.evaluate(i => window.changed[i], i), min);
      const box = await input.boundingBox();
      await input.click({ position: { x: box.width - 1, y: box.height / 2 } }); assert.equal(await value(), max, `pointer max range${i}`);
      await input.click({ position: { x: 1, y: box.height / 2 } }); assert.equal(await value(), min, `pointer min range${i}`);
      for (let j = 0; j < 12; j++) { await input.press('ArrowRight'); const x = await value(); assert.ok(x >= min && x <= max); }
    }
    // The runtime retains author precision independently of thumb step sanitization.
    await page.evaluate(() => window.controls[3].set(Math.SQRT2));
    assert.equal(await page.evaluate(() => window.controls[3].value), Math.SQRT2);
    assert.equal(await page.evaluate(() => window.dispose.snapshot().parts.find(([key]) => key.startsWith('slider:range3:'))[1]), Math.SQRT2);
    assert.deepEqual(errors, []);
  } finally { await page.close(); await browser.close(); server.close(); }
});
