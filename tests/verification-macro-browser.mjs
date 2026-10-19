// Native range, checkbox, button and pointer interactions in both themes.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';

const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const dir = '/tmp/atlas-macro-shots', results = []; mkdirSync(dir, { recursive: true });
const numbers = process.env.MACRO_ITEMS ? process.env.MACRO_ITEMS.split(',').map(Number) : Array.from({ length: 9 }, (_, i) => i + 1);
try {
  for (const theme of ['light', 'dark']) for (const num of numbers) {
    const id = `macro-4.${num}`, file = `content/macro/ch04${num >= 6 ? '-b' : ''}.js`;
    const page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
    await installBrowserAssets(page.context());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const settle = async () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const read = async () => { await settle(); return page.locator('.viz-readout').innerText(); };
    const slider = async (i, value) => {
      await page.locator('#viz input[type=range]').nth(i).evaluate((el, value) => {
        el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true }));
      }, value); await settle();
    };
    const toggle = async (i, checked) => {
      const el = page.locator('#viz input[type=checkbox]').nth(i);
      if (await el.isChecked() !== checked) await el.locator('..').click();
      await settle();
    };
    const drag = async (stageIndex, x, y) => {
      const p = await page.evaluate(({ stageIndex, x, y }) => {
        const s = window.__vizStages[stageIndex], h = s.handles[0], r = s.canvas.getBoundingClientRect();
        return { x0: r.x + s.X(h.x), y0: r.y + s.Y(h.y), x1: r.x + s.X(x), y1: r.y + s.Y(y) };
      }, { stageIndex, x, y });
      await page.mouse.move(p.x0, p.y0); await page.mouse.down();
      await page.mouse.move(p.x1, p.y1, { steps: 10 }); await page.mouse.up(); await settle();
    };
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=200&still=1`);
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 });
      const done = await page.evaluate(() => window.__done);
      assert.deepEqual(done.errors, []); assert.deepEqual(done.texErrors, []); assert.deepEqual(done.blank, []);
      assert.equal(done.renderer, 'KaTeX 0.16.11');
      if (num === 1) {
        const before = await read(); await drag(0, 3, .8); assert.notEqual(await read(), before);
        await toggle(0, true); assert.match(await read(), /On the stable arm/);
        await slider(0, .1); await slider(1, .5); await slider(2, .2); assert.match(await read(), /On the stable arm/);
        await toggle(0, false);
        await page.getByRole('button', { name: 'snap to saddle path', exact: true }).click();
        assert.match(await read(), /On the stable arm/);
        assert.ok(await page.locator('#viz input[type=checkbox]').isChecked());
        assert.doesNotMatch(await read(), /NaN|Infinity/);
      } else if (num === 2) {
        await slider(0, .6); await slider(1, .2); assert.doesNotMatch(await read(), /oversaving/);
        await slider(0, .1); await slider(1, 3); assert.match(await read(), /oversaving/);
        await slider(3, 2); const before = await read(); await drag(0, .2, 0); assert.notEqual(await read(), before);
      } else if (num === 3) {
        assert.match(await read(), /measured slopes 1.0% and 4.5%/);
        await slider(0, .5); assert.match(await read(), /diminishing returns/);
        await slider(0, 1); await slider(3, .12); assert.match(await read(), /−5.0%/);
      } else if (num === 4) {
        await drag(0, .025, 0); assert.match(await read(), /cross after/);
        await drag(0, .15, 0); assert.match(await read(), /cross after/);
        const before = await read(); await slider(0, 4); assert.notEqual(await read(), before);
      } else if (num === 5) {
        await slider(0, 1); await slider(1, .3); assert.match(await read(), /predicts growth × 23.0/);
        await slider(2, 0); assert.doesNotMatch(await read(), /NaN|Infinity/);
        await slider(0, -2); assert.match(await read(), /balanced-growth rate/);
      } else if (num === 6) {
        await slider(3, .001); assert.match(await read(), /income tends to 1.40× subsistence/);
        await slider(2, 3); assert.match(await read(), /technology|steady progress/);
        await slider(3, 0); assert.match(await read(), /leaves income per head at subsistence/);
      } else if (num === 7) {
        const before = await read(); await toggle(0, false); assert.notEqual(await read(), before);
        await slider(0, 0); assert.match(await read(), /threshold is not crossed/);
        assert.doesNotMatch(await read(), /economy stays trapped/);
      } else if (num === 8) {
        assert.match(await read(), /85 countries/);
        await page.getByRole('button', { name: 'Augmented, free', exact: true }).click();
        await toggle(0, true); assert.match(await read(), /22 countries/);
        await slider(0, .02); assert.doesNotMatch(await read(), /NaN|Infinity/);
        await page.getByRole('button', { name: 'Augmented, α = ⅓', exact: true }).click();
      } else {
        assert.match(await read(), /64 countries/);
        await toggle(1, true); assert.match(await read(), /60 countries/);
        await toggle(1, false);
        await toggle(0, true); assert.match(await read(), /37 countries/);
        const p = await page.evaluate(() => { const s = window.__vizStages[0], r = s.canvas.getBoundingClientRect(); return { x: r.x + s.X(10), y: r.y + s.Y(10.22) }; });
        await page.mouse.click(p.x, p.y); await settle();
        assert.ok(await page.locator('#viz .stage-tex, #viz canvas').count());
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []);
      assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
      const screenshot = `${dir}/${id}-${theme}.png`; await page.locator('#shot').screenshot({ path: screenshot });
      results.push({ id, theme, status: 'passed', screenshot });
    } catch (error) { results.push({ id, theme, status: 'failed', error: String(error.stack || error) }); console.error(String(error.stack || error)); }
    finally { await page.close(); }
    console.log(`${results.at(-1).status === 'passed' ? '✓' : '✗'} ${id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
writeFileSync(`/tmp/atlas-macro-browser${numbers.length === 9 ? '' : '-' + numbers.join('-')}.json`, JSON.stringify(results, null, 2) + '\n');
const failed = results.filter(r => r.status !== 'passed');
for (const result of failed) console.error(result.id, result.theme, result.error);
console.log(`${results.length} native interaction groups, ${failed.length} failed`);
process.exitCode = failed.length ? 1 : 0;
