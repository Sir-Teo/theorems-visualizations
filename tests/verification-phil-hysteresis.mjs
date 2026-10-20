import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true }), page = await browser.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch(); let body = await response.text();
  body = body.replace("renderRich(document.getElementById('idea'), item.idea || '');", "renderRich(document.getElementById('idea'), item.idea || '');const scope=document.createElement('div');scope.className='prose';scope.style.marginTop='14px';document.getElementById('wrap').append(scope);renderRich(scope,item.scope||'');");
  body = body.replace('stats.stages++;', `stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__DS=[];s.__RC=[];s.__FT=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['dots','__DS'],['rect','__RC']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}const fill=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(t,x,y,...a)=>{const m=s.ctx.measureText(t);s.__FT.push([String(t),x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent,!!s._clipped]);return fill(t,x,y,...a);};`);
  body = body.replace('return item.viz(v);', `const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();window.__RV=(window.__C||[]).map(c=>c.value);window.__RT=(window.__TG||[]).map(c=>c.value);window.__RS=(window.__SEL||[]).map(c=>c.value);return window.__R;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};const select=v.select.bind(v);v.select=(...a)=>{const c=select(...a);(window.__SEL||=[]).push(c);return c;};const toggle=v.toggle.bind(v);v.toggle=(...a)=>{const c=toggle(...a);(window.__TG||=[]).push(c);return c;};return item.viz(v);`);
  await route.fulfill({ response, body });
});
const near = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${a} != ${b}`);
async function done() { await page.waitForFunction(() => JSON.stringify(window.__RT)===JSON.stringify((window.__TG||[]).map(c=>c.value)) && JSON.stringify(window.__RV) === JSON.stringify((window.__C||[]).map(c => c.value)) && JSON.stringify(window.__RS) === JSON.stringify((window.__SEL || []).map(c => c.value))); }
async function load(id, theme, width) {
  await page.setViewportSize({ width, height: 1600 });
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/phil/ch03.js&id=phil-${id}&theme=${theme}&w=${width - 50}&still=1&wait=150`);
  await page.waitForFunction(() => window.__done); const d = await page.evaluate(() => window.__done);
  assert.deepEqual(d.errors, []); assert.deepEqual(d.texErrors, []); assert.deepEqual(d.blank, []); await done();
}
async function mode(name) { await page.getByRole('button', { name, exact: true }).click(); await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))); await done(); }
async function snapshot() {
  const a = await page.evaluate(() => ({ r: window.__R, audit: window.__audit, values: (window.__C||[]).map(c => c.value), modes: (window.__SEL || []).map(c => c.value), toggles:(window.__TG||[]).map(c=>c.value), e: window.__vizErrors || [], tex: document.querySelectorAll('.katex-error').length, overflow: [...document.querySelectorAll('.katex-display')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent), pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    S: window.__S.map(s => ({ visible: s.el.style.display !== 'none', w: s.width, h: s.height, b: s.bounds, paths: s.__P, dots: [...s.__D, ...s.__DS.flatMap(([ps,o])=>ps.map(([x,y])=>[x,y,o]))], rect: s.__RC, text: s.__FT, pb: [s.X(s.bounds.x[0]), s.Y(s.bounds.y[1]), s.X(s.bounds.x[1]), s.Y(s.bounds.y[0])], pp: s.__P.map(([pts,o={}]) => ({r:(o.width??2)/2,pts:pts.map(p => p && [s.X(p[0]), s.Y(p[1])])})), glyph: [...s.__D.map(([x,y,o={}])=>[s.X(x),s.Y(y),(o.r??4)+(o.hollow?(o.width??1.8)/2:o.ring!==false&&(o.r??4)>=3?.75:0)]),...s.__DS.flatMap(([ps,o={}])=>ps.map(([x,y])=>[s.X(x),s.Y(y),o.r??2.5]))], rr:s.__RC.map(([x,y,X,Y,o={}])=>[s.X(x),s.Y(y),s.X(X),s.Y(Y),o.stroke===false?0:(o.width??2)/2]) })) }));
  assert.deepEqual(a.e, []); assert.deepEqual(a.overflow, []); assert.equal(a.tex, 0); assert.equal(a.pageOverflow, false); assert.doesNotMatch(a.r, /NaN|Infinity|undefined|\\n/);
  for (const s of a.S.filter(s => s.visible)) {
    for (const {pts,r} of s.pp) for (const p of pts) if (p) { assert.ok(p.every(Number.isFinite)); assert.ok(p[0]-r >= s.pb[0] - 1e-7 && p[0]+r <= s.pb[2] + 1e-7 && p[1]-r >= s.pb[1] - 1e-7 && p[1]+r <= s.pb[3] + 1e-7, 'complete plotted paths'); }
    for (const [x, y, X, Y] of s.rect) for (const [u, v] of [[x, y], [X, Y]]) assert.ok(u >= s.b.x[0] - 1e-9 && u <= s.b.x[1] + 1e-9 && v >= s.b.y[0] - 1e-9 && v <= s.b.y[1] + 1e-9, 'complete histogram/model rectangle');
    for(const[x,y,X,Y,r]of s.rr)assert.ok(Math.min(x,X)-r>=s.pb[0]-1e-7&&Math.max(x,X)+r<=s.pb[2]+1e-7&&Math.min(y,Y)-r>=s.pb[1]-1e-7&&Math.max(y,Y)+r<=s.pb[3]+1e-7,'complete rectangle strokes');
    for (const [x, y, r] of s.glyph) assert.ok(x - r >= s.pb[0] && x + r <= s.pb[2] && y - r >= s.pb[1] && y + r <= s.pb[3], 'full marker/ring');
    for (const [t, x, y, X, Y, clipped] of s.text) { assert.ok(x >= -1 && y >= -1 && X <= s.w + 1 && Y <= s.h + 1, `canvas text ${t}`); if (clipped) assert.ok(x - 2 >= s.pb[0] && X + 2 <= s.pb[2] && y - 2 >= s.pb[1] && Y + 2 <= s.pb[3], `text halo ${t}`); }
  }
  return a;
}
await page.route(/\/content\/phil\/ch03\.js$/, async route => {
  const response = await route.fetch();
  const body = (await response.text()).replace('st = { r: rS.value, index, current, eq, ...cache };', 'st = window.__audit = { r: rS.value, index, current, eq, ...cache };');
  await route.fulfill({ response, body });
});
async function settle() { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await done(); }
async function set(values) {
  await page.locator('input[type=range]').evaluateAll((es, vals) => es.forEach((e, i) => { e.value = vals[i]; e.dispatchEvent(new Event('input', { bubbles: true })); }), values);
  await done(); const actual = await page.evaluate(() => window.__C.map(c => c.value)); actual.forEach((x, i) => near(x, values[i]));
}
function roots(r,s){if(r>0){const H=2*(r/3)**1.5,a=Math.sqrt(r/3);if(s===H)return[-a,2*a];if(s===-H)return[-2*a,a];if(Math.abs(s)<H){const theta=Math.acos(s/H)/3;return[0,1,2].map(k=>2*a*Math.cos(theta-2*k*Math.PI/3)).sort((a,b)=>a-b);}}const D=Math.sqrt(s*s/4-(r/3)**3);return[Math.cbrt(s/2+D)+Math.cbrt(s/2-D)];}
function midpoint(r,T,start){const sign=start==='low'?1:-1,points=[roots(r,-sign)[0]];let z=points[0];const N=Math.ceil((T/100)/.004),h=(T/100)/N;for(let i=0;i<200;i++){const dir=i<100?sign:-sign,s0=i<100?-sign+2*sign*i/100:sign-2*sign*(i-100)/100;for(let j=0;j<N;j++){const s=s0+dir*2*(j+.5)*h/T,old=z;let next=old;for(let n=0;n<8;n++){const m=(old+next)/2;next-=(next-old-h*(r*m-m**3+s))/(1-h*(r-3*m*m)/2);}z=next;}points.push(z);}return points;}
const references = new Map();
function reference(r,T,start) { const key = `${r}|${T}|${start}`; if (!references.has(key)) references.set(key,midpoint(r,T,start)); return references.get(key); }
async function check() {
  const a = await snapshot(), q = a.audit, s = a.S[0], {cycle,current,eq,index,r,branches,fold} = q, sign = cycle.start === 'low' ? 1 : -1;
  assert.equal(a.S.length,1); assert.deepEqual(a.values,[r,cycle.duration,index]); assert.deepEqual(a.modes,[cycle.start]);
  near(current.t,index*cycle.duration/100); near(current.s,index<=100?-sign+2*sign*index/100:sign-2*sign*(index-100)/100); assert.deepEqual(current,cycle.points[index]);
  const ref = reference(r,cycle.duration,cycle.start); cycle.points.forEach((p,i)=>near(p.z,ref[i],1e-5));
  const R=roots(r,current.s); assert.equal(eq.length,R.length);eq.forEach((e,i)=>{near(e.z,R[i],2e-9);near(e.slope,r-3*e.z**2);});
  const controls = await page.evaluate(() => ({inputs:window.__C.map(c=>[+c.input.value,c.value,+c.el.querySelector('output').textContent.replace('−','-'),+c.input.min,+c.input.max]), selected:[...document.querySelectorAll('.ctl-select button')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent),prev:[...document.querySelectorAll('button')].find(b=>b.textContent==='Previous point').disabled,next:[...document.querySelectorAll('button')].find(b=>b.textContent==='Next point').disabled}));
  assert.deepEqual(controls.selected,[cycle.start==='low'?'start at s = −1':'start at s = +1']);
  const endpoints=[[-.5,1.5],[4,160],[0,200]];controls.inputs.forEach(([input,value,output,min,max],i)=>{near(input,a.values[i]);near(value,a.values[i]);near(output,a.values[i]);assert.deepEqual([min,max],endpoints[i]);});assert.equal(controls.prev,index===0);assert.equal(controls.next,index===200);
  assert.equal(branches.length,r>0?3:1);
  const equilibriumPaths=s.paths.filter(([,o])=>o.width===2);assert.equal(equilibriumPaths.length,branches.length);
  equilibriumPaths.forEach(([ps,o],i)=>{assert.deepEqual(ps,branches[i].points);assert.equal(o.color,branches[i].stable?'green':'red');for(const[x,z]of ps){near(x,z**3-r*z);assert.ok(Math.abs(x)<=1+1e-12);assert.ok(Math.abs(z)<1.5);}});
  const out=s.paths.filter(([,o])=>o.color==='blue'&&o.width===3),back=s.paths.filter(([,o])=>o.color==='orange'&&o.width===3);
  assert.equal(out.length,index>0?1:0);assert.equal(back.length,index>100?1:0);
  if(out.length)assert.deepEqual(out[0][0],cycle.points.slice(0,Math.min(index,100)+1).map(p=>[p.s,p.z]));
  if(back.length)assert.deepEqual(back[0][0],cycle.points.slice(100,index+1).map(p=>[p.s,p.z]));
  assert.equal(s.dots.length,(fold?2:0)+eq.length+1);
  const gold=s.dots.at(-1);near(gold[0],current.s);near(gold[1],current.z);assert.equal(gold[2].color,'gold');
  if(fold){near(fold.s,2*(r/3)**1.5);near(fold.z,Math.sqrt(r/3));s.dots.slice(0,2).forEach(([x,z,o],i)=>{const sign=i?1:-1;near(x,sign*fold.s);near(z,-sign*fold.z);assert.equal(o.hollow,true);});assert.match(a.r,/Static folds/);}else assert.match(a.r,/no static bistable interval/);
  assert.ok(a.r.includes(`**${index}/200**`));assert.ok(a.r.includes(`**${current.z<0?'A':current.z>0?'B':'boundary'}**`));assert.match(a.r,/finite-speed numerical values, not the static folds/);
  const formatted=x=>x.toFixed(4).replace('-','−');
  for(const text of[`$t=${formatted(current.t)}$`,`$s=${formatted(current.s)}$`,`$z=${formatted(current.z)}$`,`$\\dot z=${formatted(r*current.z-current.z**3+current.s)}$`])assert.ok(a.r.includes(text),`numeric readout ${text}`);
  eq.forEach(e=>{assert.ok(a.r.includes(`$z=${formatted(e.z)}$ (${e.kind}; $\\lambda=${formatted(r-3*e.z**2)}$)`));});
  for(const leg of[0,1]){const events=cycle.events.filter(e=>e.leg===leg);if(!events.length)assert.ok(a.r.includes(`${leg?'Return':'Outward'} zero crossing: none on this leg`));for(const e of events)assert.ok(a.r.includes(e.direction>0?'A→B':'B→A'));}
  return a;
}
async function shot(name,width,theme){await page.screenshot({path:`/tmp/atlas-phil-hysteresis-${name}-${width}-${theme}.png`,fullPage:true});await page.locator('.stage').screenshot({path:`/tmp/atlas-phil-hysteresis-${name}-${width}-${theme}-panel.png`});}
try {
  for(const theme of['light','dark'])for(const width of[1450,430]){
    await load('3.7',theme,width);await check();await shot('default',width,theme);
    for(const start of['low','high']){
      await mode(start==='low'?'start at s = −1':'start at s = +1');
      for(const r of[-.5,0,.05,1,1.5])for(const T of[4,160])for(const index of[0,50,100,150,200]){await set([r,T,index]);await check();}
      await set([1,40,0]);for(let index=0;index<=200;index++){await page.locator('input[type=range]').nth(2).evaluate((e,i)=>{e.value=i;e.dispatchEvent(new Event('input',{bubbles:true}));},index);await done();await check();}
    }
    for(let i=0;i<=40;i++){await set([-.5+i/20,40,100]);await check();}
    for(let i=0;i<3;i++){const control=page.locator('input[type=range]').nth(i);await control.press('Home');await settle();assert.equal((await check()).values[i],[-.5,4,0][i]);await control.press('End');await settle();assert.equal((await check()).values[i],[1.5,160,200][i]);await control.press('ArrowLeft');await settle();near((await check()).values[i],[1.45,159,199][i]);}
    await mode('start at s = −1');await set([1,4,200]);let a=await check();assert.deepEqual(a.audit.cycle.events.map(e=>[e.leg,e.direction]),[[1,1]]);await shot('late-switch',width,theme);
    await set([1.5,4,200]);a=await check();assert.equal(a.audit.cycle.events.length,0);await shot('no-switch',width,theme);
    await set([-.5,4,200]);await check();await shot('monostable-lag',width,theme);
    await set([0,160,50]);await check();await shot('critical',width,theme);
    await set([1.5,160,200]);await check();await shot('slow-bistable',width,theme);
    await mode('Reset cycle');assert.equal((await check()).audit.index,0);await mode('Next point');assert.equal((await check()).audit.index,1);await mode('Previous point');assert.equal((await check()).audit.index,0);
    await mode('Outward endpoint');a=await check();assert.equal(a.audit.index,100);const actualTurn=a.audit.current.z;await mode('Next point');assert.equal((await check()).audit.cycle.points[100].z,actualTurn);await mode('Complete return');assert.equal((await check()).audit.index,200);
    await page.getByRole('button',{name:'start at s = +1',exact:true}).press('Enter');await settle();assert.equal((await check()).audit.cycle.start,'high');
    console.log(`PASS hysteresis ${width} ${theme}: all 201 cycle points in both preparations; all r endpoints, zero, near-zero and bistable corners at T4/160 and five cycle positions; all41r values; native slider Home/End/ArrowLeft and reset/outward/return/step/keyboard preparation controls; independent implicit-midpoint trajectories, analytic roots and full path/dot/text/TeX/page bounds`);
  }
  assert.deepEqual(errors,[]);
}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-phil-hysteresis-failure.png',fullPage:true});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
