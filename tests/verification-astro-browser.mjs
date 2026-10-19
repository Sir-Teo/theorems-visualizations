import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[], dir='/tmp/atlas-astro-shots';mkdirSync(dir,{recursive:true});
try {
 for(const theme of ['light','dark'])for(const num of (process.argv.length>2?process.argv.slice(2):['4.1','4.3','4.6','4.7','4.8','4.9','4.10','4.11','4.12'])) {
  const id='astro-'+num,page=await browser.newPage({viewport:{width:1300,height:1500}});await installBrowserAssets(page.context());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const text=async()=>{await settle();return page.locator('.viz-readout').innerText();};
  const slider=async(i,x,log=false)=>{await page.locator('#viz input[type=range]').nth(i).evaluate((el,x)=>{el.value=String(x.log?Math.log10(x.value):x.value);el.dispatchEvent(new Event('input',{bubbles:true}));},{value:x,log});await settle();};
  try {
   const file=['4.1','4.3','4.6'].includes(num)?'content/astro/ch04.js':'content/astro/ch04-b.js';
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&still&wait=100`,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__done,null,{timeout:60000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
   assert.match(await page.evaluate(()=>window.__done.renderer),/^KaTeX 0\.16\.11$/);const initial=await text();
   const click=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
   const drag=async(i,x,y,tx,ty)=>{const p=await page.evaluate(q=>{const s=window.__vizStages[q.i],r=s.canvas.getBoundingClientRect();return{x:r.x+s.X(q.x),y:r.y+s.Y(q.y),tx:r.x+s.X(q.tx),ty:r.y+s.Y(q.ty)};},{i,x,y,tx,ty});await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.tx,p.ty,{steps:10});await page.mouse.up();await settle();};
   if(num==='4.1'){
    await slider(0,3000,true);await slider(1,365);await slider(2,0);await click('0.03 mas');assert.match(await text(),/good distance/);await click('10 mas');assert.match(await text(),/weak parallax/);
   }else if(num==='4.3'){
    await click('faint example M = 15.5');assert.match(await text(),/15.50/);await click('Vega (BSC5 V ≈ 0.48)');assert.match(await text(),/0.48/);await drag(1,5,.01,10,.0001);assert.notEqual(await text(),initial);
   }else if(num==='4.6'){
    await slider(0,30000,true);assert.ok(await page.evaluate(()=>window.__vizStages[0].bounds.y[1]>4));assert.match(await text(),/Ballesteros/);await slider(0,2500,true);
   }else if(num==='4.7'){
    await slider(0,10000);await slider(1,10000);assert.match(await text(),/no lines/);await slider(1,12000);assert.match(await text(),/emission lines/);await slider(0,3000);await slider(2,8,true);
   }else if(num==='4.8'){
    const {popFrac}=await import('../content/astro/ch04.shared.js');await drag(0,9000,popFrac(2,9000),40000,popFrac(2,40000));
    const before=await text();await slider(0,30);assert.match(await text(),/cutoff 30/);assert.notEqual(await text(),before);await page.locator('#viz .switch-track').click();assert.notEqual(await text(),before);
   }else if(num==='4.9'){
    await slider(0,.05,true);const low=await text();await slider(0,2000,true);assert.notEqual(await text(),low);assert.match(await text(),/50 % ionized/);const {ionFrac}=await import('../content/astro/ch04.shared.js');await drag(0,9500,ionFrac(9500,2000),25000,ionFrac(25000,2000));assert.match(await text(),/25000/);
   }else if(num==='4.10'){
    await slider(0,.5,true);const low=await text();await slider(0,2000,true);assert.notEqual(await text(),low);assert.match(await text(),/maximum at/);
   }else if(num==='4.11'){
    await drag(0,-Math.log10(8000),1,-Math.log10(20000),-2);assert.match(await text(),/white dwarf/);const p=await page.evaluate(()=>{const s=window.__vizStages[0],r=s.canvas.getBoundingClientRect();return{x:r.x+s.X(-Math.log10(17200)),y:r.y+s.Y(Math.log10(.01349))};});await page.mouse.move(p.x,p.y);await settle();assert.match(await text(),/40 Eridani B/);assert.match(await text(),/17200/);
   }else{
    await drag(0,.3,-3.1,Math.log10(31),-3.1);await drag(0,-.6,-3.1,Math.log10(8),-3.1);assert.match(await text(),/slope 2.9/);await page.locator('#viz .switch-track').click();assert.doesNotMatch(await text(),/choose a wider/);
   }
   assert.doesNotMatch(await text(),/NaN|Infinity/);assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
   const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',initial,final:await text(),screenshot});
  }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(id,theme,e.message);}finally{await page.close();}
  console.log(`${results.at(-1).status==='passed'?'✓':'✗'} ${id} ${theme}`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync('/tmp/atlas-astro-browser.json',JSON.stringify(results,null,2)+'\n');
console.log(`${results.length} stellar groups, ${results.filter(r=>r.status==='failed').length} failed`);process.exitCode=results.some(r=>r.status==='failed')?1:0;
