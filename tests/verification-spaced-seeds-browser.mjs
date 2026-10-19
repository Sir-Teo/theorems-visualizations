import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser, installBrowserAssets} from '../scripts/browser.mjs';

const server = createServer({verificationAssets: true});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath: findBrowser(), headless: true});
mkdirSync('/tmp/spaced-seeds-review', {recursive: true});
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({viewport: {width: 1000, height: 1400}});
    await installBrowserAssets(page.context());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/bioinf/ch03-b.js&id=bioinf-3.8&theme=${theme}&still=1`);
    await page.waitForFunction(() => window.__done);
    const readout = page.locator('.viz-readout');
    assert.match(await readout.innerText(), /exact expected hit counts 1\.068 against 0\.929/);
    await page.locator('#shot').screenshot({path: `/tmp/spaced-seeds-review/default-${theme}.png`});
    const pattern = async () => (await readout.innerText()).match(/^seed ([01]+)/)[1];
    for (const weight of [1, 20, 19]) {
      const current = (await pattern()).padEnd(20, '0');
      for (let k = 1; k < 20; k++) if (current[k] !== (k < weight ? '1' : '0')) {
        const before = await pattern();
        await page.locator('#viz canvas').first().scrollIntoViewIfNeeded();
        const point = await page.evaluate(k => {
          const s = window.__vizStages[0], b = s.canvas.getBoundingClientRect();
          return {x: b.left + s.X(k + .5), y: b.top + s.Y(.5)};
        }, k);
        await page.mouse.click(point.x, point.y);
        await page.waitForFunction(before => !document.querySelector('.viz-readout').innerText.startsWith('seed ' + before + ','), before);
      }
      assert.equal(await pattern(), '1'.repeat(weight));
      await page.locator('#viz').getByRole('button', {name: 'random seed of same weight', exact: true}).click();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal([...(await pattern())].filter(bit => bit === '1').length, weight);
      assert.doesNotMatch(await readout.innerText(), /NaN|Infinity|undefined/);
    }
    assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
    assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Exact means and native one/19/20-bit same-weight randomization pass in both themes.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
