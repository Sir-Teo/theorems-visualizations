import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { loadAll } from '../scripts/lib.mjs';
const {items}=await loadAll(),ids=process.argv.slice(2);
const selected=items.filter(x=>typeof x.viz==='function'&&(ids.length?ids.includes(x.id):x.col==='rca'&&x.chapter===5));
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[],dir='/tmp/atlas-rca-shots';mkdirSync(dir,{recursive:true});
try {
 for(const theme of ['light','dark'])for(const item of selected){
  const page=await browser.newPage({viewport:{width:1250,height:1700}});await installBrowserAssets(page.context());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));let sliderSweeps=0,drags=0,options=0;
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const text=async()=>{await settle();return page.locator('.viz-readout').allInnerTexts();};
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${item.file}&id=${item.id}&theme=${theme}&still&wait=100`);
   await page.waitForFunction(()=>window.__done,null,{timeout:60000});
   assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);assert.match(await page.evaluate(()=>window.__done.renderer),/^KaTeX 0\.16\.11$/);
   const initial=await text();
   for(const el of await page.locator('#viz input[type=range]').all()){
    if(!await el.isVisible())continue;
    const original=await el.inputValue();
    for(const endpoint of ['min','max']){
     await el.evaluate((e,key)=>{e.value=e[key];e.dispatchEvent(new Event('input',{bubbles:true}));},endpoint);await settle();sliderSweeps++;
     assert.doesNotMatch((await text()).join(' '),/NaN|Infinity/);
    }
    await el.evaluate((e,value)=>{e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));},original);await settle();
   }
   for(const seg of await page.locator('#viz .seg').all()){
    if(!await seg.isVisible())continue;
    const buttons=await seg.locator('button').all();let original=0;
    for(let i=0;i<buttons.length;i++)if(await buttons[i].evaluate(b=>b.classList.contains('on')))original=i;
    for(const button of buttons){if(await button.isVisible()){await button.click();await settle();options++;assert.doesNotMatch((await text()).join(' '),/NaN|Infinity/);}}
    await buttons[original].click();await settle();
   }
   for(const track of await page.locator('#viz .switch-track').all()){
    if(!await track.isVisible())continue;
    await track.click();await settle();options++;
    assert.doesNotMatch((await text()).join(' '),/NaN|Infinity/);
    await track.click();await settle();
   }
   const handles=await page.evaluate(()=>window.__vizStages.flatMap((s,i)=>(s.handles||[]).filter(h=>h.visible!==false).map((h,j)=>({stage:i,index:j,x:h.x,y:h.y}))));
   for(const h of handles){
    const point=await page.evaluate(h=>{const s=window.__vizStages[h.stage],r=s.canvas.getBoundingClientRect();return {x:r.x+s.X(h.x),y:r.y+s.Y(h.y),tx:r.x+s.X(h.x+.12),ty:r.y+s.Y(h.y+.08)};},h);
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.tx,point.ty,{steps:5});await page.mouse.up();await settle();drags++;
   }
   const scenes=await page.evaluate(()=>window.__vizStages.flatMap((s,i)=>Number.isFinite(s.yaw)?[{i,yaw:s.yaw}]:[]));
   for(const scene of scenes){
    const point=await page.evaluate(({i})=>{const r=window.__vizStages[i].canvas.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};},scene);
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+25,point.y+12,{steps:5});await page.mouse.up();await settle();
    assert.notEqual(await page.evaluate(i=>window.__vizStages[i].yaw,scene.i),scene.yaw,'3D pointer drag rotates the scene');drags++;
   }
   if(item.col==='ml'){
    for(const button of await page.locator('#viz .viz-controls button').all()){
     if(await button.evaluate(b=>!!b.closest('.seg'))||!await button.isVisible())continue;
     await button.click({noWaitAfter:true});await settle();options++;
     assert.doesNotMatch((await text()).join(' '),/NaN|Infinity/);
    }
    if(item.id==='ml-2.1c'){
     const point=await page.evaluate(()=>{const s=window.__vizStages[0],r=s.canvas.getBoundingClientRect();return{x:r.x+s.X(.9),y:r.y+s.Y(.9)};});
     const before=(await text()).join(' ');await page.mouse.click(point.x,point.y);await settle();
     assert.notEqual((await text()).join(' '),before,'adding a papaya updates the sample');options++;
    }
   }
   if(item.id==='rca-5.23'){
    await page.getByRole('button',{name:'polynomial',exact:true}).click();await settle();assert.match((await text()).join(' '),/Coefficient sum/);
    const discrepancy=+(await text()).join(' ').match(/quadrature discrepancy (\d+(?:\.\d+)?e[+-]?\d+)/)[1];assert.ok(discrepancy<1e-10);
   }
   if(item.id==='rca-5.22'){
    const point=await page.evaluate(()=>{const s=window.__vizStages[0],h=s.handles[0],r=s.canvas.getBoundingClientRect();return {x:r.x+s.X(h.x),y:r.y+s.Y(h.y),tx:r.x+s.X(-1),ty:r.y+s.Y(-.68)};});
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.tx,point.ty,{steps:8});await page.mouse.up();await settle();
    assert.match((await text()).join(' '),/Norm-preserving, hence positive/);
   }
   assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
   const screenshot=`${dir}/${item.id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id:item.id,theme,status:'passed',sliderSweeps,drags,options,initial,final:await text(),screenshot});
  }catch(error){results.push({id:item.id,theme,status:'failed',error:String(error.stack||error)});console.error(item.id,theme,error.message);}finally{await page.close();}
  console.log(`${results.at(-1).status==='passed'?'✓':'✗'} ${item.id} ${theme}`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(process.env.ATLAS_RCA_REPORT || '/tmp/atlas-rca-browser.json',JSON.stringify(results,null,2)+'\n');
console.log(`${results.length} groups, ${results.filter(x=>x.status!=='passed').length} failed`);process.exitCode=results.some(x=>x.status!=='passed')?1:0;
