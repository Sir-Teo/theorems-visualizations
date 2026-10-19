import assert from'node:assert/strict';import{chromium}from'playwright-core';import{createServer}from'../scripts/serve.mjs';import{findBrowser}from'../scripts/browser.mjs';
let currentWidth=1450;const server=createServer();await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:1500,height:2000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('stats.stages++;',`stats.stages++;(window.__stages||=[]).push(s);const hf=s.handle.bind(s);s.handle=(...a)=>{const h=hf(...a);(window.__handles||=[]).push({sid:window.__stages.indexOf(s),h});return h;};const tf=s.textPx.bind(s);s.textPx=(...a)=>{(window.__texts||=[]).push({sid:window.__stages.indexOf(s),a});return tf(...a);};let guide=false;for(const name of['vline','hline']){const f=s[name].bind(s);s[name]=(...a)=>{guide=true;try{return f(...a);}finally{guide=false;}};}for(const name of['path','dot','dots','fn','curve','circle','poly','rect','line','arrow']){const f=s[name].bind(s);s[name]=(...a)=>{if(!guide){let pts;if(name==='path'||name==='poly'||name==='dots')pts=a[0];else if(['rect','line','arrow'].includes(name))pts=[[a[0],a[1]],[a[2],a[3]]];else if(name==='dot')pts=[a.slice(0,2)];else if(name==='circle')pts=Array.from({length:101},(_,i)=>[a[0]+a[2]*Math.cos(i*2*Math.PI/100),a[1]+a[2]*Math.sin(i*2*Math.PI/100)]);else if(name==='curve')pts=Array.from({length:101},(_,i)=>a[0](a[1]+(a[2]-a[1])*i/100));else{const d=a[1]?.domain||s.view.x;pts=Array.from({length:101},(_,i)=>{const x=d[0]+(d[1]-d[0])*i/100;return[x,a[0](x)];});}(window.__draws||=[]).push({sid:window.__stages.indexOf(s),name,pts,r:name==='dot'?((a[2]?.r??4)+(a[2]?.hollow?(a[2]?.width??1.8)/2:a[2]?.ring!==false&&(a[2]?.r??4)>=3?.75:0)):name==='dots'?(a[1]?.r??2.5):0});}return f(...a);};}`).replace('return item.viz(v);',`for(const key of['render','animate']){const f=v[key];v[key]=(fn,...a)=>f((...args)=>{window.__draws=[];window.__texts=[];fn(...args);},...a);}return item.viz(v);`);await route.fulfill({response,body});});
await page.route(/\/content\/micro\/ch10-b\.js$/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replaceAll('info=p;','info=p;window.__audit=info;').replaceAll('info={...p,qlo,xmax,top};','info={...p,qlo,xmax,top};window.__audit=info;');await route.fulfill({response,body});});
const settle=()=>page.waitForTimeout(60),end=async(i,k)=>{await page.locator('.ctl-slider input').nth(i).press(k);await settle();};
async function open(id,theme){await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/micro/ch10-b.js&id=micro-${id}&still=1&theme=${theme}&w=${currentWidth-45}&wait=180`);await page.waitForFunction(()=>window.__done);const d=await page.evaluate(()=>window.__done);for(const k of['errors','texErrors','blank'])assert.deepEqual(d[k],[]);await inside();}
async function inside(){assert.doesNotMatch(await page.locator('.viz-readout').innerText(),/NaN|Infinity/);const a=await page.evaluate(()=>({errors:window.__vizErrors||[],tex:window.__texErrors||[],math:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({text:e.textContent,width:e.clientWidth,scroll:e.scrollWidth})),overflow:document.documentElement.scrollWidth>innerWidth+1,texts:(window.__texts||[]).map(({sid,a:[str,X,Y,o={}]})=>{const s=window.__stages[sid],c=s.ctx;c.save();c.font=s._font(o);c.textAlign=o.align||'left';c.textBaseline=o.baseline||'middle';const m=c.measureText(str),x=X+(o.dx||0),y=Y+(o.dy||0),halo=o.halo===false?0:2;c.restore();return{sid,str,b:[x-m.actualBoundingBoxLeft-halo,y-m.actualBoundingBoxAscent-halo,x+m.actualBoundingBoxRight+halo,y+m.actualBoundingBoxDescent+halo],clip:[s._m.l,s._m.t,s.width-s._m.r,s.height-s._m.b]};})}));assert.deepEqual(a.errors,[]);assert.deepEqual(a.tex,[]);assert.deepEqual(a.math,[],'display TeX overflow');assert.equal(a.overflow,false,'page overflow');for(const t of a.texts)assert.ok(t.b[0]>=t.clip[0]-.5&&t.b[1]>=t.clip[1]-.5&&t.b[2]<=t.clip[2]+.5&&t.b[3]<=t.clip[3]+.5,JSON.stringify(t));for(let i=0;i<a.texts.length;i++)for(let j=0;j<i;j++){const p=a.texts[i],q=a.texts[j];if(p.sid===q.sid)assert.ok(p.b[2]<=q.b[0]||q.b[2]<=p.b[0]||p.b[3]<=q.b[1]||q.b[3]<=p.b[1],JSON.stringify({overlapping:[p,q]}));}const ds=await page.evaluate(()=>[...window.__draws,...(window.__handles||[]).map(({sid,h})=>({sid,name:'handle',pts:[[h.x,h.y]],r:8}))].map(d=>{const s=window.__stages[d.sid];return{...d,pts:d.pts.map(([x,y])=>({x,y,px:s.X(x),py:s.Y(y),left:s.X(s.view.x[0]),right:s.X(s.view.x[1]),top:s.Y(s.view.y[1]),bottom:s.Y(s.view.y[0])}))};}));for(const d of ds)for(const p of d.pts){assert.ok(Number.isFinite(p.px)&&Number.isFinite(p.py),JSON.stringify(p));assert.ok(p.px>=p.left+d.r-1e-4&&p.px<=p.right-d.r+1e-4&&p.py>=p.top+d.r-1e-4&&p.py<=p.bottom-d.r+1e-4,JSON.stringify({sid:d.sid,name:d.name,...p}));}}
async function fill(i,value){const input=page.locator('.ctl-slider input').nth(i);await input.fill(String(value));await input.dispatchEvent('input');await settle();}
async function select(i){await page.locator('.ctl-select').nth(0).locator('button').nth(i).click();await settle();}
const shot=async(id,theme)=>{await page.screenshot({path:`/tmp/atlas-micro-market-power-${id}-${currentWidth}-${theme}.png`,fullPage:true});if(currentWidth===430){const stages=page.locator('.stage:visible');for(let i=0;i<await stages.count();i++)await stages.nth(i).screenshot({path:`/tmp/atlas-micro-market-power-${id}-${currentWidth}-${theme}-panel${i}.png`});}};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
try{for(const theme of['light','dark'])for(const width of[1450,430]){currentWidth=width;await page.setViewportSize({width,height:2000});
 await open('10.7',theme);
 for(let mode=0;mode<2;mode++){
  await select(mode);
  for(let mask=0;mask<16;mask++){
   for(let i=0;i<4;i++)await end(i,mask&(1<<i)?'End':'Home');await inside();const p=await page.evaluate(()=>window.__audit);
   close(p.a2,mask&1?20:8);close(p.b2,mask&2?3:.5);close(p.c,mask&4?6:0);close(p.m,mask&8?.5:0);assert.equal(p.uniform,!!mode);
   close(p.Q,p.q[0]+p.q[1]);close(p.mc,p.c+p.m*p.Q);assert.ok(p.separate.profit>=p.one.profit-1e-9);
   for(let i=0;i<2;i++){const d=p.markets[i],q=p.separate.q[i];if(q>1e-10)close(d.a-2*d.b*q,p.lambda);else{assert.equal(p.separate.elasticity[i],null);assert.ok(d.a<=p.lambda+1e-9);}}
   if(p.c===0&&p.m===0){close(p.separate.elasticity[0],1);close(p.separate.elasticity[1],1);}
   if(mask===0||mask===14||mask===15)await shot('10.7-'+mode+'-'+mask,theme);
  }
 }
 await select(0);await fill(0,8);await fill(1,3);await fill(2,6);await fill(3,.5);await inside();let p=await page.evaluate(()=>window.__audit);close(p.q[1],0);assert.match(await page.locator('.viz-readout').innerText(),/undefined \(no sales\)/);await shot('10.7-closed-market',theme);
 await select(1);await inside();assert.match(await page.locator('.viz-readout').innerText(),/do not apply/);await shot('10.7-uniform-closed-market',theme);
 console.log(`PASS micro10.7 ${width} ${theme}: all32 actual pricing-mode/intercept/slope/cost/rise corners, independent marginal conditions and feasible-policy profit dominance, zero-cost unit elasticities, closed-market labels and full demand/CS/marker geometry`);
 await open('10.9',theme);
 for(const key of['Home','End']){await end(0,key);await inside();const p=await page.evaluate(()=>window.__audit);close(p.n,key==='Home'?1:8);close(p.q,16/p.n);close(p.profit,320/p.n**2-16);close(p.p-p.averageCost,p.profit/p.q);assert.ok(p.qlo<p.q);await shot('10.9-'+key,theme);}
 await fill(0,2.01);await inside();await shot('10.9-near-minimum-AC-output',theme);
 await page.getByRole('button',{name:'zero-profit entry index',exact:true}).click();await settle();await inside();p=await page.evaluate(()=>window.__audit);close(p.n,Math.sqrt(20));close(p.profit,0);close(p.p,p.averageCost);close(-16/p.q**2+.25,-1);assert.ok(p.q<8&&p.p>p.marginalCost);await shot('10.9-zero-profit',theme);
 console.log(`PASS micro10.9 ${width} ${theme}: both actual entry-index endpoints, n1 output16/profit304, exact off-grid zero-profit button, independent tangency/markup/minimum-scale checks and complete displayed demand/MR/MC/AC/profit geometry`);
 await open('10.12',theme);
 for(let mode=0;mode<2;mode++){
  await select(mode);
  for(let n=2;n<=6;n++){
   await fill(0,n);
   for(let mask=0;mask<4;mask++){
    await end(1,mask&1?'End':'Home');await end(2,mask&2?'End':'Home');await inside();const p=await page.evaluate(()=>window.__audit);assert.equal(p.n,n);assert.equal(p.sequential,!!mode);close(p.first,mask&1?10:0);close(p.others,mask&2?10:0);close(p.totals[0],p.first+(n-1)*p.others);
    assert.ok(p.states.slice(1).flat().every(q=>q>=0&&q<=5));close(p.totalEquilibrium,10*n/(n+1));
    if(p.ratio!==null){assert.equal(p.clipped[p.ratioAt],false);close(p.ratio,-(n-1)/2);}
    if(n===6&&mask===3)await shot('10.12-'+mode+'-max-start',theme);
   }
   for(const name of['equilibrium start','balanced perturbation']){
    await page.getByRole('button',{name,exact:true}).click();await settle();await inside();const p=await page.evaluate(()=>window.__audit);close(p.totals[0],p.totalEquilibrium);
    if(name==='equilibrium start'){close(p.first,p.equilibrium);close(p.others,p.equilibrium);assert.equal(p.ratio,null);assert.ok(p.norms.at(-1)<1e-4);}else{assert.ok(p.norms[0]>.5);if(!mode&&n===3){assert.equal(p.ratio,null);close(p.norms.at(-1),p.norms[0]*2**-24);}}
    if(n===3||n===6)await shot('10.12-'+mode+'-'+n+'-'+name.split(' ')[0],theme);
   }
  }
 }
 console.log(`PASS micro10.12 ${width} ${theme}: all40 actual update-mode/firm-count/start corners plus exact fixed-point and balanced-perturbation buttons at each n; independent bounds/equilibrium/interior multipliers, full-vector diagnostics and complete projected/intermediate/total trajectories`);
}assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
