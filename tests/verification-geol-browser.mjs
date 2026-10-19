import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [], dir = '/tmp/geol-verification-shots'; mkdirSync(dir, { recursive: true });
const requested = process.argv.slice(2);
const ids = ['3.1', '3.2', '3.5', '3.11', '3.14', '3.15', '4.1', '4.3', '4.4', '4.5'].filter(num => !requested.length || requested.includes(num));
try {
  for (const theme of ['light', 'dark']) for (const num of ids) {
    const id = `geol-${num}`, file = num.startsWith('4') ? 'content/geol/ch04.js' : ['3.1', '3.2', '3.5'].includes(num) ? 'content/geol/ch03.js' : 'content/geol/ch03-c.js';
    const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
    await installBrowserAssets(page.context()); const errors = []; page.on('pageerror', e => errors.push(e.message));
    const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const read = async () => { await settle(); return page.locator('.viz-readout').innerText(); };
    const slider = async (n, value) => { await page.locator('#viz input[type=range]').nth(n).evaluate((el, value) => { el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, value); await settle(); };
    const drag = async (n, x, y, tx, ty) => {
      const q = await page.evaluate(({ n, x, y, tx, ty }) => { const s = window.__vizStages[n], r = s.canvas.getBoundingClientRect(); if (x === null) { x = s.handles[0].x; y = s.handles[0].y; } return { x: r.x + s.X(x), y: r.y + s.Y(y), tx: r.x + s.X(tx), ty: r.y + s.Y(ty) }; }, { n, x, y, tx, ty });
      await page.mouse.move(q.x, q.y); await page.mouse.down(); await page.mouse.move(q.tx, q.ty, { steps: 8 }); await page.mouse.up(); await settle();
    };
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=150`);
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 });
      assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
      if (num === '3.1') { assert.match(await read(), /misfit 90 km/); const before = await read(); await slider(0, 0); assert.notEqual(await read(), before); }
      if (num === '3.2') { const a = await read(); await slider(0, 40); assert.notEqual(await read(), a); await slider(1, 0); const tilted = await read(); await page.locator('#viz input[type=checkbox]').uncheck({ force: true }); assert.notEqual(await read(), tilted); }
      if (num === '3.5') { const before = await read(); await slider(0, .6); assert.notEqual(await read(), before); }
      if (num === '3.11') { const a = await read(); await slider(0, 100); await slider(1, 200); assert.notEqual(await read(), a); }
      if (num === '3.14') {
        assert.match(await read(), /magnetic base 11\.0 km/);
        await page.getByRole('button', { name: 'Pacific grain (no. 1)', exact: true }).click(); assert.match(await read(), /magnetic base 20\.0 km/);
        await slider(2, .5); assert.match(await read(), /magnetic base 11\.0 km/);
        await page.locator('#viz input[type=checkbox]').uncheck({ force: true }); assert.match(await read(), /peak anomaly/);
      }
      if (num === '3.15') { const a = await read(); await page.getByRole('button', { name: 'Best fit', exact: true }).click(); assert.notEqual(await read(), a); assert.doesNotMatch(await read(), /MORVEL/); }
      if (num === '4.1') { await slider(0, 100); assert.match(await read(), /100\.0.*mW\/m²/s); await page.getByRole('button', { name: 'uniform,', exact: false }).click(); assert.match(await read(), /2\.9/); }
      if (num === '4.3') {
        await page.getByRole('button', { name: 'similarity collapse', exact: true }).click();
        // Correct axes put a positive normalized temperature above zero.
        assert.deepEqual(await page.evaluate(() => window.__vizStages[1].view.y), [0, 1]);
        assert.ok(await page.evaluate(() => window.__vizStages[1].Y(.9) < window.__vizStages[1].Y(0)));
        await slider(0, 1450); assert.match(await read(), /mW\/m²/);
        await page.getByRole('button', { name: 'profile at probe age', exact: true }).click();
        await drag(0, 60, -8, 80, -8); assert.match(await read(), /Age.*80/s);
      }
      if (num === '4.4') {
        assert.match(await read(), /At.*40.*Myr/s);
        await page.getByRole('button', { name: '√age', exact: true }).click(); assert.match(await read(), /At.*40.*Myr/s);
        await page.getByRole('button', { name: 'age', exact: true }).click(); assert.match(await read(), /At.*40.*Myr/s);
        await drag(0, null, null, 170, -5.9); assert.match(await read(), /At.*170.*Myr/s);
      }
      if (num === '4.5') { const a = await read(); await slider(0, 1500); assert.notEqual(await read(), a); await slider(3, .6); assert.match(await read(), /TW/); }
      assert.deepEqual(errors, []); assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []); assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
      assert.ok(await page.locator('.katex').count() > 0);
      const screenshot = `${dir}/${id}-${theme}.png`; await page.locator('#shot').screenshot({ path: screenshot });
      results.push({ id, theme, status: 'passed', screenshot });
    } catch (error) { results.push({ id, theme, status: 'failed', error: String(error.stack || error) }); }
    finally { await page.close(); }
    console.log(`${results.at(-1).status} ${id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
writeFileSync('/tmp/geol-verification-browser.json', JSON.stringify(results, null, 2) + '\n');
for (const r of results.filter(r => r.status === 'failed')) console.error(r.id, r.theme, r.error);
process.exitCode = results.some(r => r.status === 'failed') ? 1 : 0;
