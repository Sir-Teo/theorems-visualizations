import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const dir = '/tmp/ecol-source-verification-shots'; mkdirSync(dir, { recursive: true }); const results = [];
const ids = process.env.ECOL_SOURCE_ITEMS ? process.env.ECOL_SOURCE_ITEMS.split(',') : ['4.1', '4.2', '4.4', '4.7', '4.8', '4.10', '4.12'];
try {
  for (const theme of ['light', 'dark']) for (const num of ids) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1700 } }); await installBrowserAssets(page.context());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const read = async () => { await settle(); return page.locator('.viz-readout').innerText(); };
    const slider = async (n, value) => { await page.locator('#viz input[type=range]').nth(n).evaluate((el, value) => { el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, value); await settle(); };
    const id = `ecol-${num}`, file = num === '4.1' || num === '4.2' || num === '4.4' ? 'content/ecol/ch04.js' : 'content/ecol/ch04-b.js';
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=150&still`);
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 }); assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
      if (num === '4.1') {
        const before = await read(); await page.locator('#viz .ctl-toggle label').click(); assert.notEqual(await read(), before); assert.ok(await page.locator('#viz input[type=checkbox]').isChecked());
        await page.locator('#viz .ctl-toggle label').click(); await slider(0, 0);
      } else if (num === '4.2') {
        const before = await read(); await page.getByRole('button', { name: 'caudatum + bursaria', exact: true }).click(); assert.notEqual(await read(), before); await slider(0, 0); await slider(1, 0);
      } else if (num === '4.4') {
        await slider(0, 45); await slider(1, 45); assert.match(await read(), /neutral family/);
        await slider(0, 60); await slider(1, 30); assert.match(await read(), /violated/);
      } else if (num === '4.7') {
        await slider(1, .2); await slider(2, .4); assert.match(await read(), /unresolved|condition/);
        await page.getByRole('button', { name: 'box', exact: true }).click();
      } else if (num === '4.8') {
        await slider(0, 1.5); await slider(1, .3); assert.doesNotMatch(await read(), /NaN|Infinity/); assert.match(await read(), /time 40/);
      } else if (num === '4.10') {
        await slider(0, 0); await slider(1, 1); assert.match(await read(), /neutral or boundary/);
      } else if (num === '4.12') {
        await slider(0, 1.5); await slider(1, .2); assert.match(await read(), /trade-off is broken/);
        const q = await page.evaluate(() => { const s=window.__vizStages[0],r=s.canvas.getBoundingClientRect(); return [r.x+s.X(.4),r.y+s.Y(0),r.x+s.X(.99),r.y+s.Y(0)]; });
        await page.mouse.move(q[0],q[1]); await page.mouse.down(); await page.mouse.move(q[2],q[3],{steps:5}); await page.mouse.up();
      }
      assert.deepEqual(errors, []); assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []); assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
      assert.ok(await page.evaluate(() => typeof window.katex?.render === 'function'));
      if (num !== '4.1') assert.ok(await page.locator('.katex').count() > 0);
      const screenshot = `${dir}/${id}-${theme}.png`; await page.locator('#shot').screenshot({ path: screenshot }); results.push({ id, theme, status: 'passed', screenshot });
    } catch (e) { results.push({ id, theme, status: 'failed', error: String(e.stack || e) }); }
    finally { await page.close(); }
    console.log(`${results.at(-1).status} ${id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
writeFileSync('/tmp/ecol-source-verification-browser.json', JSON.stringify(results, null, 2) + '\n');
for (const r of results.filter(r => r.status === 'failed')) console.error(r.id, r.theme, r.error);
process.exitCode = results.some(r => r.status === 'failed') ? 1 : 0;
