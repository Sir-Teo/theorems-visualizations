// Production routes, native controls, rich-text bounds and actual state-link replay.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
import * as H from '../content/mathbio/ch06.shared.js';
const dir=process.env.MATHBIO_SHOTS||'/tmp/wave6-mathbio-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true});
let actions=0,replays=0,checks=0,layouts=0,invalidReplays=0,rawReplays=0,modelChecks=0;const errors=[];
const page=await browser.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route('**/assets/js/viz/core.js',async route=>{
 let src=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
 const needle='try { vizFn(instance.api); }';assert.ok(src.includes(needle));
 src=src.replace(needle,`window.__mathbioRuntime=instance;
 const oldStage=instance.api.stage;
 instance.api.stage=(...args)=>{const s=oldStage(...args),begin=s.begin.bind(s);s.__points=[];
 s.begin=(...a)=>{s.__points=[];return begin(...a);};
 s.__paths=[];s.__dots=[];const reset=s.begin;s.begin=(...a)=>{s.__paths=[];s.__dots=[];return reset(...a);};
 for(const name of ['path','dot','line','arrow']){const old=s[name].bind(s);s[name]=(...a)=>{if(name==='path'){s.__points.push(...a[0]);s.__paths.push(a[0]);}else if(name==='dot'){s.__points.push([a[0],a[1]]);s.__dots.push([a[0],a[1]]);}else s.__points.push([a[0],a[1]],[a[2],a[3]]);return old(...a);};}
 return s;};
 ${needle}`);
 await route.fulfill({contentType:'text/javascript',body:src});
});
async function check(label){
 await page.locator('#viz').scrollIntoViewIfNeeded();
 await page.evaluate(async()=>{await document.fonts.ready;window.__mathbioRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const q=await page.evaluate(async()=>{
  const rt=window.__mathbioRuntime,issues=[],points=[];
  for(const s of rt.stages)for(const p of s.__points){if(!p||!Number.isFinite(p[0])||!Number.isFinite(p[1]))issues.push({nonfinite:p});else points.push({x:s.X(p[0]),y:s.Y(p[1]),W:s.W,H:s.H});}
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout')){
   const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1))issues.push({text:n.textContent,left:r.left,right:r.right,container:[left,right]});}
  }
  const ranges=[...document.querySelectorAll('#viz input[type=range]')],state=rt.state.capture(),sliderParts=state.parts.filter(([k])=>k.startsWith('slider:'));
  let oregonAudit=null;if(location.hash.match(/mathbio-6\.8(?:\?|$)/)){const x=Object.fromEntries(sliderParts.map(([k,v])=>[k.slice(7,k.lastIndexOf(':')),v])),params={eps:x['activator time scale ε'],delta:x['bromide time scale δ'],f:x['stoichiometric factor f']},key=JSON.stringify(params),H=await import('/content/mathbio/ch06.shared.js');if(window.__oregonAudit?.key!==key)window.__oregonAudit={key,z:H.oregonator(params)};const z=window.__oregonAudit.z;oregonAudit={selected:H.interpolate(z.rows,x['selected time']),maximum:Math.max(...z.rows.map(r=>r[1])),accepted:z.accepted,rejected:z.rejected};}

  return {issues,points,state,oregonAudit,paths:rt.stages.map(s=>s.__paths),dots:rt.stages.map(s=>s.__dots),id:Number(location.hash.match(/mathbio-6\.(\d+)/)?.[1]),selections:Object.fromEntries([...document.querySelectorAll('#viz .seg')].map(e=>[e.getAttribute('aria-label'),e.querySelector('button.on')?.textContent])),read:document.querySelector('.viz-readout')?.textContent,errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,sliders:sliderParts.map(([k,v],i)=>({key:k,model:v,dom:+ranges[i].value,output:ranges[i].closest('.ctl-slider').querySelector('output').textContent}))};
 });
 if(q.overflow>1||q.issues.length){fs.writeFileSync(`${dir}/failure.json`,JSON.stringify({label,...q},null,2));await page.screenshot({path:`${dir}/failure.png`,fullPage:true});}
 assert.deepEqual(errors,[],label+' page errors');assert.deepEqual(q.errors,[],label+' visualization errors');assert.equal(q.tex,0,label+' TeX');assert.ok(q.overflow<=1,label+' viewport overflow');assert.deepEqual(q.issues,[],label+' rich text / finite geometry');assert.ok(q.read?.length,label+' readout');assert.doesNotMatch(q.read,/NaN|Infinity|\[object Object\]/,label);
 for(const p of q.points)assert.ok(p.x>=-1&&p.x<=p.W+1&&p.y>=-1&&p.y<=p.H+1,label+' geometry outside canvas '+JSON.stringify(p));
 for(const s of q.sliders){assert.ok(Math.abs(s.model-s.dom)<=16*Number.EPSILON*Math.max(1,Math.abs(s.model)),label+' slider state mismatch '+JSON.stringify(s));assert.ok(Math.abs(Number(s.output)-s.model)<=5.1e-5*Math.abs(s.model)+Number.MIN_VALUE,label+' slider output hides its value '+JSON.stringify(s));}
 assertModel(q,label);checks++;return q;
}
const modelCache=new Map();
function cached(name,args,fn){const key=name+JSON.stringify(args);if(!modelCache.has(key))modelCache.set(key,fn());return modelCache.get(key);}
function assertModel(q,label){
 const x=Object.fromEntries(q.sliders.map(s=>[s.key.slice(7,s.key.lastIndexOf(':')),s.model]));
 const numeric=(prefix,expected,absolute=1e-13)=>{const tail=q.read.split(prefix)[1];assert.ok(tail!==undefined,label+' missing '+prefix);if(expected===null)assert.ok(tail.startsWith('not defined'),label+' undefined '+prefix);else{const a=tail.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);assert.ok(a,label+' numeric '+prefix);assert.ok(Math.abs(Number(a[0])-expected)<=5.1e-5*Math.abs(expected)+absolute,label+' value '+prefix+tail+' versus '+expected);}modelChecks++;};
 const vector=(a,b)=>{assert.equal(a.length,b.length,label+' point dimension');a.forEach((n,i)=>{assert.ok(Math.abs(n-b[i])<=1e-11*Math.max(1,Math.abs(b[i])),label+' plotted value '+n+' versus '+b[i]);modelChecks++;});};
 const last=(stage)=>q.dots[stage].at(-1);
 if(q.id===1){const z=H.dulacFlux({mode:q.selections['vector field'],weighted:q.selections['Dulac factor B']==='1/(xy)',damping:x['damping / prey self-limitation'],radius:x['candidate-circle radius']});numeric('Numerical outward flux=',z.flux);numeric('exact area flux=',z.exact);assert.ok(q.read.includes('Divergence criterion: '+z.criterion));modelChecks++;}
 if(q.id===2){const mu=x['relaxation parameter μ'],z=cached('vdp',[mu],()=>H.vdp(mu)),p=H.interpolate(z.rows,x['selected time']);numeric('Measured late-window period=',z.period);numeric('leading large-μ asymptote=',z.asymptote);numeric('selected x=',p[0]);numeric('y=',p[1]);vector(last(0),p);vector(last(1),[x['selected time'],p[0]]);}
 if(q.id===3){const b=x['substrate supply b'],z=H.selkovFacts(.1,b),rows=cached('selkov',[b],()=>H.selkov(b)),p=H.interpolate(rows,x['selected time']);numeric('Trace=',z.trace);numeric('determinant=',z.det);numeric('Supply boundaries=',z.low);vector(last(0),p);vector(last(1),[x['selected time'],p[0]]);if(q.selections['phase-plane view']==='invariant outer bound'){assert.deepEqual(q.paths[0][0],[...z.polygon,z.polygon[0]],label+' analytic polygon');modelChecks++;}}
 if(q.id===4){const h=x['Hill exponent h'],z=cached('goodwin',[h],()=>H.goodwin(h)),p=H.interpolate(z.rows,x['selected time']);numeric('Local loop gain=',z.gain);numeric('dominant real part=',z.sigma,0);numeric('local angular frequency=',z.omega);vector(last(0),[x['selected time'],p[0]]);vector(last(1),[p[0],p[2]]);}
 if(q.id===5){const n=x['number of stages n'],G=x['dimensionless loop gain G'],z=H.secant(n,G);numeric('Secant threshold=',z.critical);numeric('dominant real part=',z.sigma,0);assert.ok(q.read.includes(z.status),label+' local stability status');modelChecks++;z.eigen.forEach((p,i)=>vector(q.dots[0][i],p));vector(last(1),[x['selected time'],H.secantMode(n,G,x['selected time'])[0]]);}
 if(q.id===6){const args={A:x['feedback gain A'],input:x['pulse production input'],duration:x['pulse duration']},z=cached('switch',args,()=>H.feedbackSwitch(args)),p=H.interpolate(z.rows,x['selected time'])[0];numeric('unstable threshold=',z.unstable);numeric('high stable state=',z.high);numeric('selected x=',p);vector(last(1),[x['selected time'],p]);}
 if(q.id===7){const kick=x['instantaneous kick in x'],eps=x['recovery rate ε'],z=cached('excitable',[kick,eps],()=>H.excitable(kick,eps)),p=H.interpolate(z.rows,x['selected time']);numeric('Rest x=',z.rest[0]);numeric('y=',z.rest[1]);numeric('sampled peak x=',z.peak);numeric('endpoint distance from rest=',z.residual);vector(last(0),p);vector(last(1),[x['selected time'],p[0]]);}
 if(q.id===8){const args={eps:x['activator time scale ε'],delta:x['bromide time scale δ'],f:x['stoichiometric factor f']},z=cached('oregonator',args,()=>H.oregonator(args)),reference=H.interpolate(z.rows,x['selected time']),p=q.oregonAudit.selected;for(let i=0;i<3;i++)assert.ok(Math.abs(p[i]-reference[i])<=5e-8+1.2e-4*Math.max(Math.abs(p[i]),Math.abs(reference[i])),label+' cross-engine chemical state');numeric('Selected concentrations x,y,z=',p[0]);numeric('accepted steps=',q.oregonAudit.accepted);numeric('rejected steps=',q.oregonAudit.rejected);vector(last(0),[x['selected time'],p[0]/q.oregonAudit.maximum]);vector(last(1),[p[0],p[2]]);}

 if(q.id===9||q.id===10){const phase=x['phase before pulse / cycles'],amp=x['horizontal pulse amplitude'],shear=x['isochron shear β']??0,t=x['time after pulse'],z=H.phaseReset(phase,amp,shear);if(q.id===9){numeric('Finite phase change=',z.shift/H.TAU);numeric('infinitesimal horizontal response=',z.infinitesimal);numeric('post-pulse radius=',z.radius);vector(q.dots[0][0],z.point);vector(q.dots[0][1],H.phaseState(phase,amp,shear,t));vector(last(1),[phase,z.shift/H.TAU]);}else{numeric('Landing radius=',z.radius,0);numeric('new phase=',z.newPhase);numeric('reset-map degree=',z.degree);numeric('recovery to radius [0.9,1.1]=',z.recovery);vector(q.dots[0][1],z.point);vector(last(0),H.phaseState(phase,amp,0,t));if(z.newPhase!==null)vector(last(1),[phase,z.newPhase]);else assert.equal(q.dots[1].length,0,label+' no undefined phase marker');}}
 if(q.id===11){const omega=x['unforced frequency ratio Ω'],K=x['forcing strength K'],steps=x['iterations for rotation estimate'],[p,r]=q.selections['cycles per forcing period'].split(':').map(Number),run=H.circleRun(omega,K,steps),z=H.lockedOrbit(omega,K,p,r);numeric('Finite rotation estimate=',run.estimate);numeric('candidate multiplier=',z?.multiplier??null);numeric('return residual=',z?.residual??null);vector(last(0),[omega,K]);if(z)vector(last(1),[z.phase,z.residual]);else assert.equal(q.dots[1].length,0,label+' no candidate marker');}
}

