// Actual controls and pointer checks for cover radii and compactness examples.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {ambientClearance,lebesgueDiscs,compactCoverMinimum,punctureCoverConstant,compactnessArrows,compactnessExamples} from '../content/top/ch04.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch(),body=(await response.text()).replace('stats.stages++;',`stats.stages++;
 (window.__auditStages ||= []).push(s);
 s.__handles=[];if(s.handle){const handle=s.handle.bind(s);s.handle=(...a)=>{const h=handle(...a);s.__handles.push(h);return h;};}
 const circle=s.circle.bind(s),arrow=s.arrow.bind(s),rect=s.rect.bind(s);
 s.circle=(...a)=>{s.__circles.push(a);return circle(...a);};s.arrow=(...a)=>{s.__arrows.push(a);return arrow(...a);};s.rect=(...a)=>{s.__rects.push(a);return rect(...a);};
 const begin=s.begin.bind(s),line=s.line.bind(s),dot=s.dot.bind(s),path=s.path.bind(s),hline=s.hline.bind(s);
 s.begin=()=>{s.__circles=[];s.__arrows=[];s.__rects=[];s.__lines=[];s.__dots=[];s.__paths=[];s.__hlines=[];return begin();};
 s.line=(...a)=>{s.__lines.push(a.slice(0,4));return line(...a);};
 s.dot=(...a)=>{s.__dots.push(a);return dot(...a);};s.path=(p,...a)=>{s.__paths.push(p);return path(p,...a);};s.hline=(y,...a)=>{s.__hlines.push(y);return hline(y,...a);};`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(150);
const open=async(id,theme)=>{const file=id==='4.12'?'ch04-b.js':'ch04-c.js';await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/top/${file}&id=top-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const button=async name=>{await page.getByRole('button',{name,exact:true}).click();await settle();};
const handles=()=>page.evaluate(()=>window.__auditStages[0].__handles.map(h=>[h.x,h.y]));
const drag=async(index,x,y)=>{const p=await page.evaluate(({index,x,y})=>{const s=window.__auditStages[0],h=s.__handles[index],b=s.canvas.getBoundingClientRect();return {x0:b.x+s.X(h.x),y0:b.y+s.Y(h.y),x1:b.x+s.X(x),y1:b.y+s.Y(y)};},{index,x,y});await page.mouse.move(p.x0,p.y0);await page.mouse.down();await page.mouse.move(p.x1,p.y1,{steps:12});await page.mouse.up();await settle();};
const plotBounds=async()=>{const stages=await page.evaluate(()=>window.__auditStages.map(s=>({view:s.view,paths:s.__paths,dots:s.__dots})));for(const s of stages){for(const p of s.paths)for(const q of p)if(q)assert.ok(q[0]>=s.view.x[0]-1e-10&&q[0]<=s.view.x[1]+1e-10&&q[1]>=s.view.y[0]-1e-12&&q[1]<=s.view.y[1]+1e-10,JSON.stringify({q,view:s.view}));}};
try{
for(const theme of ['light','dark']){
 await open('4.12',theme);
 for(let mode=0;mode<2;mode++){
  await menu(0,mode);
  for(const size of ['Home','End']){
   await slider(mode?0:1,size);
   const scale=size==='Home'?.95:1.4,J=size==='Home'?2:9;
   for(const radius of ['Home','End']){
    await slider(2,radius);
    for(const [x,y] of [[0,0],[Math.cos(Math.PI/6),.5]]){
     await drag(0,x,y);await plotBounds();
     const state=await page.evaluate(()=>{const [s,g]=window.__auditStages;return {p:[s.__handles[0].x,s.__handles[0].y],circles:s.__circles,view:s.view,h:g.__hlines,gview:g.view};});
     const min=mode?2**-(J+1):0,r=Math.hypot(...state.p),rho=radius==='Home'?.005:.5;
     assert.ok(r>=min-1e-12&&r<=1+1e-12);
     const expected=mode?punctureCoverConstant*min:compactCoverMinimum(scale).value;
     assert.ok(state.h.some(y=>Math.abs(y-expected)<1e-12));
     assert.ok(state.gview.y[1]>expected&&state.gview.x[0]>0);
     for(const [cx,cy,cr] of state.circles)assert.ok(cx-cr>=state.view.x[0]-1e-12&&cx+cr<=state.view.x[1]+1e-12&&cy-cr>=state.view.y[0]-1e-12&&cy+cr<=state.view.y[1]+1e-12);
     const clearance=ambientClearance(lebesgueDiscs(!mode,scale,J),...state.p).value;
     assert.equal(state.circles.at(-1)[3].color,rho<=clearance?'green':'red');
     if(rho>clearance){const red=await page.evaluate(()=>{const s=window.__auditStages[0],d=s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]>150&&d[i]>1.4*d[i+1]&&d[i]>1.25*d[i+2]&&d[i+3]>100)n++;return n;});assert.ok(red>15,`red ball missing: ${red}`);}
     assert.match(await read(),mode?/Sampled minimum[\s\S]*estimate[\s\S]*no Lebesgue number/:/analytic uniform clearance/);
     assert.doesNotMatch(await read(),/NaN|undefined/);
    }
   }
  }
 }
 await slider(0,'End');await drag(0,0,0);await page.screenshot({path:`/tmp/atlas-top-cover-${theme}.png`});
 console.log(`PASS ${theme} cover: both spaces, every scale/ring/radius endpoint, actual probe drags, derived bounds, containment colours and full plotted extents`);
 await open('4.15',theme);
 for(let ex=0;ex<4;ex++){
  await menu(0,ex);for(const depth of ['Home','End']){
   await slider(0,depth);assert.match(await read(),/does not certify an infinite subsequence or its limit/);assert.doesNotMatch(await read(),/NaN|undefined/);
   if(ex===1)assert.match(await read(),/whether or not this finite search keeps windows near 0/);
   if(ex===2)assert.match(await read(),/none converges in this space/);
  }
 }
 await menu(0,1);await page.screenshot({path:`/tmp/atlas-top-finite-prefix-${theme}.png`});
 console.log(`PASS ${theme} finite prefix: all four sequences and bisection endpoints, finite-preview caveats and analytic limit statements`);
 await open('4.16',theme);
 for(const [index,e] of Object.values(compactnessExamples).entries()){
  await menu(0,index);
  const state=await page.evaluate(()=>({arrows:window.__auditStages[0].__arrows,rects:window.__auditStages[0].__rects})),val={C:e.c,LP:e.l,S:e.q};
  assert.equal(state.arrows.length,6);assert.equal(state.rects.length,3);
  compactnessArrows.forEach(([from,to,always],i)=>assert.equal(state.arrows[i][4].color,val[from]&&!val[to]?'red':always||e.m?'ink':'muted'));
  ['LP','C','S'].forEach((k,i)=>assert.equal(state.rects[i][4].fill,val[k]?'green':'red'));
  assert.doesNotMatch(await read(),/NaN|undefined/);
  if(index>=4){assert.match(await read(),/Counterexample/);await page.screenshot({path:`/tmp/atlas-top-compactness-${index}-${theme}.png`});}
 }
 console.log(`PASS ${theme} equivalence: all seven spaces, all six arrows, every truth box, all four nonuniversal implications witnessed`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
