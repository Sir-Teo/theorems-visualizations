import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser, installBrowserAssets} from '../scripts/browser.mjs';

const server = createServer({verificationAssets: true});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath: findBrowser(), headless: true});
mkdirSync('/tmp/sig-fir-review', {recursive: true});
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({viewport: {width: 1100, height: 1400}});
    await installBrowserAssets(page.context());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/sig/ch03-b.js&id=sig-3.12&theme=${theme}&still=1`);
    await page.waitForFunction(() => window.__done);
    assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
    const ranges = page.locator('#viz input[type=range]'), readout = page.locator('#viz .viz-readout');
    await ranges.nth(0).press('End'); // M=10, even
    await ranges.nth(1).press('Home');
    for (let i = 0; i < 10; i++) await ranges.nth(1).press('ArrowRight'); // a=-1
    await ranges.nth(2).press('End'); // L=30, keeps the finite response
    await page.waitForFunction(() => document.querySelector('.viz-readout')?.textContent.includes('FIR despite feedback'));
    assert.match(await readout.innerText(), /cancel the pole/);
    assert.match(await readout.innerText(), /Stable/);
    await page.locator('#shot').screenshot({path: `/tmp/sig-fir-review/cancelled-${theme}.png`});
    await ranges.nth(0).press('Home'); // M=1, no cancellation
    await page.waitForFunction(() => document.querySelector('.viz-readout')?.textContent.includes('Unstable'));
    assert.match(await readout.innerText(), /infinite tail diverge/);
    await page.locator('#viz .ctl-toggle label').click();
    assert.equal(await page.locator('#viz .ctl-toggle input').isChecked(), false);
    await page.waitForFunction(() => document.querySelector('.viz-readout')?.textContent.includes('feedback coefficient zero'));
    assert.match(await readout.innerText(), /Stable/);
    await page.locator('#viz .ctl-toggle label').click();
    assert.equal(await page.locator('#viz .ctl-toggle input').isChecked(), true);
    await ranges.nth(1).press('End'); // a=1.1, no cancellation
    await page.waitForFunction(() => document.querySelector('.viz-readout')?.textContent.includes('clipped at the panel limits'));
    assert.match(await readout.innerText(), /Unstable/);
    assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Native keyboard/toggle checks distinguish cancelled FIR, uncancelled IIR, zero feedback and clipped unstable output in both themes.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
