import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const directory = '/tmp/atlas-macro-model-followup';
mkdirSync(directory, { recursive: true });
const server = createServer({ verificationAssets: true });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [];
try {
  for (const theme of ['light', 'dark']) for (const id of ['macro-3.12', 'behav-3.12']) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1700 } });
    await installBrowserAssets(page.context(), { local: true });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const read = async () => {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.deepEqual(errors, []);
      assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []);
      assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
      const text = await page.locator('.viz-readout').innerText();
      assert.doesNotMatch(text, /NaN|Infinity|undefined|without limit/);
      return text;
    };
    const sliders = page.locator('#viz input[type=range]');
    const keys = async (index, presses) => {
      const input = sliders.nth(index); await input.focus();
      for (const key of presses) await input.press(key);
      return read();
    };
    const capture = async state => {
      const screenshot = `${directory}/${id}-${theme}-${state}.png`;
      await page.locator('#shot').screenshot({ path: screenshot });
      return screenshot;
    };
    try {
      const file = id.startsWith('macro') ? 'content/macro/ch03-b.js' : 'content/behav/ch03-b.js';
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=200&still=1`);
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 });
      const done = await page.evaluate(() => window.__done);
      for (const key of ['errors', 'texErrors', 'blank']) assert.deepEqual(done[key], []);
      assert.equal(done.renderer, 'KaTeX 0.16.11');
      const screenshots = [];
      if (id === 'macro-3.12') {
        assert.match(await read(), /60.4% of capital/);
        screenshots.push(await capture('excess-saving'));
        assert.match(await keys(0, ['Home']), /9.7% of labour employed/);
        screenshots.push(await capture('saving-shortfall'));
        const knife = await keys(0, ['Home', ...Array(14).fill('ArrowRight')]);
        assert.match(knife, /100.0% of labour employed and 100.0% of capital/);
        assert.match(knife, /full-utilization knife edge/);
        screenshots.push(await capture('knife-edge'));
        await keys(2, ['Home']);
        const zero = await keys(3, ['Home']);
        assert.match(zero, /20.0% of capital/);
        assert.match(zero, /no finite steady capital–output ratio/);
        assert.match(zero, /8.80/);
        screenshots.push(await capture('zero-dilution'));
      } else {
        assert.match(await read(), /normal skill-plus-luck model/);
        const zero = await keys(0, ['Home']);
        assert.match(zero, /observed change is 0.00/);
        screenshots.push(await capture('zero-luck'));
        await keys(0, ['End']); await keys(1, ['Home']);
        await page.getByRole('button', { name: 'new league', exact: true }).click();
        const text = await read();
        assert.match(text, /top 5/); assert.match(text, /−0.42/);
        assert.match(text, /conditional expected/);
        const point = await page.evaluate(() => {
          const stage = window.__vizStages[0], box = stage.canvas.getBoundingClientRect();
          return { x: box.x + stage.X(75), y: box.y + stage.Y(5) };
        });
        await page.mouse.click(point.x, point.y);
        assert.match(await read(), /Right: chance alone/);
        screenshots.push(await capture('independent-luck-negative-sample'));
      }
      results.push({ id, theme, status: 'passed', screenshots });
    } catch (error) {
      results.push({ id, theme, status: 'failed', error: String(error.stack || error) });
      console.error(results.at(-1).error);
    } finally { await page.close(); }
    console.log(`${results.at(-1).status}: ${id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
writeFileSync(`${directory}/results.json`, JSON.stringify(results, null, 2) + '\n');
process.exitCode = results.some(result => result.status === 'failed') ? 1 : 0;
