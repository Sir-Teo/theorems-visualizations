import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const page = await browser.newPage({ viewport: { width: 1450, height: 1350 } }), errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch();
  const body = (await response.text()).replace('return item.viz(v);', 'const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});return item.viz(v);');
  await route.fulfill({ response, body });
});
const slide = async (i, end) => {
  await page.locator('input[type=range]').nth(i).focus(); await page.keyboard.press(end ? 'End' : 'Home');
  await page.waitForTimeout(25);
};
try {
  for (const theme of ['light', 'dark']) {
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/imaging/ch03-d.js&id=imaging-3.16&theme=${theme}&w=1380&still=1&wait=150`);
    await page.waitForFunction(() => window.__done);
    const initial = await page.evaluate(() => window.__done);
    assert.deepEqual(initial.errors, []); assert.deepEqual(initial.texErrors, []); assert.deepEqual(initial.blank, []);
    for (const mode of [0, 1]) {
      await page.locator('.ctl-select').first().locator('button').nth(mode).click();
      for (let mask = 0; mask < 8; mask++) {
        for (let j = 0; j < 3; j++) await slide(j, !!(mask & 1 << j));
        const before = await page.locator('canvas').nth(2).evaluate(c => c.toDataURL());
        await slide(3, false); await slide(3, true);
        const sample = await page.evaluate(() => ({ r: window.__R, e: window.__vizErrors || [], tex: document.querySelectorAll('.katex-error').length }));
        assert.deepEqual(sample.e, []); assert.equal(sample.tex, 0);
        assert.doesNotMatch(sample.r, /NaN|Infinity|undefined/);
        assert.match(sample.r, /not PSF FWHM/); assert.match(sample.r, /no hole filling/);
        assert.match(sample.r, /probe only moves the gold geometry/);
        assert.equal(await page.locator('canvas').nth(2).evaluate(c => c.toDataURL()), before, 'moving the probe cannot acquire data or change reconstruction');
        if (mode === 0) assert.match(sample.r, /no wave propagation or Rytov-log data/);
        else assert.match(sample.r, /same finite cutoff/);
      }
    }
    await page.screenshot({ path: `/tmp/atlas-imaging-diffraction-${theme}.png`, fullPage: true });
    console.log(`PASS diffraction ${theme}: both geometries × eight actual frequency/count/span corners, probe invariance, finite output and explicit acquisition scope`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); await new Promise(r => server.close(r)); }
