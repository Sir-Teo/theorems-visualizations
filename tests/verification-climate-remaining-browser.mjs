import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[], dir='/tmp/atlas-climate-remaining-shots';mkdirSync(dir,{recursive:true});
try {
 for(const theme of ['light','dark'])for(const num of ['2.14','3.8','3.9','3.10']) {
  const id='climate-'+num,page=await browser.newPage({viewport:{width:1300,height:1500}});await installBrowserAssets(page.context());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const text=async()=>{await settle();return page.locator('.viz-readout').innerText();};
  const slider=async(i,x,log=false)=>{await page.locator('#viz input[type=range]').nth(i).evaluate((el,x)=>{el.value=String(x.log?Math.log10(x.value):x.value);el.dispatchEvent(new Event('input',{bubbles:true}));},{value:x,log});await settle();};
  try {
   const file=num==='2.14'?'content/climate/ch02-d.js':'content/climate/ch03-b.js';
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&still&wait=100`);
   await page.waitForFunction(()=>window.__done,null,{timeout:60000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
   assert.match(await page.evaluate(()=>window.__done.renderer),/^KaTeX 0\.16\.11$/);const initial=await text();
   if(num==='2.14'){
    await slider(2,0);await page.locator('#viz .switch-track').click();await slider(0,5);assert.doesNotMatch(await text(),/NaN|Infinity/);
    const transparent=await text();await slider(2,1);assert.notEqual(await text(),transparent);
    await slider(0,0);assert.match(await text(),/0 panes/);await slider(0,3);
   }else if(num==='3.8'){
    await slider(0,.3);await slider(1,-30);await slider(3,3);assert.match(await text(),/−9\.0|-9\.0/);
    assert.ok(await page.evaluate(()=>window.__vizStages[0].bounds.y[0]<-9));await slider(2,6);assert.doesNotMatch(await text(),/NaN|Infinity/);
   }else if(num==='3.9'){
    for(let i=1;i<4;i++)await page.locator('#viz .switch-track').nth(i).click();
    await slider(0,.7);await slider(1,2);
    const point=await page.evaluate(()=>{const s=window.__vizStages[0],r=s.canvas.getBoundingClientRect();return{x:r.x+s.X(3.93/1.16),y:r.y+s.Y(0),tx:r.x+s.X(7),ty:r.y+s.Y(0)};});
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.tx,point.ty,{steps:8});await page.mouse.up();
    assert.match(await text(),/conditional ECS median/);assert.match(await text(),/excluded and normalized separately/);
    await page.locator('#viz .switch-track').nth(0).click();assert.match(await text(),/switch on at least one line/);
    await page.locator('#viz .switch-track').nth(0).click();assert.doesNotMatch(await text(),/NaN|Infinity/);
   }else{
    await slider(0,300,true);await slider(1,20,true);await slider(2,1000,true);await slider(3,.3);
    assert.match(await text(),/unresolved photon paths 0 of 3000/);
    await slider(1,400,true);await slider(2,20,true);assert.match(await text(),/unresolved photon paths 0 of 3000/);assert.match(await text(),/forcing ≈ [0-9]/);
   }
   assert.doesNotMatch(await text(),/NaN|Infinity/);assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
   const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',initial,final:await text(),screenshot});
  }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(id,theme,e.message);}finally{await page.close();}
  console.log(`${results.at(-1).status==='passed'?'✓':'✗'} ${id} ${theme}`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync('/tmp/atlas-climate-remaining-browser.json',JSON.stringify(results,null,2)+'\n');
console.log(`${results.length} remaining climate groups, ${results.filter(r=>r.status==='failed').length} failed`);process.exitCode=results.some(r=>r.status==='failed')?1:0;
