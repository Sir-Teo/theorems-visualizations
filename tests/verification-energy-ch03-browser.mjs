// Actual light/dark inputs for reviewed fuels/nuclear chapter visualizations.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { loadAll } from '../scripts/lib.mjs';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const { items } = await loadAll();
const requested = process.argv.slice(2);
const targets = items.filter(i => i.col === 'energy' && i.chapter === 3 && (!requested.length || requested.includes(i.id)));
assert.equal(targets.length, requested.length || 10);
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [], dir = '/tmp/atlas-energy-ch03-shots'; mkdirSync(dir, { recursive: true });
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
        case '3.1': await click('wood model (6 % H, wet)'); await slider(0,.5); await slider(1,1); break;
        case '3.2': await slider(0,.65); await slider(1,.25); break;
        case '3.3': await slider(0,.02); await slider(1,.99); await slider(2,4.5); break;
        case '3.4': await slider(0,5000,true); await page.locator('input[type=checkbox]').check(); break;
        case '3.5': await click('D + T fusion'); break;
        case '3.6': await click('graphite'); await slider(0,.72,true); await slider(1,400,true); break;
        case '3.7': await slider(0,1.3); await slider(1,1e-5,true); break;
        case '3.8': await slider(0,1.4); await slider(1,1e-5,true); assert.match(await text(),/trace stops/); await click('step, scram at 10 s'); await slider(0,.3); assert.match(await text(),/60.00 s/); break;
        case '3.9': await slider(0,4000); await slider(1,1500,true); await slider(2,20,true); break;
        case '3.10': await slider(0,3e21,true); await slider(1,80); await slider(2,20,true); break;
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
const report = requested.length ? `/tmp/atlas-energy-ch03-browser-${requested.join('-')}.json` : '/tmp/atlas-energy-ch03-browser.json';
writeFileSync(report, JSON.stringify(results,null,2)+'\n');
const failures=results.filter(r=>r.status!=='passed'); failures.forEach(f=>console.error(f.id,f.theme,f.error));
console.log(`${results.length} light/dark input groups, ${failures.length} failed`); process.exitCode=failures.length?1:0;
