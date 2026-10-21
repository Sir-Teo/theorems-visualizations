import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__F=[];s.__D=[];s.__H=[];return begin();};const fn=s.fn.bind(s);s.fn=(f,o={})=>{const d=o.domain||s.bounds.x;s.__F.push(Array.from({length:121},(_,i)=>{const x=d[0]+i*(d[1]-d[0])/120;return [x,f(x)];}));return fn(f,o);};const dot=s.dot.bind(s);s.dot=(x,y,o={})=>{s.__D.push({x,y,px:s.X(x),py:s.Y(y),radius:o.r??4});return dot(x,y,o);};const hl=s.hline.bind(s);s.hline=(y,o={})=>{s.__H.push(y);return hl(y,o);};`);
  body=body.replace('return item.viz(v);','const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});return item.viz(v);');
  await route.fulfill({response,body});
});
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
async function check(){
  const q=await page.evaluate(()=>({r:window.__R,tex:document.querySelectorAll('.katex-error').length,errors:window.__vizErrors||[],mathOverflow:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),S:window.__S.map(s=>({b:s.bounds,w:s.W,h:s.H,m:s._m,f:s.__F,d:s.__D,hl:s.__H})),values:[...document.querySelectorAll('input[type=range]')].map(e=>+e.value)}));
  assert.deepEqual(q.errors,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);
  assert.deepEqual(q.mathOverflow,[]);
  const [k,pi,po]=q.values,A=(pi-po*k*k)/(k*k-1),B=k*k*(pi-po)/(k*k-1);
  for(const [j,s]of q.S.entries()){
    for(const line of s.f)for(const [x,y]of line){assert.ok(Number.isFinite(x+y));assert.ok(x>=s.b.x[0]&&x<=s.b.x[1]);assert.ok(y>=s.b.y[0]&&y<=s.b.y[1]);}
    for(const p of s.d){assert.ok(p.px-p.radius>=s.m.l-.01&&p.px+p.radius<=s.w-s.m.r+.01,`dot clips horizontally stage${j}: ${JSON.stringify(p)}`);assert.ok(p.py-p.radius>=s.m.t-.01&&p.py+p.radius<=s.h-s.m.b+.01,`dot clips vertically stage${j}`);}
  }
  const left=q.S[0];assert.equal(left.f.length,2);assert.equal(left.d.length,4);
  for(const [x,y]of left.f[0])near(y,A+B/x**2);for(const [x,y]of left.f[1])near(y,A-B/x**2);
  near(left.hl[0],(pi-po*k)/(k-1));near(left.d[0].y,A+B);near(left.d[1].y,-pi);near(left.d[3].y,-po);
  near(q.S[1].d[0].y,2*(k*k+1)/(k+1)**2);assert.match(q.r,/closed-end axial stress/);return q;
}
try{
  for(const theme of ['light','dark'])for(const width of[1450,430]){
    await page.setViewportSize({width,height:1300});
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/solid/ch03.js&id=solid-3.9&theme=${theme}&w=${width-40}&still=1&wait=150`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__done);const done=await page.evaluate(()=>window.__done);assert.deepEqual(done.errors,[]);assert.deepEqual(done.texErrors,[]);assert.deepEqual(done.blank,[]);
    for(let mask=0;mask<8;mask++){
      for(let i=0;i<3;i++){const e=page.locator('input[type=range]').nth(i);await e.focus();await page.keyboard.press(mask&(1<<i)?'End':'Home');}
      await page.waitForTimeout(40);await check();
      if(mask===4||mask===7)await page.screenshot({path:`/tmp/atlas-solid-cylinder-${mask===4?'external':'equal'}-${width}-${theme}.png`,fullPage:true});
    }
    console.log(`PASS solid3.9 ${width} ${theme}: eight actual radius/pressure corners, independent full curves, force-average line, zero/equal/external loads and every endpoint glyph`);
  }
  assert.deepEqual(errors,[]);
}catch(e){await page.screenshot({path:'/tmp/atlas-solid-cylinder-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
