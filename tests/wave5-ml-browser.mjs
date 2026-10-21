import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('stats.stages++;','stats.stages++; (window.__stages||=[]).push(s);');await route.fulfill({response,body});});
const clean=async()=>{const r=await page.locator('.viz-readout').innerText();assert.doesNotMatch(r,/NaN|Infinity|undefined/);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);return r;};
try{for(const theme of ['light','dark'])for(const width of [860,350]){await page.setViewportSize({width:width+36,height:1400});for(const id of ['5.1','5.2','5.2a','5.2b']){await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/ml/ch05.js&id=ml-${id}&theme=${theme}&w=${width}&wait=100&still=1`);await page.waitForFunction(()=>window.__done);const d=await page.evaluate(()=>window.__done);for(const k of ['errors','texErrors','blank'])assert.deepEqual(d[k],[],`${id} ${k}`);await clean();
const sliders=page.locator('.ctl-slider input');for(let i=0;i<await sliders.count();i++){for(const k of ['Home','End']){await sliders.nth(i).press(k);await page.waitForTimeout(40);await clean();}}
for(const seg of await page.locator('.seg').all())for(const button of await seg.locator('button').all()){await button.click();await page.waitForTimeout(40);await clean();}
if(id==='5.2a'){const point=await page.evaluate(()=>{const s=window.__stages[0],r=s.canvas.getBoundingClientRect();return{x:r.left+s.X(16),y:r.top+s.Y(.6)};});await page.mouse.click(point.x,point.y);await page.waitForTimeout(50);assert.match(await clean(),/1 manually added/);await page.getByRole('button',{name:'Draw sample',exact:true}).click();await page.waitForTimeout(50);assert.match(await clean(),/0 manually added/);}
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${id} overflow ${width}`);await page.locator('#shot').screenshot({path:`/tmp/wave5-ml-${id}-${theme}-${width}.png`});console.log(`PASS ${id} ${theme} ${width}: modes, slider extrema, readout${id==='5.2a'?', click training edit and reset':''}`);
}}assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
