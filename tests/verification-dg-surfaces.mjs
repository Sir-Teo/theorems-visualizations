// Actual control and pointer checks for quadrics, separation and orientability.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {classifyQuadric,surfaceRay} from '../content/dg/ch04.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch(),body=(await response.text()).replace('stats.stages++;',`stats.stages++;
 (window.__auditStages ||= []).push(s);s.__handles=[];
 if(s.handle){const h=s.handle.bind(s);s.handle=(...a)=>{const q=h(...a);s.__handles.push(q);return q;};}
 const begin=s.begin.bind(s);s.begin=()=>{s.__polys=[];s.__lines=[];s.__arrows=[];s.__circles=[];s.__dots=[];s.__fields=[];s.__heats=[];return begin();};
 for(const [key,list] of [['dot','__dots'],['field','__fields'],['heat','__heats'],['poly','__polys'],['line','__lines'],['arrow','__arrows'],['circle','__circles']])if(s[key]){const f=s[key].bind(s);s[key]=(...a)=>{s[list].push(a);return f(...a);};}`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(150);
const open=async(id,theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/dg/ch04-b.js&id=dg-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const handles=()=>page.evaluate(()=>window.__auditStages[0].__handles.map(h=>[h.x,h.y]));
const drag=async(index,x,y)=>{const p=await page.evaluate(({index,x,y})=>{const s=window.__auditStages[1],h=s.__handles[index],b=s.canvas.getBoundingClientRect();return {x0:b.x+s.X(h.x),y0:b.y+s.Y(h.y),x1:b.x+s.X(x),y1:b.y+s.Y(y)};},{index,x,y});await page.mouse.move(p.x0,p.y0);await page.mouse.down();await page.mouse.move(p.x1,p.y1,{steps:12});await page.mouse.up();await settle();};
const zero=async i=>{const input=page.locator('input[type=range]').nth(i),b=await input.boundingBox();await input.click({position:{x:b.width/2,y:b.height/2}});await settle();assert.equal(Number(await input.inputValue()),0);};
const values=()=>page.locator('input[type=range]').evaluateAll(es=>es.map(e=>Number(e.value)));
const camera=async()=>{const cv=await page.locator('canvas').first().boundingBox();await page.mouse.move(cv.x+.5*cv.width,cv.y+.5*cv.height);await page.mouse.down();await page.mouse.move(cv.x+.62*cv.width,cv.y+.62*cv.height,{steps:8});await page.mouse.up();await settle();};
try{
for(const theme of ['light','dark']){
 await open('4.10',theme);
 for(let preset=0;preset<7;preset++){
  await menu(0,preset);
  for(const tilt of ['Home','End']){
   await slider(4,tilt);await slider(5,tilt);const vals=await values();assert.match(await read(),new RegExp(classifyQuadric(vals.slice(0,3),vals[3],Number((await page.locator('.ctl-select').nth(1).locator('button[aria-pressed=true]').innerText()).replace('−','-'))).name));
  }
 }
 // All coefficient/linear endpoints, levels and zeroes through actual input controls.
 for(let level=0;level<3;level++){
  await menu(1,level);for(const index of [0,1,2,3])for(const end of ['Home','End']){await slider(index,end);assert.doesNotMatch(await read(),/NaN|undefined/);}
 }
 // Point -> line -> double plane -> all space, cases missed by sign-change-only meshing.
 await menu(0,0);await menu(1,1);await slider(3,'Home');
 let state=await page.evaluate(()=>({dots:window.__auditStages[0].__dots,polys:window.__auditStages[0].__polys,lines:window.__auditStages[0].__lines}));assert.match(await read(),/a single point/);assert.ok(state.dots.length>0);
 await zero(2);state=await page.evaluate(()=>window.__auditStages[0].__lines);assert.match(await read(),/a line/);assert.ok(state.length>0);
 await zero(1);state=await page.evaluate(()=>window.__auditStages[0].__polys);assert.match(await read(),/a plane \(double\)/);assert.equal(state.length,1);await page.screenshot({path:`/tmp/atlas-dg-double-plane-${theme}.png`});
 await zero(0);assert.match(await read(),/all of space[\s\S]*not a degree-two quadric/);
 await menu(1,2);assert.match(await read(),/empty set/);await camera();
 console.log(`PASS ${theme} quadrics: all presets, tilts, coefficient/linear endpoints and levels; visible point, line, double plane, all-space and empty cases`);
 await open('4.14',theme);
 for(let kind=0;kind<4;kind++){
  await menu(0,kind);for(const height of ['Home','End','zero']){
   if(height==='zero')await zero(0);else await slider(0,height);
   for(const [x,y] of [[-1.9,0],[0,0],[1.2,.3]]){
    await drag(0,x,y);assert.doesNotMatch(await read(),/NaN|undefined/);
    const state=await page.evaluate(()=>({q:window.__auditStages[1].__handles.map(h=>[h.x,h.y]),z:Number(document.querySelector('input[type=range]').value),dots:window.__auditStages[1].__dots,arrows:window.__auditStages[0].__arrows,circles:window.__auditStages[1].__circles}));
    if(kind<3){const result=surfaceRay(['sphere','torus','genus2'][kind],[...state.q[0],state.z]);assert.match(await read(),new RegExp(`probe is ${result.location}`));assert.equal(state.dots.length,result.hits.length);assert.equal(state.arrows.filter(a=>a[2]?.color==='green').length,result.hits.length);
     if(result.hits.some(h=>h.tangent)&&result.location!=='on the surface')assert.match(await read(),/tangent contact/);
    }else{assert.match(await read(),/do not define a global inside\/outside/);assert.equal(state.arrows.filter(a=>a[2]?.color==='green').length,0);assert.equal(state.circles.length,state.z===0?1:0);}
   }
  }
 }
 await menu(0,0);await slider(0,'End');await drag(0,0,0);assert.match(await read(),/on the surface/);await drag(0,-1.9,0);assert.match(await read(),/tangent contact/);await page.screenshot({path:`/tmp/atlas-dg-tangent-${theme}.png`});
 await menu(0,3);await camera();await page.screenshot({path:`/tmp/atlas-dg-klein-${theme}.png`});
 console.log(`PASS ${theme} orientability: all four surfaces, height endpoints/zero, real probe drags, analytic hits and normals, boundary/tangent cases, Klein labels and section-circle height`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
