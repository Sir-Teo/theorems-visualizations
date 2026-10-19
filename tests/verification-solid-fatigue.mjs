import assert from'node:assert/strict';import{chromium}from'playwright-core';import{createServer}from'../scripts/serve.mjs';import{findBrowser}from'../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:1500,height:2000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('stats.stages++;',`stats.stages++;(window.__stages||=[]).push(s);const hf=s.handle.bind(s);s.handle=(...a)=>{const h=hf(...a);(window.__handles||=[]).push({sid:window.__stages.indexOf(s),h});return h;};let guide=false;for(const name of['vline','hline']){const f=s[name].bind(s);s[name]=(...a)=>{guide=true;try{return f(...a);}finally{guide=false;}};}for(const name of['path','dot','fn','curve','circle','poly','rect','line','arrow']){const f=s[name].bind(s);s[name]=(...a)=>{if(!guide){let pts;if(name==='path'||name==='poly')pts=a[0];else if(['rect','line','arrow'].includes(name))pts=[[a[0],a[1]],[a[2],a[3]]];else if(name==='dot')pts=[a.slice(0,2)];else if(name==='circle')pts=Array.from({length:101},(_,i)=>[a[0]+a[2]*Math.cos(i*2*Math.PI/100),a[1]+a[2]*Math.sin(i*2*Math.PI/100)]);else if(name==='curve')pts=Array.from({length:101},(_,i)=>a[0](a[1]+(a[2]-a[1])*i/100));else{const d=a[1]?.domain||s.view.x;pts=Array.from({length:101},(_,i)=>{const x=d[0]+(d[1]-d[0])*i/100;return[x,a[0](x)];});}(window.__draws||=[]).push({sid:window.__stages.indexOf(s),name,pts,r:name==='dot'?(a[2]?.r??4):0});}return f(...a);};}`).replace('return item.viz(v);',`for(const key of['render','animate']){const f=v[key];v[key]=(fn,...a)=>f((...args)=>{window.__draws=[];fn(...args);},...a);}return item.viz(v);`);await route.fulfill({response,body});});
await page.route(/\/content\/solid\/ch04-b\.js$/,async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('info={material:mat.value,amplitude:S,...t};','info={material:mat.value,amplitude:S,...t};window.__fatigue=info;').replace('info={amplitudeA:Sa.value,amplitudeB:Sb.value,share:share.value,usage:usage.value,NA,NB,...q};','info={amplitudeA:Sa.value,amplitudeB:Sb.value,share:share.value,usage:usage.value,NA,NB,...q};window.__miner=info;').replace('info={material:mat.value,...p};','info={material:mat.value,...p};window.__mean=info;');await route.fulfill({response,body});});
const settle=()=>page.waitForTimeout(60),end=async(i,k)=>{await page.locator('.ctl-slider input').nth(i).press(k);await settle();};
async function open(id,theme){await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/solid/ch04-b.js&id=solid-${id}&still=1&theme=${theme}&w=1200`);await page.waitForFunction(()=>window.__done);const d=await page.evaluate(()=>window.__done);for(const k of['errors','texErrors','blank'])assert.deepEqual(d[k],[]);}
async function inside(){assert.doesNotMatch(await page.locator('.viz-readout').innerText(),/NaN|Infinity/);const ds=await page.evaluate(()=>[...window.__draws,...(window.__handles||[]).map(({sid,h})=>({sid,name:'handle',pts:[[h.x,h.y]],r:8}))].map(d=>{const s=window.__stages[d.sid];return{...d,pts:d.pts.map(([x,y])=>({x,y,px:s.X(x),py:s.Y(y),left:s.X(s.view.x[0]),right:s.X(s.view.x[1]),top:s.Y(s.view.y[1]),bottom:s.Y(s.view.y[0])}))};}));for(const d of ds)for(const p of d.pts){assert.ok(Number.isFinite(p.px)&&Number.isFinite(p.py),JSON.stringify(p));assert.ok(p.px>=p.left+d.r-1e-4&&p.px<=p.right-d.r+1e-4&&p.py>=p.top+d.r-1e-4&&p.py<=p.bottom-d.r+1e-4,JSON.stringify({sid:d.sid,name:d.name,...p}));}}
async function drag(x,y){const Q=await page.evaluate(([x,y])=>{const {sid,h}=window.__handles[0],s=window.__stages[sid],r=s.canvas.getBoundingClientRect();return{sx:r.x+s.X(h.x),sy:r.y+s.Y(h.y),tx:r.x+s.X(x),ty:r.y+s.Y(y)};},[x,y]);await page.mouse.move(Q.sx,Q.sy);await page.mouse.down();await page.mouse.move(Q.tx,Q.ty,{steps:8});await page.mouse.up();await settle();}
async function fill(i,value){const input=page.locator('.ctl-slider input').nth(i);await input.fill(String(value));await input.dispatchEvent('input');await settle();}
async function select(i){await page.locator('.ctl-select').nth(0).locator('button').nth(i).click();await settle();}
const shot=(id,theme)=>page.screenshot({path:`/tmp/atlas-solid-fatigue-${id}-${theme}.png`});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
try{for(const theme of['light','dark']){
 await open('4.7',theme);
 for(let material=0;material<2;material++){
  await select(material);
  for(const S of[80,245,260,279,280,300,440]){
   await fill(0,S);await inside();const p=await page.evaluate(()=>window.__fatigue);assert.equal(p.amplitude,S);assert.equal(p.material,material?'al':'steel');
   if(material&&S>=280){assert.equal(p.kind,'outside');assert.equal(p.specimens.length,0);assert.match(await page.locator('.viz-readout').innerText(),/life undefined/);}
   else {assert.equal(p.specimens.length,10);for(const q of p.specimens){assert.ok(q.N<=p.stop);if(q.censored)assert.equal(q.N,p.stop);}if(!material&&S<=245)assert.ok(p.specimens.every(q=>q.censored));if(material&&S===80)assert.ok(p.specimens.some(q=>q.censored));}
   if([80,300,440].includes(S))await shot('4.7-'+material+'-'+S,theme);
  }
  for(const key of['Home','End']){await end(0,key);assert.equal((await page.evaluate(()=>window.__fatigue)).amplitude,key==='Home'?80:440);await inside();}
  await fill(0,material?260:300);const before=await page.evaluate(()=>window.__fatigue.specimens);await page.getByRole('button',{name:'Resample',exact:true}).click();await settle();await inside();assert.notDeepEqual(await page.evaluate(()=>window.__fatigue.specimens),before);
 }
 console.log(`PASS solid4.7 ${theme}:both actual materials, seven amplitudes, actual min/max and resampling; finite/plateau/undefined life, both censoring policies and all curve/specimen/arrow/waveform geometry`);
 await open('4.8',theme);
 for(let mask=0;mask<16;mask++){
  for(let i=0;i<4;i++)await end(i,mask&(1<<i)?'End':'Home');await inside();const p=await page.evaluate(()=>window.__miner);
  close(p.amplitudeA,mask&1?440:260);close(p.amplitudeB,mask&2?440:260);close(p.share,mask&4?1:0);close(p.usage,mask&8?1.8:0);
  close(p.nA,p.NA*p.share*p.usage);close(p.nB,p.NB*(1-p.share)*p.usage);close(p.ab.damage,p.usage);close(p.ba.damage,p.usage);close(p.ab.total,p.ba.total);
  assert.equal(p.ab.blocks[0].key,'A');assert.equal(p.ba.blocks[0].key,'B');close(p.ab.blocks[0].count,p.ba.blocks[1].count);close(p.ba.blocks[0].count,p.ab.blocks[1].count);
  if(!p.usage){assert.equal(p.ab.crossing,null);assert.equal(p.ba.crossing,null);}else{assert.ok(p.ab.crossing!==null&&p.ba.crossing!==null);}
 }
 await fill(0,300);await fill(1,380);await fill(2,.35);
 for(const usage of[.6,1,1.8]){await fill(3,usage);await inside();const p=await page.evaluate(()=>window.__miner);close(p.amplitudeA,300);close(p.amplitudeB,380);if(usage<1){assert.equal(p.ab.crossing,null);assert.equal(p.ba.crossing,null);}else if(usage===1){close(p.ab.crossing,p.ab.total);close(p.ba.crossing,p.ba.total);}else assert.ok(Math.abs(p.ab.crossing-p.ba.crossing)>1);await shot('4.8-crossed-'+usage,theme);}
 console.log(`PASS solid4.8 ${theme}:all16 actual amplitude/share/usage corners plus crossed amplitudes at three usage levels; identical cycle bins after permutation, independent direct sums/crossings and all paths/bars/dots`);
 await open('4.9',theme);
 for(let material=0;material<2;material++){
  await select(material);const m=material?{Se:93,Su:310,Sy:276}:{Se:245,Su:490,Sy:355};
  for(const [sm,sa] of[[-220,-10],[-220,320],[580,-10],[580,320],[-200,200],[180,90],[0,300],[0,0]]){
   if(sm===0&&sa===0){await page.getByRole('button',{name:'Zero load',exact:true}).click();await settle();}else await drag(sm,sa);
   await inside();const p=await page.evaluate(()=>window.__mean);assert.equal(await page.evaluate(()=>window.__handles[0].h.color),p.admitted?'green':'red');const bounds=await page.evaluate(()=>window.__stages[1].view.y);assert.ok(bounds[0]<Math.min(-m.Sy,p.minimum)&&bounds[1]>Math.max(m.Sy,p.maximum));close(p.maximum,p.mean+p.amplitude);close(p.minimum,p.mean-p.amplitude);const peak=Math.max(Math.abs(p.maximum),Math.abs(p.minimum));if(peak)close(p.yieldFactor,m.Sy/peak);else assert.equal(p.yieldFactor,Infinity);
   const gd=p.amplitude/m.Se+Math.max(0,p.mean)/m.Su;if(gd)close(p.goodman,1/gd);else{assert.equal(p.goodman,Infinity);assert.match(await page.locator('.viz-readout').innerText(),/∞/);}
   if(p.mean<-195&&p.amplitude>195&&p.amplitude<205){assert.ok(p.goodman>1||material===1);assert.ok(p.yieldFactor<1);assert.ok(!p.admitted);}
   if(p.mean>550&&p.amplitude>290)assert.ok(p.maximum>850);
   if((sm===-220&&sa===320)||(sm===580&&sa===320)||(sm===0&&sa===0))await shot('4.9-'+material+'-'+sm+'-'+sa,theme);
  }
  for(const toggle of await page.locator('.ctl-toggle label').all()){await toggle.click();await settle();await inside();await toggle.click();await settle();await inside();}
 }
 console.log(`PASS solid4.9 ${theme}:both actual materials, all four pointer-clamped corners, compressive-yield counterexample, interior/axis/zero controls and both toggles; direct extrema/ray factors, all finite boundary segments, full waveforms and handle geometry`);
}assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);}finally{await browser.close();server.close();}
