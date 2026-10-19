import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const files=['content/sig/ch02.js','content/sig/ch02.shared.js','content/sig/recovery-plot.shared.js'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]));
const before=hashes(),dir='/tmp/atlas-sig-recovery';mkdirSync(dir,{recursive:true});
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});const results=[];
const settle=p=>p.evaluate(async()=>{await document.fonts.ready;window.dispatchEvent(new Event('vizpause'));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().filter(a=>typeof CSSTransition!=='undefined'&&a instanceof CSSTransition&&a.playState==='running').map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
const cleanText=p=>p.locator('.viz-readout').evaluate(el=>{const c=el.cloneNode(true);c.querySelectorAll('.katex-mathml').forEach(n=>n.remove());return c.textContent;});
try{for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width:1250,height:1400},colorScheme:theme});await installBrowserAssets(context,{local:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/sig/ch02.js&id=sig-2.5&theme=${theme}&still=1&w=1080`);await page.waitForFunction(()=>window.__done);assert.equal(await page.evaluate(()=>window.__done.renderer),'KaTeX 0.16.11');
 const system=page.getByRole('group',{name:'system',exact:true}),toggle=page.locator('.ctl-toggle label');
 for(const [key,index] of [['mod',9],['gain',0],['cube',1],['delay',5],['accum',6],['mavg',7],['rc',8]]){
  await system.locator('button').nth(index).click();await settle(page);
  for(const noisy of [false,true]){
   const checked=await page.locator('.ctl-toggle input').isChecked();if(checked!==noisy)await toggle.click();await settle(page);
   assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__inspectCanvases()),[]);
   const readout=await cleanText(page),corner=await page.locator('#viz .stage-overlay').first().innerText();
   if(key==='mod'&&noisy){assert.match(readout,/20 off scale/);assert.match(readout,/floating-point roundoff/);}
   if(key==='mod'&&!noisy){assert.match(readout,/max error 0/);assert.doesNotMatch(corner,/off scale/);}
   if(key==='gain'&&noisy){const amplification=Number(readout.match(/amplification of about ([0-9.]+)/)?.[1]);assert.ok(amplification>.49&&amplification<=.5);assert.doesNotMatch(corner,/off scale/);}
   const screenshot=`${dir}/${theme}-${key}-${noisy?'noisy':'noiseless'}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({theme,key,noisy,readout,corner,screenshot,status:'passed'});console.log(theme,key,noisy?'noisy':'noiseless','passed');
  }
 }
 await context.close();
}}finally{await browser.close();await new Promise(r=>server.close(r));writeFileSync(`${dir}/report.json`,JSON.stringify({before,after:hashes(),results},null,2));}
assert.deepEqual(hashes(),before,'Source changed during focused verification');
