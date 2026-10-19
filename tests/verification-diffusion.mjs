// Numerical/source follow-up UI regressions for heat balls and Tychonoff's example.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {tyDerivs,tyEval,tyOK} from '../content/pde/ch03.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();
  const body=(await response.text()).replace('stats.stages++;',`stats.stages++;
    (window.__auditStages ||= []).push(s);
    const begin=s.begin.bind(s),path=s.path.bind(s),poly=s.poly.bind(s);
    s.begin=()=>{s.__paths=[];s.__polys=[];return begin();};
    s.path=(pts,st={})=>{s.__paths.push({pts:pts.map(p=>p&&Array.from(p)),color:st.color});return path(pts,st);};
    s.poly=(pts,st)=>{s.__polys.push(pts.map(p=>Array.from(p)));return poly(pts,st);};`);
  await route.fulfill({response,body});
});
const open=async id=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/pde/ch03-c.js&id=pde-${id}&still=1&wait=100`);await page.waitForFunction(()=>window.__done);};
const settle=()=>page.waitForTimeout(150);
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const state=()=>page.evaluate(()=>window.__auditStages.map(s=>({view:s.view,paths:s.__paths,polys:s.__polys})));
try {
  await open('3.11');
  for(const [x,y] of [[-2.5,.6],[2.5,4.6]]){
    const p=await page.evaluate(({x,y})=>{const s=window.__auditStages[0],h=s.handles[0],r=s.canvas.getBoundingClientRect();return{a:r.left+s.X(h.x),b:r.top+s.Y(h.y),x:r.left+s.X(x),y:r.top+s.Y(y)};},{x,y});
    await page.mouse.move(p.a,p.b);await page.mouse.down();await page.mouse.move(p.x,p.y,{steps:8});await page.mouse.up();await settle();
    for(let f=0;f<6;f++)for(const radius of ['Home','End']){
      await page.locator('.ctl-select button').nth(f).click();await slider(0,radius);
      const [ball,average]=await state();
      for(const poly of ball.polys)for(const [a,b] of poly)assert.ok(a>=ball.view.x[0]&&a<=ball.view.x[1]&&b>=ball.view.y[0]&&b<=ball.view.y[1],'whole ball visible at both corner/radius extremes');
      for(const path of average.paths)for(const pt of path.pts)if(pt)assert.ok(pt[1]>=average.view.y[0]&&pt[1]<=average.view.y[1],'signed cumulative integral visible');
      assert.doesNotMatch(await read(),/NaN|Infinity/);
    }
  }
  console.log('PASS heat ball: 24 function/radius/corner states, real handle input and signed cumulative bounds');

  await open('3.12');
  for(const [aKey,alpha] of [['Home',1.2],['End',1.9]]){
    await slider(0,aKey);
    const stages=await state(),timePaths=stages[0].paths.filter(p=>['accent','orange','purple','teal'].includes(p.color));
    const cache=new Map();
    for(const [index,path] of timePaths.entries())for(const pt of path.pts)if(pt){
      const [t,y]=pt;if(!cache.has(t))cache.set(t,tyDerivs(alpha,t));
      const calc=tyEval(cache.get(t),[.5,1,2,3][index]);
      assert.ok(tyOK(calc));assert.ok(Math.abs(y-Math.abs(calc.u))<=2*calc.err+1e-12*Math.abs(calc.u),`plotted values agree within numerical estimates: alpha=${alpha}, x=${[.5,1,2,3][index]}, t=${t}, actual=${y}, expected=${calc.u}, estimate=${calc.err}`);
    }
    for(const pt of stages[2].paths.find(p=>p.color==='ink').pts)if(pt)assert.ok(Math.abs(pt[1]-Math.exp(-Math.pow(pt[0],-alpha)))<2e-14*pt[1]);
    for(const [tKey,t] of [['Home',.15],['End',2]])for(const [xKey,x] of [['Home',.5],['End',5]]){
      await slider(2,tKey);await slider(1,xKey);
      const accepted=tyOK(tyEval(tyDerivs(alpha,t),x)),text=await read();
      assert.match(text,accepted?/estimated absolute error/:/probe value and equation check are omitted/);
      assert.doesNotMatch(text,/NaN|Infinity/);
    }
  }
  console.log('PASS Tychonoff: both alpha extremes, un-floored accepted plots and eight accepted/rejected probe states');

  await open('3.13');await slider(0,'End');await slider(2,'End');
  assert.doesNotMatch(await read(),/NaN|Infinity/);
  assert.match(await read(),/exponent cap of 600/);
  console.log('PASS backward heat: largest theoretical amplification is labelled without floating-point overflow');

  await open('3.14');await page.locator('.ctl-select button').nth(1).click();await slider(1,'End');
  assert.doesNotMatch(await read(),/whole-line bound|✗|NaN|Infinity/);
  assert.ok(!(await state())[1].paths.some(p=>p.color==='orange'),'whole-line decay estimate is not applied to an insulated bar');
  for(let i=0;i<3;i++){
    const p=await page.evaluate(i=>{const s=window.__auditStages[0],h=s.handles[i],r=s.canvas.getBoundingClientRect();return{x:r.left+s.X(h.x),y:r.top+s.Y(h.y),z:r.top+s.Y(0)+3};},i);
    await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x,p.z,{steps:6});await page.mouse.up();await settle();
  }
  assert.match(await read(),/Initial heat is zero/);
  assert.doesNotMatch(await read(),/NaN|Infinity/);
  console.log('PASS conservation: long-time insulated bar and zero-heat state edited with three pointer drags');
  assert.deepEqual(errors,[]);
} finally {await browser.close();await new Promise(r=>server.close(r));}
