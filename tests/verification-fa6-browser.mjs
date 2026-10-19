import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';
const inventory=[{"file": "content/fa/ch06-a2.js", "id": "fa-6.11"}, {"file": "content/fa/ch06-a2.js", "id": "fa-6.12"}, {"file": "content/fa/ch06-a2.js", "id": "fa-6.14"}, {"file": "content/fa/ch06-a2.js", "id": "fa-6.15"}, {"file": "content/fa/ch06-a2.js", "id": "fa-6.17"}, {"file": "content/fa/ch06-a2.js", "id": "fa-6.18"}, {"file": "content/fa/ch06-a3.js", "id": "fa-6.20"}, {"file": "content/fa/ch06-a3.js", "id": "fa-6.21"}, {"file": "content/fa/ch06-a3.js", "id": "fa-6.23"}, {"file": "content/fa/ch06-a4.js", "id": "fa-6.24"}, {"file": "content/fa/ch06-a4.js", "id": "fa-6.25"}, {"file": "content/fa/ch06-a4.js", "id": "fa-6.26"}, {"file": "content/fa/ch06-a4.js", "id": "fa-6.27"}, {"file": "content/fa/ch06-a4.js", "id": "fa-6.28"}, {"file": "content/fa/ch06-a5.js", "id": "fa-6.30"}, {"file": "content/fa/ch06-a5.js", "id": "fa-6.32"}, {"file": "content/fa/ch06-a5.js", "id": "fa-6.33"}, {"file": "content/fa/ch06-a5.js", "id": "fa-6.35"}, {"file": "content/fa/ch06-a5.js", "id": "fa-6.37"}, {"file": "content/fa/ch06.js", "id": "fa-6.2"}, {"file": "content/fa/ch06.js", "id": "fa-6.3"}, {"file": "content/fa/ch06.js", "id": "fa-6.4"}, {"file": "content/fa/ch06.js", "id": "fa-6.5"}, {"file": "content/fa/ch06.js", "id": "fa-6.6"}, {"file": "content/fa/ch06.js", "id": "fa-6.6a"}, {"file": "content/fa/ch06.js", "id": "fa-6.7"}, {"file": "content/fa/ch06.js", "id": "fa-6.8"}];
const selected=new Set(process.argv.slice(2));
const targets=inventory.filter(x=>!selected.size||selected.has(x.id));
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[],dir='/tmp/atlas-fa6-shots';mkdirSync(dir,{recursive:true});
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
  if(id==='fa-6.21'){await page.locator('#viz .switch-track').click();await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/data disagree on the overlap/);}
  if(id==='fa-6.24'){await slider.evaluate(el=>{el.value='-0.2';el.dispatchEvent(new Event('input',{bubbles:true}));});await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/negative margin/);}
  if(id==='fa-6.33'){await page.getByRole('button',{name:/multiply by/}).click();await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/not a convolution operator/);}
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.equal(await page.locator('.katex-error').count(),0);
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-controls.png`});
  results.push({id,theme,status:'passed',readout,controlReadout:await page.locator('.viz-readout').innerText()});
 }catch(e){console.error(id,theme,String(e.stack||e));results.push({id,theme,status:'failed',error:String(e.stack||e)});}
 finally{await page.close();}
 console.log(`${results.at(-1).status} ${id} ${theme}`);
}
}finally{await browser.close();await new Promise(r=>server.close(r));}
const path='/tmp/atlas-fa6-browser.json';
writeFileSync(selected.size?'/tmp/atlas-fa6-browser-followup.json':path,JSON.stringify(results,null,2)+'\n');
if(selected.size && existsSync(path)){
 const merged=new Map(JSON.parse(readFileSync(path,'utf8')).map(x=>[`${x.id}|${x.theme}`,x]));for(const row of results)merged.set(`${row.id}|${row.theme}`,row);writeFileSync(path,JSON.stringify([...merged.values()],null,2)+'\n');
}
process.exitCode=results.some(x=>x.status==='failed')?1:0;
