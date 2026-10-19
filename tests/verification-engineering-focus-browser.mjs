import assert from 'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';
import{chromium}from'playwright-core';
import{createServer}from'../scripts/serve.mjs';
import{findBrowser,installBrowserAssets}from'../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const base=`http://127.0.0.1:${server.address().port}`,report=[];
await mkdir('/tmp/engineering-focus-shots',{recursive:true});
async function frame(p){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
async function aim(p,index,x,y){await p.locator("canvas").nth(index).scrollIntoViewIfNeeded();return p.evaluate(({index,x,y})=>{const s=window.__vizStages[index],b=s.canvas.getBoundingClientRect();return{x:b.x+s.X(x),y:b.y+s.Y(y)}},{index,x,y})}
async function drag(p,index,x,y,xx,yy){const a=await aim(p,index,x,y),b=await aim(p,index,xx,yy);await p.mouse.move(a.x,a.y);await p.mouse.down();await p.mouse.move(b.x,b.y,{steps:8});await p.mouse.up();await frame(p)}
try{for(const theme of['light','dark']){
const context=await browser.newContext({viewport:{width:1280,height:1100},colorScheme:theme});await installBrowserAssets(context);
for(const[c,file,num]of[['info','ch04-b.js','4.11'],['info','ch04-b.js','4.12'],['tech','ch04.js','4.5'],['fa','ch03-a5.js','3.32']]){
const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const id=`${c}-${num}`;
await p.goto(`${base}/tools/harness.html?file=content/${c}/${file}&id=${id}&theme=${theme}&w=1100&wait=5`);await p.waitForFunction(()=>window.__done);const ready=await p.evaluate(()=>window.__done);assert.equal(ready.ok,true);assert.equal(ready.renderer,'KaTeX 0.16.11');
if(id==='info-4.11'){
 const before=await p.locator('.viz-readout').innerText();await drag(p,0,0,.25,0,.73);const after=await p.locator('.viz-readout').innerText();assert.notEqual(before,after);assert.match(after,/prefix-free: yes/);
 await drag(p,0,0,.73,0,0);assert.match(await p.locator('.viz-readout').innerText(),/prefix-free: yes/);
}
if(id==='info-4.12'){
 await p.locator('.ctl-select').first().locator('button').nth(0).click();await frame(p);const zero=await aim(p,0,0,-.02);await p.mouse.click(zero.x,zero.y);await frame(p);assert.match(await p.locator('.viz-readout').innerText(),/assigns probability zero/);
 await p.locator('.ctl-select').first().locator('button').nth(1).click();await p.locator('.ctl-input input').fill('cccccccccccccc');await p.waitForTimeout(200);await frame(p);assert.match(await p.locator('.viz-readout').innerText(),/Decoded[\s\S]*N=14[\s\S]*cccccccccccccc[\s\S]*✓/);
}
if(id==='tech-4.5'){
 const q=await aim(p,0,2,1060/1520);await p.mouse.click(q.x,q.y);await frame(p);assert.match(await p.locator('.viz-readout').innerText(),/Table II no. 2:[\s\S]*56.667[\s\S]*16.25[\s\S]*effect 1060/);
}
if(id==='fa-3.32'){
 assert.match(await p.locator('.statement').innerText(),/weakly bounded/);assert.match(await p.locator('.viz-readout').innerText(),/function is constant/);
 for(const input of await p.locator('input[type=range]').all()){await input.focus();await input.press('End');await frame(p);await input.press('Home');await frame(p)}
 await p.locator('input[type=range]').first().press('End');await frame(p);assert.match(await p.locator('.viz-readout').innerText(),/not weakly bounded/);
}
await p.screenshot({path:`/tmp/engineering-focus-shots/${id}-${theme}.png`,fullPage:true});const live=await p.evaluate(()=>({errors:window.__vizErrors||[],tex:window.__texErrors||[]}));assert.deepEqual(errors,[]);assert.deepEqual(live.errors,[]);assert.deepEqual(live.tex,[]);report.push({id,theme});await p.close();console.log(`${id} ${theme}: focused native controls passed`);
}await context.close();}await writeFile('/tmp/engineering-focus-browser.json',JSON.stringify(report,null,2));}
finally{await browser.close();await new Promise(r=>server.close(r))}
