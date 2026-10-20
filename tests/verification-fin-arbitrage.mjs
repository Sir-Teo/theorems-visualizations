import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { rng } from '../content/fin/ch05.shared.js';
const server = createServer(); await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true }), page = await browser.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch(); let body = await response.text();
  body = body.replace('stats.stages++;', `stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__DS=[];s.__RC=[];s.__FT=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['dots','__DS'],['rect','__RC']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}const fill=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(t,x,y,...a)=>{const m=s.ctx.measureText(t);s.__FT.push([String(t),x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent,!!s._clipped]);return fill(t,x,y,...a);};`);
  body = body.replace('return item.viz(v);', `const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();window.__RV=(window.__C||[]).map(c=>c.value);window.__RS=(window.__SEL||[]).map(c=>c.value);return window.__R;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};const select=v.select.bind(v);v.select=(...a)=>{const c=select(...a);(window.__SEL||=[]).push(c);return c;};return item.viz(v);`);
  await route.fulfill({ response, body });
});
const near = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${a} != ${b}`);
async function done() { await page.waitForFunction(() => JSON.stringify(window.__RV) === JSON.stringify(window.__C.map(c => c.value)) && JSON.stringify(window.__RS) === JSON.stringify((window.__SEL || []).map(c => c.value))); }
async function load(id, theme, width) {
  await page.setViewportSize({ width, height: 1600 });
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/fin/ch05-b.js&id=fin-${id}&theme=${theme}&w=${width - 50}&still=1&wait=150`);
  await page.waitForFunction(() => window.__done); const d = await page.evaluate(() => window.__done);
  assert.deepEqual(d.errors, []); assert.deepEqual(d.texErrors, []); assert.deepEqual(d.blank, []); await done();
}
async function mode(name) { await page.getByRole('button', { name, exact: true }).click(); await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))); await done(); }
async function set(values, log = []) {
  await page.locator('input[type=range]').evaluateAll((es, [vals, log]) => es.forEach((e, i) => { e.value = log.includes(i) ? Math.log10(vals[i]) : vals[i]; e.dispatchEvent(new Event('input', { bubbles: true })); }), [values, log]);
  await done(); const actual = await page.evaluate(() => window.__C.map(c => c.value)); const publicEntry = actual.length === 4 && (await page.evaluate(() => window.__SEL?.[0]?.value)) === 'semi'; actual.forEach((x, i) => near(x, publicEntry && i === 3 ? Math.max(0, values[i]) : values[i], log.includes(i) ? .008 : 1e-10));
}
async function snapshot() {
  const a = await page.evaluate(() => ({ r: window.__R, audit: window.__audit, values: window.__C.map(c => c.value), modes: (window.__SEL || []).map(c => c.value), e: window.__vizErrors || [], tex: document.querySelectorAll('.katex-error').length, overflow: [...document.querySelectorAll('.katex-display')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent), pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    S: window.__S.map(s => ({ visible: s.el.style.display !== 'none', w: s.width, h: s.height, b: s.bounds, paths: s.__P, dots: [...s.__D, ...s.__DS.flatMap(([ps,o])=>ps.map(([x,y])=>[x,y,o]))], rect: s.__RC, text: s.__FT, pb: [s.X(s.bounds.x[0]), s.Y(s.bounds.y[1]), s.X(s.bounds.x[1]), s.Y(s.bounds.y[0])], pp: s.__P.map(([pts,o={}]) => ({r:(o.width??2)/2,pts:pts.map(p => p && [s.X(p[0]), s.Y(p[1])])})), glyph: [...s.__D, ...s.__DS.flatMap(([ps,o])=>ps.map(([x,y])=>[x,y,o]))].map(([x, y, o = {}]) => [s.X(x), s.Y(y), (o.r ?? 4) + (o.hollow ? (o.width ?? 1.8) / 2 : .75)]) })) }));
  assert.deepEqual(a.e, []); assert.deepEqual(a.overflow, []); assert.equal(a.tex, 0); assert.equal(a.pageOverflow, false); assert.doesNotMatch(a.r, /NaN|Infinity|undefined|\\n/);
  for (const s of a.S.filter(s => s.visible)) {
    for (const {pts,r} of s.pp) for (const p of pts) if (p) { assert.ok(p.every(Number.isFinite)); assert.ok(p[0]-r >= s.pb[0] - 1e-7 && p[0]+r <= s.pb[2] + 1e-7 && p[1]-r >= s.pb[1] - 1e-7 && p[1]+r <= s.pb[3] + 1e-7, 'complete plotted paths'); }
    for (const [x, y, X, Y] of s.rect) for (const [u, v] of [[x, y], [X, Y]]) assert.ok(u >= s.b.x[0] - 1e-9 && u <= s.b.x[1] + 1e-9 && v >= s.b.y[0] - 1e-9 && v <= s.b.y[1] + 1e-9, 'complete histogram/model rectangle');
    for (const [x, y, r] of s.glyph) assert.ok(x - r >= s.pb[0] && x + r <= s.pb[2] && y - r >= s.pb[1] && y + r <= s.pb[3], 'full marker/ring');
    for (const [t, x, y, X, Y, clipped] of s.text) { assert.ok(x >= -1 && y >= -1 && X <= s.w + 1 && Y <= s.h + 1, `canvas text ${t}`); if (clipped) assert.ok(x - 2 >= s.pb[0] && X + 2 <= s.pb[2] && y - 2 >= s.pb[1] && Y + 2 <= s.pb[3], `text halo ${t}`); }
  }
  return a;
}
await page.route(/\/content\/fin\/ch05-b\.js$/,async route=>{const response=await route.fetch();const body=(await response.text()).replace('st={seed,m0:m0.value','st=window.__audit={seed,m0:m0.value');await route.fulfill({response,body});});
let referenceKey='',referencePaths;
function reference(q){
 const key=[q.seed,q.m0,q.kappa,q.sigma].join('|');
 if(key!==referenceKey){const R=rng(q.seed*4099+13),a=Math.exp(-q.kappa);referencePaths=Array.from({length:400},()=>{let x=q.m0;const p=[x];for(let t=1;t<=250;t++){x=a*x+q.sigma*R.normal();p.push(x);}return p;});referenceKey=key;}
 return referencePaths;
}
function stopped(path,L,rho){
 if(L*rho>=1)return{status:'inadmissible',wealth:1,exitDay:null,equity:path.map(()=>1)};
 let exitDay=null;for(let t=1;t<=250;t++)if(1+L*(path[0]-path[t])/100<=rho*L){exitDay=t;break;}
 const end=exitDay??250,wealth=1+L*(path[0]-path[end])/100;
 return{status:exitDay===null?'open':'liquidated',wealth,exitDay,equity:path.map((_,t)=>1+L*(path[0]-path[Math.min(t,end)])/100)};
}
async function check(){
 const shot=await snapshot(),q=shot.audit,pool=reference(q),one=stopped(pool[0],q.leverage,q.margin),[A,B,C,D]=shot.S;
 assert.equal(shot.S.length,4);assert.equal(q.selected.status,one.status);assert.equal(q.selected.exitDay,one.exitDay);near(q.selected.wealth,one.wealth);
 assert.equal(A.paths.length,1);assert.equal(B.paths.length,1);
 for(let t=0;t<=250;t++){near(A.paths[0][0][t][0],t);near(A.paths[0][0][t][1],pool[0][t]);near(B.paths[0][0][t][1],one.equity[t]);}
 assert.equal(A.dots.length,one.exitDay===null?0:1);assert.equal(B.dots.length,A.dots.length);
 if(one.exitDay!==null){near(A.dots[0][0],one.exitDay);near(A.dots[0][1],pool[0][one.exitDay]);near(B.dots[0][1],one.wealth);assert.ok(one.wealth<=q.margin*q.leverage+1e-9);}
 const valid=[];
 for(let j=0;j<=58;j++){
  const L=1+j/2,row=q.rows[j];near(row.leverage,L);
  if(L*q.margin>=1){assert.equal(row.status,'inadmissible');assert.equal(row.probability,undefined);continue;}
  const outcomes=pool.map(p=>stopped(p,L,q.margin)),wealth=outcomes.map(x=>x.wealth),mean=wealth.reduce((a,b)=>a+b,0)/400,liquidated=outcomes.filter(x=>x.exitDay!==null).length,probability=liquidated/400,se=Math.sqrt(wealth.reduce((s,x)=>s+(x-mean)**2,0)/(399*400));
  assert.equal(row.liquidated,liquidated);near(row.probability,probability);near(row.probabilitySE,Math.sqrt(probability*(1-probability)/400));near(row.mean,mean);near(row.se,se);near(row.min,Math.min(...wealth));near(row.max,Math.max(...wealth));near(row.unstopped,1+L*q.m0*(1-Math.exp(-250*q.kappa))/100);valid.push(row);
 }
 assert.equal(C.paths.length,1);assert.equal(D.paths.length,2);assert.equal(C.paths[0][0].length,valid.length);
 valid.forEach((row,i)=>{near(C.paths[0][0][i][0],row.leverage);near(C.paths[0][0][i][1],100*row.probability);near(D.paths[0][0][i][1],row.mean);near(D.paths[1][0][i][1],row.unstopped);});
 assert.equal(C.dots.length,q.selected.status==='inadmissible'?0:1);assert.equal(D.dots.length,C.dots.length);
 if(one.status==='inadmissible'){assert.match(shot.r,/No position admitted/);assert.match(shot.r,/no exit-frequency/);}else{assert.match(shot.r,/400 matched paths/);assert.match(shot.r,/estimated SE/);assert.ok(shot.r.replaceAll('−','-').includes(one.wealth.toFixed(4)));}
 return{shot,q,one};
}
const screenshot=async(name,width,theme)=>{await page.screenshot({path:`/tmp/atlas-fin-arbitrage-${name}-${width}-${theme}.png`,fullPage:true});if(width===430)for(let i=0;i<4;i++)await page.locator('.stage:visible').nth(i).screenshot({path:`/tmp/atlas-fin-arbitrage-${name}-${width}-${theme}-panel${i}.png`});};
try{for(const theme of['light','dark'])for(const width of[1450,430]){
 await load('5.7',theme,width);await check();await screenshot('default',width,theme);
 const limits=[[1,12],[1,30],[.1,1.2],[.002,.05],[0,20]];
 for(let bits=0;bits<32;bits++){await set(limits.map((values,i)=>values[(bits>>i)&1]),[3]);await check();}
 await set([5,30,1.2,.002,0],[3]);const loss=await check();assert.equal(loss.one.status,'liquidated');assert.ok(loss.one.wealth<0);await screenshot('negative-overshoot',width,theme);
 await mode('Initial admission boundary');let b=await check();near(b.q.leverage,10);near(b.q.margin,.1);assert.equal(b.one.status,'inadmissible');await screenshot('admission-boundary',width,theme);
 await page.locator('input[type=range]').nth(1).press('ArrowLeft');await done();b=await check();near(b.q.leverage,9.5);assert.notEqual(b.one.status,'inadmissible');
 const before=await check();await mode('New paths');const after=await check();assert.notEqual(before.q.seed,after.q.seed);assert.notDeepEqual(before.shot.S[0].paths,after.shot.S[0].paths);assert.notDeepEqual(before.shot.S[3].paths,after.shot.S[3].paths);await screenshot('resampled',width,theme);
 for(let i=0;i<5;i++)for(const key of['Home','End']){await page.locator('input[type=range]').nth(i).press(key);await done();await check();}
 console.log(`PASS arbitrage ${width} ${theme}: all32 actual control corners, independent400-path/59-exposure first-hit statistics, negative observed overshoot, exact initial-admission boundary/adjacent valid control, allpanels reseeded, native endpoints and full curve/stroke/glyph/text/TeX bounds`);
}assert.deepEqual(errors,[]);}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-fin-arbitrage-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
