// Actual controls and pointer checks for Cantor sets, covers and compactification.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {cantorLevel,continuityLocalRadius,continuityUniformRadius} from '../content/top/ch04.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch(),body=(await response.text()).replace('stats.stages++;',`stats.stages++;
 (window.__auditStages ||= []).push(s);
 s.__handles=[];if(s.handle){const handle=s.handle.bind(s);s.handle=(...a)=>{const h=handle(...a);s.__handles.push(h);return h;};}
 const begin=s.begin.bind(s),line=s.line.bind(s),dot=s.dot.bind(s),path=s.path.bind(s),hline=s.hline.bind(s);
 s.begin=()=>{s.__lines=[];s.__dots=[];s.__paths=[];s.__hlines=[];return begin();};
 s.line=(...a)=>{s.__lines.push(a.slice(0,4));return line(...a);};
 s.dot=(...a)=>{s.__dots.push(a);return dot(...a);};s.path=(p,...a)=>{s.__paths.push(p);return path(p,...a);};s.hline=(y,...a)=>{s.__hlines.push(y);return hline(y,...a);};`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(150);
const open=async(id,theme)=>{const file=id==='4.11'?'ch04-b.js':'ch04-c.js';await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/top/${file}&id=top-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const handles=()=>page.evaluate(()=>window.__auditStages[0].__handles.map(h=>[h.x,h.y]));
const drag=async(index,x,y)=>{const p=await page.evaluate(({index,x,y})=>{const s=window.__auditStages[0],h=s.__handles[index],b=s.canvas.getBoundingClientRect();return {x0:b.x+s.X(h.x),y0:b.y+s.Y(h.y),x1:b.x+s.X(x),y1:b.y+s.Y(y)};},{index,x,y});await page.mouse.move(p.x0,p.y0);await page.mouse.down();await page.mouse.move(p.x1,p.y1,{steps:12});await page.mouse.up();await settle();};
const plotBounds=async()=>{const stages=await page.evaluate(()=>window.__auditStages.map(s=>({view:s.view,paths:s.__paths,dots:s.__dots})));for(const s of stages){for(const p of s.paths)for(const q of p)if(q)assert.ok(q[0]>=s.view.x[0]-1e-10&&q[0]<=s.view.x[1]+1e-10&&q[1]>=s.view.y[0]-1e-12&&q[1]<=s.view.y[1]+1e-10,JSON.stringify({q,view:s.view}));}};
try{
for(const theme of ['light','dark']){
 await open('4.11',theme);
 for(let f=0;f<2;f++){await menu(0,f);for(let region=0;region<2;region++){await menu(1,region);for(const n of ['Home','End']){
  await slider(0,n);const points=await page.evaluate(()=>window.__auditStages[0].__dots.filter(a=>['sample max','sample min'].includes(a[2]?.label)));assert.equal(points.length,2);for(const [x,y] of points)assert.ok(Math.hypot(x,y)<=(region?1-1/(n==='Home'?4:120):1)+1e-12);
  assert.match(await read(),region?(f?/no maximum or minimum/:/maximum is attained at an interior point/):/both extrema are attained/);assert.doesNotMatch(await read(),/NaN|undefined/);
 }}}
 await menu(0,0);await menu(1,1);await drag(0,.632,.063);await page.screenshot({path:`/tmp/atlas-top-extreme-${theme}.png`});console.log(`PASS ${theme} extrema: both functions/domains, grid endpoints and probe drag`);
 await open('4.13',theme);
 for(let f=0;f<2;f++){
  await menu(0,f);for(const e of ['Home','End'])for(const a of (f?['Home','End']:['Home'])){
   await slider(0,e);if(f)await slider(1,a);const av=f?(a==='Home'?.005:.5):0,eps=e==='Home'?.05:1.5;
   for(const x of [f?av:0,f?1:2]){
    await drag(0,x,0);await plotBounds();const state=await page.evaluate(()=>({h:window.__auditStages[0].__handles[0].x,dot:window.__auditStages[1].__dots[0],lines:window.__auditStages[1].__hlines,view:window.__auditStages[1].view}));
    assert.ok(Math.abs(state.dot[1]-continuityLocalRadius(f?'inv':'sin',state.h,eps,av))<1e-10);const uniform=continuityUniformRadius(f?'inv':'sin',eps,av);assert.ok(state.lines.some(y=>Math.abs(y-uniform)<1e-10));assert.ok(state.view.y[0]<uniform);assert.match(await read(),/uniform guarantee/);assert.doesNotMatch(await read(),/NaN|undefined/);
   }
  }
 }
 await slider(0,'Home');await slider(1,'Home');await drag(0,.005,0);await page.screenshot({path:`/tmp/atlas-top-continuity-${theme}.png`});console.log(`PASS ${theme} continuity: all epsilon/domain endpoints, exact probe radii, visible full graph and logarithmic guarantee`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
