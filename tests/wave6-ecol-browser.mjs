// Production routes, native controls, rich-text bounds and actual state-link replay.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
import * as H from '../content/ecol/ch06.shared.js';
const dir=process.env.ECOL_SHOTS||'/tmp/wave6-ecol-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true});
let actions=0,replays=0,checks=0,layouts=0,invalidReplays=0,rawReplays=0,modelChecks=0;const errors=[];
const page=await browser.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route('**/assets/js/viz/core.js',async route=>{
 let src=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
 const needle='try { vizFn(instance.api); }';assert.ok(src.includes(needle));
 src=src.replace(needle,`window.__ecolRuntime=instance;
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
 await page.evaluate(async()=>{await document.fonts.ready;window.__ecolRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const q=await page.evaluate(()=>{
  const rt=window.__ecolRuntime,issues=[],points=[];
  for(const s of rt.stages)for(const p of s.__points){if(!p||!Number.isFinite(p[0])||!Number.isFinite(p[1]))issues.push({nonfinite:p});else points.push({x:s.X(p[0]),y:s.Y(p[1]),W:s.W,H:s.H});}
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout')){
   const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1))issues.push({text:n.textContent,left:r.left,right:r.right,container:[left,right]});}
  }
  const ranges=[...document.querySelectorAll('#viz input[type=range]')],state=rt.state.capture(),sliderParts=state.parts.filter(([k])=>k.startsWith('slider:'));
  return {issues,points,state,paths:rt.stages.map(s=>s.__paths),dots:rt.stages.map(s=>s.__dots),id:Number(location.hash.match(/ecol-6\.(\d+)/)?.[1]),selections:Object.fromEntries([...document.querySelectorAll('#viz .seg')].map(e=>[e.getAttribute('aria-label'),e.querySelector('button.on')?.textContent])),read:document.querySelector('.viz-readout')?.textContent,errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,sliders:sliderParts.map(([k,v],i)=>({key:k,model:v,dom:+ranges[i].value,output:ranges[i].closest('.ctl-slider').querySelector('output').textContent}))};
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
 const number=(tail,expected,absolute=1e-12)=>{assert.ok(tail!==undefined,label+' missing numeric text');if(expected===null)assert.ok(tail.startsWith('not defined'),label+' undefined value');else{const a=tail.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);assert.ok(a,label+' numeric '+tail);assert.ok(Math.abs(Number(a[0])-expected)<=5.1e-5*Math.abs(expected)+absolute,label+' value '+tail+' versus '+expected);}modelChecks++;};
 const numeric=(prefix,value,abs)=>number(q.read.split(prefix)[1],value,abs),list=(prefix,values)=>{const text=q.read.split(prefix)[1];assert.ok(text!==undefined,label+' missing '+prefix);const a=text.split(';')[0].split(', ');values.forEach((v,i)=>number(a[i],v));};
 const vector=(a,b)=>{assert.equal(a.length,b.length,label+' point dimension');a.forEach((n,i)=>{assert.ok(Math.abs(n-b[i])<=2e-10*Math.max(1,Math.abs(b[i])),label+' plotted value '+n+' versus '+b[i]);modelChecks++;});};
 const spectrum=(actual,expected)=>{assert.equal(actual.length,expected.length,label+' spectrum count');const left=expected.map(p=>p.slice());for(const p of actual){let k=0;for(let i=1;i<left.length;i++)if(Math.hypot(p[0]-left[i][0],p[1]-left[i][1])<Math.hypot(p[0]-left[k][0],p[1]-left[k][1]))k=i;vector(p,left[k]);left.splice(k,1);}};
 if(q.id===1){const z=H.trophic(x['diet fraction recycled from top consumer']);list('Trophic levels=',z.levels);numeric('basal share of middle diet=',1-x['diet fraction recycled from top consumer'],0);const points=z.levels.map((v,i)=>v===null?null:[i,v]).filter(p=>p);assert.equal(q.dots[1].length,points.length);points.forEach((p,i)=>vector(q.dots[1][i],p));}
 if(q.id===2){const P=x['external predator pressure'],z=H.spaceEquilibrium(P);list('Equilibrium coverages=',z.x);numeric('free space=',z.free);numeric('positive species=',z.x.filter(x=>x>0).length);z.x.forEach((v,i)=>vector(q.dots[1][i],[P,v]));}
 if(q.id===3){const P=x['imposed top-consumer density'],z=H.cascade(P,x['resource carrying capacity K']);numeric('Resource=',z.resource);numeric('herbivore=',z.herbivore);numeric('top input=',z.top);vector(q.dots[1][0],[P,z.resource]);vector(q.dots[1][1],[P,z.herbivore]);}
 if(q.id===4){const K=x['resource carrying capacity K'],z=H.exploitation(K,+q.selections['maximum chain levels']);list('Equilibrium densities=',z.x);numeric('herbivore invasion K=',z.herbivoreBoundary);numeric('top invasion K=',z.topBoundary);z.x.forEach((v,i)=>vector(q.dots[1][i],[K,v]));}
 if(q.id===5){const a=x['competition coefficient a'],mode=q.selections['competition structure'],z=cached('community',[a,mode],()=>H.competitionRun(a,mode)),p=H.interpolate(z.rows,x['selected time']);if(z.equilibrium===null)numeric('Interior candidate=',null);else list('Interior candidate=',z.equilibrium);assert.ok(q.read.includes('status: '+z.status),label+' ecological status');modelChecks++;list('selected x,y=',p);vector(q.dots[0][0],p);if(z.feasible)vector(q.dots[0][1],z.equilibrium);spectrum(q.dots[1],z.eigen);}
 if(q.id===6){const args={S:x['species count S'],C:x['off-diagonal inclusion probability C'],sigma:x['interaction standard deviation σ'],d:x['self-regulation d'],seed:x['random seed']},z=cached('may',args,()=>H.may(args));numeric('Rightmost real part=',z.abscissa);numeric('nominal disk radius=',z.radius);numeric('realized off-diagonal fraction=',z.density);assert.ok(q.read.includes('status: '+z.status));modelChecks++;spectrum(q.dots[1],z.eigen);}
 if(q.id===7){const C=x['off-diagonal inclusion probability C'],seed=x['random seed'],z=cached('base24',[C,seed],()=>H.randomBase(24,C,seed));numeric('local rightmost part=',-1+x['interaction standard deviation σ']*z.abscissa);numeric('aggregate CV=',H.insuranceFacts(24,x['response correlation ρ'],.2).aggregateCV);}
 if(q.id===8){const a=x['attack coefficient a'],z=cached('attack',[a],()=>H.attackRun(a)),p=H.interpolate(z.rows,x['selected time']);numeric('Jacobian trace=',z.trace);numeric('determinant=',z.det);numeric('attack boundary≈',z.boundary);list('late ranges=',z.ranges);vector(q.dots[0][0],z.equilibrium);vector(q.dots[0][1],p);vector(q.dots[1][0],[x['selected time'],p[0]]);}
 if(q.id===9){const z=cached('niche',[x['species count S'],x['target connectance C'],x['random seed']],()=>H.niche({S:x['species count S'],C:x['target connectance C'],seed:x['random seed']}));numeric('Realized connectance L/S²=',z.connectance);numeric('feeding links=',z.links);numeric('basal species=',z.basal);numeric('self-feeding links=',z.cannibalism);z.positions.forEach((n,i)=>vector(q.dots[0][i],[n,i]));}
 if(q.id===10){const args={S:x['species count S'],p:x['optional-link probability'],seed:x['random seed'],mode:q.selections['web construction']},z=cached('chain',args,()=>H.chainWeb(args));numeric('Feeding links=',z.links);numeric('connectance L/S²=',z.connectance);numeric('longest chain=',z.longest);numeric('mean trophic level=',z.meanLevel);z.levels.forEach((v,i)=>vector(q.dots[1][i],[i,v]));}
 if(q.id===11){const b=x['top consumer attack on basal resource'],z=cached('omnivory',[b],()=>H.omnivory(b)),p=H.interpolate(z.rows,x['selected time']);list('Selected R,N,P=',p);list('endpoint R,N,P=',z.endpoint);vector(q.dots[0][0],[x['selected time'],p[0]]);vector(q.dots[1][0],[p[0],p[1]]);}
 if(q.id===12){const S=x['species count S'],rho=x['response correlation ρ'],cv=x['individual production CV'],z=cached('insurance',[S,rho,cv],()=>H.insurance(S,rho,cv)),p=H.production(S,rho,cv,x['phase in environmental period']),average=H.sum(p)/S;numeric('Exact aggregate CV=',z.aggregateCV);numeric('period-grid CV=',z.measuredCV);numeric('individual CV=',cv);numeric('selected mean production=',average);vector(q.dots[0][0],[x['phase in environmental period'],average]);vector(q.dots[1][0],[S,z.aggregateCV]);}
 if(q.id===13){const args={pressure:x['predator pressure during removal'],restore:q.state.parts.find(([k])=>k.startsWith('toggle:'))[1],returnTime:x['predator restoration time']},z=cached('space',args,()=>H.spaceRun(args)),p=H.interpolate(z.rows,x['selected time']);list('Selected coverages=',p);numeric('free space=',1-H.sum(p));assert.ok(q.read.includes('predator restored='+(args.restore?'yes':'no')));modelChecks++;vector(q.dots[0][0],[x['selected time'],p[0]]);}
 if(q.id===14){const args={S:x['species count S'],C:x['off-diagonal inclusion probability C'],trials:x['Monte Carlo trials'],seed:x['random seed']},base=cached('ensemble',args,()=>H.ensemble(args)),z=H.ensembleAt(base,x['interaction standard deviation σ'],x['self-regulation d']);for(const k of ['stable','unstable','trials'])numeric(k==='stable'?'Stable=':k+'=',k==='trials'?base.trials:z[k]);numeric('numerically unresolved=',z.unresolved);numeric('stable fraction=',z.fraction);list('nominal Wilson interval=[',z.interval);vector(q.dots[0][0],[x['interaction standard deviation σ'],z.fraction]);base.abscissae.forEach((a,i)=>vector(q.dots[1][i],[a,(i+.5)/base.trials]));}
}

async function open(id,theme,width,url){
 errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/ecol-6.${id}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__ecolRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme,'actual production theme');return check(`${id}/${theme}/${width}`);
}
async function replay(id,theme,width,label){
 const before=await check(label+' before share');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();
 await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const url=await page.locator('.share-url').inputValue();assert.ok(url.includes(`#/t/ecol-6.${id}?s=`));
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
 const after=await open(id,theme,width,stateURL(base,`ecol-6.${id}`,bad));
 assert.deepEqual(after.state.parts,baseState.parts,label+' reject out-of-domain state');
 assert.match(await page.locator('.share-status').innerText(),/could not|invalid|saved|restor/i);invalidReplays++;
 const rawIndex=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.findIndex(e=>e.getAttribute('step')==='any'));
 if(rawIndex<0)return;
 const rawKey=baseState.parts.filter(([k])=>k.startsWith('slider:'))[rawIndex][0];
 const raw=structuredClone(baseState),part=raw.parts.find(([k])=>k===rawKey),bounds=await page.locator('#viz .ctl-slider input').nth(rawIndex).evaluate(e=>({min:+e.min,max:+e.max})),delta=.0000123456789;part[1]+=part[1]+delta<=bounds.max?delta:-delta;assert.ok(part[1]>=bounds.min&&part[1]<=bounds.max);
 const q=await open(id,theme,width,stateURL(base,`ecol-6.${id}`,raw));assert.equal(q.state.parts.find(([k])=>k===rawKey)[1],part[1]);rawReplays++;
 await replay(id,theme,width,label+' raw fractional state');
 const cases=id===1?[{'diet fraction recycled from top consumer':1-2**-52},{'diet fraction recycled from top consumer':1}]:id===5?[{'competition coefficient a':1-2**-52},{'competition coefficient a':1},{'competition coefficient a':1+2**-52}]:id===13?[{'predator restoration time':50.1234567}]:[];
 let criticalIndex=0;for(const values of cases){const special=structuredClone(baseState);for(const[name,value]of Object.entries(values))special.parts.find(([k])=>k.startsWith('slider:'+name+':'))[1]=value;await open(id,theme,width,stateURL(base,`ecol-6.${id}`,special));await replay(id,theme,width,label+' exact critical '+JSON.stringify(values));if(width===320)await page.locator('#viz').screenshot({path:`${dir}/${label}-critical-${criticalIndex++}.png`});}
 if(id===5){await open(id,theme,width);await page.getByRole('group',{name:'competition structure',exact:true}).getByRole('button',{name:'asymmetric',exact:true}).click();actions++;const special=(await check(label+' asymmetric')).state;special.parts.find(([k])=>k.startsWith('slider:competition coefficient a:'))[1]=2;await open(id,theme,width,stateURL(base,`ecol-6.${id}`,special));await replay(id,theme,width,label+' missing interior equilibrium');}



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
 const ids=process.argv.slice(2).length?process.argv.slice(2).map(Number):Array.from({length:14},(_,i)=>i+1);
 for(const id of ids)for(const theme of ['light','dark'])for(const width of [1200,320]){
  const label=`6.${id}-${theme}-${width}`;await open(id,theme,width);await screenshot(`${dir}/${label}-default.png`);await page.screenshot({path:`${dir}/${label}-full.png`,fullPage:true});if(!process.env.ECOL_DEFAULTS_ONLY)await controls(id,theme,width,label);await savedStates(id,theme,width,label);layouts++;fs.writeFileSync(`${dir}/progress.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks},null,2));console.log('PASS',label,{actions,replays,checks,modelChecks});
 }
 fs.writeFileSync(`${dir}/result.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks},null,2));console.log(JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
