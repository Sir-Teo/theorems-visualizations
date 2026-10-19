import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';

const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [];
mkdirSync('/tmp/atlas-macro-shots', { recursive: true });
const ids = process.env.VERIFY_IDS ? process.env.VERIFY_IDS.split(',') : ['macro-3.9', 'macro-3.11', 'game-2.8', 'game-3.10'];
try {
  for (const theme of ['light', 'dark']) for (const id of ids) {
    const file = id.startsWith('macro') ? 'content/macro/ch03-b.js' : id === 'game-2.8' ? 'content/game/ch02-b.js' : 'content/game/ch03-b.js';
    const page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
    await installBrowserAssets(page.context());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const settle = async () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const read = async () => { await settle(); return page.locator('.viz-readout').innerText(); };
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=200&still=1`);
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 });
      const done = await page.evaluate(() => window.__done);
      assert.deepEqual(done.errors, []); assert.deepEqual(done.texErrors, []); assert.deepEqual(done.blank, []);
      assert.equal(done.renderer, 'KaTeX 0.16.11');
      if (id === 'macro-3.9') {
        assert.match(await read(), /weights intervals by their duration/);
        await page.getByRole('button', { name: 'China', exact: true }).click(); assert.match(await read(), /China:/);
        await page.getByRole('button', { name: 'fixed 1/3', exact: true }).click(); assert.match(await read(), /0.33, 0.33/);
        await page.getByRole('button', { name: 'United States', exact: true }).click(); assert.match(await read(), /average growth 3.0%/);
      } else if (id === 'macro-3.11') {
        assert.match(await read(), /58-fold gap/);
        const p = await page.evaluate(() => {
          const s = window.__vizStages[0], h = s.handles[0], r = s.canvas.getBoundingClientRect();
          return { x: r.x + s.X(h.x), y: r.y + s.Y(h.y), tx: r.x + s.X(30), ty: r.y + s.Y(30 ** 1.5) };
        });
        await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.tx, p.ty, { steps: 10 }); await page.mouse.up();
        assert.match(await read(), /30.0-fold income gap/);
        await page.getByRole('button', { name: 'effective worker (÷ human capital)', exact: true }).click();
        assert.match(await read(), /effective worker/);
        await page.locator('#viz input[type=range]').evaluate(el => { el.value = '.2'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        assert.doesNotMatch(await read(), /NaN|Infinity/);
      } else if (id === 'game-2.8') {
        assert.match(await read(), /38.54%/); assert.match(await read(), /41.99%/);
        await page.getByRole('button', { name: 'equilibrium mixture', exact: true }).click();
        assert.match(await read(), /gap 0.0 points/);
        await page.locator('#viz input[type=range]').nth(1).evaluate(el => { el.value = '80'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        assert.doesNotMatch(await read(), /38.54%/);
        await page.getByRole('button', { name: 'restore published data', exact: true }).click(); assert.match(await read(), /38.54%/);
      } else {
        assert.match(await read(), /sampled tests pass|not approachable/);
        await page.getByRole('button', { name: 'square', exact: true }).click();
        await page.getByRole('button', { name: 'random', exact: true }).click();
        assert.doesNotMatch(await read(), /it stalls/);
        await page.locator('#viz input[type=range]').nth(0).evaluate(el => { el.value = '.2'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        const p = await page.evaluate(() => {
          const s = window.__vizStages[0], h = s.handles[0], r = s.canvas.getBoundingClientRect();
          return { x: r.x + s.X(h.x), y: r.y + s.Y(h.y), tx: r.x + s.X(3), ty: r.y + s.Y(3) };
        });
        await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.tx, p.ty, { steps: 10 }); await page.mouse.up();
        assert.match(await read(), /not approachable/);
      }
      assert.deepEqual(errors, []); assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []);
      assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
      const screenshot = `/tmp/atlas-macro-shots/${id}-${theme}.png`; await page.locator('#shot').screenshot({ path: screenshot });
      results.push({ id, theme, status: 'passed', screenshot });
    } catch (error) { results.push({ id, theme, status: 'failed', error: String(error.stack || error) }); console.error(results.at(-1).error); }
    finally { await page.close(); }
    console.log(`${results.at(-1).status === 'passed' ? '✓' : '✗'} ${id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
writeFileSync(`/tmp/atlas-macro-followup-browser${process.env.VERIFY_IDS ? '-targeted' : ''}.json`, JSON.stringify(results, null, 2) + '\n');
process.exitCode = results.some(r => r.status === 'failed') ? 1 : 0;
