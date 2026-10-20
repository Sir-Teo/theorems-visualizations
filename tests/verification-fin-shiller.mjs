import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { D_SHILLER, rng } from '../content/fin/ch05.shared.js';
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
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/fin/ch05-${id==='5.6'?'b':'c'}.js&id=fin-${id}&theme=${theme}&w=${width - 50}&still=1&wait=150`);
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
await page.route(/\/content\/fin\/ch05-[bc]\.js$/,async route=>{const response=await route.fetch();const body=(await response.text()).replace('st={h,curve,rate:','st=window.__audit={h,curve,rate:').replace('st={h,model,hist,seed,','st=window.__audit={h,model,hist,seed,');await route.fulfill({response,body});});
const stat=x=>{const mean=x.reduce((a,b)=>a+b)/x.length;return{mean,sd:Math.sqrt(x.reduce((s,v)=>s+(v-mean)**2,0)/x.length)}};
function finite(d,r,K){return d.map((_,t)=>{let sum=K/(1+r)**(d.length-1-t);for(let k=t;k<d.length-1;k++)sum+=d[k]/(1+r)**(k-t+1);return sum;});}
function history(n,r,terminalRule){
 const base=D_SHILLER.at(-1)[3],real=D_SHILLER.slice(0,n).map(q=>q[1]*base/q[3]),logs=real.map(Math.log),sx=n*(n-1)/2,sxx=n*(n-1)*(2*n-1)/6,sy=logs.reduce((a,b)=>a+b),sxy=logs.reduce((s,v,i)=>s+i*v,0),g=(n*sxy-sx*sy)/(n*sxx-sx*sx);
 const p=real.map((x,i)=>x/Math.exp(g*i)),d=D_SHILLER.slice(0,n).map((q,i)=>q[2]*base/q[3]/Math.exp(g*(i+1))),K=terminalRule==='last'?p.at(-1):stat(p).mean,proxy=finite(d,r,K);
 return{p,d,proxy,K,g,sp:stat(p).sd,sq:stat(proxy).sd,ratio:stat(p).sd/stat(proxy).sd};
}
function model(q,h){
 const R=rng(q.seed*1009+3),mu=stat(h.d).mean,sd=stat(h.d).sd,ratios=[];let nd=0,np=0;
 for(let j=0;j<400;j++){let x=sd*R.normal();const d=[],p=[];for(let t=0;t<q.count;t++){const y=mu+x,value=mu/q.rate+x/(1+q.rate-q.persistence);d.push(y);p.push(value);nd+=y<0;np+=value<0;if(t+1<q.count)x=q.persistence*x+sd*Math.sqrt(1-q.persistence*q.persistence)*R.normal();}const K=q.terminalRule==='last'?p.at(-1):stat(p).mean,proxy=finite(d,q.rate,K);ratios.push(stat(p).sd/stat(proxy).sd);}
 return{ratios,nd,np,pop:Math.sqrt(((1+q.rate)**2-1)/((1+q.rate)**2-q.persistence**2))};
}
async function check(id){
 const shot=await snapshot(),q=shot.audit,h=history(q.count,q.rate,q.terminalRule),[A,B]=shot.S;assert.equal(shot.S.length,2);assert.equal(A.paths.length,2);
 for(let j=0;j<q.count;j++){near(A.paths[0][0][j][0],1871+j);near(A.paths[0][0][j][1],h.p[j]);near(A.paths[1][0][j][1],h.proxy[j]);}
 near(q.h.growth,h.g);near(q.h.terminal,h.K);near(q.h.ratio,h.ratio);
 const text=shot.r.replaceAll('−','-');for(const x of[h.sp,h.sq,h.ratio])assert.ok(text.includes(x.toFixed(4)),`displayed sample number ${x}`);
 if(id==='5.6'){
  assert.equal(B.paths.length,1);assert.equal(B.paths[0][0].length,41);for(let i=0;i<=40;i++){const r=.02+i*.0025;near(B.paths[0][0][i][0],r);near(B.paths[0][0][i][1],history(q.count,r,q.terminalRule).sq);}
  assert.equal(B.dots.length,1);near(B.dots[0][0],q.rate);near(B.dots[0][1],h.sq);assert.match(text,/sample statistics/);assert.match(text,/absorbed into K/);
 }else{
  const ref=model(q,h),m=q.model,hist=q.hist;ref.ratios.forEach((x,i)=>near(m.ratios[i],x));assert.equal(m.negativeDividends,ref.nd);assert.equal(m.negativePrices,ref.np);near(m.population.ratio,ref.pop);assert.ok(ref.pop<=1);assert.ok(hist.upper>Math.max(1,h.ratio,...ref.ratios));
  const counts=Array.from({length:40},(_,i)=>ref.ratios.filter(x=>x>=i*hist.width&&x<(i+1)*hist.width).length);assert.deepEqual(hist.counts,counts);assert.equal(counts.reduce((a,b)=>a+b),400);assert.equal(m.aboveOne,ref.ratios.filter(x=>x>1).length);assert.equal(hist.aboveObserved,ref.ratios.filter(x=>x>=h.ratio).length);
  const occupied=counts.map((n,i)=>({n,i})).filter(x=>x.n);assert.equal(B.rect.length,occupied.length);occupied.forEach(({n,i},j)=>{near(B.rect[j][0],(i+.08)*hist.width);near(B.rect[j][2],(i+.92)*hist.width);near(B.rect[j][3],n/400);});
  assert.ok(text.includes(ref.pop.toFixed(6)));assert.ok(text.includes(`${m.aboveOne}/400`));assert.ok(text.includes(`${hist.aboveObserved}/400`));assert.ok(text.includes('400/400'));assert.match(text,q.terminalRule==='last'?/exact conditional continuation/:/without an exact conditional-PV identity/);
 }
 return{shot,q,h};
}
async function screenshot(id,name,width,theme){await page.screenshot({path:`/tmp/atlas-fin-shiller-${id}-${name}-${width}-${theme}.png`,fullPage:true});if(width===430)for(let i=0;i<2;i++)await page.locator('.stage').nth(i).screenshot({path:`/tmp/atlas-fin-shiller-${id}-${name}-${width}-${theme}-panel${i}.png`});}
try{for(const id of['5.6','5.15'])for(const theme of['light','dark'])for(const width of[1450,430]){
 await load(id,theme,width);await check(id);await screenshot(id,'default',width,theme);
 for(const n of[109,152])for(const terminal of['sample mean price','last observed price']){
  await mode(n===109?'1871–1979':'1871–2022');await mode(terminal);
  for(const r of[.02,.05,.12])for(const persistence of id==='5.15'?[0,.9,.99]:[0]){await set(id==='5.6'?[r]:[r,persistence]);await check(id);}
 }
 if(id==='5.15'){
  await mode('sample mean price');await set([.02,.99]);await check(id);await screenshot(id,'persistent-mean',width,theme);
  await mode('last observed price');await set([.12,0]);await check(id);await screenshot(id,'exact-continuation',width,theme);
  const before=await check(id);await mode('New samples');const after=await check(id);assert.equal(after.q.seed,before.q.seed+1);assert.notDeepEqual(after.q.model.ratios,before.q.model.ratios);await screenshot(id,'resampled',width,theme);
 }
 for(let i=0;i<(id==='5.6'?1:2);i++)for(const key of['Home','End']){await page.locator('input[type=range]').nth(i).press(key);await done();const a=await check(id);near(i===0?a.q.rate:a.q.persistence,i===0?(key==='Home'?.02:.12):(key==='Home'?0:.99));}
 await page.locator('input[type=range]').first().press('ArrowLeft');await done();const actual=await check(id);near(actual.q.rate,.1175);
 await screenshot(id,'native-interior',width,theme);
 console.log(`PASS Shiller ${id} ${width} ${theme}: all window/terminal choices and rate endpoints/default${id==='5.15'?', persistence corners/default, independent400-path conditional-PV ratios, all histogram samples and reseeding':''}; exact curves/readouts, native Home/End/interior, full stroke/ring/text/TeX/page bounds`);
}assert.deepEqual(errors,[]);}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-fin-shiller-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