async function open(id,theme,width,url){
 errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/mathbio-6.${id}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__mathbioRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme,'actual production theme');return check(`${id}/${theme}/${width}`);
}
async function replay(id,theme,width,label){
 const before=await check(label+' before share');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();
 await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const url=await page.locator('.share-url').inputValue();assert.ok(url.includes(`#/t/mathbio-6.${id}?s=`));
 const after=await open(id,theme,width,url);assert.deepEqual(after.state.parts,before.state.parts,label+' exact shared state');assert.equal(after.read,before.read,label+' shared readout');replays++;
}
async function screenshot(path){
 await page.locator('#viz').scrollIntoViewIfNeeded();await check('capture settle');
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});});
 await page.screenshot({path:path.replace('.png','-settle.png'),fullPage:true});
 const clip=await page.locator('#viz').evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});
 await page.screenshot({path,clip,fullPage:true});
}
async function savedStates(id,theme,width,label){
 const baseState=(await open(id,theme,width)).state;
 const key=baseState.parts.find(([k])=>k.startsWith('slider:'))[0];
 const bad=structuredClone(baseState);bad.parts.find(([k])=>k===key)[1]=1e99;
 const after=await open(id,theme,width,stateURL(base,`mathbio-6.${id}`,bad));
 assert.deepEqual(after.state.parts,baseState.parts,label+' reject out-of-domain state');
 assert.match(await page.locator('.share-status').innerText(),/could not|invalid|saved|restor/i);invalidReplays++;
 const rawIndex=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.findIndex(e=>e.getAttribute('step')==='any'));
 if(rawIndex<0)return;
 const rawKey=baseState.parts.filter(([k])=>k.startsWith('slider:'))[rawIndex][0];
 const raw=structuredClone(baseState),part=raw.parts.find(([k])=>k===rawKey);part[1]+=.0000123456789;
 const q=await open(id,theme,width,stateURL(base,`mathbio-6.${id}`,raw));assert.equal(q.state.parts.find(([k])=>k===rawKey)[1],part[1]);rawReplays++;
 await replay(id,theme,width,label+' raw fractional state');
 if(id===5||id===10){const cases=id===5?[{'dimensionless loop gain G':8-2**-49},{'dimensionless loop gain G':8},{'dimensionless loop gain G':8+2**-49}]:[{'horizontal pulse amplitude':1-1e-14,'phase before pulse / cycles':.5},{'horizontal pulse amplitude':1,'phase before pulse / cycles':.5},{'horizontal pulse amplitude':1+1e-14,'phase before pulse / cycles':.5},{'horizontal pulse amplitude':1,'phase before pulse / cycles':.5-2**-52},{'horizontal pulse amplitude':1,'phase before pulse / cycles':.5+2**-52}];for(const values of cases){const special=structuredClone(baseState);for(const [name,value]of Object.entries(values))special.parts.find(([k])=>k.startsWith('slider:'+name+':'))[1]=value;await open(id,theme,width,stateURL(base,`mathbio-6.${id}`,special));await replay(id,theme,width,label+' exact boundary '+JSON.stringify(values));}}



}
async function controls(id,theme,width,label){
 const seen=new Set();async function sliders(){const names=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));
 for(const name of names){const el=page.getByRole('slider',{name,exact:true});if(seen.has(name)||!await el.isVisible())continue;seen.add(name);for(const key of ['Home','End']){await el.press(key);actions++;await check(label+' '+name+' '+key);}await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();await page.mouse.click(b.x+.37*b.width,b.y+b.height/2);actions++;await check(label+' native drag '+name);await replay(id,theme,width,label+' '+name);}}
 await sliders();
 const groups=await page.locator('#viz .seg').evaluateAll(es=>es.map(e=>[e.getAttribute('aria-label'),[...e.querySelectorAll('button')].map(b=>b.textContent)]));
 for(const [name,options]of groups){const group=page.getByRole('group',{name,exact:true});if(!await group.isVisible())continue;const original=await group.locator('button.on').textContent();for(const option of options){await group.getByRole('button',{name:option,exact:true}).click();actions++;await check(label+' '+option);await sliders();await replay(id,theme,width,label+' '+option);await page.locator('#viz').screenshot({path:`${dir}/${label}-mode-${option.replace(/[^a-z0-9]/gi,'_')}.png`});}await group.getByRole('button',{name:original,exact:true}).click();actions++;await check(label+' restored '+name);}

 const toggles=await page.locator('#viz .ctl-toggle').count();for(let i=0;i<toggles;i++)for(let j=0;j<2;j++){await page.locator('#viz .ctl-toggle').nth(i).locator('label').click();actions++;await check(label+' toggle');await replay(id,theme,width,label+' toggle');await page.locator('#viz').screenshot({path:`${dir}/${label}-toggle${i}-${j}.png`});}
}
try{
 const ids=process.argv.slice(2).length?process.argv.slice(2).map(Number):Array.from({length:11},(_,i)=>i+1);
 for(const id of ids)for(const theme of ['light','dark'])for(const width of [1200,320]){
  const label=`6.${id}-${theme}-${width}`;await open(id,theme,width);await screenshot(`${dir}/${label}-default.png`);await page.screenshot({path:`${dir}/${label}-full.png`,fullPage:true});if(!process.env.MATHBIO_DEFAULTS_ONLY)await controls(id,theme,width,label);await savedStates(id,theme,width,label);layouts++;fs.writeFileSync(`${dir}/progress.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks},null,2));console.log('PASS',label,{actions,replays,checks,modelChecks});
 }
 fs.writeFileSync(`${dir}/result.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks},null,2));console.log(JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
