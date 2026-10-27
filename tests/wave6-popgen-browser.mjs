// Production routes, native controls, rich-text bounds and actual state-link replay.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
import * as H from '../content/popgen/ch06.shared.js';
const dir=process.env.POPGEN_SHOTS||'/tmp/wave6-popgen-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true});
let actions=0,replays=0,checks=0,layouts=0,invalidReplays=0,rawReplays=0,modelChecks=0;const errors=[];
const page=await browser.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route('**/assets/js/viz/core.js',async route=>{
 let src=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
 const needle='try { vizFn(instance.api); }';assert.ok(src.includes(needle));
 src=src.replace(needle,`window.__popgenRuntime=instance;
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
 await page.evaluate(async()=>{await document.fonts.ready;window.__popgenRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const q=await page.evaluate(()=>{
  const rt=window.__popgenRuntime,issues=[],points=[];
  for(const s of rt.stages)for(const p of s.__points){if(!p||!Number.isFinite(p[0])||!Number.isFinite(p[1]))issues.push({nonfinite:p});else points.push({x:s.X(p[0]),y:s.Y(p[1]),W:s.W,H:s.H});}
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout')){
   const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1))issues.push({text:n.textContent,left:r.left,right:r.right,container:[left,right]});}
  }
  const ranges=[...document.querySelectorAll('#viz input[type=range]')],state=rt.state.capture(),sliderParts=state.parts.filter(([k])=>k.startsWith('slider:'));
  return {issues,points,state,paths:rt.stages.map(s=>s.__paths),dots:rt.stages.map(s=>s.__dots),id:Number(location.hash.match(/popgen-6\.(\d+)/)?.[1]),selections:Object.fromEntries([...document.querySelectorAll('#viz .seg')].map(e=>[e.getAttribute('aria-label'),e.querySelector('button.on')?.textContent])),read:document.querySelector('.viz-readout')?.textContent,errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,sliders:sliderParts.map(([k,v],i)=>({key:k,model:v,dom:+ranges[i].value,output:ranges[i].closest('.ctl-slider').querySelector('output').textContent}))};
 });
 if(q.overflow>1||q.issues.length){fs.writeFileSync(`${dir}/failure.json`,JSON.stringify({label,...q},null,2));await page.screenshot({path:`${dir}/failure.png`,fullPage:true});}
 assert.deepEqual(errors,[],label+' page errors');assert.deepEqual(q.errors,[],label+' visualization errors');assert.equal(q.tex,0,label+' TeX');assert.ok(q.overflow<=1,label+' viewport overflow');assert.deepEqual(q.issues,[],label+' rich text / finite geometry');assert.ok(q.read?.length,label+' readout');assert.doesNotMatch(q.read,/NaN|Infinity|\[object Object\]/,label);
 for(const p of q.points)assert.ok(p.x>=-1&&p.x<=p.W+1&&p.y>=-1&&p.y<=p.H+1,label+' geometry outside canvas '+JSON.stringify(p));
 for(const s of q.sliders){assert.ok(Math.abs(s.model-s.dom)<=16*Number.EPSILON*Math.max(1,Math.abs(s.model)),label+' slider state mismatch '+JSON.stringify(s));assert.ok(Math.abs(Number(s.output)-s.model)<=5.1e-5*Math.abs(s.model)+Number.MIN_VALUE,label+' slider output hides its value '+JSON.stringify(s));}
 assertModel(q,label);checks++;return q;
}
function assertModel(q,label){
 const x=Object.fromEntries(q.sliders.map(s=>[s.key.slice(7,s.key.lastIndexOf(':')),s.model]));
 const numeric=(prefix,expected,absolute=1e-13)=>{const tail=q.read.split(prefix)[1];assert.ok(tail!==undefined,label+' missing '+prefix);if(expected===null)assert.ok(tail.startsWith('not defined'),label+' undefined '+prefix);else{const a=tail.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);assert.ok(a,label+' numeric '+prefix);assert.ok(Math.abs(Number(a[0])-expected)<=5.1e-5*Math.abs(expected)+absolute,label+' value '+prefix+tail+' versus '+expected);}modelChecks++;};
 if(q.id===1){numeric('Single-copy survival root=',H.survival(x['per-copy advantage s']));numeric('eventual survival from k copies=',H.manySurvival(x['per-copy advantage s'],x['initial copies']));const z=H.branching({s:x['per-copy advantage s'],k:x['initial copies'],seed:x['random seed'],generations:x['generation horizon']});assert.ok(q.read.includes(`${z.extinct} extinct; ${z.censored} crossed`),label+' actual observed paths');modelChecks++;}
 if(q.id===2){const s=x['selected advantage s'];numeric('Exact establishment probability=',H.survival(s));numeric('2s=',2*s);numeric('relative approximation error=',s>0?(2*s-H.survival(s))/H.survival(s):null);}
 if(q.id===3){const N=x['diploid size N = Nₑ'],s=x['per-copy advantage s'],p=x['initial frequency p'],z=H.finiteWF(N,s);numeric('Diffusion u(p)=',H.fixation(p,N,s));numeric('exact one-copy fixation=',z.u[1]);}
 if(q.id===4){const N=x['effective size Nₑ'],s=x['selected coefficient s'];numeric('4Nₑs=',4*N*s);numeric('fixation / neutral=',H.fixation(.2,N,s)/.2);}
 if(q.id===5){const z=H.nearly(10**x['log₁₀ reference size N = Nₑ'],x['deleterious effect scale'],x['strictly neutral fraction']);numeric('total k/μ=',z.rate);}
 if(q.id===6){const z=H.barrier(x['effective size Nₑ'],x['benefit scale A'],x['available progress step δ'],x['current progress x']);numeric('Next-step advantage=',z.gain);numeric('4Nₑ × advantage=',z.scaled);numeric('crossing progress x*=',z.threshold);numeric('fixation / neutral=',z.relative);}
 if(q.id===7){const N=x['diploid size N'],s=x['per-copy advantage s'],z=H.finiteWF(N,s),t=H.sweep(N,s);numeric('Conditional fixation time from one copy=',z.conditional[1]);numeric('leading-log rule=',t.rule);numeric('exact deterministic endpoint passage=',t.discrete);}
 if(q.id===8){const z=H.origin(10**x['log₁₀ census N = Nₑ'],x['beneficial mutation rate μ'],x['per-copy advantage s']);numeric('Origin–fixation rate=',z.rate);numeric('mean waiting time=',z.waiting);numeric('rate × sweep-time rule=',z.overlap);}
 if(q.id===9){const z=H.dfe(10**x['log₁₀ size N = Nₑ'],x['effect scale a'],x['beneficial fraction'],x['strictly neutral fraction']);numeric('Mean new effect=',z.mean);numeric('mean fixed effect=',z.meanFixed);numeric('fixed fractions sum=',H.sum(z.fixed));}
 if(q.id===10){const z=H.clones({N:x['haploid census N'],a:x['clone A log-fitness gain'],b:x['clone B log-fitness gain'],arrival:x['clone B arrival generation'],recombination:x['recombination fraction'],seed:x['random seed']}),row=z.frames[x['selected generation']];assert.ok(q.read.includes('['+row.join(', ')+']'),label+' actual integer clone state');numeric('total=',H.sum(row));modelChecks++;}
 if(q.id===11){const z=H.ratchet({N:x['haploid census N'],U:x['deleterious input U'],s:x['per-mutation cost s'],seed:x['random seed']}),at=z.summary[x['selected generation']];numeric('Least load=',at.min);numeric('mean load=',at.mean);numeric('deterministic equilibrium mean U/s=',z.equilibriumMean);numeric('reference N exp(−U/s)=',z.zeroClass);}
 if(q.id===12){const z=H.rescue({N0:10**x['log₁₀ initial residents N₀'],d:x['resident decline rate d'],g:x['absolute mutant excess g'],mu:x['new-mutation rate μ'],k:x['initial mutant copies'],t:x['selected generation']});numeric('Single-lineage establishment=',z.rho);numeric('standing-copy rescue=',z.stand);numeric('rescue from new origins by selected time=',z.newByT);numeric('eventual combined rescue=',z.total);numeric('conditional standing-lineage total=',z.conditionalTotal);}
 if(q.id===13){numeric('Finite-generation extinction qₜ=',H.extinction(x['per-copy advantage s'],x['generating-function iterations']));numeric('exact Poisson survival=',H.survival(x['per-copy advantage s']));}
}

async function open(id,theme,width,url){
 errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/popgen-6.${id}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__popgenRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme,'actual production theme');return check(`${id}/${theme}/${width}`);
}
async function replay(id,theme,width,label){
 const before=await check(label+' before share');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();
 await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const url=await page.locator('.share-url').inputValue();assert.ok(url.includes(`#/t/popgen-6.${id}?s=`));
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
 const after=await open(id,theme,width,stateURL(base,`popgen-6.${id}`,bad));
 assert.deepEqual(after.state.parts,baseState.parts,label+' reject out-of-domain state');
 assert.match(await page.locator('.share-status').innerText(),/could not|invalid|saved|restor/i);invalidReplays++;
 const rawIndex=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.findIndex(e=>e.getAttribute('step')==='any'));
 if(rawIndex<0)return;
 const rawKey=baseState.parts.filter(([k])=>k.startsWith('slider:'))[rawIndex][0];
 const raw=structuredClone(baseState),part=raw.parts.find(([k])=>k===rawKey);part[1]+=.0000123456789;
 const q=await open(id,theme,width,stateURL(base,`popgen-6.${id}`,raw));assert.equal(q.state.parts.find(([k])=>k===rawKey)[1],part[1]);rawReplays++;
 await replay(id,theme,width,label+' raw fractional state');


}
async function controls(id,theme,width,label){
 const seen=new Set();async function sliders(){const names=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));
 for(const name of names){const el=page.getByRole('slider',{name,exact:true});if(seen.has(name)||!await el.isVisible())continue;seen.add(name);for(const key of ['Home','End']){await el.press(key);actions++;await check(label+' '+name+' '+key);}await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();await page.mouse.click(b.x+.37*b.width,b.y+b.height/2);actions++;await check(label+' native drag '+name);await replay(id,theme,width,label+' '+name);}}
 await sliders();
 const groups=await page.locator('#viz .seg').evaluateAll(es=>es.map(e=>[e.getAttribute('aria-label'),[...e.querySelectorAll('button')].map(b=>b.textContent)]));
 for(const [name,options]of groups)for(const option of options){await page.getByRole('group',{name,exact:true}).getByRole('button',{name:option,exact:true}).click();actions++;await check(label+' '+option);await sliders();await replay(id,theme,width,label+' '+option);await page.locator('#viz').screenshot({path:`${dir}/${label}-mode-${option.replace(/[^a-z0-9]/gi,'_')}.png`});}
 const toggles=await page.locator('#viz .ctl-toggle').count();for(let i=0;i<toggles;i++)for(let j=0;j<2;j++){await page.locator('#viz .ctl-toggle').nth(i).locator('label').click();actions++;await check(label+' toggle');await replay(id,theme,width,label+' toggle');await page.locator('#viz').screenshot({path:`${dir}/${label}-toggle${i}-${j}.png`});}
}
try{
 const ids=process.argv.slice(2).length?process.argv.slice(2).map(Number):Array.from({length:13},(_,i)=>i+1);
 for(const id of ids)for(const theme of ['light','dark'])for(const width of [1200,320]){
  const label=`6.${id}-${theme}-${width}`;await open(id,theme,width);await screenshot(`${dir}/${label}-default.png`);await page.screenshot({path:`${dir}/${label}-full.png`,fullPage:true});if(!process.env.POPGEN_DEFAULTS_ONLY)await controls(id,theme,width,label);await savedStates(id,theme,width,label);layouts++;console.log('PASS',label,{actions,replays,checks});
 }
 fs.writeFileSync(`${dir}/result.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks},null,2));console.log(JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
