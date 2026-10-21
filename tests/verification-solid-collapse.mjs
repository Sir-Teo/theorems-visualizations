import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__D=[];s.__P=[];return begin();};const dot=s.dot.bind(s);s.dot=(x,y,o={})=>{s.__D.push({x,y,px:s.X(x),py:s.Y(y),r:o.r??4});return dot(x,y,o);};for(const name of ['path','poly']){const f=s[name].bind(s);s[name]=(pts,o={})=>{s.__P.push(pts);return f(pts,o);};}`);
  body=body.replace('return item.viz(v);','const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});return item.viz(v);');
  await route.fulfill({response,body});
});
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
async function check(){
  const q=await page.evaluate(()=>({r:window.__R,errors:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,math:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),inputs:[...document.querySelectorAll('input[type=range]')].map(e=>+e.value),S:window.__S.map(s=>({b:s.bounds,w:s.W,h:s.H,m:s.o.gutter?s._m:{l:0,r:0,t:0,b:0},d:s.__D,p:s.__P,handles:s.handles.map(h=>({x:h.x,y:h.y}))}))}));
  assert.deepEqual(q.errors,[]);assert.deepEqual(q.math,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);
  const x=q.S[1].handles[0].x,lo=4*(100+(q.inputs[0]+q.inputs[1])/2)/6,hi=400/Math.min(x,6-x),c=q.S[2];
  near(c.d[0].x,lo);near(c.d[1].x,hi);assert.ok(lo<=800/6&&hi>=800/6-1e-9);assert.ok(c.b.x[1]>hi);
  for(const s of q.S){for(const p of s.d){const r=p.r+.75;assert.ok(p.px-r>=s.m.l-.25&&p.px+r<=s.w-s.m.r+.25,`horizontal marker clip: ${JSON.stringify(p)}`);assert.ok(p.py-r>=s.m.t-.25&&p.py+r<=s.h-s.m.b+.25,'vertical marker clip');}for(const path of s.p)for(const [x,y]of path)assert.ok(Number.isFinite(x+y)&&x>=s.b.x[0]&&x<=s.b.x[1]&&y>=s.b.y[0]&&y<=s.b.y[1]);}
  return q;
}
async function drag(x){
  const p=await page.evaluate(x=>{const s=window.__S[1],h=s.handles[0],r=s.canvas.getBoundingClientRect();return{a:[r.x+s.X(h.x),r.y+s.Y(h.y)],b:[r.x+s.X(x),r.y+s.Y(-.9)]};},x);
  await page.mouse.move(...p.a);await page.mouse.down();await page.mouse.move(...p.b,{steps:4});await page.mouse.up();await page.waitForTimeout(30);
  const q=await check();near(q.S[1].handles[0].x,x,1e-5);return q;
}
try{
  for(const theme of['light','dark'])for(const width of[1450,430]){
    await page.setViewportSize({width,height:1500});
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/solid/ch04-b.js&id=solid-4.10&theme=${theme}&w=${width-40}&still=1&wait=150`);
    await page.waitForFunction(()=>window.__done);const done=await page.evaluate(()=>window.__done);assert.deepEqual(done.errors,[]);assert.deepEqual(done.texErrors,[]);assert.deepEqual(done.blank,[]);
    for(let mask=0;mask<4;mask++){
      for(let i=0;i<2;i++){await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(mask&(1<<i)?'End':'Home');}
      for(const x of[.4,3,5.6])await drag(x);
    }
    await drag(.4);await page.screenshot({path:`/tmp/atlas-solid-collapse-wide-bound-${width}-${theme}.png`,fullPage:true});
    await page.getByRole('button',{name:'match both bounds',exact:true}).click();await page.waitForTimeout(30);const q=await check();near(q.S[2].d[0].x,800/6);near(q.S[2].d[1].x,800/6);assert.match(q.r,/bounds have met/);
    await page.screenshot({path:`/tmp/atlas-solid-collapse-equality-${width}-${theme}.png`,fullPage:true});
    console.log(`PASS solid4.10 ${width} ${theme}: four native moment corners ×three actual hinge drags, full admissible diagrams, both marker extents and equality action`);
  }
  assert.deepEqual(errors,[]);
}catch(e){await page.screenshot({path:'/tmp/atlas-solid-collapse-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
