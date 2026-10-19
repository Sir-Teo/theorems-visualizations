import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';
const inventory=[{"file": "content/graph/ch01-b.js", "id": "graph-1.4.1a"}, {"file": "content/graph/ch01-b.js", "id": "graph-1.4.1b"}, {"file": "content/graph/ch01-b.js", "id": "graph-1.5.1a"}, {"file": "content/graph/ch01-b.js", "id": "graph-1.5.3a"}, {"file": "content/graph/ch01-b.js", "id": "graph-1.6.1a"}, {"file": "content/graph/ch01-c.js", "id": "graph-1.7.1a"}, {"file": "content/graph/ch01-c.js", "id": "graph-1.7.1b"}, {"file": "content/graph/ch01-c.js", "id": "graph-1.8.1a"}, {"file": "content/graph/ch01-c.js", "id": "graph-1.9.1a"}, {"file": "content/graph/ch01-c.js", "id": "graph-1.9.1b"}, {"file": "content/graph/ch01-c.js", "id": "graph-1.9.5a"}, {"file": "content/graph/ch01-c.js", "id": "graph-1.10.1a"}, {"file": "content/graph/ch01.js", "id": "graph-1.1.1a"}, {"file": "content/graph/ch01.js", "id": "graph-1.1.1b"}, {"file": "content/graph/ch01.js", "id": "graph-1.1.1c"}, {"file": "content/graph/ch01.js", "id": "graph-1.2.1a"}, {"file": "content/graph/ch01.js", "id": "graph-1.3.1a"}, {"file": "content/graph/ch01.js", "id": "graph-1.3.1b"}, {"file": "content/graph/ch01.js", "id": "graph-1.3.1c"}, {"file": "content/graph/ch02-b.js", "id": "graph-2.3.1a"}, {"file": "content/graph/ch02-b.js", "id": "graph-2.4.3a"}, {"file": "content/graph/ch02-b.js", "id": "graph-2.5.1a"}, {"file": "content/graph/ch02.js", "id": "graph-2.1.1a"}, {"file": "content/graph/ch02.js", "id": "graph-2.1.1b"}, {"file": "content/graph/ch02.js", "id": "graph-2.1.1c"}, {"file": "content/graph/ch02.js", "id": "graph-2.1.3a"}, {"file": "content/graph/ch02.js", "id": "graph-2.2.1a"}, {"file": "content/graph/ch02.js", "id": "graph-2.2.2a"}, {"file": "content/graph/ch03-b.js", "id": "graph-3.5.1a"}, {"file": "content/graph/ch03.js", "id": "graph-3.1.1a"}, {"file": "content/graph/ch03.js", "id": "graph-3.1.3a"}, {"file": "content/graph/ch04-a.js", "id": "graph-4.1.1a"}, {"file": "content/graph/ch04-a.js", "id": "graph-4.1.4"}, {"file": "content/graph/ch04-a.js", "id": "graph-4.2.1a"}, {"file": "content/graph/ch04-a2.js", "id": "graph-4.2.7a"}, {"file": "content/graph/ch04-a2.js", "id": "graph-4.2.9"}, {"file": "content/graph/ch04-z.js", "id": "graph-4.3.1a"}, {"file": "content/graph/ch04-z.js", "id": "graph-4.3.1"}, {"file": "content/graph/ch04-z.js", "id": "graph-4.3.2"}, {"file": "content/graph/ch04-z.js", "id": "graph-4.4.1a"}, {"file": "content/graph/ch04-z.js", "id": "graph-4.4.2"}, {"file": "content/graph/ch04-z.js", "id": "graph-4.4.3"}, {"file": "content/graph/ch04-z.js", "id": "graph-4.4.4"}, {"file": "content/graph/ch04-z.js", "id": "graph-4.4.5"}, {"file": "content/graph/ch04-z2.js", "id": "graph-4.5.2"}, {"file": "content/graph/ch04-z2.js", "id": "graph-4.5.3"}, {"file": "content/graph/ch04-z2.js", "id": "graph-4.6.1a"}, {"file": "content/graph/ch04-z2.js", "id": "graph-4.6.1b"}, {"file": "content/graph/ch04-z2.js", "id": "graph-4.6.3"}, {"file": "content/graph/ch05-a.js", "id": "graph-5.1.1a"}, {"file": "content/graph/ch05-a.js", "id": "graph-5.1.1b"}, {"file": "content/graph/ch05-a.js", "id": "graph-5.1.1"}, {"file": "content/graph/ch05-a.js", "id": "graph-5.1.2"}, {"file": "content/graph/ch05-a.js", "id": "graph-5.1.3"}, {"file": "content/graph/ch05-a.js", "id": "graph-5.2.1a"}, {"file": "content/graph/ch05-a.js", "id": "graph-5.2.2"}, {"file": "content/graph/ch05-a2.js", "id": "graph-5.2.4"}, {"file": "content/graph/ch05-a2.js", "id": "graph-5.2.5"}, {"file": "content/graph/ch05-a2.js", "id": "graph-5.2.5a"}, {"file": "content/graph/ch05-a2.js", "id": "graph-5.2.6"}, {"file": "content/graph/ch05-a2.js", "id": "graph-5.3.1"}, {"file": "content/graph/ch05-a2.js", "id": "graph-5.3.2"}, {"file": "content/graph/ch05-a2.js", "id": "graph-5.3.3"}, {"file": "content/graph/ch05-z.js", "id": "graph-5.4.1a"}, {"file": "content/graph/ch05-z.js", "id": "graph-5.4.1"}, {"file": "content/graph/ch05-z.js", "id": "graph-5.4.2a"}, {"file": "content/graph/ch05-z.js", "id": "graph-5.4.2b"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.5.1a"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.5.1b"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.5.3"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.5.4"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.5.5"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.5.6"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.6.1a"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.6.1"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.6.2"}, {"file": "content/graph/ch05-z2.js", "id": "graph-5.6.3a"}];
const selected=new Set(process.argv.slice(2));
const targets=inventory.filter(x=>!selected.size||selected.has(x.id));
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[],dir='/tmp/atlas-graph-shots';mkdirSync(dir,{recursive:true});
const frame=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
try {
for(const theme of ['light','dark'])for(const {file,id}of targets){
 const page=await browser.newPage({viewport:{width:1150,height:1500}});await installBrowserAssets(page.context());page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=150&still=2&w=1080`);
  await page.waitForFunction(()=>window.__done,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);assert.equal(await page.evaluate(()=>window.katex.version),'0.16.11');
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-default.png`});
  const slider=page.locator('#viz input[type=range]').first();
  if(await slider.count()){await slider.evaluate(el=>{el.value=String(Number(el.min)*.3+Number(el.max)*.7);el.dispatchEvent(new Event('input',{bubbles:true}));});await frame(page);}
  const group=page.locator('.seg').first();if(await group.count()){const buttons=group.locator('button');if(await buttons.count()>1){await buttons.nth(1).click();await frame(page);}}
  const button=page.getByRole('button',{name:/^(Resample|New|sample$|another outer|Minimum$|Optimal$|Find$|Restore$|Show)/i}).first();if(await button.count()){await button.click();await frame(page);}
  const readout=await page.locator('.viz-readout').innerText();assert.doesNotMatch(readout,/NaN|undefined/);
  if(id==='graph-2.4.3a'){assert.match(readout,/forests cover all edges/);assert.doesNotMatch(readout,/uncoloured/);}
  if(id==='graph-4.3.1')assert.match(readout,/topological on the sphere/);
  if(id==='graph-4.5.3')assert.match(readout,/0 crossings/);
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.equal(await page.locator('.katex-error').count(),0);
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-controls.png`});
  results.push({id,theme,status:'passed',readout});
 }catch(e){console.error(id,theme,String(e.stack||e));results.push({id,theme,status:'failed',error:String(e.stack||e)});}
 finally{await page.close();}
 console.log(`${results.at(-1).status} ${id} ${theme}`);
}
}finally{await browser.close();await new Promise(r=>server.close(r));}
const path='/tmp/atlas-graph-browser.json';
writeFileSync(selected.size?'/tmp/atlas-graph-browser-followup.json':path,JSON.stringify(results,null,2)+'\n');
if(selected.size && existsSync(path)){
 const merged=new Map(JSON.parse(readFileSync(path,'utf8')).map(x=>[`${x.id}|${x.theme}`,x]));for(const row of results)merged.set(`${row.id}|${row.theme}`,row);writeFileSync(path,JSON.stringify([...merged.values()],null,2)+'\n');
}
process.exitCode=results.some(x=>x.status==='failed')?1:0;
