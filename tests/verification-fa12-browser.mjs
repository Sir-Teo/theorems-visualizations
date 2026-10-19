import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const files=['ch12.js','ch12-a2.js','ch12-a3.js','ch12-a4.js','ch12-a5.js'];const inventory=(await Promise.all(files.map(async file=>({file,items:(await import('../content/fa/'+file)).default.items})))).flatMap(({file,items})=>items.filter(x=>x.viz).map(x=>({file,num:x.num})));
const selected=process.argv.slice(2),cases=selected.length?inventory.filter(x=>selected.includes(x.num)):inventory;
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});const out=[],dir='/tmp/atlas-fa12-shots';mkdirSync(dir,{recursive:true});
try{for(const theme of['light','dark'])for(const {file,num}of cases){const page=await browser.newPage({viewport:{width:1400,height:1600}});await installBrowserAssets(page.context());const errors=[];page.on('pageerror',e=>errors.push(e.message));const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 try{await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/fa/${file}&id=fa-${num}&theme=${theme}&still&wait=100`);await page.waitForFunction(()=>window.__done,null,{timeout:60000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);assert.equal(await page.evaluate(()=>window.__done.renderer),'KaTeX 0.16.11');
 const inputs=page.locator('#viz input[type=range]');for(let i=0;i<await inputs.count();i++)for(const end of['min','max']){await inputs.nth(i).evaluate((el,end)=>{el.value=el[end];el.dispatchEvent(new Event('input',{bubbles:true}));},end);await settle();}
 for(const seg of await page.locator('#viz .seg').all())for(const button of await seg.locator('button').all()){await button.click();await settle();}
 const selects=page.locator('#viz select');for(let i=0;i<await selects.count();i++){for(const value of await selects.nth(i).locator('option').evaluateAll(es=>es.map(e=>e.value))){await selects.nth(i).selectOption(value);await settle();}}
 for(const sw of await page.locator('#viz .switch-track').all()){await sw.click();await settle();}
 const stages=await page.evaluate(()=>window.__vizStages.map((s,i)=>({i,handles:s.handles?.map(h=>({x:h.x,y:h.y}))||[]})));
 for(const {i,handles}of stages)if(handles.length){const h=handles[0],p=await page.evaluate(({i,h})=>{const s=window.__vizStages[i],r=s.canvas.getBoundingClientRect();return{x:r.x+s.X(h.x),y:r.y+s.Y(h.y)};},{i,h});await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+36,p.y+22,{steps:6});await page.mouse.up();await settle();}
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);const readout=await page.locator('.viz-readout').allTextContents();assert.doesNotMatch(readout.join(' '),/NaN|Infinity|undefined/);await page.locator('#shot').screenshot({path:`${dir}/fa-${num}-${theme}.png`});out.push({num,theme,status:'passed',readout});
 }catch(e){out.push({num,theme,status:'failed',error:String(e.stack||e)});}finally{await page.close();}console.log(JSON.stringify(out.at(-1)));}}finally{await browser.close();await new Promise(r=>server.close(r));}writeFileSync('/tmp/atlas-fa12-browser.json',JSON.stringify(out,null,2));process.exitCode=out.some(x=>x.status==='failed')?1:0;
