import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {fusionBalanceAudit as balance,fusionThresholdAudit as threshold} from '../content/energy/source-audit-fusion.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch();let body=await response.text();
 body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__R=[];s.__T=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['rect','__R'],['textPx','__T']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}`);
 body=body.replace('return item.viz(v);','const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};return item.viz(v);');await route.fulfill({response,body});
});
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(Math.abs(b),1e-100),`${a} != ${b}`);
const check=async()=>{
 const q=await page.evaluate(()=>({r:window.__R,e:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,overflow:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),values:window.__C.map(c=>c.value),S:window.__S.map(s=>({b:s.bounds,w:s.width,h:s.height,paths:s.__P,dots:s.__D,rects:s.__R,pb:[s.X(s.bounds.x[0]),s.Y(s.bounds.y[1]),s.X(s.bounds.x[1]),s.Y(s.bounds.y[0])],glyphs:s.__D.map(([x,y,o])=>[s.X(x),s.Y(y),(o?.r??4)+.75]),texts:s.__T.map(([t,X,Y,o={}])=>{s.ctx.save();s.ctx.font=s._font(o);const a=s.ctx.measureText(t).width,siz=o.size||12.5;let x=X+(o.dx||0);if(o.align==='center')x-=a/2;else if(o.align==='right')x-=a;s.ctx.restore();return[t,x,Y+(o.dy||0)-siz/2,x+a,Y+(o.dy||0)+siz/2];})}))}));
 assert.deepEqual(q.e,[]);assert.deepEqual(q.overflow,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);
 const[n,T,tau]=q.values,p=balance({n,T,tau}),s=q.S[0],bars=q.S[1].rects,vals=[p.alpha,p.transport,p.brems,p.external],scale=Math.max(...vals);
 assert.equal(bars.length,4);bars.forEach((r,i)=>close(r[3],vals[i]/scale));assert.equal(s.dots.length,1);close(s.dots[0][0],T);close(s.dots[0][1],n*T*tau);
 assert.equal(s.paths.length,4);s.paths.forEach(([pts],i)=>pts.forEach(([t,y])=>{close(y,threshold(t,[1,5,20,Infinity][i]));assert.ok(t>=1&&t<=100&&y>=s.b.y[0]&&y<=s.b.y[1]);}));
 if(p.net>0)assert.match(q.r,/Fuel gain/);else assert.match(q.r,/ignition inequality is met/);
 if(!Number.isFinite(p.need))assert.match(q.r,/No finite ignition threshold/);assert.match(q.r,/Fuel gain uses absorbed heating/);
 for(const st of q.S){for(const[x,y,r]of st.glyphs)assert.ok(x-r>=st.pb[0]&&x+r<=st.pb[2]&&y-r>=st.pb[1]&&y+r<=st.pb[3],'complete plasma-state marker remains visible');for(const[t,x,y,x1,y1]of st.texts)assert.ok(x>=-1&&y>=-1&&x1<=st.w+1&&y1<=st.h+1,`canvas text clipped: ${t}, ${JSON.stringify({x,y,x1,y1,w:st.w,h:st.h})}`);}
 return q;
};
try{
 for(const theme of ['light','dark'])for(const width of [1450,430]){
  await page.setViewportSize({width,height:1450});await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/energy/ch03-b.js&id=energy-3.10&theme=${theme}&w=${width-50}&still=1&wait=150`);await page.waitForFunction(()=>window.__done);
  const d=await page.evaluate(()=>window.__done);assert.deepEqual(d.errors,[]);assert.deepEqual(d.texErrors,[]);assert.deepEqual(d.blank,[]);
  for(const n of [1e19,1e20,3e21])for(const T of [2,15,80])for(const tau of [.01,1,20]){
   await page.locator('input[type=range]').evaluateAll((es,vs)=>es.forEach((e,i)=>{e.value=vs[i];e.dispatchEvent(new Event('input',{bubbles:true}));}),[Math.log10(n),T,Math.log10(tau)]);await page.waitForTimeout(40);await check();
  }
  // A state beyond the former fixed plot ceiling must remain completely visible.
  await page.screenshot({path:`/tmp/atlas-energy-fusion-high-${width}-${theme}.png`,fullPage:true});
  await page.locator('input[type=range]').evaluateAll(es=>es.forEach((e,i)=>{e.value=[20,15,0][i];e.dispatchEvent(new Event('input',{bubbles:true}));}));await page.waitForTimeout(60);await check();await page.screenshot({path:`/tmp/atlas-energy-fusion-${width}-${theme}.png`,fullPage:true});
  console.log(`PASS fusion ${width} ${theme}: 27 density/temperature/confinement states, original valid-range contours, exact power bars, honest ignition/gain states, full marker and text containment`);
 }
 assert.deepEqual(errors,[]);
}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-energy-fusion-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
