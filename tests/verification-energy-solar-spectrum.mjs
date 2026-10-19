import assert from 'node:assert/strict';import{chromium}from'playwright-core';
import{createServer}from'../scripts/serve.mjs';import{findBrowser}from'../scripts/browser.mjs';
import{solarSpectrumAudit as spectrum,solarFractionAudit as fraction,solarTransmissionAudit as transmission}from'../content/energy/source-audit-solar.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__T=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['textPx','__T']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}`);body=body.replace('return item.viz(v);','const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};return item.viz(v);');await route.fulfill({response,body});});
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(Math.abs(b),1e-100),`${a} != ${b}`);
async function check(air){
 const q=await page.evaluate(()=>({r:window.__R,values:window.__C.map(c=>c.value),e:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,overflow:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),S:window.__S.map(s=>({b:s.bounds,w:s.width,h:s.height,p:s.__P,d:s.__D,pb:[s.X(s.bounds.x[0]),s.Y(s.bounds.y[1]),s.X(s.bounds.x[1]),s.Y(s.bounds.y[0])],glyphs:s.__D.map(([x,y,o])=>[s.X(x),s.Y(y),(o?.r??4)+.75]),texts:s.__T.map(([t,X,Y,o={}])=>{s.ctx.save();s.ctx.font=s._font(o);const a=s.ctx.measureText(t).width,siz=o.size||12.5;let x=X+(o.dx||0);if(o.align==='center')x-=a/2;else if(o.align==='right')x-=a;s.ctx.restore();return[t,x,Y+(o.dy||0)-siz/2,x+a,Y+(o.dy||0)+siz/2];})}))}));
 assert.deepEqual(q.e,[]);assert.deepEqual(q.overflow,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);assert.match(q.r,/blackbody-model fractions/);
 const[T,AM]=q.values;const curves=q.S[0].p.filter(([,o])=>o.color==='muted');assert.equal(curves.length,1,'reference curve retained');
 for(const[x,y]of curves[0][0])near(y,spectrum(x,5772));
 const c=q.S[1];assert.equal(c.d.length,2);near(c.d[0][1],fraction(400,T));near(c.d[1][1],fraction(700,T));
 assert.match(q.r,new RegExp(`${(100*fraction(1000,T)).toFixed(1)}%`));if(T===5772)assert.match(q.r,/2008 solar-minimum measurement/);
 if(air)assert.match(q.r,/not measured atmospheric data/);
 for(const s of q.S){for(const[pts]of s.p)for(const p of pts)if(p){assert.ok(p.every(Number.isFinite));assert.ok(p[0]>=s.b.x[0]-1e-8&&p[0]<=s.b.x[1]+1e-8&&p[1]>=s.b.y[0]-1e-8&&p[1]<=s.b.y[1]+1e-8,`curve outside view: ${JSON.stringify(p)}`);}for(const[x,y,r]of s.glyphs)assert.ok(x-r>=s.pb[0]&&x+r<=s.pb[2]&&y-r>=s.pb[1]&&y+r<=s.pb[3],'complete cumulative marker visible');for(const[t,x,y,x1,y1]of s.texts)assert.ok(x>=-1&&y>=-1&&x1<=s.w+1&&y1<=s.h+1,`text clipped: ${t} ${JSON.stringify({x,y,x1,y1,w:s.w,h:s.h})}`);}
 // The attenuation model itself is checked by independent unit tests; verify
 // its plotted top samples at their actual rendering temperatures/air masses.
 const selected=q.S[0].p.filter(([,o])=>o.color==='gold'||o.color==='accent');assert.equal(selected.length,air?2:1);
 for(const[pts,o]of selected)for(const[x,y]of pts)near(y,spectrum(x,T)*(o.color==='accent'?transmission(x,AM):1));
 if(air){const labels=q.S[0].texts.filter(([t])=>['O₂','H₂O','CO₂'].includes(t));assert.equal(labels.length,q.S[0].w<500?4:6);for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const[a,x,y,x1,y1]=labels[i],[b,X,Y,X1,Y1]=labels[j];assert.ok(x1+3<=X||X1+3<=x||y1+3<=Y||Y1+3<=y,`absorber labels overlap: ${a},${b}`);}}
 return q;
}
try{
 for(const theme of['light','dark'])for(const width of[1450,430]){
  await page.setViewportSize({width,height:1450});await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/energy/ch04.js&id=energy-4.1&theme=${theme}&w=${width-50}&still=1&wait=150`);await page.waitForFunction(()=>window.__done);const d=await page.evaluate(()=>window.__done);assert.deepEqual(d.errors,[]);assert.deepEqual(d.texErrors,[]);assert.deepEqual(d.blank,[]);
  for(const air of[false,true]){
   await page.getByRole('button',{name:air?'chosen attenuation (illustrative)':'above the atmosphere',exact:true}).click();
   for(const T of[4000,5772,7500])for(const AM of[1,1.5,5]){await page.locator('input[type=range]').evaluateAll((es,v)=>es.forEach((e,i)=>{e.value=v[i];e.dispatchEvent(new Event('input',{bubbles:true}));}),[T,AM]);await page.waitForTimeout(40);await check(air);}
  }
  await page.locator('input[type=range]').evaluateAll(es=>es.forEach((e,i)=>{e.value=[5772,1.5][i];e.dispatchEvent(new Event('input',{bubbles:true}));}));await page.waitForTimeout(50);await check(true);await page.screenshot({path:`/tmp/atlas-energy-solar-spectrum-${width}-${theme}.png`,fullPage:true});
  console.log(`PASS solar spectrum ${width} ${theme}: 18 temperature/attenuation/air-mass states, complete nominal reference, analytic fractions, full marker/text containment`);
 }
 assert.deepEqual(errors,[]);
}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-energy-solar-spectrum-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
