// Source-audit browser regressions: node tests/verification-pde.mjs.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer(); await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}), errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();
  const body=(await response.text()).replace('stats.stages++;',`stats.stages++;
    (window.__auditStages ||= []).push(s);
    const begin=s.begin.bind(s),fn=s.fn.bind(s),path=s.path.bind(s),bars=s.bars.bind(s);
    s.begin=()=>{s.__curves=[];s.__paths=[];s.__bars=[];return begin();};
    s.fn=(f,st={})=>{const [a,b]=st.domain||s.view.x;s.__curves.push({color:st.color,pts:Array.from({length:501},(_,i)=>{const x=a+(b-a)*i/500;return[x,f(x)];})});return fn(f,st);};
    s.path=(pts,st={})=>{s.__paths.push({pts:pts.map(p=>p&&Array.from(p)),color:st.color});return path(pts,st);};
    s.bars=(values,st)=>{s.__bars.push(Array.from(values));return bars(values,st);};`);
  await route.fulfill({response,body});
});
const open=async(id,file='ch04.js')=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/pde/${file}&id=pde-${id}&still=1&wait=100`);await page.waitForFunction(()=>window.__done);};
const settle=()=>page.waitForTimeout(100);
const read=()=>page.locator('.viz-readout').innerText();
const choose=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
const slider=async(i,key,steps=0)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);for(let j=0;j<steps;j++)await page.keyboard.press('ArrowRight');await settle();};
const state=()=>page.evaluate(()=>window.__auditStages.map(s=>({view:s.view,curves:s.__curves,paths:s.__paths,bars:s.__bars})));
const visible=s=>{for(const c of s.curves)for(const [,y] of c.pts)assert.ok(Number.isFinite(y)&&y>=s.view.y[0]-1e-8&&y<=s.view.y[1]+1e-8,'sampled curve stays in view');};
const drag=async(stage,index,x,y)=>{
  const p=await page.evaluate(({stage,index,x,y})=>{const s=window.__auditStages[stage],h=s.handles[index],r=s.canvas.getBoundingClientRect();return{a:r.left+s.X(h.x),b:r.top+s.Y(h.y),x:r.left+s.X(x),y:r.top+s.Y(y)};},{stage,index,x,y});
  await page.mouse.move(p.a,p.b);await page.mouse.down();await page.mouse.move(p.x,p.y,{steps:8});await page.mouse.up();await settle();
};
try {
  await open('4.1');
  for(let eq=0;eq<2;eq++){
    await choose(0,eq);
    for(let i=0;i<4;i++)await drag(1,i,i+1,1.1);
    visible((await state())[0]);
    assert.doesNotMatch(await read(),/NaN|Infinity/);
  }
  console.log('PASS separation: both PDEs with four coefficient pointer edits and visible sums');

  await open('4.2');await drag(0,0,.5,1.4);
  const s=await state(), values=s[1].bars[0];
  assert.ok(values[0]>1.1,'large pluck exercises the formerly clipped amplitude');
  assert.ok(Math.max(...values)<s[1].view.y[1]);
  for(let i=1;i<16;i+=2)assert.ok(values[i]<1e-12,'middle pluck eliminates even harmonics');
  await slider(0,'Home',45);
  assert.match(await read(),/silent at the pickup: 2, 4, 6/);
  console.log('PASS pluck: middle-node cancellations, pickup control and largest-amplitude bars');

  await open('4.3');
  for(let left=0;left<2;left++)for(const [key,steps] of [['Home',0],['End',0],['Home',8],['Home',12]]){
    await choose(0,left);await slider(0,key,steps);
    for(const mode of ['Home','End']){
      await slider(1,mode);const stages=await state();visible(stages[0]);visible(stages[1]);
      assert.doesNotMatch(await read(),/NaN|Infinity/);
    }
  }
  console.log('PASS Robin: both ends, growth/zero/decay thresholds and selected-mode extremes, all envelopes visible');

  await open('4.5','ch04-b.js');
  for(let left=0;left<3;left++)for(let right=0;right<3;right++){
    await choose(0,left);await choose(1,right);
    assert.match(await read(),/✓ orthogonal/);
  }
  await page.locator('.ctl-toggle label').click();await slider(1,'End');
  assert.match(await read(),/not orthogonal/);
  await slider(1,'Home',18);assert.match(await read(),/✓ orthogonal/);
  console.log('PASS orthogonality: nine symmetric end combinations, nonsymmetric example and its a=0 exception');

  await open('4.6','ch04-b.js');
  for(let f=0;f<4;f++)for(const n of ['Home','End']){
    await choose(0,f);await slider(0,n);assert.doesNotMatch(await read(),/NaN|Infinity/);
    const e=(await state())[1];assert.ok(e.view.y[0]>0&&e.view.y[1]>e.view.y[0]);
    const path=e.paths.find(p=>p.color==='accent').pts;
    for(let i=1;i<path.length;i++)assert.ok(path[i][1]<=path[i-1][1]+1e-12);
  }
  console.log('PASS Parseval: four functions at both slider endpoints and monotone finite projection errors');

  await open('4.7','ch04-b.js');
  for(const x of [0,Math.PI,-Math.PI]){
    await drag(0,0,x,-1.35);await page.getByRole('button',{name:'probe nearest jump',exact:true}).click();await settle();
    const target=(await page.locator('.viz-readout annotation').allTextContents()).find(t=>t.includes('frac12'));
    assert.ok(Math.abs(Number(target.split('=').at(-1)))<.001,'one-sided midpoint at a square-wave jump');
  }
  console.log('PASS convergence: pointer probe at the interior and periodic endpoint jumps');

  await open('4.9','ch04-b.js');
  const chart=(await state())[0].paths;
  for(let k=1;k<=4;k++){
    const moment=[0,1/12,1/180,1/840,1/2100][k], factorial=[1,1,2,6,24][k];
    const expected=factorial/(2*Math.PI)**k/Math.sqrt(2*Math.PI*moment);
    assert.ok(Math.abs(chart[k-1].pts[0][1]/expected-1)<1e-5,'complex coefficient with unit L2(dx) norm');
  }
  await choose(0,4);await slider(0,'End');visible((await state())[1]);
  console.log('PASS coefficient decay: all four exact normalized Bernoulli coefficients and high narrow analytic peak');

  await open('4.12','ch04-c.js');
  for(const key of ['Home','End']){await slider(0,key);assert.doesNotMatch(await read(),/NaN|Infinity/);}
  console.log('PASS Fourier recreation: both finite-series endpoints');
  assert.deepEqual(errors,[]);
} finally {await browser.close();await new Promise(r=>server.close(r));}
