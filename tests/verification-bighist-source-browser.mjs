// Actual controls and pointer input for the root's eight Big History reviews.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { loadAll } from '../scripts/lib.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';
const ids = ['bighist-3.8', 'bighist-3.9', 'bighist-3.10', 'bighist-4.4', 'bighist-4.5', 'bighist-4.6', 'bighist-4.7', 'bighist-4.8'];
const selected = process.argv.slice(2).length ? ids.filter(id => process.argv.slice(2).includes(id)) : ids;
assert.ok(selected.length);
const { items } = await loadAll(), results = [];
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const directory = '/tmp/atlas-bighist-source-shots'; mkdirSync(directory, { recursive: true });
try {
  for (const theme of ['light', 'dark']) for (const id of selected) {
    const it = items.find(it => it.id === id), page = await browser.newPage({ viewport: { width: 1150, height: 1600 } });
    page.setDefaultTimeout(60000); await installBrowserAssets(page.context());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    let ranges = 0, choices = 0, drags = 0;
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${it.file}&id=${id}&theme=${theme}&wait=100`, { timeout: 60000 });
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 });
      assert.equal(await page.evaluate(() => window.__done.renderer), 'KaTeX 0.16.11');
      assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
      const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const readout = () => page.locator('.viz-readout').innerText();
      const sanity = async () => {
        await settle(); assert.doesNotMatch(await readout(), /\bNaN\b|undefined/);
        assert.deepEqual(errors, []);
        assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []);
        assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
        assert.deepEqual(await page.evaluate(() => window.__inspectCanvases()), []);
      };
      await sanity();
      const sliders = page.locator('#viz input[type=range]');
      for (let k = 0; k < await sliders.count(); k++) {
        const slider = sliders.nth(k), original = await slider.inputValue();
        for (const endpoint of ['min', 'max']) {
          await slider.evaluate((el, endpoint) => { el.value = el[endpoint]; el.dispatchEvent(new Event('input', { bubbles: true })); }, endpoint);
          await sanity(); ranges++;
        }
        await slider.evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, original);
        await sanity();
      }
      if (id === 'bighist-3.9') {
        const originals = await sliders.evaluateAll(inputs => inputs.map(input => input.value));
        await sliders.evaluateAll(inputs => inputs.forEach(input => { input.value = input.min; input.dispatchEvent(new Event('input', { bubbles: true })); }));
        await sanity();
        assert.match(await readout(), /180 km crater needs 44\.0 km/);
        assert.equal(await page.evaluate(() => window.__vizStages[1].bounds.x[1]), 50);
        await sliders.evaluateAll((inputs, values) => inputs.forEach((input, index) => { input.value = values[index]; input.dispatchEvent(new Event('input', { bubbles: true })); }), originals);
        await sanity(); ranges += 3;
      }
      const selects = page.locator('#viz select');
      for (let k = 0; k < await selects.count(); k++) {
        const select = selects.nth(k), original = await select.inputValue();
        const values = await select.locator('option').evaluateAll(options => options.map(o => o.value));
        for (const value of values) { await select.selectOption(value); await sanity(); choices++; }
        await select.selectOption(original); await sanity();
      }
      const toggles = page.locator('#viz .ctl-toggle label');
      for (let k = 0; k < await toggles.count(); k++) {
        await toggles.nth(k).click({ noWaitAfter: true }); await sanity(); choices++;
        await toggles.nth(k).click({ noWaitAfter: true }); await sanity();
      }
      for (const button of await page.locator('#viz .viz-controls button').all()) {
        if (!await button.isVisible()) continue;
        await button.click({ noWaitAfter: true }); await sanity(); choices++;
      }
      const handle = await page.evaluate(() => {
        const stage = window.__vizStages.find(s => s.handles?.some(h => h.visible !== false));
        if (!stage) return null;
        stage.canvas.scrollIntoView({ block: 'center' });
        const h = stage.handles.find(h => h.visible !== false), box = stage.canvas.getBoundingClientRect();
        return { x: box.x + stage.X(h.x), y: box.y + stage.Y(h.y), before: [h.x, h.y] };
      });
      if (handle) {
        const before = await readout();
        await page.mouse.move(handle.x, handle.y); await page.mouse.down();
        await page.mouse.move(handle.x + 35, handle.y - 30, { steps: 8 }); await page.mouse.up(); await sanity();
        assert.notEqual(await readout(), before, 'native handle drag changes the live result'); drags++;
      }
      if (id === 'bighist-4.4') assert.match(await readout(), /0% at the start/);
      if (id === 'bighist-4.5') assert.match(await readout(), /Finite-window likelihood estimate|rate boundary|Too few segments/);
      if (id === 'bighist-4.6') {
        assert.match(await readout(), /pair still separate at its beginning/);
        assert.match(await readout(), /not a test of genomic detectability/);
      }
      if (id === 'bighist-4.8') assert.doesNotMatch(await readout(), /overkill is excluded/);
      const screenshot = `${directory}/${id}-${theme}.png`; await page.locator('#shot').screenshot({ path: screenshot });
      results.push({ id, theme, status: 'passed', ranges, choices, drags, screenshot });
    } catch (error) { results.push({ id, theme, status: 'failed', ranges, choices, drags, error: String(error.stack || error) }); }
    finally { await page.close(); }
    console.log(`${results.at(-1).status === 'passed' ? '✓' : '✗'} ${id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
writeFileSync('/tmp/atlas-bighist-source-browser.json', JSON.stringify(results, null, 2) + '\n');
const failures = results.filter(r => r.status !== 'passed');
for (const result of failures) console.error(result.id, result.theme, result.error);
console.log(`${results.length} native theme cases, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
