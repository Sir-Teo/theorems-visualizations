import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { rng } from '../assets/js/viz/math.js';
import { triPt, solveZS, guarantee, ceiling } from '../content/game/ch03.shared.js';
import { FICTITIOUS_GAMES, MINIMAX_BIAS, fictitiousPlay } from '../content/game/minimax-audit.js';

const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__FT=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}const fill=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(t,x,y,...a)=>{const m=s.ctx.measureText(t);s.__FT.push([String(t),x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent,!!s._clipped]);return fill(t,x,y,...a);};`);
  body=body.replace('return item.viz(v);',`const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();window.__RV=(window.__C||[]).map(c=>c.value);window.__RS=(window.__SEL||[]).map(c=>c.value);return window.__R;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};const select=v.select.bind(v);v.select=(...a)=>{const c=select(...a);(window.__SEL||=[]).push(c);return c;};return item.viz(v);`);
  body=body.replace("mount(document.getElementById('viz'),", "window.__mount=mount(document.getElementById('viz'),");
  body=body.replace('    });\n    window.__vizStats',"    }, {state:JSON.parse(sessionStorage.getItem('gameRestore')||'null')});\n    window.__vizStats");
  await route.fulfill({response,body});
});
await page.route(/\/content\/game\/ch03\.js$/,async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('info = { x, y, gx, hy_, S, certificate };','info = window.__audit = { A, x, y, gx, hy_, S, certificate };')});});
await page.route(/\/content\/game\/ch03-b\.js$/,async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('run = { ...fictitiousPlay(A, TM, mode.value), sol, certificate:', 'run = window.__audit = { ...fictitiousPlay(A, TM, mode.value), sol, certificate:')});});
const near=(x,y,e=1e-8)=>assert.ok(Math.abs(x-y)<=e*Math.max(1,Math.abs(y)),`${x} != ${y}`);
async function done(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForFunction(()=>JSON.stringify(window.__RV)===JSON.stringify(window.__C.map(c=>c.value))&&JSON.stringify(window.__RS)===JSON.stringify(window.__SEL.map(c=>c.value)));}
async function load(id,theme,width){await page.setViewportSize({width,height:1400});await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/game/${id==='3.4'?'ch03.js':'ch03-b.js'}&id=game-${id}&theme=${theme}&w=${width-36}&still=1&wait=100`);await page.waitForFunction(()=>window.__done);const d=await page.evaluate(()=>window.__done);assert.deepEqual(d.errors,[]);assert.deepEqual(d.texErrors,[]);assert.deepEqual(d.blank,[]);await page.evaluate(()=>document.fonts.ready);await done();}
async function choose(label,value){await page.locator('.ctl-select').filter({has:page.locator('.ctl-label',{hasText:label})}).getByRole('button',{name:value,exact:true}).click();await done();}
async function round(t){await page.locator('input[type=range]').evaluate((e,t)=>{e.value=Math.log10(t);e.dispatchEvent(new Event('input',{bubbles:true}));},t);await done();assert.equal(await page.evaluate(()=>window.__C[0].value),t);}
async function snapshot(){
  const q=await page.evaluate(()=>({r:window.__R,a:window.__audit,values:window.__C.map(c=>c.value),modes:window.__SEL.map(c=>c.value),errors:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,overflow:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),pageOverflow:document.documentElement.scrollWidth>innerWidth+1,
    S:window.__S.map(s=>({w:s.width,h:s.height,b:s.bounds,paths:s.__P,dots:s.__D,text:s.__FT,pb:[s.X(s.bounds.x[0]),s.Y(s.bounds.y[1]),s.X(s.bounds.x[1]),s.Y(s.bounds.y[0])],pp:s.__P.map(([pts,o={}])=>({r:(o.width??2)/2,pts:pts.map(p=>p&&[s.X(p[0]),s.Y(p[1])])})),glyph:s.__D.map(([x,y,o={}])=>[s.X(x),s.Y(y),(o.r??4)+(o.hollow?(o.width??1.8)/2:.75)]),handles:s.handles.map(h=>[s.X(h.x),s.Y(h.y),h.r+4])}))}));
  assert.deepEqual(q.errors,[]);assert.equal(q.tex,0);assert.equal(q.pageOverflow,false);assert.deepEqual(q.overflow,[]);assert.doesNotMatch(q.r,/NaN|Infinity|undefined|\\n/);
  for(const s of q.S){
    for(const {pts,r}of s.pp)for(const p of pts)if(p){assert.ok(p.every(Number.isFinite));assert.ok(p[0]-r>=s.pb[0]-1e-7&&p[0]+r<=s.pb[2]+1e-7&&p[1]-r>=s.pb[1]-1e-7&&p[1]+r<=s.pb[3]+1e-7,'complete path/stroke');}
    for(const[x,y,r]of[...s.glyph,...s.handles])assert.ok(x-r>=s.pb[0]&&x+r<=s.pb[2]&&y-r>=s.pb[1]&&y+r<=s.pb[3],`complete marker/ring/handle ${[x,y,r]} in ${s.pb}`);
    for(const[t,x,y,X,Y,clipped]of s.text){assert.ok(x>=-1&&y>=-1&&X<=s.w+1&&Y<=s.h+1,`canvas text ${t}`);if(clipped)assert.ok(x-2>=s.pb[0]&&X+2<=s.pb[2]&&y-2>=s.pb[1]&&Y+2<=s.pb[3],`text halo ${t} ${[x,y,X,Y]} in ${s.pb}`);}
  }return q;
}
async function checkLP(){const q=await snapshot(),r=rng(q.values[0]*101+3),A=q.modes[0]==='bias'?MINIMAX_BIAS:Array.from({length:3},()=>Array.from({length:3},()=>r.int(-5,5)));assert.deepEqual(q.a.A,A);assert.equal(q.a.certificate.ok,true);near(q.a.gx,guarantee(A,q.a.x));near(q.a.hy_,ceiling(A,q.a.y));const S=solveZS(A);near(q.a.S.v,S.v);assert.match(q.r,/passes numerical checks/);assert.equal(q.S.length,3);const labels=q.S[2].text.filter(([t])=>['g(x)','h(y)','v'].includes(t));assert.equal(labels.length,3);for(let i=0;i<3;i++)for(let j=0;j<i;j++){const[a,x,y,X,Y]=labels[i],[b,u,v,U,V]=labels[j];assert.ok(X+2<u-2||U+2<x-2||Y+2<v-2||V+2<y-2,`separate security labels ${a}/${b}`);}return q;}
async function checkFP(){
  const q=await snapshot(),t=q.values[0],A=FICTITIOUS_GAMES[q.modes[0]].A,run=fictitiousPlay(A,4000,q.modes[1]);assert.equal(q.S.length,3);
  assert.deepEqual(q.a.actions,run.actions);assert.deepEqual(q.a.X,run.X);assert.deepEqual(q.a.Y,run.Y);assert.deepEqual(q.a.lo,run.lo);assert.deepEqual(q.a.hi,run.hi);assert.equal(q.a.certificate.ok,true);
  const [X,Y,L]=q.S;assert.equal(X.paths[1][0].length,t);assert.equal(Y.paths[1][0].length,t);
  for(let k=0;k<t;k++){const x=triPt(run.X[k]),y=triPt(run.Y[k]);x.forEach((v,i)=>near(X.paths[1][0][k][i],v));y.forEach((v,i)=>near(Y.paths[1][0][k][i],v));}
  assert.deepEqual(L.paths.map(([p])=>p.length),[4000,4000,t,t]);
  for(let s=0;s<4000;s++){near(L.paths[0][0][s][0],s+1);near(L.paths[0][0][s][1],run.hi[s]);near(L.paths[1][0][s][1],run.lo[s]);}
  near(L.dots[0][0],t);near(L.dots[0][1],run.hi[t-1]);near(L.dots[1][0],t);near(L.dots[1][1],run.lo[t-1]);
  assert.ok(q.r.includes(`row ${run.actions[t-1][0]+1}, column ${run.actions[t-1][1]+1}`));assert.match(q.r,/neither bound is required to move monotonically/);return q;
}
async function screenshot(name,width,theme){await page.screenshot({path:`/tmp/atlas-game-${name}-${width}-${theme}.png`,fullPage:true});for(let i=0;i<3;i++)await page.locator('.stage').nth(i).screenshot({path:`/tmp/atlas-game-${name}-${width}-${theme}-panel${i}.png`});}
async function replay(check){const before=await check(),state=await page.evaluate(()=>window.__mount.snapshot());await page.evaluate(s=>sessionStorage.setItem('gameRestore',JSON.stringify(s)),state);await page.reload();await page.waitForFunction(()=>window.__done);await done();const after=await check();assert.deepEqual(after.values,before.values);assert.deepEqual(after.modes,before.modes);assert.equal(after.r,before.r);assert.deepEqual(after.S.map(s=>[s.paths,s.dots]),before.S.map(s=>[s.paths,s.dots]));await page.evaluate(()=>sessionStorage.removeItem('gameRestore'));}
async function drag(sIndex,target){const position=await page.evaluate(([i,target])=>{const s=window.__S[i],h=s.handles[0],b=s.canvas.getBoundingClientRect();return{from:[b.x+s.X(h.x),b.y+s.Y(h.y)],to:[b.x+s.X(target[0]),b.y+s.Y(target[1])]};},[sIndex,target]);await page.mouse.move(...position.from);await page.mouse.down();await page.mouse.move(...position.to,{steps:8});await page.mouse.up();await page.mouse.move(1,1);await done();}
try{for(const theme of['light','dark'])for(const width of[1440,320]){
  await load('3.4',theme,width);await checkLP();await screenshot('lp-default',width,theme);
  for(const name of['skew-symmetric','random']){await choose('matrix',name);for(const key of['Home','End']){await page.locator('input[type=range]').press(key);await done();const q=await checkLP();assert.equal(q.values[0],key==='Home'?1:128);}await page.getByRole('button',{name:'Snap to the LP solution',exact:true}).click();await done();const q=await checkLP();near(q.a.hy_-q.a.gx,0);}
  await screenshot('lp-snap',width,theme);await page.getByRole('button',{name:'New random matrix',exact:true}).click();await done();let q=await checkLP();assert.equal(q.values[0],1);assert.equal(q.modes[0],'rand');
  for(const p of[[0,0],[1,0],[.5,Math.sqrt(3)/2],[-.2,-.2],[1.2,-.1]]){await drag(0,p);await drag(1,p);q=await checkLP();assert.ok(q.a.x.every(x=>x>=0)&&q.a.y.every(x=>x>=0));}
  await screenshot('lp-handles',width,theme);await replay(checkLP);
  console.log(`PASS LP ${width} ${theme}: seed endpoints/wrap, both matrix choices, certified snap, actual constrained handle drags, saved seed/handles replay, full glyph/path/text/TeX bounds`);
  await load('3.6',theme,width);await checkFP();await screenshot('fp-default',width,theme);
  for(const g of Object.values(FICTITIOUS_GAMES))for(const update of['simultaneous','alternating']){await choose('game',g.label);await choose('update timing',update);for(const key of['Home','End']){await page.locator('input[type=range]').press(key);await done();q=await checkFP();assert.equal(q.values[0],key==='Home'?1:4000);}await round(63);await checkFP();}
  await screenshot('fp-alternating-63',width,theme);await replay(checkFP);await page.locator('input[type=range]').press('End');await done();await checkFP();await screenshot('fp-final',width,theme);
  console.log(`PASS fictitious ${width} ${theme}: both timings/all4 games at1/63/4000, every plotted empirical/bound point including final endpoint, prefix decisions, nonmonotone range, saved controls replay, full glyph/path/text/TeX bounds`);
}assert.deepEqual(errors,[]);}catch(e){await page.screenshot({path:'/tmp/atlas-game-minimax-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
