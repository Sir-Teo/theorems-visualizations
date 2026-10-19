import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const output = '/tmp/cm-verification-shots', results = [];
await mkdir(output, { recursive: true });
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: theme });
    await installBrowserAssets(context);
    for (const n of [5, 6, 14]) {
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const file = n <= 7 ? 'ch02.js' : 'ch02-b.js';
      await page.goto(`${base}/tools/harness.html?file=content/cm/${file}&id=cm-2.${n}&theme=${theme}&w=1100&wait=5`);
      await page.waitForFunction(() => window.__done);
      const ready = await page.evaluate(() => window.__done);
      assert.equal(ready.ok, true, JSON.stringify(ready));
      assert.equal(ready.renderer, 'KaTeX 0.16.11');
      assert.deepEqual(ready.errors, []); assert.deepEqual(ready.texErrors, []); assert.deepEqual(ready.blank, []);
      await page.screenshot({ path: `${output}/cm-2.${n}-${theme}.png`, fullPage: true });
      const initial = await page.locator('.viz-readout').innerText();
      let sliderChecks = 0;
      for (const input of await page.locator('input[type=range]').all()) {
        const original = await input.inputValue();
        await input.focus(); await input.press('Home'); await frame(page);
        await input.press('End'); await frame(page);
        await input.evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, original);
        await frame(page); sliderChecks++;
      }
      let options = 0;
      for (const button of await page.locator('.ctl-select button').all()) { await button.click(); await frame(page); options++; }
      if (n <= 6) {
        const beforeClick = await page.locator('.viz-readout').innerText();
        const p = await page.evaluate(() => { const s = window.__vizStages[0], b = s.canvas.getBoundingClientRect(); return { x: b.x + s.X(1), y: b.y + s.Y(.5) }; });
        await page.mouse.click(p.x, p.y); await frame(page);
        assert.notEqual(await page.locator('.viz-readout').innerText(), beforeClick, `cm-2.${n}: actual bar click`);
      }
      const live = await page.evaluate(() => ({ errors: window.__vizErrors || [], tex: window.__texErrors || [] }));
      assert.deepEqual(errors, []); assert.deepEqual(live.errors, []); assert.deepEqual(live.tex, []);
      const after = await page.locator('.viz-readout').innerText();
      assert.ok(!/NaN|Infinity|undefined/.test(after), after);
      results.push({ id: `cm-2.${n}`, theme, sliderChecks, options, barClick: n <= 6, initial, after });
      console.log(`cm-2.${n} ${theme}: ${sliderChecks} slider endpoint sweeps, ${options} options, barClick=${n <= 6}`);
      await page.close();
    }
    await context.close();
  }
  await writeFile('/tmp/cm-verification-browser.json', JSON.stringify(results, null, 2));
  console.log(`Passed ${results.length} item/theme checks, ${results.reduce((s, r) => s + r.sliderChecks, 0)} slider sweeps, ${results.reduce((s, r) => s + r.options, 0)} options and ${results.filter(r => r.barClick).length} bar clicks.`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
