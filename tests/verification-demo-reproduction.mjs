import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { CTRY,CNAME,SEXY,AGE22,FAGES,asfr,indAt,lxSex,LxSex } from '../content/demo/ch04.shared.js';
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
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/demo/ch04.js&id=demo-${id}&theme=${theme}&w=${width - 50}&still=1&wait=150`);
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
await page.route(/\/content\/demo\/ch04\.js$/,async route=>{const response=await route.fetch();const body=(await response.text()).replace('st={country:c,year:y,','st=window.__audit={country:c,year:y,');await route.fulfill({response,body});});
function reference(c,y,k){
 const l=lxSex(c,'f',y),L=LxSex(c,'f',y),f=asfr(c,y),share=1/(1+indAt(c,'srb',y)/100),survive=age=>{let i=0;while(i+1<AGE22.length&&age>AGE22[i+1])i++;if(i+1===AGE22.length)return l[i]/l[0];const t=(age-AGE22[i])/(AGE22[i+1]-AGE22[i]);return(l[i]/l[0])**(1-t)*(l[i+1]/l[0])**t;};
 const gross=f.map(x=>x*share),net=gross.map((g,i)=>{const a=FAGES[i];let sum=survive(a)**k+survive(a+5)**k;for(let j=1;j<128;j++)sum+=(j%2?4:2)*survive(a+j*5/128)**k;return g*sum/(3*128);}),GRR=gross.reduce((a,b)=>a+5*b,0),NRR=net.reduce((a,b)=>a+5*b,0),grouped=f.reduce((s,x,i)=>s+x*share*L[AGE22.indexOf(FAGES[i])]/l[0],0);
 return{l,L,f,gross,net,GRR,NRR,grouped,survive};
}
async function check(){
 const shot=await snapshot(),q=shot.audit,m=q.model,r=reference(q.country,q.year,q.multiplier),[A,B]=shot.S;assert.equal(shot.S.length,2);near(m.GRR,r.GRR);near(m.NRR,r.NRR,1e-9);near(m.grouped,r.grouped);near(q.published,indAt(q.country,'nrr',q.year));assert.ok(m.NRR>=0&&m.NRR<=m.GRR+1e-10);if(q.multiplier===0)assert.equal(m.NRR,m.GRR);
 assert.equal(A.rect.length,27);FAGES.forEach((age,i)=>{const[g,loss,net]=A.rect.slice(3*i,3*i+3);near(g[0],age);near(g[2],age+5);near(g[3],r.gross[i]);near(net[3],r.net[i]);near(loss[1],r.net[i]);near(loss[3],r.gross[i]);});
 assert.equal(B.paths.length,2);assert.equal(B.dots.length,22);
 for(let i=0;i<2;i++){assert.equal(B.paths[i][0].length,401);B.paths[i][0].forEach(([a,s],j)=>{near(a,j/4);near(s,r.survive(a)**(i===0?1:q.multiplier),1e-9);});}
 B.dots.forEach(([a,s],i)=>{assert.equal(a,AGE22[i]);near(s,r.l[i]/r.l[0]);});
 const readout=shot.r.replaceAll('−','-');for(const x of[m.GRR,m.NRR,m.loss,m.grouped,m.reconstructedBaseline,q.published])assert.ok(readout.includes(x.toFixed(4)),`readout ${x}`);assert.ok(readout.includes((100*m.survival30).toFixed(3)));assert.match(readout,/not current or next-year population growth/);assert.ok(shot.values[0]===q.multiplier);assert.equal(shot.modes[0],q.country);assert.equal(shot.modes[1],String(q.year));
 return{shot,q};
}
async function screenshot(name,width,theme){await page.screenshot({path:`/tmp/atlas-demo-reproduction-${name}-${width}-${theme}.png`,fullPage:true});if(width===430)for(let i=0;i<2;i++)await page.locator('.stage').nth(i).screenshot({path:`/tmp/atlas-demo-reproduction-${name}-${width}-${theme}-panel${i}.png`});}
try{for(const theme of['light','dark'])for(const width of[1450,430]){
 await load('4.3',theme,width);await check();await screenshot('default',width,theme);
 for(const c of CTRY){await mode(CNAME[c]);for(const y of SEXY){await mode(String(y));let previous=Infinity;for(const k of[0,1,3]){await set([k]);const q=await check();assert.ok(q.q.model.NRR<=previous+1e-10);previous=q.q.model.NRR;}}}
 await mode(CNAME.NGA);await mode('1950');await page.locator('input[type=range]').press('End');await done();let q=await check();near(q.q.multiplier,3);await screenshot('high-mortality',width,theme);
 await page.locator('input[type=range]').press('Home');await done();q=await check();near(q.q.multiplier,0);await screenshot('no-mortality',width,theme);
 await page.locator('input[type=range]').press('ArrowRight');await done();q=await check();near(q.q.multiplier,.05);await screenshot('native-interior',width,theme);
 console.log(`PASS reproduction ${width} ${theme}: all50 country-years × hazard0/1/3; exact maternal-survival band integrals, official-L/published references, all27rectangles/802curvepoints/22knots and readouts; native0/3/.05 endpoints and complete strokes/points/text/TeX/page bounds`);
}assert.deepEqual(errors,[]);}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-demo-reproduction-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
