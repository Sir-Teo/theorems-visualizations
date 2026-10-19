import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const dir='/tmp/epi-source-verification-shots';mkdirSync(dir,{recursive:true});const results=[];
const ids=process.env.EPI_SOURCE_ITEMS?.split(',')||['3.13','4.4','4.5','4.12'];
try{for(const theme of ['light','dark'])for(const num of ids){
 const page=await browser.newPage({viewport:{width:1200,height:1800}});await installBrowserAssets(page.context());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const read=async()=>{await settle();return page.locator('.viz-readout').innerText();};
 const slider=async(n,value)=>{await page.locator('#viz input[type=range]').nth(n).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await settle();};
 const drag=async(n,x,y)=>{const p=await page.evaluate(({n,x,y})=>{const s=window.__vizStages[n],r=s.canvas.getBoundingClientRect(),h=s.handles[0];return{a:[r.x+s.X(h.x),r.y+s.Y(h.y)],b:[r.x+s.X(x),r.y+s.Y(y)]};},{n,x,y});await page.mouse.move(...p.a);await page.mouse.down();await page.mouse.move(...p.b,{steps:12});await page.mouse.up();await settle();};
 const file=num==='3.13'?'ch03-b.js':'ch04.js',id=`epi-${num}`;
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/epi/${file}&id=${id}&theme=${theme}&wait=150&still`,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__done,null,{timeout:60000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
  if(num==='3.13'){
   await slider(0,1);assert.ok(await page.evaluate(()=>window.__vizStages[2].Y(451)>=0));await drag(2,.3,50);assert.ok(await page.evaluate(()=>{const s=window.__vizStages[2];return s.Y(s.handles[0].y)>=0;}));
   await page.getByRole('button',{name:'Draw a sample',exact:true}).click();assert.match(await read(),/in this sample/);
   await page.getByRole('button',{name:'Use expected counts',exact:true}).click();assert.doesNotMatch(await read(),/NaN|Infinity/);
  }else if(num==='4.4'){
   const a=await read();await slider(1,1);assert.notEqual(await read(),a);await slider(2,6);await slider(0,18);assert.match(await read(),/curve alone cannot isolate/);
  }else if(num==='4.5'){
   const a=await read();await slider(0,20);assert.notEqual(await read(),a);await slider(1,1);assert.ok(await page.evaluate(()=>{const s=window.__vizStages[0];return s.Y(.5)>=0;}));await drag(0,1,.012);assert.match(await read(),/effectiveness 100%/);await slider(2,.03);assert.match(await read(),/background alone exceeds/);
  }else{
   await slider(0,-2);assert.ok(await page.evaluate(()=>window.__vizStages[0].Y(100)>=0));await page.getByRole('button',{name:'1950 case–control',exact:true}).click();assert.match(await read(),/case–control odds ratio/);assert.ok(await page.evaluate(()=>window.__vizStages[0].Y(100)>=0));await slider(0,Math.log10(.5));assert.match(await read(),/approximation/);await drag(1,30,10);assert.match(await read(),/gains about 10/);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);if(num==='3.13')assert.ok(await page.locator('.katex').count()>0);assert.ok(await page.evaluate(()=>typeof window.katex?.render==='function'));
  const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',screenshot});
 }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});}finally{await page.close();}
 console.log(`${results.at(-1).status} ${id} ${theme}`);
}}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync('/tmp/epi-source-verification-browser.json',JSON.stringify(results,null,2)+'\n');for(const r of results.filter(r=>r.status==='failed'))console.error(r.id,r.theme,r.error);process.exitCode=results.some(r=>r.status==='failed')?1:0;
