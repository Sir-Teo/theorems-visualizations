import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';
const inventory={
'ch02-e.js':['2.6.11','2.7.10'], 'ch04-m2.js':['4.3.11','4.4.4'], 'ch04-z1.js':['4.6.9'], 'ch04-z3.js':['4.9.1'],
'ch03.js':['3.2.1a'], 'ch03-b.js':['3.3.1a'], 'ch03-c.js':['3.5.1a'], 'ch03-d.js':['3.6.3a','3.7.2a'], 'ch03-e.js':['3.8.3a','3.9.1a'],
'ch05-a.js':['5.1.1a','5.1.3','5.1.4','5.1.5','5.2.2','5.2.7'], 'ch05-a2.js':['5.3.1a','5.3.2a'], 'ch05-m.js':['5.4.4','5.4.5','5.4.8'], 'ch05-m2.js':['5.4.10','5.4.11'], 'ch05-m3.js':['5.5.1a','5.5.2a','5.5.6','5.5.11','5.5.11a'], 'ch05-z.js':['5.6.2a','5.6.6','5.7.3'], 'ch05-z2.js':['5.8.1a','5.8.4','5.8.5','5.8.6','5.8.8','5.8.9','5.8.10','5.8.11','5.8.12','5.8.13']};
const selected=new Set(process.argv.slice(2));
const targets=Object.entries(inventory).flatMap(([file,nums])=>nums.map(num=>({file:`content/prob/${file}`,id:`prob-${num}`}))).filter(x=>!selected.size||selected.has(x.id));
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[],dir='/tmp/atlas-prob-shots';mkdirSync(dir,{recursive:true});
const frame=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
try{
for(const theme of ['light','dark'])for(const {file,id}of targets){
 const page=await browser.newPage({viewport:{width:1150,height:1500}});await installBrowserAssets(page.context());page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=150&still=2&w=1080`);
  await page.waitForFunction(()=>window.__done,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);assert.equal(await page.evaluate(()=>window.katex.version),'0.16.11');
  const text=()=>page.locator('.viz-readout').innerText();
  const slide=async(n,value)=>{await page.locator('#viz input[type=range]').nth(n).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await frame(page);};
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-default.png`});
  if(id==='prob-5.1.5'){
   await slide(0,.8);assert.match(await text(),/1\.600/);
   await page.getByRole('button',{name:'exponential',exact:false}).click();await frame(page);assert.match(await text(),/3\.200/);assert.match(await text(),/0\.360/);
   await slide(0,1.2);assert.match(await text(),/transient/);
  }else if(id==='prob-3.5.1a'){
   await page.locator('.ctl-toggle .switch-track').click();await frame(page);assert.match(await text(),/Nonlattice/);
   // Drag atom 2 onto atom 1: two support points are always lattice,
   // including when their separation contains the irrational shift.
   const coords=await page.evaluate(()=>{const s=window.__vizStages[0],r=s.canvas.getBoundingClientRect();return {x:r.x+s.X(.5),y:r.y+s.Y(.9),tx:r.x+s.X(-1),ty:r.y+s.Y(.9)};});
   await page.mouse.move(coords.x,coords.y);await page.mouse.down();await page.mouse.move(coords.tx,coords.ty,{steps:12});await page.mouse.up();await frame(page);assert.match(await text(),/^Lattice/);
  }else if(id==='prob-5.2.2'){
   await page.locator('.seg').nth(1).locator('button').nth(1).click();await frame(page);
   await slide(0,7);assert.match(await text(),/Level/);
   await page.locator('.seg').first().locator('button').nth(1).click();await frame(page);assert.match(await text(),/0\.224/);
  }else{
   const slider=page.locator('#viz input[type=range]').first();
   if(await slider.count()){await slider.evaluate(el=>{el.value=String(Number(el.min)*.3+Number(el.max)*.7);el.dispatchEvent(new Event('input',{bubbles:true}));});await frame(page);}
   const group=page.locator('.seg').first();if(await group.count()){const buttons=group.locator('button');if(await buttons.count()>1){await buttons.nth(1).click();await frame(page);}}
   const button=page.getByRole('button',{name:/^(New|Resample|Resimulate)/}).first();if(await button.count()){await button.click();await frame(page);}
  }
  const readout=await text();assert.doesNotMatch(readout,/NaN|undefined/);
  if(['prob-5.4.10','prob-5.4.11'].includes(id))assert.match(readout,/transient/);
  if(id==='prob-5.6.6')assert.match(readout,/two standard errors/);
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
  assert.equal(await page.locator('.katex-error').count(),0);
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-controls.png`});
  results.push({id,theme,status:'passed',readout});
 }catch(e){console.error(id,theme,String(e.stack||e));results.push({id,theme,status:'failed',error:String(e.stack||e)});}
 finally{await page.close();}
 console.log(`${results.at(-1).status} ${id} ${theme}`);
}
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(selected.size?'/tmp/atlas-prob-browser-followup.json':'/tmp/atlas-prob-browser.json',JSON.stringify(results,null,2)+'\n');
if(selected.size && existsSync('/tmp/atlas-prob-browser.json')) {
 const merged=new Map(JSON.parse(readFileSync('/tmp/atlas-prob-browser.json','utf8')).map(x=>[`${x.id}|${x.theme}`,x]));
 for(const result of results)merged.set(`${result.id}|${result.theme}`,result);
 writeFileSync('/tmp/atlas-prob-browser.json',JSON.stringify([...merged.values()],null,2)+'\n');
}
for(const r of results.filter(x=>x.status==='failed'))console.error(r.id,r.theme,r.error);
process.exitCode=results.some(x=>x.status==='failed')?1:0;
