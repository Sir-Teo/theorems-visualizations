import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const baseline=process.argv.includes('--record-baseline');
const dir=`/tmp/algo-graph-modes-${baseline?'before':'after'}`;await mkdir(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),results=[];
const settle=p=>p.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
const text=p=>p.locator('.viz-readout').evaluate(e=>{const c=e.cloneNode(true);c.querySelectorAll('.katex-mathml').forEach(e=>e.remove());return c.textContent});
async function inspect(p,id,theme,label){await settle(p);const r={id,theme,label,blank:await p.evaluate(()=>window.__inspectCanvases()),readout:await text(p)};await p.screenshot({path:`${dir}/${id}-${theme}-${label}.png`,fullPage:true});if(!baseline){assert.deepEqual(r.blank,[],JSON.stringify(r));assert.ok(!/NaN|undefined|Add a vertex to start/.test(r.readout),r.readout)}results.push(r);return r}
const canvas=p=>p.locator('canvas').first().evaluate(c=>c.toDataURL());
async function unhover(p){await p.mouse.move(5,5);await settle(p)}
async function point(p,x,y){await p.locator('canvas').first().scrollIntoViewIfNeeded();return p.evaluate(({x,y})=>{const s=window.__vizStages[0],b=s.canvas.getBoundingClientRect();return{x:b.x+s.X(x),y:b.y+s.Y(y)}},{x,y})}
try{for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width:1280,height:1100},colorScheme:theme});await installBrowserAssets(context);
 for(const id of ['algo-8.1','algo-8.10']){
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/algo/ch08.js&id=${id}&theme=${theme}&w=1100&still=1`);await p.waitForFunction(()=>window.__done);
  const ready=await p.evaluate(()=>window.__done);assert.equal(ready.ok,true);assert.equal(ready.renderer,'KaTeX 0.16.11');assert.deepEqual(ready.errors,[]);assert.deepEqual(ready.texErrors,[]);
  await inspect(p,id,theme,'default');
  if(id==='algo-8.1'){
   const options=p.locator('.ctl-select button');await options.nth(1).click();await inspect(p,id,theme,'edit');await options.nth(0).click();
  }
  const toggle=p.locator('.ctl-toggle label');await toggle.click();let r=await inspect(p,id,theme,'alternate');
  if(!baseline){
   if(id==='algo-8.1'){assert.match(r.readout,/m\s*=\s*11/);assert.match(r.readout,/not symmetric/);assert.match(r.readout,/deg\+\s*=\s*11/)}
   else{assert.match(r.readout,/tree 7 · back 7 · forward 0 · cross 0/);assert.match(r.readout,/agrees on 14 of 14 edges/)}
   await toggle.click();r=await inspect(p,id,theme,'restored');
   if(id==='algo-8.1')assert.match(r.readout,/n\s*=\s*10.*m\s*=\s*11/);else assert.match(r.readout,/agrees on 14 of 14 edges/);
   // A native node drag and graph edit must survive a direction round-trip.
   await unhover(p);const beforeDrag=await canvas(p);
   const a=await point(p,1,4.6),b=await point(p,1.25,4.35);await p.mouse.move(a.x,a.y);await p.mouse.down();await p.mouse.move(b.x,b.y,{steps:8});await p.mouse.up();await unhover(p);assert.notEqual(await canvas(p),beforeDrag,'native drag changes the graph image');
   if(id==='algo-8.1')await p.locator('.ctl-select button').nth(1).click();
   const u=await point(p,id==='algo-8.1'?3.1:3.6,id==='algo-8.1'?5.3:5.5),v=await point(p,id==='algo-8.1'?2.5:6.3,id==='algo-8.1'?2.9:4.4);
   await p.mouse.click(u.x,u.y);await p.mouse.click(v.x,v.y);await settle(p);
   await unhover(p);r=await inspect(p,id,theme,'edited');const editedCanvas=await canvas(p);
   if(id==='algo-8.1')assert.match(r.readout,/m\s*=\s*12/);else assert.match(r.readout,/agrees on 13 of 13 edges/);
   await toggle.click();r=await inspect(p,id,theme,'edited-alternate');
   if(id==='algo-8.1')assert.match(r.readout,/m\s*=\s*12/);else assert.match(r.readout,/agrees on 13 of 13 edges/);
   await toggle.click();await unhover(p);await inspect(p,id,theme,'edited-restored');assert.equal(await canvas(p),editedCanvas,'direction round-trip preserves edited nodes, edges and node positions');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await p.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await p.evaluate(()=>window.__texErrors||[]),[]);
  await p.close();console.log(`${id} ${theme}: ${baseline?'baseline recorded':'native mode/edit/drag checks passed'}`);
 }await context.close();
}await writeFile(`${dir}/report.json`,JSON.stringify({baseline,results},null,2)+'\n');}finally{await browser.close();await new Promise(r=>server.close(r))}
