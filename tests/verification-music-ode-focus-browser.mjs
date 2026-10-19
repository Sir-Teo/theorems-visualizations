import assert from 'node:assert/strict';
import {mkdir,writeFile}from'node:fs/promises';
import{chromium}from'playwright-core';
import{createServer}from'../scripts/serve.mjs';
import{findBrowser,installBrowserAssets}from'../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const base=`http://127.0.0.1:${server.address().port}`,report=[];
await mkdir('/tmp/music-ode-focus-shots',{recursive:true});
async function frame(p){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
async function range(p,n,x){await p.locator('input[type=range]').nth(n).evaluate((el,x)=>{el.value=x;el.dispatchEvent(new Event('input',{bubbles:true}))},x);await frame(p)}
try{for(const theme of['light','dark']){
const context=await browser.newContext({viewport:{width:1280,height:1100},colorScheme:theme});await installBrowserAssets(context);
for(const[c,file,num]of[['ode','ch04.js','4.1'],['ode','ch04-c.js','4.13'],['music','ch07-c.js','7.15'],['music','ch07-c.js','7.16'],['music','ch08.js','8.6']]){
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const id=`${c}-${num}`;
 await p.goto(`${base}/tools/harness.html?file=content/${c}/${file}&id=${id}&theme=${theme}&w=1100&wait=5`);await p.waitForFunction(()=>window.__done);assert.equal((await p.evaluate(()=>window.__done)).ok,true);
 if(id==='ode-4.13'){
   await range(p,0,9.9);assert.match(await p.locator('.viz-readout').innerText(),/interior zeros of[\s\S]*?u: 1;/);
   await p.getByRole('button',{name:'next eigenvalue',exact:true}).click();await frame(p);assert.match(await p.locator('.viz-readout').innerText(),/interior zeros of[\s\S]*?u: 1;/);
 }
 if(id==='ode-4.1')assert.match(await p.locator('.viz-readout').innerText(),/ratio can oscillate/);
 if(id==='music-7.15'){
   await p.getByRole('button',{name:'free choice',exact:true}).click();await range(p,0,0);await range(p,1,0);assert.match(await p.locator('.viz-readout').innerText(),/do not define a finite periodicity block/);
 }
 if(id==='music-7.16')assert.match(await p.locator('.statement').innerText(),/local minimum need not be perfectly just/);
 if(id==='music-8.6'){
   await range(p,0,700);await range(p,1,24);assert.match(await p.locator('.viz-readout').innerText(),/1 distinct step sizes: 100\.000/);
 }
 await p.screenshot({path:`/tmp/music-ode-focus-shots/${id}-${theme}.png`,fullPage:true});
 const live=await p.evaluate(()=>({errors:window.__vizErrors||[],tex:window.__texErrors||[]}));assert.deepEqual(errors,[]);assert.deepEqual(live.errors,[]);assert.deepEqual(live.tex,[]);report.push({id,theme});await p.close();console.log(`${id} ${theme}: focused native controls passed`);
}await context.close();}await writeFile('/tmp/music-ode-focus-browser.json',JSON.stringify(report,null,2));}
finally{await browser.close();await new Promise(r=>server.close(r))}
