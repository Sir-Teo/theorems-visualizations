import assert from'node:assert/strict';import{chromium}from'playwright-core';
import{createServer}from'../scripts/serve.mjs';import{findBrowser}from'../scripts/browser.mjs';
import{solarDayEnergyAudit as day,solarYearEnergyAudit as year,solarPositionAudit as pos}from'../content/energy/source-audit-solar-geometry.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch();let body=await response.text();body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__T=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['textPx','__T']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}`);
 body=body.replace('return item.viz(v);','const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};return item.viz(v);');await route.fulfill({response,body});
});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
async function check(atm){
 const q=await page.evaluate(()=>({r:window.__R,values:window.__C.map(c=>c.value),e:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,overflow:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),S:window.__S.map(s=>({b:s.bounds,w:s.width,h:s.height,p:s.__P,d:s.__D,pb:[s.X(s.bounds.x[0]),s.Y(s.bounds.y[1]),s.X(s.bounds.x[1]),s.Y(s.bounds.y[0])],glyphs:s.__D.map(([x,y,o])=>[s.X(x),s.Y(y),(o?.r??4)+(o?.hollow?(o.width??1.8)/2:o?.ring!==false&&(o?.r??4)>=3?.75:0)]),texts:s.__T.map(([t,X,Y,o={}])=>{s.ctx.save();s.ctx.font=s._font(o);const a=s.ctx.measureText(t).width,siz=o.size||12.5;let x=X+(o.dx||0);if(o.align==='center')x-=a/2;else if(o.align==='right')x-=a;s.ctx.restore();return[t,x,Y+(o.dy||0)-siz/2,x+a,Y+(o.dy||0)+siz/2];})}))}));
 assert.deepEqual(q.e,[]);assert.deepEqual(q.overflow,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);assert.match(q.r,/365 days/);assert.match(q.r,/3° grid/);
 const[phi,n,b,h]=q.values,E=q.S[1],daily=E.p.find(([,o])=>o.color==='accent'),annual=E.p.find(([,o])=>o.color==='green');assert.equal(daily[0].length,31);assert.equal(annual[0].length,31);
 for(const[x,y]of daily[0])near(y,day(phi,n,x,atm));for(const[x,y]of annual[0])near(y,year(phi,x,atm));
 const selected=E.d.filter(([, ,o])=>o.color==='gold');assert.equal(selected.length,2);near(selected[0][0],b);near(selected[0][1],day(phi,n,b,atm));near(selected[1][0],b);near(selected[1][1],year(phi,b,atm));assert.match(q.r,new RegExp(`yearly mean at your tilt ${year(phi,b,atm).toFixed(2)}`));
 const sp=pos(phi,n,h);assert.equal(q.S[0].d.length,sp.alt>0?1:0);
 const skyText=q.S[0].texts;for(let i=0;i<skyText.length;i++)for(let j=i+1;j<skyText.length;j++){const[a,x,y,x1,y1]=skyText[i],[b,X,Y,X1,Y1]=skyText[j];assert.ok(x1+2<=X||X1+2<=x||y1+2<=Y||Y1+2<=y,`sky labels overlap: ${a},${b}`);}
 for(const s of q.S){for(const[pts]of s.p)for(const p of pts)if(p){assert.ok(p.every(Number.isFinite));assert.ok(p[0]>=s.b.x[0]-1e-8&&p[0]<=s.b.x[1]+1e-8&&p[1]>=s.b.y[0]-1e-8&&p[1]<=s.b.y[1]+1e-8,'complete sun/energy paths contained');}for(const[x,y,r]of s.glyphs)assert.ok(x-r>=s.pb[0]&&x+r<=s.pb[2]&&y-r>=s.pb[1]&&y+r<=s.pb[3],'full sky/zero-energy/endpoint marker contained');for(const[t,x,y,x1,y1]of s.texts)assert.ok(x>=-1&&y>=-1&&x1<=s.w+1&&y1<=s.h+1,`text clipped: ${t}`);}
 return q;
}
async function set(values){await page.locator('input[type=range]').evaluateAll((es,v)=>es.forEach((e,i)=>{e.value=v[i];e.dispatchEvent(new Event('input',{bubbles:true}));}),values);await page.waitForTimeout(40);}
try{
 for(const theme of['light','dark'])for(const width of[1450,430]){
  await page.setViewportSize({width,height:1450});await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/energy/ch04.js&id=energy-4.2&theme=${theme}&w=${width-50}&still=1&wait=150`);await page.waitForFunction(()=>window.__done);const d=await page.evaluate(()=>window.__done);assert.deepEqual(d.errors,[]);assert.deepEqual(d.texErrors,[]);assert.deepEqual(d.blank,[]);
  const toggle=page.getByRole('checkbox'),setAtmosphere=async value=>{if(await toggle.isChecked()!==value)await page.locator('.switch-track').click();assert.equal(await toggle.isChecked(),value);};
  for(const atm of[true,false]){
   await setAtmosphere(atm);
   for(const phi of[-60,0,40,70])for(const n of[1,81,172,355]){await set([phi,n,41,12]);await check(atm);}
   for(const b of[0,90])for(const h of[0,5.9,12,24]){await set([70,355,b,h]);const q=await check(atm);assert.match(q.r,/no beam energy/);}
  }
  await setAtmosphere(true);await set([40,172,41,12]);await check(true);await page.screenshot({path:`/tmp/atlas-energy-solar-geometry-${width}-${theme}.png`,fullPage:true});
  console.log(`PASS solar geometry ${width} ${theme}: 48 hemisphere/season/attenuation/tilt/hour states,365-day selected-tilt mean, complete zero/end markers and all plotted paths`);
 }
 assert.deepEqual(errors,[]);
}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-energy-solar-geometry-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
