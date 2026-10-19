import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser, installBrowserAssets} from '../scripts/browser.mjs';

const server = createServer({verificationAssets: true});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath: findBrowser(), headless: true});
mkdirSync('/tmp/gauss-density-review', {recursive: true});
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({viewport: {width: 1100, height: 1400}});
    await installBrowserAssets(page.context());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/em/ch01-b.js&id=em-1.15&theme=${theme}&still=1`);
    await page.waitForFunction(() => window.__done);
    const readout = page.locator('.viz-readout');
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    for (const endpoint of ['Home', 'End']) {
      await page.locator('#viz input[type=range]').press(endpoint);
      await settle();
      assert.doesNotMatch(await readout.innerText(), /NaN|Infinity|undefined/);
    }
    await page.locator('#viz').getByRole('button', {name: 'clear', exact: true}).click();
    await settle();
    assert.match(await readout.innerText(), /sampled map: zero/);
    // The zero-error display floor must be inside the plot, not clipped below it.
    const floor = await page.evaluate(() => {
      const s = window.__vizStages[2];
      return {pixel: s.Y(1e-12), height: s.H};
    });
    assert.ok(floor.pixel >= 0 && floor.pixel <= floor.height, JSON.stringify(floor));
    await page.locator('#shot').screenshot({path: `/tmp/gauss-density-review/cleared-${theme}.png`});
    await page.locator('#viz').getByRole('group', {name: 'brush', exact: true}).getByRole('button').nth(1).click();
    await page.locator('#viz canvas').first().scrollIntoViewIfNeeded();
    const box = await page.locator('#viz canvas').first().boundingBox();
    await page.mouse.move(box.x + box.width * .4, box.y + box.height * .5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .6, box.y + box.height * .5, {steps: 5});
    await page.mouse.up();
    await settle();
    assert.doesNotMatch(await readout.innerText(), /sampled map: zero/);
    await page.locator('#viz').getByRole('button', {name: 'reset', exact: true}).click();
    await settle();
    assert.doesNotMatch(await readout.innerText(), /NaN|Infinity|undefined/);
    await page.locator('#shot').screenshot({path: `/tmp/gauss-density-review/reset-${theme}.png`});
    assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
    assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Gauss box endpoints, empty-map zero/floor, native negative painting and reset pass in both themes.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
