import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser, installBrowserAssets} from '../scripts/browser.mjs';

const server = createServer({verificationAssets: true});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath: findBrowser(), headless: true});
mkdirSync('/tmp/pl-candidates-review', {recursive: true});
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({viewport: {width: 1000, height: 1200}});
    await installBrowserAssets(page.context());
    await page.addInitScript(() => {
      window.drawnText = [];
      const original = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(text, ...args) {
        window.drawnText.push(String(text));
        return original.call(this, text, ...args);
      };
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/pl/ch04-b.js&id=pl-4.8&theme=${theme}&still=1`);
    await page.waitForFunction(() => window.__done);
    const drawn = () => page.evaluate(() => window.drawnText.join('\n'));
    const reset = () => page.evaluate(() => { window.drawnText = []; });
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // The higher-order default must actually appear with a check, not just in the readout.
    assert.match(await drawn(), /\(Nat → Nat\) → Nat → Nat ✓/);
    assert.match(await drawn(), /1 candidate passes/);
    await page.locator('#shot').screenshot({path: `/tmp/pl-candidates-review/higher-order-${theme}.png`});
    await reset();
    await page.locator('#viz').getByRole('button', {name: 'mismatch', exact: true}).click();
    await settle();
    assert.doesNotMatch(await drawn(), /✓/);
    assert.match(await drawn(), /0 candidates pass/);
    assert.match(await page.locator('.viz-readout').innerText(), /rejects/);
    await page.locator('#viz').getByRole('button', {name: 'identity', exact: true}).click();
    await reset();
    await page.locator('#viz').getByRole('button', {name: 'erased', exact: true}).click();
    await settle();
    assert.match(await drawn(), /infinitely many instances/);
    await reset();
    await page.locator('#viz input[type=text]').fill('3');
    await page.waitForFunction(() => window.drawnText.some(text => text.includes('principal type is ground: only one type')));
    assert.match(await drawn(), /principal type is ground: only one type/);
    assert.doesNotMatch(await drawn(), /infinitely many/);
    await page.locator('#shot').screenshot({path: `/tmp/pl-candidates-review/ground-${theme}.png`});
    await reset();
    await page.locator('#viz').getByRole('button', {name: 'kept', exact: true}).click();
    await settle();
    assert.match(await drawn(), /Nat ✓/);
    assert.match(await drawn(), /1 candidate passes/);
    assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
    assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Higher-order, ill-typed, polymorphic and ground candidate cases pass in both themes.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
