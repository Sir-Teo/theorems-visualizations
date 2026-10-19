import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const dir = '/tmp/arch-source-verification-shots'; mkdirSync(dir, { recursive: true }); const results = [];
const ids = process.env.ARCH_SOURCE_ITEMS ? process.env.ARCH_SOURCE_ITEMS.split(',') : ['3.7','3.10','4.1','4.2','4.6','4.7','4.8','4.9'];
try {
  for (const theme of ['light', 'dark']) for (const num of ids) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1700 } }); await installBrowserAssets(page.context());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const read = async () => { await settle(); return page.locator('.viz-readout').innerText(); };
    const slider = async (n, value) => { await page.locator('#viz input[type=range]').nth(n).evaluate((el, value) => { el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, value); await settle(); };
    const id = `arch-${num}`, file = num === '3.7' ? 'content/arch/ch03.js' : num === '3.10' ? 'content/arch/ch03-b.js' : num === '4.1' || num === '4.2' ? 'content/arch/ch04.js' : 'content/arch/ch04-b.js';
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=150&still`);
      await page.waitForFunction(() => window.__done, null, { timeout: 60000 }); assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
      if(num==='3.7'){
        await slider(1,135);await slider(0,.8);assert.doesNotMatch(await read(),/NaN|Infinity/);
        assert.ok(await page.evaluate(()=>{const s=window.__vizStages[1];return s.X(.8)<=s.canvas.width;}));
      }else if(num==='3.10'){
        await slider(0,120);await slider(1,.8);await slider(2,3000);assert.match(await read(),/enough/);
        assert.ok(await page.evaluate(()=>{const s=window.__vizStages[1];return s.Y(2600)>=0;}));
      }else if(num==='4.1'){
        const before=await read();await page.getByRole('button',{name:'barrel vault',exact:true}).click();assert.notEqual(await read(),before);await slider(1,.8);await page.getByRole('button',{name:'groin vault',exact:true}).click();assert.match(await read(),/vertical-load surrogate/);
      }else if(num==='4.2'){
        const before=await read();await page.locator('#viz .ctl-toggle label').click();assert.notEqual(await read(),before);await slider(1,1);
      }else if(num==='4.6'){
        assert.match(await read(),/Whole shell weight/);const mass=async()=>Number((await read()).match(/Whole shell weight: (\d+)/)[1]);const initial=await mass();await slider(2,64);assert.equal(await mass(),initial);await slider(2,16);assert.equal(await mass(),initial);await slider(0,1);assert.match(await read(),/does not prove collapse|Whole shell weight/);
      }else if(num==='4.7'){
        await page.getByRole('button',{name:'uniform heavy',exact:true}).click();await slider(1,2.5);await slider(2,0);await page.locator('#viz .ctl-toggle label').click();assert.doesNotMatch(await read(),/NaN|Infinity/);
        assert.ok(await page.evaluate(()=>{const s=window.__vizStages[1];return s.Y(1700)>=0;}));
      }else if(num==='4.8'){
        await slider(0,1);await slider(2,1);assert.ok(await page.evaluate(()=>window.__vizStages[0].Y(38)>0));await slider(1,.2);assert.doesNotMatch(await read(),/NaN|Infinity/);
      }else if(num==='4.9'){
        await page.getByRole('button',{name:'separate spherical cap',exact:true}).click();await slider(1,1.2);assert.doesNotMatch(await read(),/NaN|Infinity/);await page.getByRole('button',{name:'same sphere (sail)',exact:true}).click();await slider(0,.6);assert.match(await read(),/leaves the square/);
      }else if(num==='4.11'){
        await page.evaluate(()=>{
          window.__thrustWidths=[];
          const stage=window.__vizStages[0],line=stage.line;
          stage.line=function(...args){window.__thrustWidths.push(args[4]?.width);return line.apply(this,args);};
        });
        for(const shape of ['sail vault','cross vault','cloister vault']){
          await page.getByRole('button',{name:shape,exact:true}).click();
          // Large diagonal contrast formerly generated tensile edges and negative widths.
          await slider(1,-10);await slider(2,12);await slider(3,-.5);await slider(4,12);
          assert.doesNotMatch(await read(),/NaN|Infinity/);
          assert.ok(await page.evaluate(()=>window.__thrustWidths.length>0&&window.__thrustWidths.every(w=>Number.isFinite(w)&&w>0)));
        }
        await page.locator('#viz .ctl-toggle label').click();assert.doesNotMatch(await read(),/NaN|Infinity/);
        await page.locator('#viz .ctl-toggle label').click();
        for(const section of ['y = 0.5','diagonal','y = 0'])await page.getByRole('button',{name:section,exact:true}).click();
        await page.getByRole('button',{name:'find the best network',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);
      }
      assert.deepEqual(errors, []); assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []); assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
      assert.ok(await page.evaluate(() => typeof window.katex?.render === 'function'));
      assert.ok(await page.locator('.katex').count() > 0);
      const screenshot = `${dir}/${id}-${theme}.png`; await page.locator('#shot').screenshot({ path: screenshot }); results.push({ id, theme, status: 'passed', screenshot });
    } catch (e) { results.push({ id, theme, status: 'failed', error: String(e.stack || e) }); }
    finally { await page.close(); }
    console.log(`${results.at(-1).status} ${id} ${theme}`);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
writeFileSync('/tmp/arch-source-verification-browser.json', JSON.stringify(results, null, 2) + '\n');
for (const r of results.filter(r => r.status === 'failed')) console.error(r.id, r.theme, r.error);
process.exitCode = results.some(r => r.status === 'failed') ? 1 : 0;
