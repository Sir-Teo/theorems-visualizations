import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const server = createServer({ verificationAssets: true });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [], dir = '/tmp/tech-2-2-label-shots';
mkdirSync(dir, { recursive: true });
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1240, height: 1500 } });
    await installBrowserAssets(page.context(), { local: true });
    const errors = [], states = [];
    page.on('pageerror', e => errors.push(e.message));
    const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const drag = async diameter => {
      const p = await page.evaluate(d => {
        const s = window.__vizStages[0], h = s.handles[0], b = s.canvas.getBoundingClientRect();
        return { x: b.x + s.X(h.x), y: b.y + s.Y(h.y), ty: b.y + s.Y(.6 + d) };
      }, diameter);
      await page.mouse.move(p.x, p.y); await page.mouse.down();
      await page.mouse.move(p.x, p.ty, { steps: 12 }); await page.mouse.up();
      await page.mouse.move(10, 10); await settle();
    };
    const check = async (name, diameter, ground, wet = false, tonnes = 2) => {
      await settle();
      const p = await page.evaluate(() => {
        const s = window.__vizStages[0], h = s.handles[0];
        const bars = window.__vizStages[2];
        return { label: window.__wheelLabel, width: s.W, height: s.H, sandCaption: window.__sandCaption, barWidth: bars.W, barHeight: bars.H, handle: [h.x, h.y], readout: document.querySelector('.viz-readout').innerText, blank: window.__inspectCanvases() };
      });
      assert.ok(p.label, 'the wheel-size label was painted');
      assert.ok(p.label.left >= 0 && p.label.right <= p.width && p.label.top >= 0 && p.label.bottom <= p.height, JSON.stringify(p));
      if (ground === 'sand') {
        assert.equal(p.sandCaption.length, 2);
        for (const b of p.sandCaption) assert.ok(b.left >= 0 && b.right <= p.barWidth && b.top >= 0 && b.bottom <= p.barHeight, JSON.stringify(p));
        assert.ok(p.sandCaption[0].bottom < p.sandCaption[1].top, 'caption lines do not overlap');
      }
      assert.equal(p.handle[0], 10.2);
      assert.ok(Math.abs(p.handle[1] - .6 - diameter) < .015, JSON.stringify(p.handle));
      assert.deepEqual(p.blank, []); assert.doesNotMatch(p.readout, /NaN|Infinity/);
      // Independently recompute the unchanged force model from actual dragged diameter.
      const d = p.handle[1] - .6, weight = tonnes * 1000 * 9.81;
      const cart = .08 * weight * .04 / (d / 2) + weight * Math.sqrt((ground === 'sand' ? .03 : .002) / d);
      const sled = (ground === 'sand' ? wet ? .25 : .5 : .45) * weight;
      const shownCart = Number(p.readout.match(/total\s+([\d.]+) kN/)[1]);
      assert.ok(Math.abs(shownCart - cart / 1000) <= .005 * cart / 1000);
      assert.match(p.readout, new RegExp(`sledge[\\s\\S]*${Number((sled / 1000).toPrecision(3))} kN`));
      const screenshot = `${dir}/${theme}-${name}.png`;
      await page.locator('#shot').screenshot({ path: screenshot });
      states.push({ name, ground, wet, diameter, ...p, expectedCartKN: cart / 1000, screenshot });
    };
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/tech/ch02.js&id=tech-2.2&theme=${theme}&w=1080&wait=150&still`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 });
      assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
      await page.evaluate(() => {
        const s = window.__vizStages[0], c = s.ctx, text = c.fillText.bind(c);
        c.fillText = (str, x, y, ...args) => {
          if (str === 'wheel size') {
            const m = c.measureText(str);
            window.__wheelLabel = { left: x - m.actualBoundingBoxLeft, right: x + m.actualBoundingBoxRight, top: y - m.actualBoundingBoxAscent, bottom: y + m.actualBoundingBoxDescent, align: c.textAlign, baseline: c.textBaseline };
          }
          return text(str, x, y, ...args);
        };
        const bars = window.__vizStages[2], bc = bars.ctx, bt = bc.fillText.bind(bc), clear = bc.clearRect.bind(bc);
        window.__sandCaption = [];
        bc.clearRect = (...args) => { window.__sandCaption = []; return clear(...args); };
        bc.fillText = (str, x, y, ...args) => {
          if (str === 'sledge,' || str === 'wetted sand') {
            const m = bc.measureText(str);
            window.__sandCaption.push({ text: str, left: x - m.actualBoundingBoxLeft, right: x + m.actualBoundingBoxRight, top: y - m.actualBoundingBoxAscent, bottom: y + m.actualBoundingBoxDescent });
          }
          return bt(str, x, y, ...args);
        };
        s.rt.invalidate();
      });
      await check('default', 1, 'earth');
      for (const d of [.3, 1, 1.8]) { await drag(d); await check(`earth-${d}`, d, 'earth'); }
      await page.getByRole('button', { name: 'dry sand', exact: true }).click();
      await check('sand-1.8', 1.8, 'sand');
      for (const d of [.3, 1]) { await drag(d); await check(`sand-${d}`, d, 'sand'); }
      await page.locator('.ctl-toggle label').nth(1).click(); await check('sand-wet', 1, 'sand', true);
      await page.locator('.ctl-toggle label').nth(1).click(); await check('sand-restored', 1, 'sand');
      await page.getByRole('button', { name: 'packed earth', exact: true }).click(); await check('earth-restored', 1, 'earth');
      await page.locator('input[type="range"]').evaluate(i => { i.value = i.max; i.dispatchEvent(new Event('input', { bubbles: true })); });
      await drag(.3); await check('earth-small-wheel-max-load', .3, 'earth', false, 20);
      assert.deepEqual(errors, []);
      assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []);
      assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
      assert.ok(await page.locator('.katex').count() > 0);
      results.push({ theme, status: 'passed', states });
    } catch (e) { results.push({ theme, status: 'failed', states, error: String(e.stack || e) }); }
    finally { await page.close(); }
    console.log(results.at(-1).status, theme);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
writeFileSync('/tmp/tech-2-2-label-browser.json', JSON.stringify(results, null, 2) + '\n');
for (const r of results.filter(r => r.status === 'failed')) console.error(r.error);
process.exitCode = results.some(r => r.status === 'failed') ? 1 : 0;
