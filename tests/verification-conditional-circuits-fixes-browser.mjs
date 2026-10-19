import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const dir='/tmp/conditional-circuits-fixes';await mkdir(dir,{recursive:true});const results=[];
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const settle=p=>p.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
const txt=(p,sel)=>p.locator(sel).evaluate(e=>{const c=e.cloneNode(true);c.querySelectorAll('.katex-mathml').forEach(e=>e.remove());return c.textContent.replace(/\u200b/g,'')});
async function snap(p,id,theme,state){await settle(p);const blank=await p.evaluate(()=>window.__inspectCanvases());assert.deepEqual(blank,[]);const readout=await txt(p,'.viz-readout');assert.ok(!/NaN|undefined|Infinity/.test(readout),readout);const screenshot=`${dir}/${id}-${theme}-${state}.png`;await p.locator('#shot').screenshot({path:screenshot});results.push({id,theme,state,readout,screenshot,blank});return readout}
const click=async(p,group,option)=>{await p.locator('.ctl-select').nth(group).locator('button').nth(option).click();await settle(p)};
try{for(const theme of ['light','dark']){const context=await browser.newContext({viewport:{width:1280,height:1100},colorScheme:theme});await installBrowserAssets(context);
 for(const[id,file]of [['causal-2.2','content/causal/ch02.js'],['kin-1.5','content/kin/ch01.js'],['opt-3.1','content/opt/ch03.js'],['opt-3.3','content/opt/ch03.js'],['opt-3.5','content/opt/ch03.js'],['opt-3.6','content/opt/ch03.js']]){
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&w=1080&still=1`);await p.waitForFunction(()=>window.__done);const ready=await p.evaluate(()=>window.__done);assert.equal(ready.ok,true);assert.equal(ready.renderer,'KaTeX 0.16.11');assert.deepEqual(ready.errors,[]);assert.deepEqual(ready.texErrors,[]);await snap(p,id,theme,'default');
  if(id==='causal-2.2'){
   await p.locator('.ctl-toggle label').click();await settle(p);assert.match(await p.locator('.ctl-select').nth(1).innerText(),/simulated assignments/);assert.ok(!/draws \(40/.test(await p.locator('#shot').innerText()));assert.match(await snap(p,id,theme,'choice12-draw1000'),/12 units/);
   await click(p,1,1);assert.match(await snap(p,id,theme,'choice12-draw20000'),/12 units/);
   await p.locator('.ctl-toggle label').click();await click(p,0,2);assert.match(await snap(p,id,theme,'randomized40'),/40 units/);
   await click(p,0,1);assert.match(await snap(p,id,theme,'restored12'),/all.*924.*assignments/);
  }else if(id==='kin-1.5'){
   await click(p,0,1);assert.match(await txt(p,'.viz-controls'),/reference.*k1/);await snap(p,id,theme,'synthetic-first');await click(p,1,1);const c=await txt(p,'#caption');assert.match(c,/k2=k1/);assert.match(c,/same initial half-life/);assert.match(await snap(p,id,theme,'synthetic-second'),/unequal: not first order/);await click(p,1,0);await snap(p,id,theme,'synthetic-restored');await click(p,0,0);await snap(p,id,theme,'textbook-restored');
  }else if(id==='opt-3.1'||id==='opt-3.3'||id==='opt-3.5'){
   assert.match(await txt(p,'.viz-readout'),/Sampled chord inequalities violated|sampled chord inequalities violated/);assert.ok(!(await txt(p,'.viz-readout')).includes('chords above the graph'));
   await click(p,0,id==='opt-3.1'?4:id==='opt-3.3'?2:3);const r=await snap(p,id,theme,'violating-example');assert.match(r,/not convex/);assert.match(r,/inequalities violated/);
  }else{
   await click(p,2,5);for(let i=0;i<4;i++){await click(p,0,i);for(let g=0;g<3;g++){await click(p,3,g);const r=await snap(p,id,theme,`inner${i}-outer${g}`);assert.ok(!r.includes('takes negative values here'));assert.match(r,/sampled chord inequalities violated/);assert.ok(!r.includes('chords above the graph'));if(i<3&&g<2){assert.match(r,/composition rule applies/);assert.match(r,/convex by the stated rule/);if(g===1)assert.match(r,/nonnegative range/)}else assert.match(r,/sufficient rule gives no conclusion/);if(i===3||i===1&&g===2)assert.match(r,/not convex: a sampled chord violates/);else if(g===2)assert.match(r,/no sampled violations/);}}
   await click(p,0,0);await click(p,3,0);await snap(p,id,theme,'composition-restored');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await p.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await p.evaluate(()=>window.__texErrors||[]),[]);await p.close();console.log(`${id} ${theme}: focused branch labels/math diagnoses passed`);
 }await context.close();}await writeFile(`${dir}/report.json`,JSON.stringify({results},null,2)+'\n');}finally{await browser.close();await new Promise(r=>server.close(r))}
