import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser, installBrowserAssets} from '../scripts/browser.mjs';
const server = createServer({verificationAssets: true});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath: findBrowser(), headless: true});
mkdirSync('/tmp/xtal-rational-review', {recursive: true});
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({viewport: {width: 1100, height: 1200}});
    await installBrowserAssets(page.context());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/xtal/ch01.js&id=xtal-1.4&theme=${theme}&still=1`);
    await page.waitForFunction(() => window.__done);
    assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
    const readout = page.locator('.viz-readout'), ratio = page.locator('#viz input[type=range]');
    for (const endpoint of ['Home', 'End']) {
      await ratio.press(endpoint);
      for (const name of ['golden 1/φ', '2/3', '√2 − 1', '1/3']) {
        await page.locator('#viz').getByRole('button', {name, exact: true}).click();
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.doesNotMatch(await readout.innerText(), /NaN|Infinity|undefined/);
        if (name === '2/3') assert.match(await readout.innerText(), /0\.6667/);
      }
    }
    await page.locator('#viz').getByRole('button', {name: '2/3', exact: true}).click();
    await page.waitForFunction(() => document.querySelector('.viz-readout')?.textContent.includes('0.6667'));
    assert.match(await readout.innerText(), /1, 2 bricks/);
    await page.locator('#shot').screenshot({path: `/tmp/xtal-rational-review/two-thirds-${theme}.png`});
    await page.locator('#viz canvas').first().scrollIntoViewIfNeeded();
    const point = await page.evaluate(() => {
      const stage = window.__vizStages[0], handle = stage.handles[0], box = stage.canvas.getBoundingClientRect();
      return {x: box.left + stage.X(handle.x), y: box.top + stage.Y(handle.y)};
    });
    const before = await readout.innerText();
    await page.mouse.move(point.x, point.y); await page.mouse.down();
    await page.mouse.move(point.x - 35, point.y + 20, {steps: 6}); await page.mouse.up();
    await page.waitForFunction(previous => document.querySelector('.viz-readout')?.innerText !== previous, before);
    assert.match(await readout.innerText(), /do not certify rationality/);
    assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('All rational/irrational presets, aspect-ratio endpoints and native cut-handle drag pass in both themes.');
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
