// Actual light/dark inputs for reviewed aerospace chapter visualizations.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { loadAll } from '../scripts/lib.mjs';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const { items } = await loadAll();
const requested = process.argv.slice(2);
const targets = items.filter(i => i.col === 'aero' && (requested.length ? requested.includes(i.id) : i.chapter === 4));
assert.equal(targets.length, requested.length || 8);
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [], dir = '/tmp/atlas-aero-shots'; mkdirSync(dir, { recursive: true });
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
        case '3.7': await slider(0,1,true); await slider(1,14); assert.match(await text(),/outside its published range/); await slider(0,.15,true); break;
        case '4.1': await slider(0,.9); await slider(1,6); break;
        case '4.2': await slider(0,.98); await slider(1,6); await click('supercritical'); break;
        case '4.3': await slider(0,60); await slider(1,.15); await slider(2,.8); break;
        case '4.4': await slider(0,1); await slider(1,.6); await slider(2,.54); assert.match(await text(),/1.000 times the minimum/); break;
        case '4.5': await click('strong'); await slider(0,1.1); await slider(1,1); await slider(1,-35); assert.match(await text(),/isentropic/); break;
        case '4.6': await slider(1,0); await slider(2,0); assert.match(await text(),/zero drag in both models/); await slider(0,1.15); await slider(1,10); await slider(2,10); assert.match(await text(),/unavailable/); break;
        case '4.7': await slider(0,90); await slider(1,.01,true); await slider(2,.4); await drag(6,1000,12,1000); assert.match(await text(),/cold-wall flux/); break;
        case '4.8': await slider(0,1); await slider(1,.6); await slider(2,.12); assert.match(await text(),/smaller, fully-indented volume/); break;
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
const report = requested.length ? `/tmp/atlas-aero-browser-${requested.join('-')}.json` : '/tmp/atlas-aero-browser.json';
writeFileSync(report, JSON.stringify(results,null,2)+'\n');
const failures=results.filter(r=>r.status!=='passed'); failures.forEach(f=>console.error(f.id,f.theme,f.error));
console.log(`${results.length} light/dark input groups, ${failures.length} failed`); process.exitCode=failures.length?1:0;
