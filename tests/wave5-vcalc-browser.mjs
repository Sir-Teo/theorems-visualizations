// Scoped chapter audit: source imports, extremes, singular states, stage bounds.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1100,height:1600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness.html\?/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('stats.stages++;','stats.stages++; (window.__stages ||= []).push(s);').replace('return item.viz(v);','window.__auditV=v;return item.viz(v);');await route.fulfill({response,body});});
const open=async(num,theme,w)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/vcalc/ch05${Number(num.split('.')[1])>5?'-b':''}.js&id=vcalc-${num}&still=1&wait=80&theme=${theme}&w=${w}`);await page.waitForFunction(()=>window.__done);const done=await page.evaluate(()=>window.__done);assert.deepEqual(done.errors,[]);assert.deepEqual(done.texErrors,[]);assert.deepEqual(done.blank,[]);assert.ok(done.quality.interactive);};
const settle=()=>page.waitForTimeout(90);
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const read=()=>page.locator('.viz-readout').innerText();
try{for(const theme of ['light','dark'])for(const w of [390,860]){
 for(let n=1;n<=10;n++){await open(`5.${n}`,theme,w);for(let j=0;j<await page.locator('input[type=range]').count();j++)for(const key of ['Home','End']){await slider(j,key);assert.doesNotMatch(await read(),/NaN|Infinity|undefined/);}}
 await open('5.2',theme,w);await page.evaluate(()=>{Object.assign(window.__stages[0].handles[0],{x:2,y:-2});window.__auditV.invalidate();});await settle();assert.match(await read(),/8\.00000/);assert.ok(await page.evaluate(()=>window.__stages[1].view.y[1]>8));
 await open('5.6',theme,w);await page.locator('.ctl-select button').nth(1).click();await slider(0,'End');assert.match(await read(),/excluded origin/);await page.locator('.ctl-select button').nth(2).click();await settle();assert.match(await read(),/loop work ≈ 0\.000000/);
 await open('5.7',theme,w);await page.evaluate(()=>{const el=document.querySelector('input[type=range]');el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});await settle();assert.match(await read(),/Undefined: the curve passes through/);await slider(0,'End');assert.match(await read(),/Winding = 0/);
 await open('5.9',theme,w);await slider(0,'End');await slider(1,'End');assert.match(await read(),/19\.3504430/);const views=await page.evaluate(()=>window.__stages.map(s=>s.view));assert.ok(views[0].x[1]>4.34);assert.ok(views[1].y[1]>19.35);
 console.log(`PASS ${theme} width=${w}: all ten items, slider endpoints, singular modes, dynamic work/orbit bounds`);
}assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
