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
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/fin/ch05-c.js&id=fin-${id}&theme=${theme}&w=${width - 50}&still=1&wait=150`);
  await page.waitForFunction(() => window.__done); const d = await page.evaluate(() => window.__done);
  assert.deepEqual(d.errors, []); assert.deepEqual(d.texErrors, []); assert.deepEqual(d.blank, []); await done();
}
async function mode(name) { await page.getByRole('button', { name, exact: true }).click(); await done(); }
async function set(values, log = []) {
  await page.locator('input[type=range]').evaluateAll((es, [vals, log]) => es.forEach((e, i) => { e.value = log.includes(i) ? Math.log10(vals[i]) : vals[i]; e.dispatchEvent(new Event('input', { bubbles: true })); }), [values, log]);
  await done(); const actual = await page.evaluate(() => window.__C.map(c => c.value)); const publicEntry = actual.length === 4 && (await page.evaluate(() => window.__SEL?.[0]?.value)) === 'semi'; actual.forEach((x, i) => near(x, publicEntry && i === 3 ? Math.max(0, values[i]) : values[i], log.includes(i) ? .008 : 1e-10));
}
async function snapshot() {
  const a = await page.evaluate(() => ({ r: window.__R, values: window.__C.map(c => c.value), modes: (window.__SEL || []).map(c => c.value), e: window.__vizErrors || [], tex: document.querySelectorAll('.katex-error').length, overflow: [...document.querySelectorAll('.katex-display')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent), pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    S: window.__S.map(s => ({ visible: s.el.style.display !== 'none', w: s.width, h: s.height, b: s.bounds, paths: s.__P, dots: [...s.__D, ...s.__DS.flatMap(([ps,o])=>ps.map(([x,y])=>[x,y,o]))], rect: s.__RC, text: s.__FT, pb: [s.X(s.bounds.x[0]), s.Y(s.bounds.y[1]), s.X(s.bounds.x[1]), s.Y(s.bounds.y[0])], pp: s.__P.map(([pts]) => pts.map(p => p && [s.X(p[0]), s.Y(p[1])])), glyph: [...s.__D, ...s.__DS.flatMap(([ps,o])=>ps.map(([x,y])=>[x,y,o]))].map(([x, y, o = {}]) => [s.X(x), s.Y(y), (o.r ?? 4) + (o.hollow ? (o.width ?? 1.8) / 2 : .75)]) })) }));
  assert.deepEqual(a.e, []); assert.deepEqual(a.overflow, []); assert.equal(a.tex, 0); assert.equal(a.pageOverflow, false); assert.doesNotMatch(a.r, /NaN|Infinity|undefined|\\n/);
  for (const s of a.S.filter(s => s.visible)) {
    for (const pts of s.pp) for (const p of pts) if (p) { assert.ok(p.every(Number.isFinite)); assert.ok(p[0] >= s.pb[0] - 1e-7 && p[0] <= s.pb[2] + 1e-7 && p[1] >= s.pb[1] - 1e-7 && p[1] <= s.pb[3] + 1e-7, 'complete plotted paths'); }
    for (const [x, y, X, Y] of s.rect) for (const [u, v] of [[x, y], [X, Y]]) assert.ok(u >= s.b.x[0] - 1e-9 && u <= s.b.x[1] + 1e-9 && v >= s.b.y[0] - 1e-9 && v <= s.b.y[1] + 1e-9, 'complete histogram/model rectangle');
    for (const [x, y, r] of s.glyph) assert.ok(x - r >= s.pb[0] && x + r <= s.pb[2] && y - r >= s.pb[1] && y + r <= s.pb[3], 'full marker/ring');
    for (const [t, x, y, X, Y, clipped] of s.text) { assert.ok(x >= -1 && y >= -1 && X <= s.w + 1 && Y <= s.h + 1, `canvas text ${t}`); if (clipped) assert.ok(x - 2 >= s.pb[0] && X + 2 <= s.pb[2] && y - 2 >= s.pb[1] && Y + 2 <= s.pb[3], `text halo ${t}`); }
  }
  return a;
}
function independent(b,k,n,seed){const R=rng(seed),p=[];let p0=1.9,p1=1.6;for(let t=1;t<=15;t++){const w=k+(1-k)/2*(t/15)**6,x=Math.max(.02,p0+b*(p0-p1)+w*(.24*(16-t)-p0)+n*R.normal()/100);p.push(x);p1=p0;p0=x;}return p;}
const presets=[[.7,.07],[.4,.2],[.15,.45]];
async function check(seed){
 const q=await snapshot(),[b,k,n]=q.values,[A,B]=q.S;assert.equal(A.paths.length,6);assert.equal(B.paths.length,4);assert.equal(A.dots.length,16);assert.equal(B.dots.length,1);
 for(const s of[A,B]){assert.deepEqual(s.dots[0].slice(0,2),[16,0]);assert.equal(s.dots[0][2].hollow,true);const F=s.paths[0][0];assert.equal(F.length,30);for(let t=1;t<=15;t++){near(F[2*t-2][0],t-.5);near(F[2*t-1][0],t+.5);near(F[2*t-2][1],.24*(16-t));near(F[2*t-1][1],.24*(16-t));}}
 const paths=Array.from({length:5},(_,i)=>independent(b,k,n,seed*100+i));
 for(let j=1;j<5;j++)for(let t=0;t<15;t++){near(A.paths[j][0][t][0],t+1);near(A.paths[j][0][t][1],paths[j][t]);}
 for(let t=0;t<15;t++){near(A.paths[5][0][t][1],paths[0][t]);near(A.dots[t+1][0],t+1);near(A.dots[t+1][1],paths[0][t]);}
 let rd=0,rad=0;for(let t=0;t<15;t++){rd+=(paths[0][t]-.24*(15-t))/28.8;rad+=Math.abs(paths[0][t]-.24*(15-t))/28.8;}
 const r=q.r.replaceAll('−','-');assert.ok(r.includes(`= ${rd.toFixed(4)}`));assert.ok(r.includes(`= ${rad.toFixed(4)}`));
 for(let j=0;j<3;j++){
  const samples=Array.from({length:40},(_,i)=>independent(...presets[j],n,seed*10000+5000+i));let maxSE=0;
  for(let t=0;t<15;t++){const xs=samples.map(p=>p[t]),mean=xs.reduce((a,b)=>a+b,0)/40,se=Math.sqrt(xs.reduce((s,x)=>s+(x-mean)**2,0)/(39*40));maxSE=Math.max(maxSE,se);near(B.paths[j+1][0][t][0],t+1);near(B.paths[j+1][0][t][1],mean);}
  assert.ok(r.includes(`${'ABC'[j]} ${maxSE.toFixed(4)}`));
 }
 assert.match(q.r,/uncalibrated model outputs/);assert.match(q.r,/not evidence that a simulated price discovers/);if(!n)assert.match(q.r,/zero noise setting is deterministic/);return q;
}
try{for(const theme of['light','dark'])for(const width of[1450,430]){
 await load('5.12',theme,width);await check(21);await page.screenshot({path:`/tmp/atlas-fin-laboratory-default-${width}-${theme}.png`,fullPage:true});
 for(const b of[0,1])for(const k of[0,.8])for(const n of[0,40]){await set([b,k,n]);await check(21);}
 await set([1,0,40]);await check(21);await page.screenshot({path:`/tmp/atlas-fin-laboratory-corner-${width}-${theme}.png`,fullPage:true});
 for(let j=0;j<3;j++){await page.getByRole('button',{name:`Preset ${['A: high trend','B: balanced','C: strong pull'][j]}`,exact:true}).click();await done();const a=await check(21);near(a.values[0],presets[j][0]);near(a.values[1],presets[j][1]);}
 await set([.7,.07,12]);const before=await check(21);await page.getByRole('button',{name:'Resample all paths',exact:true}).click();await page.waitForTimeout(30);const after=await check(22);assert.notDeepEqual(after.S[0].paths,before.S[0].paths);assert.notDeepEqual(after.S[1].paths,before.S[1].paths);await page.screenshot({path:`/tmp/atlas-fin-laboratory-resampled-${width}-${theme}.png`,fullPage:true});
 for(let i=0;i<3;i++){const el=page.locator('input[type=range]').nth(i);await el.scrollIntoViewIfNeeded();for(const key of['Home','End']){await el.press(key);await done();await check(22);}}
 console.log(`PASS laboratory ${width} ${theme}: all8control corners, independent15period paths/40sample means/SE, exactsource staircase/terminal marker, allpreset buttons, bothpanels reseeded, native endpoints and complete path/glyph/text/TeX bounds`);
}assert.deepEqual(errors,[]);}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-fin-laboratory-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
