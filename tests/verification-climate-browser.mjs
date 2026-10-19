// Actual native controls in both themes; pinned local KaTeX is mandatory.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server=createServer(); await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[], dir='/tmp/atlas-climate-shots';mkdirSync(dir,{recursive:true});
try {
  for(const theme of ['light','dark']) for(const num of (process.argv[2] ? process.argv[2].split(',').map(Number) : [1,2,3,4,5,7,8])) {
    const id=`climate-4.${num}`, page=await browser.newPage({viewport:{width:1300,height:1400}});
    await installBrowserAssets(page.context());
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const redraw=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const text=async()=>{await redraw();return page.locator('.viz-readout').innerText();};
    const slider=async(i,x)=>{await page.locator('#viz input[type=range]').nth(i).evaluate((el,x)=>{el.value=String(x);el.dispatchEvent(new Event('input',{bubbles:true}));},x);await redraw();};
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/climate/ch04${num>=5?'-b':''}.js&id=${id}&theme=${theme}&wait=100&still`);
      await page.waitForFunction(()=>window.__done,null,{timeout:60000});
      assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
      assert.match(await page.evaluate(()=>window.__done.renderer),/^KaTeX 0\.16\.11$/);
      const initial=await text(); assert.doesNotMatch(initial,/computing|integrating|NaN|Infinity/);
      if(num===1){
        await slider(0,-.8);assert.match(await text(),/limit/);
        await slider(0,1);assert.match(await text(),/no equilibrium/);
        await slider(0,1.3);await slider(2,30);assert.match(await text(),/algebraic equilibrium is unstable/);
        await page.getByRole('button',{name:'AR6 central values',exact:true}).click();assert.match(await text(),/3\.39/);
      } else if(num===2){
        await slider(1,100);const cut=await text();assert.notEqual(cut,initial);
        await slider(1,1000);await slider(0,6);assert.match(await text(),/6\.0/);
      } else if(num===3){
        await page.getByRole('button',{name:'uniform',exact:true}).click();assert.match(await text(),/feedback 0\.00/);
        await page.getByRole('button',{name:'surface-trapped',exact:true}).click();assert.notEqual(await text(),initial);
        await page.locator('#viz .switch-track').click();assert.equal(await page.locator('#viz input[type=checkbox]').isChecked(),true);assert.match(await text(),/relative humidity fixed/);
        await page.getByRole('button',{name:'tropics: moist adiabat',exact:true}).click();await slider(1,4);assert.ok(await page.evaluate(()=>window.__vizStages[0].bounds.x[1]>4),'amplified upper-air warming remains visible');
      } else if(num===4){
        await slider(1,0);assert.match(await text(),/0\.00/);
        await slider(1,.06);assert.match(await text(),/unstable/);
        await slider(0,-40);assert.match(await text(),/equilibri/);
        await page.getByRole('button',{name:'AR6-sized',exact:false}).click();await slider(0,3.93);
      } else if(num===5){
        for(const name of ['low stratocumulus','thin cirrus','deep anvil']){await page.getByRole('button',{name,exact:true}).click();assert.doesNotMatch(await text(),/NaN|Infinity/);}
        await slider(7,-6);await slider(8,6);assert.ok(await page.evaluate(()=>window.__vizStages[1].bounds.y[0]<-1.15),'extreme cloud waterfall remains visible');assert.notEqual(await text(),initial);
      } else if(num===7){
        await slider(0,.02);await slider(1,1.2);await slider(2,0);await slider(3,1.5);
        assert.match(await text(),/No stable equilibrium/);
        await slider(0,1.5);await slider(1,0);await slider(2,-2);await slider(3,-1);
        assert.match(await text(),/amplification/);assert.doesNotMatch(await text(),/No stable/);
      } else if(num===8){
        for(const name of ['uniform','surface-trapped','tropical']){await page.getByRole('button',{name,exact:true}).click();assert.doesNotMatch(await text(),/NaN|Infinity/);}
        await slider(0,.2);await slider(1,10);await slider(2,.01);assert.match(await text(),/error/);
        await slider(0,6);await slider(1,-10);await slider(2,-.01);assert.ok(await page.evaluate(()=>window.__vizStages[2].bounds.y[0]<-23),'six-kelvin Planck response remains visible');assert.notEqual(await text(),initial);
      }
      assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
      const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});
      results.push({id,theme,status:'passed',initial,final:await text(),screenshot});
    }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(id,theme,e.message);}
    finally{await page.close();}
    console.log(`${results.at(-1).status==='passed'?'✓':'✗'} ${id} ${theme}`);
  }
} finally {await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(process.argv[2] ? '/tmp/atlas-climate-browser-recheck.json' : '/tmp/atlas-climate-browser.json',JSON.stringify(results,null,2)+'\n');
for(const r of results.filter(r=>r.status==='failed'))console.error(r.id,r.theme,r.error);
console.log(`${results.length} climate native interaction groups, ${results.filter(r=>r.status==='failed').length} failed`);
process.exitCode=results.some(r=>r.status==='failed')?1:0;
