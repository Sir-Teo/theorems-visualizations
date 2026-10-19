import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),report=[];await mkdir('/tmp/computing-focus-shots',{recursive:true});
async function frame(p){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
async function click(p,i,x,y){await p.locator('canvas').nth(i).scrollIntoViewIfNeeded();const q=await p.evaluate(({i,x,y})=>{const s=window.__vizStages[i],b=s.canvas.getBoundingClientRect();return{x:b.x+s.X(x),y:b.y+s.Y(y)}},{i,x,y});await p.mouse.click(q.x,q.y);await frame(p)}
const targets=[['toc','ch03-b.js','3.10'],['toc','ch04-b.js','4.8'],['crypto','ch03-b.js','3.10'],['crypto','ch03-b.js','3.14'],['crypto','ch04-b.js','4.5'],['crypto','ch04-b.js','4.8'],['crypto','ch04.js','4.2'],['pl','ch04-b.js','4.7'],['algo','ch10.js','10.6'],['algo','ch11-d.js','11.23'],['cg','ch04-b.js','4.7'],['cg','ch04.js','4.4'],['dist','ch04-b.js','4.7']];
try{for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width:1280,height:1100},colorScheme:theme});await installBrowserAssets(context);
 for(const[c,file,num] of targets){const id=`${c}-${num}`,p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`${base}/tools/harness.html?file=content/${c}/${file}&id=${id}&theme=${theme}&w=1100&wait=5`);await p.waitForFunction(()=>window.__done);const ready=await p.evaluate(()=>window.__done);assert.equal(ready.ok,true);assert.equal(ready.renderer,'KaTeX 0.16.11');assert.deepEqual(ready.texErrors,[]);assert.deepEqual(ready.blank,[]);
 let nativeClicks=0,textEdits=0;
 if(id==='toc-3.10'){
  const inputs=p.locator('input:not([type=range]):not([type=checkbox])');await inputs.nth(0).fill('a|ε');await inputs.nth(1).fill('a');textEdits+=2;await p.waitForTimeout(250);await frame(p);
  await p.locator('.ctl-select').last().locator('button').nth(1).click();await frame(p);assert.match(await p.locator('.viz-readout').innerText(),/0 violations/);
  await inputs.nth(0).fill('a');textEdits++;await p.waitForTimeout(250);await frame(p);assert.match(await p.locator('.viz-readout').innerText(),/1 string differs|1 string differ/);
 }
 if(id==='crypto-3.14'){
  const r=p.locator('input[type=range]');await r.nth(0).focus();await r.nth(0).press('Home');await frame(p);await r.nth(1).focus();await r.nth(1).press('End');await frame(p);
  assert.ok(!/NaN|Infinity/.test(await p.locator('.viz-readout').innerText()));
 }
 if(id==='crypto-4.8'){
  const before=await p.locator('.viz-readout').innerText();await click(p,0,.48,.52);nativeClicks++;assert.notEqual(await p.locator('.viz-readout').innerText(),before);
  await p.locator('.ctl-select').nth(1).locator('button').nth(1).click();await frame(p);await click(p,0,.56,.44);nativeClicks++;
 }
 if(id==='pl-4.7'){
  const input=p.locator('input:not([type=range]):not([type=checkbox])').first();await input.fill('λx:Bool. succ x');await p.waitForTimeout(250);await frame(p);assert.match(await p.locator('.viz-readout').innerText(),/not typable|ill.typed|mismatch|fails|cannot|error/i);
  await input.fill('λx:Nat. succ x');await p.waitForTimeout(250);await frame(p);textEdits+=2;assert.match(await p.locator('.viz-readout').innerText(),/Nat/);
 }
 if(id==='dist-4.7')assert.match(await p.locator('.statement').innerText(),/system-wide progress/);
 await p.screenshot({path:`/tmp/computing-focus-shots/${id}-${theme}.png`,fullPage:true});const live=await p.evaluate(()=>({errors:window.__vizErrors||[],tex:window.__texErrors||[]}));assert.deepEqual(errors,[]);assert.deepEqual(live.errors,[]);assert.deepEqual(live.tex,[]);report.push({id,theme,nativeClicks,textEdits,readout:await p.locator('.viz-readout').innerText()});await p.close();console.log(`${id} ${theme}: focused native check passed`);
 }await context.close();
}await writeFile('/tmp/computing-focus-browser.json',JSON.stringify(report,null,2));}finally{await browser.close();await new Promise(r=>server.close(r))}
