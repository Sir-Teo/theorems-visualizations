// Actual controls and pointer checks for Cantor sets, covers and compactification.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {cantorLevel} from '../content/top/ch04.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch(),body=(await response.text()).replace('stats.stages++;',`stats.stages++;
 (window.__auditStages ||= []).push(s);
 s.__handles=[];if(s.handle){const handle=s.handle.bind(s);s.handle=(...a)=>{const h=handle(...a);s.__handles.push(h);return h;};}
 const begin=s.begin.bind(s),line=s.line.bind(s),dot=s.dot.bind(s);
 s.begin=()=>{s.__lines=[];s.__dots=[];return begin();};
 s.line=(...a)=>{s.__lines.push(a.slice(0,4));return line(...a);};
 s.dot=(...a)=>{s.__dots.push(a);return dot(...a);};`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(150);
const open=async(id,theme)=>{const file=id==='3.15'?'ch03-c.js':id==='4.1'?'ch04.js':'ch04-c.js';await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/top/${file}&id=top-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const handles=()=>page.evaluate(()=>window.__auditStages[0].__handles.map(h=>[h.x,h.y]));
const drag=async(index,x,y)=>{const p=await page.evaluate(({index,x,y})=>{const s=window.__auditStages[0],h=s.__handles[index],b=s.canvas.getBoundingClientRect();return {x0:b.x+s.X(h.x),y0:b.y+s.Y(h.y),x1:b.x+s.X(x),y1:b.y+s.Y(y)};},{index,x,y});await page.mouse.move(p.x0,p.y0);await page.mouse.down();await page.mouse.move(p.x1,p.y1,{steps:12});await page.mouse.up();await settle();};
try{
for(const theme of ['light','dark']){
 await open('3.15',theme);const ends=cantorLevel(6).flat();
 for(const h of await handles())assert.ok(ends.some(x=>Math.abs(x-h[0])<1e-14));
 await drag(0,.32,.35);await drag(1,.34,.35);assert.match(await read(),/stage/);
 for(const h of await handles())assert.ok(ends.some(x=>Math.abs(x-h[0])<1e-14));
 await menu(0,0);for(const h of await handles())assert.ok(Math.abs(20*h[0]-Math.round(20*h[0]))<1e-12);
 await drag(0,.11,.35);await drag(1,.89,.35);assert.match(await read(),/irrational/);await menu(0,1);await page.screenshot({path:`/tmp/atlas-top-disconnected-${theme}.png`});console.log(`PASS ${theme} disconnected sets: initial membership, two pointer drags and both snapping modes`);
 await open('4.1',theme);
 for(const n of ['Home','End'])for(const radius of ['Home','End']){await slider(0,n);await slider(1,radius);await button('Resample');assert.match(await read(),/finite subcover/);}
 await menu(0,1);for(const n of ['Home','End']){await slider(2,n);assert.match(await read(),/not covered/);}
 await menu(0,2);await slider(2,'Home');await slider(3,'Home');assert.match(await read(),/do not cover/);await slider(2,'End');await slider(3,'End');assert.match(await read(),/finite subcover/);console.log(`PASS ${theme} open covers: random endpoints and strict finite-prefix failure/success`);
 await open('4.14',theme);for(let list=0;list<2;list++){await menu(0,list);for(const n of ['Home','End']){await slider(0,n);await button('New list');assert.match(await read(),/left endpoint/);assert.match(await read(),/is in the Cantor set/);assert.doesNotMatch(await read(),/NaN|undefined/);}}
 await page.screenshot({path:`/tmp/atlas-top-uncountable-${theme}.png`});console.log(`PASS ${theme} uncountability: both lists and depth endpoints, genuine Cantor candidates`);
 await open('4.18',theme);for(let mode=0;mode<2;mode++){await menu(0,mode);for(const radius of ['Home','End'])for(const n of ['Home','End']){
  await slider(0,radius);await slider(1,n);const count=await page.evaluate(()=>{const s=window.__auditStages[0],dots=s.__dots.filter(a=>['blue','orange','gold'].includes(a[2]?.color));for(const [x,y] of dots)if(x<s.view.x[0]||x>s.view.x[1]||y<s.view.y[0]||y>s.view.y[1])throw new Error('sequence point clipped');return dots.length;});assert.equal(count,n==='Home'?1:40);assert.doesNotMatch(await read(),/NaN|undefined/);
 }}
 const b=await page.locator('canvas').nth(1).boundingBox();await page.mouse.move(b.x+b.width*.4,b.y+b.height*.4);await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+b.height*.6,{steps:12});await page.mouse.up();await settle();await page.screenshot({path:`/tmp/atlas-top-infinity-${theme}.png`});console.log(`PASS ${theme} compactification: both sequences, all parameter extremes, every plane point visible and sphere drag`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
