// Actual light/dark inputs for every solar-energy chapter visualization.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { loadAll } from '../scripts/lib.mjs';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const { items } = await loadAll();
const requested = process.argv.slice(2);
const targets = items.filter(i => i.col === 'energy' && i.chapter === 4 && (!requested.length || requested.includes(i.id)));
assert.equal(targets.length, requested.length || 12);
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [], dir = '/tmp/atlas-energy-shots'; mkdirSync(dir, { recursive: true });
try {
  for (const theme of ['light', 'dark']) for (const it of targets) {
    const page = await browser.newPage({ viewport: { width: 1150, height: 1400 } });
    await installBrowserAssets(page.context());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${it.file}&id=${it.id}&theme=${theme}&wait=200`);
      await page.waitForFunction(() => window.__done, null, { timeout: 120000 });
      const done = await page.evaluate(() => window.__done);
      assert.deepEqual(done.errors, []); assert.deepEqual(done.blank, []);
      assert.equal(done.renderer, 'KaTeX 0.16.11');
      const text = async () => { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); return page.locator('.viz-readout').innerText(); };
      const before = await text();
      const slider = async (n, x, log = false) => {
        await page.locator('#viz input[type=range]').nth(n).evaluate((el, x) => { el.value = String(x); el.dispatchEvent(new Event('input', { bubbles: true })); }, log ? Math.log10(x) : x);
        await text();
      };
      const click = name => page.getByRole('button', { name, exact: true }).click({ timeout: 120000 });
      const drag = async (x, y, tx, ty) => {
        const p = await page.evaluate(({x,y,tx,ty}) => { const s=window.__vizStages[0], r=s.canvas.getBoundingClientRect(), hd=s.handles.filter(h=>h.visible!==false).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0]; return {x:r.x+s.X(hd.x),y:r.y+s.Y(hd.y),tx:r.x+s.X(tx),ty:r.y+s.Y(ty)}; }, {x,y,tx,ty});
        await page.mouse.move(p.x,p.y); await page.mouse.down(); await page.mouse.move(p.tx,p.ty,{steps:8}); await page.mouse.up(); await text();
      };
      switch(it.num) {
        case '4.1': await slider(0, 6500); await click('through air (schematic)'); await slider(1, 4); assert.match(await text(), /schematic air path/); break;
        case '4.2': await slider(0, -45); await slider(1, 355); break;
        case '4.3': await slider(2, 2); await page.locator('.ctl-select button').last().click(); await slider(0, .01, true); break;
        case '4.4': await drag(.45,30,.25,30); await click('3 Ω cm²'); break;
        case '4.5': await slider(0,.4); await slider(1,Math.log10(46200)); await click('both faces'); assert.doesNotMatch(await text(), /NaN|Infinity/); break;
        case '4.6': await drag(1.8,.03,2.1,.03); await click('independent (4-terminal)'); await click('3'); await click('optimise the gaps'); break;
        case '4.7': await slider(0,60); await click('fixed 0.50 V'); break;
        case '4.8': await slider(0,45); await slider(1,1.2); assert.match(await text(), /83 °C/); break;
        case '4.9': await click('clear'); await click('one cell'); {
          const p=await page.evaluate(()=>{const s=window.__vizStages[0],r=s.canvas.getBoundingClientRect();return{x:r.x+s.X(.8),y:r.y+s.Y(.5)}});
          await page.mouse.click(p.x,p.y); assert.match(await text(), /2 of 60 cells shaded/);
        } break;
        case '4.10': await slider(0,90); await click('trough (2D)'); assert.match(await text(), /215/); break;
        case '4.11': await drag(.3,10,.2,10); await click('modern silicon (illustrative)'); await slider(0,.05,true); break;
        case '4.12': await slider(0,.4); await slider(2,Math.log10(1/2.18e-5)); await click('one face'); break;
      }
      const after = await text(); assert.notEqual(after,before,`${it.id}: input changes readout`);
      assert.doesNotMatch(after,/NaN|Infinity/);
      assert.deepEqual(errors,[]); assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);
      assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
      const screenshot = `${dir}/${it.id}-${theme}.png`; await page.locator('#shot').screenshot({path:screenshot});
      results.push({id:it.id,theme,status:'passed',screenshot,readout:after});
    } catch(error) { results.push({id:it.id,theme,status:'failed',error:String(error.stack||error)}); }
    finally { await page.close(); }
    console.log(`${results.at(-1).status === 'passed' ? '✓' : '✗'} ${it.id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(r=>server.close(r)); }
const report = requested.length ? `/tmp/atlas-energy-browser-${requested.join('-')}.json` : '/tmp/atlas-energy-browser.json';
writeFileSync(report, JSON.stringify(results,null,2)+'\n');
const failures=results.filter(r=>r.status!=='passed'); failures.forEach(f=>console.error(f.id,f.theme,f.error));
console.log(`${results.length} light/dark input groups, ${failures.length} failed`); process.exitCode=failures.length?1:0;
