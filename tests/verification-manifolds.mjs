// Actual control and pointer checks for Morse points, brackets and Lie derivatives.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {PAIRS,lieQuotient} from '../content/mfd/ch04.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch(),body=(await response.text()).replace('stats.stages++;',`stats.stages++;
 (window.__auditStages ||= []).push(s);s.__handles=[];
 if(s.handle){const h=s.handle.bind(s);s.handle=(...a)=>{const q=h(...a);s.__handles.push(q);return q;};}
 const begin=s.begin.bind(s);s.begin=()=>{s.__dots=[];s.__fields=[];s.__heats=[];return begin();};
 for(const [key,list] of [['dot','__dots'],['field','__fields'],['heat','__heats']])if(s[key]){const f=s[key].bind(s);s[key]=(...a)=>{s[list].push(a);return f(...a);};}`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(150);
const open=async(id,theme)=>{const file=id==='3.14'?'ch03-b.js':id==='4.6'?'ch04.js':'ch04-b.js';await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/mfd/${file}&id=mfd-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const handles=()=>page.evaluate(()=>window.__auditStages[0].__handles.map(h=>[h.x,h.y]));
const drag=async(index,x,y)=>{const p=await page.evaluate(({index,x,y})=>{const s=window.__auditStages[0],h=s.__handles[index],b=s.canvas.getBoundingClientRect();return {x0:b.x+s.X(h.x),y0:b.y+s.Y(h.y),x1:b.x+s.X(x),y1:b.y+s.Y(y)};},{index,x,y});await page.mouse.move(p.x0,p.y0);await page.mouse.down();await page.mouse.move(p.x1,p.y1,{steps:12});await page.mouse.up();await settle();};
const midSlider=async i=>{const input=page.locator('input[type=range]').nth(i),b=await input.boundingBox();await input.click({position:{x:b.width/2,y:b.height/2}});await settle();assert.equal(Number(await input.inputValue()),0);};
try{
for(const theme of ['light','dark']){
 await open('3.14',theme);await slider(0,'Home');assert.match(await read(),/degenerate/);
 await slider(0,'ArrowRight');assert.doesNotMatch(await read(),/degenerate critical set/);assert.match(await read(),/nondegenerate/);
 for(const tilt of ['Home','End']){
  if(tilt==='Home'){await slider(0,'Home');await slider(0,'ArrowRight');}else await slider(0,tilt);
  for(let selected=0;selected<4;selected++){
   await menu(0,selected);for(const radius of ['Home','End']){
    await slider(2,radius);assert.match(await read(),/48 sampled circle points/);assert.doesNotMatch(await read(),/NaN|undefined|det=0≠0/);
    const points=await page.evaluate(()=>window.__auditStages[1].__dots);assert.equal(points.length,4);
   }
  }
  for(const lev of ['Home','End']){await slider(1,lev);assert.match(await read(),/Critical values/);}
 }
 // Camera interaction with the actual 3D canvas.
 const cv=await page.locator('canvas').first().boundingBox();await page.mouse.move(cv.x+.5*cv.width,cv.y+.5*cv.height);await page.mouse.down();await page.mouse.move(cv.x+.6*cv.width,cv.y+.6*cv.height,{steps:8});await page.mouse.up();await settle();
 await page.screenshot({path:`/tmp/atlas-mfd-morse-${theme}.png`});console.log(`PASS ${theme} Morse: exact zero degeneracy, positive one-degree tilt, all critical selections/radius/level endpoints and camera drag`);
 await open('4.6',theme);
 for(const [index,P] of Object.values(PAIRS).entries()){
  await menu(0,index);for(const [x,y] of [[-1.9,1.9],[.9,.6],[1.9,-1.9]]){
   await drag(0,x,y);assert.match(await read(),/absolute difference/);assert.doesNotMatch(await read(),/NaN|undefined/);
  }
 }
 await page.screenshot({path:`/tmp/atlas-mfd-bracket-${theme}.png`});console.log(`PASS ${theme} bracket: all five field pairs and real probe drags to interior and corners`);
 await open('4.8',theme);
 for(let object=0;object<3;object++){
  await menu(0,object);
  for(let field=0;field<4;field++){
   await menu(1,field);
   for(const time of ['Home','End','zero']){
    if(time==='zero')await midSlider(0);else await slider(0,time);
    const key=['rot','dil','shear','wave'][field],kind=['f','Y','g'][object],t=time==='zero'?0:time==='Home'?-1.2:1.2;
    const data=await page.evaluate(()=>{const s=window.__auditStages[1],f=s.__heats[0]?.[0]||s.__fields[0]?.[0];return {v:f(.9,.6),angle:Number(document.querySelectorAll('input[type=range]')[1].value)};});
    const expected=lieQuotient(key,kind,[.9,.6],t,[Math.cos(data.angle),Math.sin(data.angle)]);
    (Array.isArray(expected)?expected:[expected]).forEach((x,i)=>assert.ok(Math.abs(x-(Array.isArray(data.v)?data.v[i]:data.v))<1e-12));
    assert.match(await read(),time==='zero'?/analytic limit is displayed/:/finite-time quotient is displayed/);assert.doesNotMatch(await read(),/NaN|undefined/);
   }
   if(object===2)for(const direction of ['Home','End']){await slider(1,direction);assert.match(await read(),/81-point grid/);}
  }
 }
 await menu(0,2);await menu(1,0);await midSlider(0);await page.screenshot({path:`/tmp/atlas-mfd-lie-${theme}.png`});
 console.log(`PASS ${theme} Lie derivative: all 12 object/field combinations, signed time endpoints, zero-time analytic limit, metric directions and displayed-value agreement`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
