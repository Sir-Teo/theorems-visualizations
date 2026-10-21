// Real browser inputs and observation of the five conditional-probability foundations.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch(),body=(await response.text()).replace('stats.stages++;',`stats.stages++;
 (window.__auditStages ||= []).push(s);s.__handles=[];
 if(s.handle){const h=s.handle.bind(s);s.handle=(...a)=>{const q=h(...a);s.__handles.push(q);return q;};}
 const begin=s.begin.bind(s);s.begin=()=>{s.__paths=[];s.__dots=[];s.__hist=[];s.__fn=[];s.__heat=[];return begin();};
 for(const [key,list] of [['path','__paths'],['dot','__dots'],['hist','__hist'],['fn','__fn'],['heat','__heat']])if(s[key]){const f=s[key].bind(s);s[key]=(...a)=>{s[list].push(a);return f(...a);};}`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(110);
const open=async(id,theme)=>{const file=['4.1.1a','4.1.8'].includes(id)?'ch04-a.js':'ch04-a1.js';await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/prob/${file}&id=prob-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').evaluate(e=>{const c=e.cloneNode(true);c.querySelectorAll('.katex-mathml').forEach(e=>e.remove());return c.textContent;});
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const toggle=async on=>{if(await page.locator('input[type=checkbox]').isChecked()!==on)await page.locator('.ctl-toggle label').click();await settle();};
const drag=async(i,x,y)=>{const p=await page.evaluate(({i,x,y})=>{const s=window.__auditStages[0],h=s.__handles[i],b=s.canvas.getBoundingClientRect();return{x0:b.x+s.X(h.x),y0:b.y+s.Y(h.y),x1:b.x+s.X(x),y1:b.y+s.Y(y)};},{i,x,y});await page.mouse.move(p.x0,p.y0);await page.mouse.down();await page.mouse.move(p.x1,p.y1,{steps:10});await page.mouse.up();await settle();};
const clickAt=async(x,y,shift=false)=>{const p=await page.evaluate(({x,y})=>{const s=window.__auditStages[0],b=s.canvas.getBoundingClientRect();return{x:b.x+s.X(x),y:b.y+s.Y(y)};},{x,y});if(shift)await page.keyboard.down('Shift');await page.mouse.click(p.x,p.y);if(shift)await page.keyboard.up('Shift');await settle();};
const finite=async()=>assert.doesNotMatch(await read(),/NaN|undefined|Infinity/);
try{
for(const theme of ['light','dark']){
 await open('4.1.1a',theme);
 assert.match(await read(),/so \(ii\) holds/);
 for(let j=0;j<4;j++){await menu(0,j);await clickAt(.11,2);assert.match(await read(),/so \(ii\) holds/);await clickAt(.11,2,true);assert.match(await read(),/nothing forces/);await clickAt(.11,2,true);await finite();}
 for(const [i,x] of [[0,1/48],[2,47/48],[1,1/48],[1,.5]]){await drag(i,x,-1.6);await finite();const h=await page.evaluate(()=>window.__auditStages[0].__handles.map(h=>h.x));h.forEach(x=>assert.ok(Math.abs(x*48-Math.round(x*48))<1e-10));}
 await page.screenshot({path:`/tmp/atlas-prob-partition-${theme}.png`});
 console.log(`PASS ${theme} conditional expectation: four variables, whole/partial events, snapped and merged partitions`);

 await open('4.1.8',theme);
 for(let j=0;j<2;j++)for(const end of ['Home','End']){
  await menu(0,j);await slider(0,end);await finite();assert.match(await read(),/empirical discrepancies/);
  // Observe the data passed to the canvas and its actual generic histogram.
  const r=await page.evaluate(async()=>{const M=await import('/assets/js/viz/math.js'),s=window.__auditStages[1],[d,o]=s.__hist[0],h=M.histogram(d,o);return{density:h.density,view:s.view};});
  assert.ok(r.view.y[1]>Math.max(...r.density));assert.ok(Math.abs(r.density.reduce((a,b)=>a+b*2*Math.PI/40,0)-1)<1e-12);
 }
 await page.screenshot({path:`/tmp/atlas-prob-borel-${theme}.png`});
 console.log(`PASS ${theme} Borel: both schemes, width endpoints, normalized and fully visible histogram`);

 await open('4.1.15a',theme);
 for(const p of ['Home','End'])for(const y of ['Home','End'])for(const c of ['Home','End']){
  await slider(0,p);await slider(1,y);await slider(4,c);await finite();
  assert.match(await read(),/Analytic mass[\s\S]*estimated standard error/);
  const r=await page.evaluate(()=>{const s=window.__auditStages[1],L=window.__auditStages[0],rho=Number(document.querySelector('input[type=range]').value),y=Number(document.querySelectorAll('input[type=range]')[1].value);return{peak:s.__fn[0][0](rho*y),view:s.view,range:L.__heat[0][1].range};});
  assert.ok(r.peak<r.view.y[1]);assert.ok(Math.abs(r.peak-r.range[1])<1e-13);
 }
 // Both orderings of endpoints and the empty interval through actual controls.
 await slider(2,'End');await slider(3,'Home');await finite();
 await slider(2,'Home');assert.match(await read(),/\]\)=0/);await finite();
 await page.screenshot({path:`/tmp/atlas-prob-kernel-${theme}.png`});
 console.log(`PASS ${theme} Gaussian kernel: correlation, slice and averaging endpoints, reversed/empty A and visible peak`);

 await open('4.1.16',theme);
 for(let j=0;j<4;j++)for(const end of ['Home','End']){
  await menu(0,j);await slider(0,end);await slider(1,end);await finite();
  const r=await page.evaluate(()=>{const s=window.__auditStages[1];return{view:s.view,values:Array.from({length:501},(_,i)=>s.__fn[1][0](s.view.x[0]+i*(s.view.x[1]-s.view.x[0])/500))};});
  assert.ok(Math.min(...r.values)>=r.view.y[0]&&Math.max(...r.values)<=r.view.y[1]);
  if(j===3)assert.ok(r.view.y[0]<-.4);
 }
 await page.screenshot({path:`/tmp/atlas-prob-functional-${theme}.png`});
 console.log(`PASS ${theme} neighboring kernel functional: all four functions, signed cubic range and endpoint controls`);

 await open('4.1.17',theme);
 for(let j=0;j<2;j++)for(const fix of [false,true]){
  await menu(0,j);await toggle(fix);for(const e of ['Home','End']){await slider(0,e);await slider(1,e);await slider(2,e);await finite();assert.match(await read(),/Maximum discrepancy over 401 sampled/);if(j===0||fix)assert.match(await read(),/^0 of/);}
 }
 await menu(0,1);await toggle(false);await slider(2,'End');
 const before=await page.evaluate(()=>window.__auditStages[0].__dots.map(d=>d[1]));
 await page.getByRole('button',{name:'New versions',exact:true}).click();await settle();
 const after=await page.evaluate(()=>window.__auditStages[0].__dots.map(d=>d[1]));assert.notDeepEqual(before,after);
 await toggle(true);await slider(1,'Home');assert.match(await read(),/^0 of/);
 await page.screenshot({path:`/tmp/atlas-prob-cdf-${theme}.png`});
 console.log(`PASS ${theme} rational CDF: both slices, repair toggle, endpoint controls, changed versions and finite-grid warning`);

 await open('4.2.1a',theme);
 for(const p of ['Home','End']){
  await slider(0,p);
  for(const m of [0,39]){
   await drag(0,m,0);await finite();assert.match(await read(),new RegExp(`At m=${m}:`));
   const r=await page.evaluate(()=>{const s=window.__auditStages[0],p=Number(document.querySelector('input[type=range]').value),h=s.__handles[0],ring=s.__dots.find(d=>d[2]?.hollow),path=s.__paths.find(p=>p[1]?.color==='accent')[0],theory=s.__paths.find(p=>p[1]?.color==='purple')[0];return{p,m:h.x,view:s.view,ring,path,theory,all:s.__paths.flatMap(p=>p[0])};});
   assert.equal(r.ring[0],r.m+1);assert.ok(Math.abs(r.ring[1]-(r.path[r.m][1]+2*r.p-1))<1e-12);
   assert.ok(Math.abs(r.theory.at(-1)[1]-40*(2*r.p-1))<1e-12);
   for(const [x,y] of [...r.all,r.ring])assert.ok(x>=0&&x<=40&&y>=r.view.y[0]&&y<=r.view.y[1]);
  }
 }
 const input=page.locator('input[type=range]'),b=await input.boundingBox();await input.click({position:{x:b.width/2,y:b.height/2}});await settle();assert.match(await read(),/⇒ martingale/);
 await slider(0,'End');await page.screenshot({path:`/tmp/atlas-prob-walk-${theme}.png`});
 console.log(`PASS ${theme} martingale: p=.2/.5/.8, real time-handle endpoints, conditional mean and all shown paths in view`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
