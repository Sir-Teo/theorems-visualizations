// Actual controls and pointer events for the named wave 3–4 corrections.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { loadAll } from '../scripts/lib.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';

const { items } = await loadAll();
const allIds = ['tech-4.1', 'geo-4.5', 'ecol-4.6', 'ecol-4.7', 'ode-3.18', 'climate-4.6'];
const ids = process.argv.length > 2 ? allIds.filter(id => process.argv.slice(2).includes(id)) : allIds;
assert.ok(ids.length, 'select at least one known follow-up');
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [], dir = '/tmp/atlas-followup-shots'; mkdirSync(dir, { recursive: true });
try {
  for (const theme of ['light', 'dark']) for (const id of ids) {
    const it = items.find(i => i.id === id), page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
    await installBrowserAssets(page.context());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${it.file}&id=${id}&theme=${theme}&wait=200`);
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 });
      assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
      const text = async () => {
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        return page.locator('.viz-readout').innerText();
      };
      const slider = async (n, value) => {
        await page.locator('#viz input[type=range]').nth(n).evaluate((el, value) => { el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      };
      if (id === 'tech-4.1') {
        await slider(1, .11); assert.match(await text(), /no admissible thrust line/);
        await slider(1, .12); assert.match(await text(), /thrust between/);
        assert.match(await text(), /0\.1075/);
        await page.getByRole('button', { name: 'segmental (60°)', exact: true }).click();
        assert.match(await text(), /segmental arch/);
      } else if (id === 'geo-4.5') {
        const before = await text(); assert.match(before, /23\.1/);
        await page.getByRole('button', { name: 'free top surface', exact: true }).click();
        assert.match(await text(), /46\.2/);
        await page.getByRole('button', { name: 'two rigid lids', exact: true }).click();
        assert.match(await text(), /23\.1/);
      } else if (id === 'ecol-4.6') {
        assert.match(await text(), /5 species on 5 resources/);
        await page.getByRole('button', { name: '12 species', exact: true }).click({ timeout: 60000 });
        assert.match(await text(), /12 species on 5 resources/);
        assert.match(await text(), /12.*abundance above 0\.01/s);
      } else if (id === 'ecol-4.7') {
        await slider(0, 9); await slider(1, .2); await slider(2, 0);
        assert.match(await text(), /numerically unresolved/);
        await slider(1, 3.5);
        assert.match(await text(), /all equilibrium abundances are positive/);
        for (const name of ['exponential', 'box', 'Gaussian']) {
          await page.getByRole('button', { name, exact: true }).click();
          assert.match(await text(), /150 of 150 draws resolve/);
        }
      } else if (id === 'climate-4.6') {
        await slider(0, .85); await slider(1, .35); await slider(2, 1.2);
        assert.match(await text(), /Conditional median/);
        assert.match(await text(), /population mean diverges/);
        assert.match(await text(), /33\.4/);
        await slider(1, .02);
        assert.doesNotMatch(await text(), /NaN/);
        assert.match(await text(), /conditional 5–95% interval/);
      } else {
        const before = await text();
        const point = await page.evaluate(() => {
          const s = window.__vizStages[0], r = s.canvas.getBoundingClientRect();
          return { x: r.x + s.X(.3), y: r.y + s.Y(.5), tx: r.x + s.X(1.4), ty: r.y + s.Y(.05) };
        });
        await page.mouse.move(point.x, point.y); await page.mouse.down(); await page.mouse.move(point.tx, point.ty, { steps: 8 }); await page.mouse.up();
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        assert.notEqual(await text(), before, 'pointer drag changes the parameter readout');
        assert.match(await text(), /outside: bounded/);
        await slider(0, .4); assert.match(await text(), /decaying/);
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []);
      assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
      const screenshot = `${dir}/${id}-${theme}.png`;
      await page.locator('#shot').screenshot({ path: screenshot });
      results.push({ id, theme, status: 'passed', screenshot });
    } catch (error) { results.push({ id, theme, status: 'failed', error: String(error.stack || error) }); }
    finally { await page.close(); }
    console.log(`${results.at(-1).status === 'passed' ? '✓' : '✗'} ${id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
writeFileSync('/tmp/atlas-followup-browser.json', JSON.stringify(results, null, 2) + '\n');
const failures = results.filter(r => r.status !== 'passed');
for (const f of failures) console.error(f.id, f.theme, f.error);
console.log(`${results.length} native interaction groups, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
