import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[], dir='/tmp/atlas-geog-shots';mkdirSync(dir,{recursive:true});
try {
 for(const theme of ['light','dark'])for(const num of (process.argv.length>2?process.argv.slice(2):['5.1','5.2','5.3','5.4','5.7','6.1','6.2','6.3','6.5'])) {
  const id='geog-'+num,page=await browser.newPage({viewport:{width:1300,height:1500}});await installBrowserAssets(page.context());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const text=async()=>{await settle();return page.locator('.viz-readout').innerText();};
  const slider=async(i,x,log=false)=>{await page.locator('#viz input[type=range]').nth(i).evaluate((el,x)=>{el.value=String(x.log?Math.log10(x.value):x.value);el.dispatchEvent(new Event('input',{bubbles:true}));},{value:x,log});await settle();};
  try {
   const file=num==='5.7'?'content/geog/ch05-b.js':num==='6.5'?'content/geog/ch06-b.js':num.startsWith('5.')?'content/geog/ch05.js':'content/geog/ch06.js';
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&still&wait=100`,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__done,null,{timeout:60000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
   assert.match(await page.evaluate(()=>window.__done.renderer),/^KaTeX 0\.16\.11$/);const initial=await text();
   const click=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
   if(num==='5.1'){
    await click('London – Tokyo');await page.locator('#viz .switch-track').click();assert.notEqual(await text(),initial);assert.match(await text(),/rhumb line/);
   }else if(num==='5.2'){
    await slider(0,20);await click('Pass through the antipode N');assert.match(await text(),/straight line/);
    await slider(0,100);assert.doesNotMatch(await text(),/straight line/);assert.match(await text(),/fit a circle/);
   }else if(num==='5.3'){
    const {projection}=await import('../assets/js/viz/kits/globe.js'),P=projection('orthographic',{center:[10,25]}),a=P.forward([52,38]),b=P.forward([95,25]);
    const p=await page.evaluate(q=>{const s=window.__vizStages[1],r=s.canvas.getBoundingClientRect();return {x:r.x+s.X(q.a[0]),y:r.y+s.Y(q.a[1]),tx:r.x+s.X(q.b[0]),ty:r.y+s.Y(q.b[1])};},{a,b});
    await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.tx,p.ty,{steps:10});await page.mouse.up();assert.notEqual(await text(),initial);assert.match(await text(),/clipped at centre or limb/);
   }else if(num==='5.4'){
    await click('North Pole');assert.notEqual(await text(),initial);await click('Quito');assert.match(await text(),/true initial bearing/);
   }else if(num==='5.7'){
    await slider(0,10);await slider(1,10);assert.match(await text(),/tangent cone/);await slider(0,80);await slider(1,80);assert.notEqual(await text(),initial);
   }else if(num==='6.1'){
    await click('equirectangular (contrast)');assert.match(await text(),/plate carrée inflates/);await click('sinusoidal');await slider(0,170);assert.match(await text(),/equal-area: exactly 1/);await page.locator('#viz .switch-track').click();
   }else if(num==='6.2'){
    await click('t₀ ≈ ±π');assert.notEqual(await text(),initial);await page.locator('#viz .switch-track').nth(0).click();await page.locator('#viz .switch-track').nth(1).click();assert.match(await text(),/Area factor/);
   }else if(num==='6.3'){
    await click('Winkel tripel');assert.match(await text(),/0.389/);await click('Van der Grinten');assert.match(await text(),/badly exaggerated/);await slider(0,-175);
   }else{
    await click('Icosahedron');assert.match(await text(),/3.88/);await click('Sinus. (int.)');assert.match(await text(),/equal-area up to numerical error/);await page.locator('#viz .switch-track').click();
   }
   assert.doesNotMatch(await text(),/NaN|Infinity/);assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
   const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',initial,final:await text(),screenshot});
  }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(id,theme,e.message);}finally{await page.close();}
  console.log(`${results.at(-1).status==='passed'?'✓':'✗'} ${id} ${theme}`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync('/tmp/atlas-geog-browser.json',JSON.stringify(results,null,2)+'\n');
console.log(`${results.length} geography groups, ${results.filter(r=>r.status==='failed').length} failed`);process.exitCode=results.some(r=>r.status==='failed')?1:0;
