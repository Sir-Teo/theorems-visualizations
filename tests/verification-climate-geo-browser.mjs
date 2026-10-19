import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[], dir='/tmp/atlas-climate-geo-shots';mkdirSync(dir,{recursive:true});
try {
 for(const theme of ['light','dark'])for(const num of (process.argv.length>2?process.argv.slice(2):['3.9','4.5','4.7'])) {
  const id='geo-'+num,page=await browser.newPage({viewport:{width:1300,height:1500}});await installBrowserAssets(page.context());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const text=async()=>{await settle();return page.locator('.viz-readout').innerText();};
  const slider=async(i,x,log=false)=>{await page.locator('#viz input[type=range]').nth(i).evaluate((el,x)=>{el.value=String(x.log?Math.log10(x.value):x.value);el.dispatchEvent(new Event('input',{bubbles:true}));},{value:x,log});await settle();};
  try {
   const file=num==='3.9'?'content/geo/ch03-b.js':'content/geo/ch04-b.js';
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&still&wait=100`);
   await page.waitForFunction(()=>window.__done,null,{timeout:60000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
   assert.match(await page.evaluate(()=>window.__done.renderer),/^KaTeX 0\.16\.11$/);const initial=await text();
   if(num==='3.9'){
    await slider(0,1);await slider(1,2.5);await slider(2,100);await slider(3,40);
    const pt=await page.evaluate(()=>{const s=window.__vizStages[2],r=s.canvas.getBoundingClientRect();return{x:r.x+s.X(28),y:r.y+s.Y(74.3),tx:r.x+s.X(33),ty:r.y+s.Y(90)};});
    // Find the actual handle's vertical position from its analytic model, then drag it.
    const {potentialIntensity}=await import('../content/geo/ch03.shared.js');
    pt.y=await page.evaluate(y=>{const s=window.__vizStages[2];return s.canvas.getBoundingClientRect().y+s.Y(y);},potentialIntensity(28).V);
    await page.mouse.move(pt.x,pt.y);await page.mouse.down();await page.mouse.move(pt.tx,pt.ty,{steps:10});await page.mouse.up();
    assert.match(await text(),/SST 33.0/);assert.match(await text(),/dissipative-heating coefficient/);assert.doesNotMatch(await text(),/category/);
   }else if(num==='4.5'){
    const before=await page.evaluate(()=>window.__vizStages[2].bounds.x[1]);await page.getByRole('button',{name:'free top surface',exact:true}).click();await settle();
    const after=await page.evaluate(()=>window.__vizStages[2].bounds.x[1]);assert.ok(Math.abs(after/before-2)<1e-10);
    await slider(0,1e-4,true);await slider(1,3);await slider(2,8);await slider(3,.02);assert.notEqual(await text(),initial);
   }else{
    await slider(2,.1);assert.match(await text(),/Surface current 3.8|Surface current.*3.8/);assert.match(await text(),/bottom stress/);
    const shallow=await text();await slider(0,.4);await slider(1,20);await slider(2,3);assert.notEqual(await text(),shallow);assert.match(await text(),/45.0/);
   }
   assert.doesNotMatch(await text(),/NaN|Infinity/);assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
   const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',initial,final:await text(),screenshot});
  }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(id,theme,e.message);}finally{await page.close();}
  console.log(`${results.at(-1).status==='passed'?'✓':'✗'} ${id} ${theme}`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync('/tmp/atlas-climate-geo-browser.json',JSON.stringify(results,null,2)+'\n');
console.log(`${results.length} geo groups, ${results.filter(r=>r.status==='failed').length} failed`);process.exitCode=results.some(r=>r.status==='failed')?1:0;
