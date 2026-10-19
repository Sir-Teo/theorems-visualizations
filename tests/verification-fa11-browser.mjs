import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';
const inventory=[{"file":"content/fa/ch11-a2.js","id":"fa-11.9a"},{"file":"content/fa/ch11-a2.js","id":"fa-11.13"},{"file":"content/fa/ch11-a2.js","id":"fa-11.17"},{"file":"content/fa/ch11-a2.js","id":"fa-11.15"},{"file":"content/fa/ch11-a2.js","id":"fa-11.18"},{"file":"content/fa/ch11-a2.js","id":"fa-11.29"},{"file":"content/fa/ch11-a2.js","id":"fa-11.31"},{"file":"content/fa/ch11-a3.js","id":"fa-11.10"},{"file":"content/fa/ch11-a3.js","id":"fa-11.11"},{"file":"content/fa/ch11-a3.js","id":"fa-11.12"},{"file":"content/fa/ch11-a3.js","id":"fa-11.16"},{"file":"content/fa/ch11-a3.js","id":"fa-11.22"},{"file":"content/fa/ch11-a3.js","id":"fa-11.23"},{"file":"content/fa/ch11-a4.js","id":"fa-11.25"},{"file":"content/fa/ch11-a4.js","id":"fa-11.26"},{"file":"content/fa/ch11-a4.js","id":"fa-11.28"},{"file":"content/fa/ch11-a4.js","id":"fa-11.30"},{"file":"content/fa/ch11-a4.js","id":"fa-11.32"},{"file":"content/fa/ch11-a4.js","id":"fa-11.33"},{"file":"content/fa/ch11-a4.js","id":"fa-11.28a"},{"file":"content/fa/ch11-source.js","id":"fa-11.6"},{"file":"content/fa/ch11-source.js","id":"fa-11.7"},{"file":"content/fa/ch11-source.js","id":"fa-11.19"},{"file":"content/fa/ch11-source.js","id":"fa-11.20"},{"file":"content/fa/ch11.js","id":"fa-11.2"},{"file":"content/fa/ch11.js","id":"fa-11.3"},{"file":"content/fa/ch11.js","id":"fa-11.4"},{"file":"content/fa/ch11.js","id":"fa-11.5"},{"file":"content/fa/ch11.js","id":"fa-11.8"},{"file":"content/fa/ch11.js","id":"fa-11.9"}];
const selected=new Set(process.argv.slice(2));
const targets=inventory.filter(x=>!selected.size||selected.has(x.id));
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[],dir='/tmp/atlas-fa11-shots';mkdirSync(dir,{recursive:true});
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
  if(id==='fa-11.7'){await page.getByRole('button',{name:'Make roots coincide',exact:true}).click();await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/no Bezout solution/);}
  if(id==='fa-11.33'){await page.getByRole('button',{name:'Use an evaluation',exact:true}).click();await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/multiplicative and extreme/);await page.getByRole('button',{name:'Use the zero functional',exact:true}).click();await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/multiplicative and extreme/);}
  if(id==='fa-11.2'||id==='fa-11.3'){await page.getByRole('button',{name:'Make zeros coincide',exact:true}).click();await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/Common zero/);}
  if(id==='fa-11.6'){await page.getByRole('button',{name:'Put a zero on the circle',exact:true}).click();await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/not invertible/);}
  if(id==='fa-11.25'){await page.locator('#viz input[type=range]').nth(2).evaluate(el=>{el.value='.6';el.dispatchEvent(new Event('input',{bubbles:true}));});await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/outside the maximal normal set/);}
  if(id==='fa-11.5'){await page.getByRole('button',{name:'Put a root on the first character',exact:true}).click();await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/has no inverse/);}
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.equal(await page.locator('.katex-error').count(),0);
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-controls.png`});
  results.push({id,theme,status:'passed',readout,controlReadout:await page.locator('.viz-readout').innerText()});
 }catch(e){console.error(id,theme,String(e.stack||e));results.push({id,theme,status:'failed',error:String(e.stack||e)});}
 finally{await page.close();}
 console.log(`${results.at(-1).status} ${id} ${theme}`);
}
}finally{await browser.close();await new Promise(r=>server.close(r));}
const path='/tmp/atlas-fa11-browser.json';
writeFileSync(selected.size?'/tmp/atlas-fa11-browser-followup.json':path,JSON.stringify(results,null,2)+'\n');
if(selected.size && existsSync(path)){
 const merged=new Map(JSON.parse(readFileSync(path,'utf8')).map(x=>[`${x.id}|${x.theme}`,x]));for(const row of results)merged.set(`${row.id}|${row.theme}`,row);writeFileSync(path,JSON.stringify([...merged.values()],null,2)+'\n');
}
process.exitCode=results.some(x=>x.status==='failed')?1:0;
