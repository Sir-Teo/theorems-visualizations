import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('stats.stages++;','stats.stages++; (window.__stages||=[]).push(s);');await route.fulfill({response,body});});
const clean=async()=>{const r=await page.locator('.viz-readout').innerText();assert.doesNotMatch(r,/NaN|Infinity/);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);return r;};
const ids=process.env.STAT_IDS?process.env.STAT_IDS.split(','):Array.from({length:13},(_,i)=>`9.${i+1}`);
try{for(const theme of ['light','dark'])for(const width of [860,350]){await page.setViewportSize({width:width+36,height:1600});for(const id of ids){const file=Number(id.split('.')[1])<=6?'ch09.js':'ch09-b.js';await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/stat/${file}&id=stat-${id}&theme=${theme}&w=${width}&wait=100&still=1`);await page.waitForFunction(()=>window.__done,null,{timeout:60000});const d=await page.evaluate(()=>window.__done);for(const k of ['errors','texErrors','blank'])assert.deepEqual(d[k],[],`${id} ${k}`);await clean();
const sliders=page.locator('.ctl-slider input');for(let i=0;i<await sliders.count();i++){for(const k of ['Home','End']){await sliders.nth(i).press(k);await page.waitForTimeout(40);await clean();}}
for(const seg of await page.locator('.seg').all())for(const button of await seg.locator('button').all()){await button.click();await page.waitForTimeout(40);await clean();}
if(id==='9.13'){const p=await page.evaluate(()=>{const s=window.__stages[0],r=s.canvas.getBoundingClientRect();return{x:r.left+s.X(8),y:r.top+s.Y(.4),to:r.left+s.X(13)};});await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.to,p.y,{steps:5});await page.mouse.up();await page.waitForTimeout(100);await clean();}
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${id} overflow ${width}`);await page.locator('#shot').screenshot({path:`/tmp/wave5-stat-${id}-${theme}-${width}.png`});console.log(`PASS ${id} ${theme} ${width}: modes, slider extrema, readout${id==='9.13'?', actual drag':''}`);
}}assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
