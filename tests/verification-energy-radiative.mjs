import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {radiativeJunctionAudit as junction,radiativeMaximumAudit as mpp,radiativeStackAudit as stack,radiativeEnergyAudit as energy,RADIATIVE_INPUTS_AUDIT as C} from '../content/energy/source-audit-radiative.shared.js';

const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch();let body=await response.text();
 body=body.replace('stats.stages++;',`stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__T=[];s.__Rects=[];s.__Bands=[];s.__FT=[];s.__H=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['textPx','__T'],['rect','__Rects'],['hline','__H']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}const fill=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(t,x,y,...a)=>{const m=s.ctx.measureText(t);s.__FT.push([String(t),x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent]);return fill(t,x,y,...a);};const between=s.between.bind(s);s.between=(f,g,a,b,o)=>{s.__Bands.push({a,b,o,p:Array.from({length:21},(_,i)=>{const x=a+(b-a)*i/20;return[x,f(x),g(x)];})});return between(f,g,a,b,o);};`);
 body=body.replace('return item.viz(v);',`const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};return item.viz(v);`);
 await route.fulfill({response,body});
});
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
async function snapshot(){return page.evaluate(()=>({r:window.__R,values:window.__C.map(c=>c.value),e:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,overflow:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),legend:[...document.querySelectorAll('.lg-label')].map(e=>e.textContent),S:window.__S.map(s=>({b:s.bounds,w:s.width,h:s.height,p:s.__P,d:s.__D,rects:s.__Rects,hlines:s.__H,bands:s.__Bands,allText:s.__FT,pb:[s.X(s.bounds.x[0]),s.Y(s.bounds.y[1]),s.X(s.bounds.x[1]),s.Y(s.bounds.y[0])],handles:s.handles.filter(h=>h.visible!==false).map(h=>({x:h.x,y:h.y,color:h.color,r:h.r+1.1,X:s.X(h.x),Y:s.Y(h.y)})),glyphs:s.__D.map(([x,y,o])=>[s.X(x),s.Y(y),(o?.r??4)+(o?.hollow?(o.width??1.8)/2:o?.ring!==false&&(o?.r??4)>=3?.75:0)]),texts:s.__T.map(([t,X,Y,o={}])=>{s.ctx.save();s.ctx.font=s._font(o);const a=s.ctx.measureText(t).width,siz=o.size||12.5;let x=X+(o.dx||0),y=Y+(o.dy||0);if(o.align==='center')x-=a/2;else if(o.align==='right')x-=a;if(o.baseline==='top')y+=siz/2;else if(o.baseline==='bottom')y-=siz/2;s.ctx.restore();return[t,x,y-siz/2,x+a,y+siz/2];})}))}));}
function common(q){
 assert.deepEqual(q.e,[]);assert.deepEqual(q.overflow,[]);assert.equal(q.tex,0);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);
 for(const s of q.S){
  for(const[pts]of s.p)for(const p of pts)if(p){assert.ok(p.every(Number.isFinite));assert.ok(p[0]>=s.b.x[0]-1e-8&&p[0]<=s.b.x[1]+1e-8&&p[1]>=s.b.y[0]-1e-8&&p[1]<=s.b.y[1]+1e-8,'all plotted data contained');}
  for(const[x,y,r]of s.glyphs)assert.ok(x-r>=s.pb[0]&&x+r<=s.pb[2]&&y-r>=s.pb[1]&&y+r<=s.pb[3],'full endpoint/selected marker contained');
  for(const h of s.handles)assert.ok(h.X-h.r>=s.pb[0]&&h.X+h.r<=s.pb[2]&&h.Y-h.r>=s.pb[1]&&h.Y+h.r<=s.pb[3],'complete stroked gap handle contained');
  for(const[t,x,y,x1,y1]of s.allText)assert.ok(x>=-1&&y>=-1&&x1<=s.w+1&&y1<=s.h+1,`text clipped: ${t}`);
 }
}
async function set(values){await page.locator('input[type=range]').evaluateAll((es,v)=>es.forEach((e,i)=>{e.value=v[i];e.dispatchEvent(new Event('input',{bubbles:true}));}),values);await page.waitForTimeout(50);}
async function select(label){await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(50);}
async function load(id,theme,width){
 await page.setViewportSize({width,height:1450});await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/energy/ch04-b.js&id=energy-${id}&theme=${theme}&w=${width-50}&still=1&wait=150`);await page.waitForFunction(()=>window.__done);
 const q=await page.evaluate(()=>window.__done);assert.deepEqual(q.errors,[]);assert.deepEqual(q.texErrors,[]);assert.deepEqual(q.blank,[]);
}
async function single(faces){
 const q=await snapshot();common(q);const[Eg,conc,Tc]=q.values,o={conc,Tc,faces},j=junction(Eg,Infinity,o),p=mpp(j),Pin=C.S0*o.conc;
 const absorbed=C.FW*o.conc*energy(Eg,Infinity,C.T_SUN)*C.QE/Pin,usable=Eg*C.QE*j.solar/Pin,eta=p.P/Pin;
 const losses=[1-absorbed,absorbed-usable,usable-eta,eta];assert.ok(losses.every(v=>v>=-1e-12));near(losses.reduce((s,v)=>s+v,0),1);
 const left=q.S[0],right=q.S[1],curve=left.p.find(([,o])=>o.color==='green')[0],fills=['red','orange','purple','green'].map(c=>left.p.find(([,o])=>o.fill===c)[0]);assert.equal(curve.length,105);
 for(let i=0;i<curve.length;i++){const[E,y]=curve[i],qj=junction(E,Infinity,o),qe=mpp(qj).P/Pin,qa=C.FW*o.conc*energy(E,Infinity,C.T_SUN)*C.QE/Pin,qu=E*C.QE*qj.solar/Pin;near(y,qe);for(const[k,top]of[1,qa,qu,qe].entries())near(fills[k][i][1],top);for(const[k,bottom]of[qa,qu,qe,0].entries())near(fills[k].at(-1-i)[1],bottom);}
 const selected=left.d.find(([, ,o])=>o.color==='gold');near(selected[0],Eg);near(selected[1],eta);assert.match(q.r,new RegExp(`efficiency \\*\\*${(100*eta).toFixed(1)}%`));
 const iv=right.p.find(([,o])=>o.color==='accent')[0];assert.equal(iv.length,201);near(iv[0][0],0);near(iv[0][1],1);near(iv.at(-1)[0],j.Voc);near(iv.at(-1)[1],0);
 for(let i=0;i<200;i++){const[V,J]=iv[i];near(J,j.J(V)/j.A);assert.ok(J>=0&&J<=1+1e-12);}
 const rect=right.rects.find(a=>a[4]?.color==='green');near(rect[2],p.V);near(rect[3],p.J/j.A);
 const red=right.d.find(([, ,o])=>o.color==='red');near(red[0],j.Voc);near(red[1],0);
 assert.deepEqual(right.b.y,[-.08,1.2]);return q;
}
async function multi(n,mode){
 const q=await snapshot();common(q);const o={conc:q.values[0],Tc:300,faces:1},g=q.S[0].handles.map(h=>h.x).sort((a,b)=>b-a),result=stack(g,o,mode);assert.equal(g.length,n);assert.deepEqual([...q.S[0].handles].sort((a,b)=>b.x-a.x).map(h=>h.color),['blue','green','orange'].slice(0,n));assert.match(q.r,new RegExp(`efficiency \\*\\*${(100*result.eta).toFixed(1)}%`));assert.match(q.r,/Searched candidates/);
 assert.ok(stack(g,o,'indep').eta>=stack(g,o,'series').eta-1e-12);
 const kT=C.KB*C.T_SUN,f=x=>(x**3/Math.expm1(x/kT))/((2.82144*kT)**3/Math.expm1(2.82144)),dark=q.S[0].bands.filter(b=>b.o.fillAlpha===.6);assert.equal(dark.length,n);
 for(let i=0;i<n;i++)for(const[x,y,z]of dark[i].p){const part=result.parts[i],work=part.solar>0?part.P/(C.QE*part.solar):0;near(y,f(x)*work/x);near(z,0);assert.ok(y>=0&&y<=f(x)+1e-10);}
 assert.deepEqual(q.legend,n===1?['below the lowest gap','single junction']:n===2?['below the lowest gap','top junction','bottom junction']:['below the lowest gap','top junction','middle junction','bottom junction']);
 near(q.S[1].hlines.find(([,o])=>o.color==='gold')[0],result.eta);assert.equal(q.S[1].rects.length,3);for(const a of q.S[1].rects)assert.ok(a[3]>=0&&a[3]<1);return q;
}
try{
 for(const theme of['light','dark'])for(const width of[1450,430]){
  await load('4.5',theme,width);
  for(const faces of[1,2]){await select(faces===1?'front only':'both faces');for(const Eg of[.4,1.34,3])for(const lc of[0,Math.log10(C.maxConcentration)])for(const Tc of[250,400]){await set([Eg,lc,Tc]);const q=await single(faces);near(q.values[1],lc===0?1:C.maxConcentration);}}
  await select('front only');await set([1.34,0,300]);await single(1);await page.screenshot({path:`/tmp/atlas-energy-radiative-single-${width}-${theme}.png`,fullPage:true});
  await set([.4,Math.log10(C.maxConcentration),400]);await single(1);await page.screenshot({path:`/tmp/atlas-energy-radiative-single-full-${width}-${theme}.png`,fullPage:true});
  console.log(`PASS radiative single ${width} ${theme}: 24 concentration/temperature/gap/face corners,full photon budget and normalized I–V/MPP/endpoints`);
  await load('4.6',theme,width);
  for(const mode of['series','indep']){await select(mode==='series'?'in series (2-terminal)':'independently loaded');for(const n of[1,2,3]){await select(String(n));for(const lc of[0,Math.log10(C.maxConcentration)]){await set([lc]);const q=await multi(n,mode);near(q.values[0],lc===0?1:C.maxConcentration);}}}
  await select('3');await select('in series (2-terminal)');await set([Math.log10(C.maxConcentration)]);await page.getByRole('button',{name:'optimise the gaps',exact:true}).click();await page.waitForTimeout(50);await multi(3,'series');await page.screenshot({path:`/tmp/atlas-energy-radiative-stack-${width}-${theme}.png`,fullPage:true});
  await page.evaluate(()=>window.__S[0].handles.forEach((h,i)=>h.set([3.9,1.8,.4][i],.03)));await page.waitForTimeout(50);await multi(3,'series');
  const cv=page.locator('canvas').first(),box=await cv.boundingBox(),points=await page.evaluate(()=>{const s=window.__S[0],h=s.handles[1];return[s.X(h.x),s.Y(h.y),s.X(2.1),s.Y(.03)];});await page.mouse.move(box.x+points[0],box.y+points[1]);await page.mouse.down();await page.mouse.move(box.x+points[2],box.y+points[3],{steps:8});await page.mouse.up();await page.waitForTimeout(50);const dragged=await multi(3,'series');near(dragged.S[0].handles[1].x,2.1,.01);
  await page.evaluate(()=>window.__S[0].handles.forEach((h,i)=>h.set([1.2,1.2,.8][i],.03)));await page.waitForTimeout(50);await multi(3,'series');assert.match((await snapshot()).r,/efficiency \*\*0\.0%/);
  await page.evaluate(()=>window.__S[0].handles.forEach((h,i)=>h.set([.4,3.9,1.4][i],.03)));await page.waitForTimeout(50);await multi(3,'series');await select('independently loaded');await multi(3,'indep');
  await select('2');await set([0]);await page.getByRole('button',{name:'optimise the gaps',exact:true}).click();await page.waitForTimeout(50);await multi(2,'indep');await page.screenshot({path:`/tmp/atlas-energy-radiative-stack-independent-${width}-${theme}.png`,fullPage:true});
  console.log(`PASS radiative stack ${width} ${theme}: 12 number/connection/concentration states, actual-output spectral density, exact shared currents, bounds/equal gaps, native drag and gap search`);
 }
 assert.deepEqual(errors,[]);
}catch(e){console.error(e);await page.screenshot({path:'/tmp/atlas-energy-radiative-failure.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
