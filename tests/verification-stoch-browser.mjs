import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const dir = '/tmp/stoch-verification-shots'; mkdirSync(dir, { recursive: true }); const results = [];
const ids = ['2.6', '3.10', '3.12', '3.13', '4.10', '4.14', '4.16'];
try {
  for (const theme of ['light', 'dark']) for (const num of ids) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1700 } }); await installBrowserAssets(page.context());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const read = async () => { await settle(); return page.locator('.viz-readout').innerText(); };
    const slider = async (n, value) => { await page.locator('#viz input[type=range]').nth(n).evaluate((el, value) => { el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, value); await settle(); };
    const id = `stoch-${num}`, file = num.startsWith('2') ? 'content/stoch/ch02.js' : num.startsWith('3') ? 'content/stoch/ch03-b.js' : 'content/stoch/ch04-b.js';
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=150`);
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 }); assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
      if (num === '2.6') {
        assert.match(await read(), /19 jumps/); assert.match(await read(), /0 games still unfinished/);
        const before = await read(); await page.getByRole('button', { name: 'overshoot wins', exact: true }).click(); assert.notEqual(await read(), before);
        for (const [x, y] of [[1.5, .5], [2.5, .5]]) {
          const q = await page.evaluate(({ x, y }) => { const s = window.__vizStages[0], r = s.canvas.getBoundingClientRect(); return [r.x + s.X(x), r.y + s.Y(y)]; }, { x, y }); await page.mouse.click(...q); await settle();
        }
        assert.match(await read(), /20 jumps/);
        await page.getByRole('button', { name: 'no jumps', exact: true }).click(); assert.match(await read(), /0 jumps/);
      } else if (num === '3.10') {
        await page.getByRole('button', { name: '0 or 2 children', exact: true }).click(); await slider(0, 2); assert.match(await read(), /0\.0000/);
      } else if (num === '3.12') {
        await page.locator('#viz input[type=range]').evaluateAll(els => {
          for (let i = 0; i < 6; i++) { els[i].value = i === 1 ? '1' : '0'; els[i].dispatchEvent(new Event('input', { bubbles: true })); }
        });
        assert.match(await read(), /zero offspring is impossible/); assert.match(await read(), /0\.0000/);
        await slider(0, 1); assert.doesNotMatch(await read(), /zero offspring is impossible/);
      } else if (num === '3.13') {
        const before = await read(); await page.getByRole('button', { name: '3', exact: true }).click(); assert.notEqual(await read(), before); await slider(0, 2000);
      } else if (num === '4.10') {
        const before = await read(); await slider(0, 0); assert.notEqual(await read(), before);
        await page.getByRole('button', { name: '3→4→5', exact: true }).click();
      } else if (num === '4.14') {
        const before = await read(); await slider(0, 3); assert.notEqual(await read(), before); await page.getByRole('button', { name: 'new weights', exact: true }).click();
      } else if (num === '4.16') {
        assert.match(await read(), /Period 2/); await slider(0, 4); assert.match(await read(), /after 1\.0 steps/);
        await slider(0, 60); assert.match(await read(), /stationary and long-run occupation averages/);
        assert.ok(await page.evaluate(() => { const s = window.__vizStages[2]; return s.X(60) <= s.canvas.width && s.Y(2 ** 60) >= 0; }));
      }
      assert.deepEqual(errors, []); assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []); assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
      assert.ok(await page.locator('.katex').count() > 0);
      const screenshot = `${dir}/${id}-${theme}.png`; await page.locator('#shot').screenshot({ path: screenshot }); results.push({ id, theme, status: 'passed', screenshot });
    } catch (e) { results.push({ id, theme, status: 'failed', error: String(e.stack || e) }); }
    finally { await page.close(); }
    console.log(`${results.at(-1).status} ${id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
writeFileSync('/tmp/stoch-verification-browser.json', JSON.stringify(results, null, 2) + '\n');
for (const r of results.filter(r => r.status === 'failed')) console.error(r.id, r.theme, r.error);
process.exitCode = results.some(r => r.status === 'failed') ? 1 : 0;
