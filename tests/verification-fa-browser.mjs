import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const targetIds = new Set(['1.4','1.6','1.7','1.11','1.12','1.20','1.23','1.26','1.42','1.43','2.9','3.1','3.8','3.13','3.24','3.26','3.29','4.1','4.12a','4.17','4.20','4.21','4.22','4.23','4.24']);
const candidates = [];
for (const f of (await import('node:fs/promises')).readdir ? await (await import('node:fs/promises')).readdir('content/fa') : []) {
  if (!/^ch0[1-4].*\.js$/.test(f) || f.includes('shared')) continue;
  const m = (await import(`../content/fa/${f}`)).default;
  for (const item of m.items || []) if (targetIds.has(item.num) && item.viz) candidates.push({ file: f, num: item.num });
}
assert.equal(candidates.length, 25, 'all source-reviewed visualizations must run');
const output = '/tmp/fa-verification-shots';
await mkdir(output, { recursive: true });
const results = [];
async function frame(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: theme });
    await installBrowserAssets(context);
    for (const { file, num } of candidates) {
      const id = `fa-${num}`;
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/tools/harness.html?file=content/fa/${file}&id=${id}&theme=${theme}&w=1100&wait=5`);
      await page.waitForFunction(() => window.__done);
      const ready = await page.evaluate(() => window.__done);
      assert.equal(ready.ok, true, JSON.stringify(ready));
      assert.equal(ready.renderer, 'KaTeX 0.16.11');
      assert.deepEqual(ready.errors, []);
      assert.deepEqual(ready.texErrors, []);
      assert.deepEqual(ready.blank, []);
      await page.screenshot({ path: `${output}/${id}-${theme}.png`, fullPage: true });
      const before = await page.locator('.viz-readout').innerText();
      const sliders = page.locator('input[type=range]');
      let sliderChecks = 0;
      for (let j = 0; j < await sliders.count(); j++) {
        const input = sliders.nth(j);
        if (!await input.isVisible()) continue;
        const original = await input.inputValue();
        await input.focus(); await input.press('Home'); await frame(page);
        await input.press('End'); await frame(page);
        await input.evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, original);
        await frame(page); sliderChecks++;
      }
      for (const input of await page.locator('input[type=checkbox]').all()) {
        if (!await input.isVisible()) continue;
        await input.locator('..').click(); await frame(page); await input.locator('..').click(); await frame(page);
      }
      for (const group of await page.locator('.ctl-select').all()) {
        const options = group.locator('button');
        for (const button of await options.all()) {
          await button.click(); await frame(page);
          for (const input of await sliders.all()) {
            if (!await input.isVisible()) continue;
            const original = await input.inputValue();
            await input.focus(); await input.press('Home'); await frame(page);
            await input.press('End'); await frame(page);
            await input.evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, original);
            await frame(page); sliderChecks++;
          }
        }
      }
      for (const group of await page.locator('.ctl-select').all()) { await group.locator('button').first().click(); await frame(page); }
      // Real pointer input, using only stage coordinate conversion to aim the drag.
      const handle = await page.evaluate(() => {
        const s = window.__vizStages.find(s => s.handles?.length);
        if (!s) return null;
        const h = s.handles[0], box = s.canvas.getBoundingClientRect();
        return { x: box.x + s.X(h.x), y: box.y + s.Y(h.y), old: [h.x, h.y] };
      });
      if (handle) {
        await page.mouse.move(handle.x, handle.y); await page.mouse.down();
        await page.mouse.move(handle.x + 45, handle.y - 30, { steps: 8 }); await page.mouse.up(); await frame(page);
        const changed = await page.evaluate(() => { const s = window.__vizStages.find(s => s.handles?.length); return [s.handles[0].x, s.handles[0].y]; });
        assert.notDeepEqual(changed, handle.old, `${id}: pointer drag`);
      }
      for (const button of await page.locator('.viz-controls > button').all()) { await button.click(); await frame(page); }
      await frame(page);
      const live = await page.evaluate(() => ({ errors: window.__vizErrors || [], tex: window.__texErrors || [] }));
      assert.deepEqual(errors, [], `${id}: runtime errors`);
      assert.deepEqual(live.errors, [], `${id}: live errors`);
      assert.deepEqual(live.tex, [], `${id}: live TeX errors`);
      const after = await page.locator('.viz-readout').innerText();
      assert.ok(!/NaN|Infinity|undefined/.test(after), `${id}: ${after}`);
      results.push({ id: `${id}`, theme, sliderChecks, pointer: !!handle, before, after });
      console.log(`${id} ${theme}: ${sliderChecks} slider sweeps, pointer=${!!handle}`);
      await page.close();
    }
    await context.close();
  }
  await writeFile('/tmp/fa-verification-browser.json', JSON.stringify(results, null, 2));
  console.log(`Passed ${results.length} light/dark item checks, ${results.reduce((s, r) => s + r.sliderChecks, 0)} slider endpoint sweeps and ${results.filter(r => r.pointer).length} pointer drags.`);
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
