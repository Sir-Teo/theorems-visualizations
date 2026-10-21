import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('stats.stages++;',`stats.stages++;window.__stage=s;const begin=s.begin.bind(s);s.begin=()=>{s.__arrows=[];s.__dots=[];s.__poly=[];s.__text=[];return begin();};for(const[k,key]of[['arrow','__arrows'],['dot','__dots'],['poly','__poly']]){const f=s[k].bind(s);s[k]=(...a)=>{s[key].push(a);return f(...a);};}const fill=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(t,x,y,...a)=>{const m=s.ctx.measureText(t);s.__text.push([String(t),x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent]);return fill(t,x,y,...a);};`);
  body=body.replace('return item.viz(v);',`window.__v=v;const steps=v.steps.bind(v);v.steps=o=>(window.__steps=steps(o));const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__readout=f();return window.__readout;});return item.viz(v);`);
  body=body.replace("mount(document.getElementById('viz'),","window.__mount=mount(document.getElementById('viz'),");
  body=body.replace('    });\n    window.__vizStats',"    },{state:JSON.parse(sessionStorage.getItem('basisRestore')||'null')});\n    window.__vizStats");
  await route.fulfill({response,body});
});
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const rank=vs=>vs.every(p=>Math.hypot(...p)<1e-10)?0:vs.some(a=>vs.some(b=>Math.abs(a[0]*b[1]-a[1]*b[0])>1e-8))?2:1;
async function settle(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function check(index,expectedRank){
  const q=await page.evaluate(()=>{const s=__stage,p=__steps,f=p.frame,box=s.canvas.getBoundingClientRect();return{
    i:p.i,n:p.n,f,vs:s.handles.map(h=>[h.x,h.y]),r:__readout,b:s.bounds,w:s.width,h:s.height,
    plot:[s.X(s.bounds.x[0]),s.Y(s.bounds.y[1]),s.X(s.bounds.x[1]),s.Y(s.bounds.y[0])],
    arrows:s.__arrows.map(([x,y,X,Y,o])=>[s.X(x),s.Y(y),s.X(X),s.Y(Y),o]),
    dots:s.__dots.map(([x,y,o={}])=>[s.X(x),s.Y(y),(o.r??4)+(o.hollow?(o.width??1.8)/2:.75)]),
    polygons:s.__poly.map(([ps,o={}])=>({ps:ps.map(([x,y])=>[s.X(x),s.Y(y)]),radius:(o.width??1.8)/2})),
    handles:s.handles.map(h=>[s.X(h.x),s.Y(h.y),h.r+1.1]),text:s.__text,
    overlays:[...document.querySelectorAll('.stage .tex-label')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const b=e.getBoundingClientRect();return[b.left-box.left,b.top-box.top,b.right-box.left,b.bottom-box.top,e.textContent];}),
    errors:window.__vizErrors||[],tex:document.querySelectorAll('.katex-error').length,
    overflow:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),pageOverflow:document.documentElement.scrollWidth>innerWidth+1,
  };});
  assert.equal(q.i,index);assert.equal(q.n,7);assert.deepEqual(q.errors,[]);assert.equal(q.tex,0);assert.deepEqual(q.overflow,[]);assert.equal(q.pageOverflow,false);assert.doesNotMatch(q.r,/NaN|Infinity|undefined/);
  const f=q.f,k=index-1,processed=q.vs.slice(0,Math.min(5,Math.max(0,index)));
  if(index>0&&index<6){assert.equal(f.kept.length,rank(processed));assert.equal(rank(f.kept.map(i=>q.vs[i])),f.kept.length);const before=q.vs.slice(0,k);assert.equal(f.inSp,rank([...before,q.vs[k]])===rank(before));if(f.c){const sum=f.c.reduce((s,c,j)=>s.map((v,d)=>v+c*q.vs[f.before[j]][d]),[0,0]);near(sum[0],q.vs[k][0],1e-6);near(sum[1],q.vs[k][1],1e-6);}}
  if(index===6){assert.equal(f.kept.length,expectedRank??rank(q.vs));assert.match(q.r,/Numerical survivor count/);assert.doesNotMatch(f.note,/still spans.*R\^2/);}
  const contained=(x,y,r=0)=>assert.ok(x-r>=q.plot[0]-1e-7&&x+r<=q.plot[2]+1e-7&&y-r>=q.plot[1]-1e-7&&y+r<=q.plot[3]+1e-7,`complete geometry ${[x,y,r]} in ${q.plot}`);
  for(const[x,y,X,Y,o]of q.arrows){const L=Math.hypot(X-x,Y-y);if(L<.5)continue;const head=Math.min(o.head??10,L*.45),u=(X-x)/L,v=(Y-y)/L;contained(x,y,(o.width??2.6)/2);contained(X,Y);contained(X-u*head-v*head*.45,Y-v*head+u*head*.45);contained(X-u*head+v*head*.45,Y-v*head-u*head*.45);}
  for(const p of [...q.dots,...q.handles])contained(...p);
  for(const{ps,radius}of q.polygons)for(const p of ps)contained(...p,radius);
  for(const[t,x,y,X,Y]of q.text)assert.ok(x>=-1&&y>=-1&&X<=q.w+1&&Y<=q.h+1,`canvas label ${t}`);
  for(const[x,y,X,Y,t]of q.overlays)assert.ok(x>=-1&&y>=-1&&X<=q.w+1&&Y<=q.h+1,`vector label ${t}`);
  return q;
}
async function frame(i){await page.getByLabel('Step',{exact:true}).evaluate((e,i)=>{e.value=i;e.dispatchEvent(new Event('input',{bubbles:true}));},i);await settle();}
try{
  for(const theme of ['light','dark'])for(const width of [1440,320]){
    await page.setViewportSize({width,height:1400});
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/ladr/ch02-b.js&id=ladr-2.30&theme=${theme}&w=${width-36}&still=1&wait=100`);
    await page.waitForFunction(()=>window.__done);await page.evaluate(()=>document.fonts.ready);await settle();
    for(const[label,n]of[['Plane-spanning example',2],['Collinear example',1],['All zero example',0]]){
      await page.getByRole('button',{name:label,exact:true}).click();await settle();assert.equal(await page.evaluate(()=>__steps.i),0);
      for(let i=0;i<7;i++){await frame(i);await check(i,n);}
      await page.screenshot({path:`/tmp/atlas-flagship-basis-${n}-${width}-${theme}.png`,fullPage:true});
      await page.locator('.stage').screenshot({path:`/tmp/atlas-flagship-basis-${n}-${width}-${theme}-panel.png`});
      const before=await check(6,n),saved=await page.evaluate(()=>__mount.snapshot());
      await page.evaluate(s=>sessionStorage.setItem('basisRestore',JSON.stringify(s)),saved);await page.reload();await page.waitForFunction(()=>window.__done);await page.evaluate(()=>document.fonts.ready);await settle();
      const after=await check(6,n);assert.deepEqual(after.vs,before.vs);assert.deepEqual(after.f,before.f);assert.equal(after.r,before.r);assert.deepEqual(await page.evaluate(()=>__mount.snapshot()),saved);await page.evaluate(()=>sessionStorage.removeItem('basisRestore'));
    }
    const invalid=await page.evaluate(()=>__mount.snapshot());invalid.parts.find(([k])=>k.startsWith('custom:basis input vectors:'))[1][0][0]=3;
    await page.evaluate(s=>sessionStorage.setItem('basisRestore',JSON.stringify(s)),invalid);await page.reload();await page.waitForFunction(()=>window.__done);await page.evaluate(()=>document.fonts.ready);await settle();
    assert.match(await page.locator('.viz-state-notice').textContent(),/invalid visualization value/);await check(2);await page.evaluate(()=>sessionStorage.removeItem('basisRestore'));
    await page.getByRole('button',{name:'Plane-spanning example',exact:true}).click();await settle();
    for(let h=0;h<5;h++)for(const target of [[-2.5,-1.6],[-2.5,1.6],[2.5,-1.6],[2.5,1.6]]){
      await page.locator('.stage').scrollIntoViewIfNeeded();const p=await page.evaluate(([h,t])=>{const s=__stage,b=s.canvas.getBoundingClientRect(),v=s.handles[h];return[b.x+s.X(v.x),b.y+s.Y(v.y),b.x+s.X(t[0]*1.1),b.y+s.Y(t[1]*1.1)];},[h,target]);
      await page.mouse.move(p[0],p[1]);await page.mouse.down();await page.mouse.move(p[2],p[3],{steps:8});await page.mouse.up();await page.mouse.move(0,0);await settle();
      for(let i=0;i<7;i++){await frame(i);const q=await check(i);q.vs.forEach(([x,y])=>{assert.ok(Math.abs(x)<=2.5+1e-10);assert.ok(Math.abs(y)<=1.6+1e-10);});}
    }
    await page.getByLabel('Step',{exact:true}).press('Home');await settle();await check(0);await page.getByRole('button',{name:'Next step',exact:true}).click();await settle();await check(1);await page.getByLabel('Step',{exact:true}).press('End');await settle();await check(6);
    console.log(`PASS flagship basis ${width} ${theme}: all7 frames of3 rank presets and actual saved-state replay of each, twenty actual bounded handle drags/all frames, rank/deletion reconstruction, native first/next/last and full finite arrow/polygon/marker/handle/text/TeX/page bounds`);
  }
  assert.deepEqual(errors,[]);
}catch(e){await page.screenshot({path:'/tmp/atlas-flagship-basis-failure.png',fullPage:true});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
