import assert from'node:assert/strict';import{chromium}from'playwright-core';import{createServer}from'../scripts/serve.mjs';import{findBrowser}from'../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:1500,height:2000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('stats.stages++;',`stats.stages++;(window.__stages||=[]).push(s);const hf=s.handle.bind(s);s.handle=(...a)=>{const h=hf(...a);(window.__handles||=[]).push({sid:window.__stages.indexOf(s),h});return h;};let guide=false;for(const name of['vline','hline']){const f=s[name].bind(s);s[name]=(...a)=>{guide=true;try{return f(...a);}finally{guide=false;}};}for(const name of['path','dot','fn','curve','circle','poly']){const f=s[name].bind(s);s[name]=(...a)=>{if(!guide){let pts;if(name==='path'||name==='poly')pts=a[0];else if(name==='dot')pts=[a.slice(0,2)];else if(name==='circle')pts=Array.from({length:101},(_,i)=>[a[0]+a[2]*Math.cos(i*2*Math.PI/100),a[1]+a[2]*Math.sin(i*2*Math.PI/100)]);else if(name==='curve')pts=Array.from({length:101},(_,i)=>a[0](a[1]+(a[2]-a[1])*i/100));else{const d=a[1]?.domain||s.view.x;pts=Array.from({length:101},(_,i)=>{const x=d[0]+(d[1]-d[0])*i/100;return[x,a[0](x)];});}(window.__draws||=[]).push({sid:window.__stages.indexOf(s),name,pts,r:name==='dot'?(a[2]?.r??4):0});}return f(...a);};}`).replace('return item.viz(v);',`for(const key of['render','animate']){const f=v[key];v[key]=(fn,...a)=>f((...args)=>{window.__draws=[];fn(...args);},...a);}return item.viz(v);`);await route.fulfill({response,body});});
await page.route(/\/content\/physio\/ch04-[cd]\.js$/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replaceAll(/\bo = \{/g,'window.__physio = o = {').replace('cur.Re = Re;', 'cur.Re = Re;window.__physio={Re,D,u,mu,Rec};');await route.fulfill({response,body});});
const settle=()=>page.waitForTimeout(60),end=async(i,k)=>{await page.locator('.ctl-slider input').nth(i).press(k);await settle();};
async function open(id,theme){await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/physio/${id==='4.14'?'ch04-c':'ch04-d'}.js&id=physio-${id}&still=1&theme=${theme}&w=1200`);await page.waitForFunction(()=>window.__done);const d=await page.evaluate(()=>window.__done);for(const k of['errors','texErrors','blank'])assert.deepEqual(d[k],[]);}
async function inside(){assert.doesNotMatch(await page.locator('.viz-readout').innerText(),/NaN|Infinity|undefined/);const ds=await page.evaluate(()=>[...window.__draws,...(window.__handles||[]).map(({sid,h})=>({sid,name:'handle',pts:[[h.x,h.y]],r:8}))].map(d=>{const s=window.__stages[d.sid];return{...d,pts:d.pts.map(([x,y])=>({x,y,px:s.X(x),py:s.Y(y),left:s.X(s.view.x[0]),right:s.X(s.view.x[1]),top:s.Y(s.view.y[1]),bottom:s.Y(s.view.y[0])}))};}));for(const d of ds)for(const p of d.pts){assert.ok(Number.isFinite(p.px)&&Number.isFinite(p.py),JSON.stringify(p));assert.ok(p.px>=p.left+d.r-1e-4&&p.px<=p.right-d.r+1e-4&&p.py>=p.top+d.r-1e-4&&p.py<=p.bottom-d.r+1e-4,JSON.stringify({sid:d.sid,name:d.name,...p}));}}
async function dragX(x){const Q=await page.evaluate(x=>{const {sid,h}=window.__handles[0],s=window.__stages[sid],r=s.canvas.getBoundingClientRect();return{sx:r.x+s.X(h.x),sy:r.y+s.Y(h.y),tx:r.x+s.X(x)};},x);await page.mouse.move(Q.sx,Q.sy);await page.mouse.down();await page.mouse.move(Q.tx,Q.sy,{steps:8});await page.mouse.up();await settle();}
const shot=(id,theme)=>page.screenshot({path:`/tmp/atlas-physio-flow-${id}-${theme}.png`});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
async function animation(){await page.getByRole('button',{name:'Play animation',exact:true}).click();await page.waitForTimeout(300);await page.getByRole('button',{name:'Pause animation',exact:true}).click();await settle();await inside();}
async function dragXY(x,y){const Q=await page.evaluate(({x,y})=>{const {sid,h}=window.__handles[0],s=window.__stages[sid],r=s.canvas.getBoundingClientRect();return{sx:r.x+s.X(h.x),sy:r.y+s.Y(h.y),tx:r.x+s.X(x),ty:r.y+s.Y(y)};},{x,y});await page.mouse.move(Q.sx,Q.sy);await page.mouse.down();await page.mouse.move(Q.tx,Q.ty,{steps:8});await page.mouse.up();await settle();}
try{for(const theme of['light','dark']){
 await open('4.14',theme);
 for(let mask=0;mask<4;mask++){
  for(let i=0;i<2;i++)await end(i,mask&(1<<i)?'End':'Home');
  for(const d of[.005,50])for(const u of[1e-4,10]){
   await dragXY(d,u);await inside();const D=await page.evaluate(()=>window.__physio);
   close(D.D,d);close(D.u,u);close(D.Re,1060*D.u*(D.D/1000)/(D.mu/1000));
   if(mask===0&&d===.005&&u===1e-4)await shot('4.14-small',theme);
  }
 }
 await shot('4.14-large',theme);await animation();
 console.log(`PASS4.14 ${theme}:16 actual mu/reference/diameter/speed combinations; SI ratio, whole log-curve and marker containment, native play/pause`);
 await open('4.18',theme);
 for(let mask=0;mask<8;mask++){
  for(let i=0;i<3;i++)await end(i,mask&(1<<i)?'End':'Home');await inside();
  const D=await page.evaluate(()=>window.__physio);
  const exact=.5*1060*(D.v2**2-D.v1**2)/133.322;
  close(D.dPex,exact);close(D.dFinal,D.loss);close(D.d4,D.dPex+D.proximalRounded+D.rounding);
  if(!(mask&1)){close(D.dPex,0);assert.ok(D.d4>0);}
  if(mask===0)await shot('4.18-open',theme);
 }
 await shot('4.18-tight',theme);
 console.log(`PASS4.18 ${theme}:8 actual narrowing/flow/recovery corners; independent SI energy, recovery and exact approximation decomposition, whole curves and marker containment`);
}assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
