// Production routes, native controls, rich-text bounds and actual state-link replay.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
import * as H from '../content/bioinf/ch06.shared.js';
const dir=process.env.BIOINF_SHOTS||'/tmp/wave6-bioinf-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true});
let actions=0,replays=0,checks=0,layouts=0,invalidReplays=0,rawReplays=0,modelChecks=0;const errors=[];
const page=await browser.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route('**/assets/js/viz/core.js',async route=>{
 let src=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
 const needle='try { vizFn(instance.api); }';assert.ok(src.includes(needle));
 src=src.replace(needle,`window.__bioinfRuntime=instance;
 const oldStage=instance.api.stage;
 instance.api.stage=(...args)=>{const s=oldStage(...args),begin=s.begin.bind(s);s.__points=[];
 s.begin=(...a)=>{s.__points=[];return begin(...a);};
 s.__paths=[];s.__dots=[];s.__glyphs=[];s.__radii=[];const reset=s.begin;s.begin=(...a)=>{s.__paths=[];s.__dots=[];s.__glyphs=[];s.__radii=[];return reset(...a);};
 const text=s.textPx.bind(s);s.textPx=(str,X,Y,st={})=>{const c=s.ctx;c.save();c.font=s._font(st);c.textAlign=st.align||'left';c.textBaseline=st.baseline||'middle';const m=c.measureText(String(str));s.__glyphs.push({text:String(str),l:X+(st.dx||0)-m.actualBoundingBoxLeft,r:X+(st.dx||0)+m.actualBoundingBoxRight,t:Y+(st.dy||0)-m.actualBoundingBoxAscent,b:Y+(st.dy||0)+m.actualBoundingBoxDescent,W:s.W,H:s.H});c.restore();return text(str,X,Y,st);};
 for(const name of ['path','dot','line','arrow']){const old=s[name].bind(s);s[name]=(...a)=>{if(name==='path'){s.__points.push(...a[0]);s.__paths.push(a[0]);}else if(name==='dot'){s.__points.push([a[0],a[1]]);s.__dots.push([a[0],a[1]]);s.__radii.push({x:s.X(a[0]),y:s.Y(a[1]),r:(a[2]?.r??4)+1,W:s.W,H:s.H});}else s.__points.push([a[0],a[1]],[a[2],a[3]]);return old(...a);};}
 return s;};
 ${needle}`);
 await route.fulfill({contentType:'text/javascript',body:src});
});
async function check(label){
 await page.locator('#viz').scrollIntoViewIfNeeded();
 await page.evaluate(async()=>{await document.fonts.ready;window.__bioinfRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const q=await page.evaluate(()=>{
  const rt=window.__bioinfRuntime,issues=[],points=[];
  for(const s of rt.stages)for(const p of s.__points){if(!p||!Number.isFinite(p[0])||!Number.isFinite(p[1]))issues.push({nonfinite:p});else points.push({x:s.X(p[0]),y:s.Y(p[1]),W:s.W,H:s.H});}
  for(const s of rt.stages)for(const el of s.overlay.querySelectorAll('.tex-label')){if(getComputedStyle(el).display==='none')continue;const b=el.getBoundingClientRect(),p=s.overlay.getBoundingClientRect();if(b.width>0&&(b.left<p.left-1||b.right>p.right+1||b.top<p.top-1||b.bottom>p.bottom+1))issues.push({overlay:el.textContent,bounds:[b.left-p.left,b.top-p.top,b.right-p.left,b.bottom-p.top],canvas:[p.width,p.height]});const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement.closest('.katex-mathml,annotation'))continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>1&&(r.left<p.left-1||r.right>p.right+1||r.top<p.top-1||r.bottom>p.bottom+1))issues.push({overlayGlyph:n.textContent,bounds:[r.left-p.left,r.top-p.top,r.right-p.left,r.bottom-p.top],canvas:[p.width,p.height]});}}
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout')){
   const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1))issues.push({text:n.textContent,left:r.left,right:r.right,container:[left,right]});}
  }
  const ranges=[...document.querySelectorAll('#viz input[type=range]')],state=rt.state.capture(),sliderParts=state.parts.filter(([k])=>k.startsWith('slider:'));
  return {glyphs:rt.stages.flatMap(s=>s.__glyphs),radii:rt.stages.flatMap(s=>s.__radii),issues,points,state,paths:rt.stages.map(s=>s.__paths),dots:rt.stages.map(s=>s.__dots),id:Number(location.hash.match(/bioinf-6\.(\d+)/)?.[1]),selections:Object.fromEntries([...document.querySelectorAll('#viz .seg')].map(e=>[e.getAttribute('aria-label'),e.querySelector('button.on')?.textContent])),read:document.querySelector('.viz-readout')?.textContent,errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,sliders:sliderParts.map(([k,v],i)=>({key:k,model:v,dom:+ranges[i].value,output:ranges[i].closest('.ctl-slider').querySelector('output').textContent}))};
 });
 if(q.overflow>1||q.issues.length){fs.writeFileSync(`${dir}/failure.json`,JSON.stringify({label,...q},null,2));await page.screenshot({path:`${dir}/failure.png`,fullPage:true});}
 assert.deepEqual(errors,[],label+' page errors');assert.deepEqual(q.errors,[],label+' visualization errors');assert.equal(q.tex,0,label+' TeX');assert.ok(q.overflow<=1,label+' viewport overflow');assert.deepEqual(q.issues,[],label+' rich text / finite geometry');assert.ok(q.read?.length,label+' readout');assert.doesNotMatch(q.read,/NaN|Infinity|\[object Object\]/,label);
 for(const g of q.glyphs)assert.ok(g.l>=-1&&g.r<=g.W+1&&g.t>=-1&&g.b<=g.H+1,label+' glyph outside canvas '+JSON.stringify(g));
 for(const p of q.radii)assert.ok(p.x-p.r>=-1&&p.x+p.r<=p.W+1&&p.y-p.r>=-1&&p.y+p.r<=p.H+1,label+' marker outside canvas '+JSON.stringify(p));
 for(const p of q.points)assert.ok(p.x>=-1&&p.x<=p.W+1&&p.y>=-1&&p.y<=p.H+1,label+' geometry outside canvas '+JSON.stringify(p));
 for(const s of q.sliders){assert.ok(Math.abs(s.model-s.dom)<=16*Number.EPSILON*Math.max(1,Math.abs(s.model)),label+' slider state mismatch '+JSON.stringify(s));assert.ok(Math.abs(Number(s.output)-s.model)<=5.1e-5*Math.abs(s.model)+Number.MIN_VALUE,label+' slider output hides its value '+JSON.stringify(s));}
 try{assertModel(q,label);}catch(e){fs.writeFileSync(`${dir}/failure.json`,JSON.stringify({label,...q},null,2));await page.screenshot({path:`${dir}/failure.png`,fullPage:true});throw e;}checks++;return q;
}
const modelCache=new Map();
function cached(name,args,fn){const key=name+JSON.stringify(args);if(!modelCache.has(key))modelCache.set(key,fn());return modelCache.get(key);}
function assertModel(q,label){
 const x=Object.fromEntries(q.sliders.map(s=>[s.key.slice(7,s.key.lastIndexOf(':')),s.model])),sel=q.selections;
 const numeric=(prefix,expected)=>{const tail=q.read.split(prefix)[1];assert.ok(tail!==undefined,label+' missing '+prefix);if(expected===null)assert.ok(tail.startsWith('not defined'),label);else{const a=tail.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);assert.ok(a,label+' numeric '+tail);assert.ok(Math.abs(+a[0]-expected)<=5.1e-5*Math.abs(expected)+1e-12,label+' '+prefix+tail+' vs '+expected);}modelChecks++;};
 const vector=(a,b)=>{assert.equal(a.length,b.length);a.forEach((v,i)=>{assert.ok(Math.abs(v-b[i])<=3e-11*Math.max(1,Math.abs(b[i])),label+' plotted '+v+' vs '+b[i]);modelChecks++;});};
 const path=(stage,index,rows)=>{assert.ok(q.paths[stage][index],label+' missing path');assert.equal(q.paths[stage][index].length,rows.length);q.paths[stage][index].forEach((p,i)=>vector(p,rows[i]));};
 const dots=(stage,rows)=>{assert.equal(q.dots[stage].length,rows.length);q.dots[stage].forEach((p,i)=>vector(p,rows[i]));};
 if(q.id===1){const d=x['common edge length [substitutions/site]'],obs=['A','B','C','D'].map(t=>H.DNA.indexOf(sel[t+' observed base'])),z=H.enumerate(H.quartet({topology:H.SPLITS.indexOf(sel['quartet split']),pendants:Array(4).fill(d),internal:2*d}),obs),h=z.records[x['ancestral assignment']];if(z.logL===-Infinity)assert.ok(q.read.includes('Column likelihood=zero'));else numeric('log likelihood=',z.logL);if(h.posterior===0&&h.logJoint!==-Infinity)assert.ok(q.read.includes('conditional weight=positive below binary64 range'));else numeric('conditional weight=',h.posterior);}
 if(q.id===2){const n=x.taxa,obs=Array.from({length:n},(_,i)=>sel['tip pattern']==='all A'?0:i%4),z=H.prune(H.teachingTree(n,x['edge length [substitutions/site]'],sel['tree shape']),obs),id=z.order[Math.min(z.order.length-1,Math.floor(x['postorder progress']*z.order.length))];numeric('Selected node=',id);numeric('Actual transition terms=',z.terms);numeric('log scaling factor=',H.scaledVector(z.vectors[id]).logScale);}
 if(q.id===3){const model=sel['substitution family']==='reversible equal-input'?'equal-input':'cycle',opts={model,pA:x['stationary frequency of A'],cycle:x['cycle imbalance']},t=H.SPLITS.indexOf(sel['quartet split']),rows=H.lin(81,0,1).map(u=>[u,H.prune(H.quartet({topology:t,internal:x['internal edge [substitutions/site]'],rootFraction:u}),[0,1,2,0],opts).logL]),z=H.prune(H.quartet({topology:t,internal:x['internal edge [substitutions/site]'],rootFraction:x['root position on internal edge']}),[0,1,2,0],opts);numeric('Selected log likelihood=',z.logL);path(1,0,rows);dots(1,[[x['root position on internal edge'],z.logL]]);}
 if(q.id===4){const z=cached('rates',x,()=>H.gammaStudy({shape:x['Gamma shape α'],d:x['total pair path [substitutions/site]'],N:x['independent sites'],seed:x['data seed']}));numeric('Shared-rate expected match=',z.match);numeric('observed mismatch fraction=',z.observedMismatch);numeric('homogeneous JC length fitted to the population mismatch=',z.jcLength);numeric('Rate probability beyond the plotted range [0,4]=',z.tail);dots(1,[[z.d,1-z.observedMismatch]]);}
 if(q.id===5){const z=cached('boot',x,()=>H.bootstrap({N:x['alignment columns'],B:x['bootstrap replicates'],internal:x['generating internal edge'],dataSeed:x['data seed'],bootstrapSeed:x['resampling seed']})),k=Math.min(z.B-1,Math.floor(x['replicate position']*z.B));numeric('Replicate=',k+1);numeric('tied replicates=',z.counts[3]);assert.ok(q.read.includes('unique-clade counts AB, AC, BC='+z.counts.slice(0,3).join(', ')));assert.ok(q.read.includes('Selected raw mismatch split sums='+z.replicates[k].scores.join(', ')));}
 if(q.id===6){const z=cached('mcmc',x,()=>H.metropolis({N:x['alignment columns'],dataSeed:x['data seed'],priorRate:x['discrete prior decay'],chainSeed:x['chain seed'],steps:x['chain steps']})),r=H.chainSummary(z,x['chain prefix position'],x['burn fraction of full chain']);numeric('Prefix step=',r.k);numeric('retained states=',r.kept.length);numeric('accepted proposals=',r.acceptances);const rows=z.chain.slice(Math.max(0,r.k-119),r.k+1).map((a,i)=>[Math.max(0,r.k-119)+i,z.states[a.index].logL]);if(rows.length===1)rows.push([rows[0][0]+.5,rows[0][1]]);path(0,0,rows);}
 if(q.id===7){const z=cached('zone',x,()=>H.binaryStudy({long:x['A and C pendant flip probability'],short:x['B and D pendant flip probability'],internal:x['internal flip probability'],N:x['binary alignment sites'],seed:x['data seed']}));numeric('expected long-branch MP gap=',z.expectedMPGap);if(Number.isFinite(z.populationLLGap))numeric('Population profile log-likelihood gap=',z.populationLLGap);else assert.ok(q.read.includes('unbounded: alternative assigns zero probability'));for(const[stage,key]of[[0,'mpGap'],[1,'llGap']]){const rows=z.trace.map(r=>[r.n,r[key]]).filter(p=>Number.isFinite(p[1]));if(rows.length)path(stage,0,rows);}}
 if(q.id===8){const z=cached('genes',x,()=>H.geneTrees({tau:x['internal population length [2Ne generations]'],N:x['independent loci'],seed:x['genealogy seed']})),k=Math.min(z.N-1,Math.floor(x['selected locus position']*z.N)),g=z.genes[k];numeric('Selected locus=',k+1);numeric('first coalescence time=',g.first);numeric('root time=',g.root);vector(q.dots[0][0],[g.within?.75:1.5,g.first]);vector(q.dots[0][1],[1.5,g.root]);}
 if(q.id===9){const z=cached('paper',x,()=>{const data=H.alignment({N:x['synthetic alignment columns'],seed:x['data seed']});return{data,...H.profileQuartets(data.counts)};}),t=H.SPLITS.indexOf(sel['candidate split']),d=x['candidate internal edge'],k=Math.min(z.data.N-1,Math.floor(x['alignment site position']*z.data.N)),c=H.prune(H.quartet({topology:t,internal:d,rootFraction:x['candidate root fraction']}),z.data.columns[k]);numeric('Selected site log likelihood=',c.logL);numeric('selected alignment log likelihood=',H.logLikelihood(z.data.counts,H.mixtureLogs(z.tables[t],Math.exp(-4*d/3))));for(let j=0;j<3;j++)path(1,j,H.lin(101,0,2).map(d=>[d,H.logLikelihood(z.data.counts,H.mixtureLogs(z.tables[j],Math.exp(-4*d/3)))]));}
}

async function open(id,theme,width,url){
 errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/bioinf-6.${id}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__bioinfRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme,'actual production theme');return check(`${id}/${theme}/${width}`);
}
async function replay(id,theme,width,label){
 const before=await check(label+' before share');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();
 await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const url=await page.locator('.share-url').inputValue();assert.ok(url.includes(`#/t/bioinf-6.${id}?s=`));
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
 const after=await open(id,theme,width,stateURL(base,`bioinf-6.${id}`,bad));
 assert.deepEqual(after.state.parts,baseState.parts,label+' reject out-of-domain state');
 assert.match(await page.locator('.share-status').innerText(),/could not|invalid|saved|restor/i);invalidReplays++;
 const rawIndex=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.findIndex(e=>e.getAttribute('step')==='any'));
 if(rawIndex<0)return;
 const rawKey=baseState.parts.filter(([k])=>k.startsWith('slider:'))[rawIndex][0];
 const raw=structuredClone(baseState),part=raw.parts.find(([k])=>k===rawKey),bounds=await page.locator('#viz .ctl-slider input').nth(rawIndex).evaluate(e=>({min:+e.min,max:+e.max})),delta=.0000123456789;part[1]+=part[1]+delta<=bounds.max?delta:-delta;assert.ok(part[1]>=bounds.min&&part[1]<=bounds.max);
 const q=await open(id,theme,width,stateURL(base,`bioinf-6.${id}`,raw));assert.equal(q.state.parts.find(([k])=>k===rawKey)[1],part[1]);rawReplays++;
 await replay(id,theme,width,label+' raw fractional state');
 const cases={
 1:[{'common edge length [substitutions/site]':0},{'common edge length [substitutions/site]':Number.MIN_VALUE}],
 2:[{taxa:16,'@tree shape':'comb','edge length [substitutions/site]':0},{taxa:16,'@tree shape':'comb','edge length [substitutions/site]':Number.MIN_VALUE},{'@tip pattern':'all A','edge length [substitutions/site]':0}],
 3:[{'@substitution family':'nonreversible cycle','root position on internal edge':1,'internal edge [substitutions/site]':0},{'stationary frequency of A':.1,'root position on internal edge':0,'internal edge [substitutions/site]':Number.MIN_VALUE},{'@substitution family':'nonreversible cycle','@quartet split':'AC|BD'}],
 4:[{'Gamma shape α':.1,'total pair path [substitutions/site]':4,'independent sites':20},{'Gamma shape α':8,'total pair path [substitutions/site]':Number.MIN_VALUE}],
 5:[{'alignment columns':20,'bootstrap replicates':20,'generating internal edge':0,'replicate position':1},{'alignment columns':20,'bootstrap replicates':20,'generating internal edge':0,'replicate position':.425}],
 6:[{'chain prefix position':0,'burn fraction of full chain':.8},{'chain steps':100,'discrete prior decay':5,'chain prefix position':1}],
 7:[{'A and C pendant flip probability':0,'B and D pendant flip probability':0,'internal flip probability':.1},{'internal flip probability':0},{'A and C pendant flip probability':Number.MIN_VALUE,'B and D pendant flip probability':0,'internal flip probability':Number.MIN_VALUE}],
 8:[{'internal population length [2Ne generations]':0,'independent loci':20},{'internal population length [2Ne generations]':4,'independent loci':1000,'selected locus position':1}],
 9:[{'candidate internal edge':0,'candidate root fraction':0,'alignment site position':1},{'candidate internal edge':Number.MIN_VALUE,'candidate root fraction':1}]
 }[id];
 let criticalIndex=0;for(const values of cases){const special=structuredClone(baseState);for(const[name,value]of Object.entries(values)){const part=special.parts.find(([k])=>k.startsWith((name.startsWith('@')?'select:'+name.slice(1):'slider:'+name)+':'));if(name.startsWith('@')){const index=part[1][1].indexOf(value);assert.ok(index>=0,'known mode');part[1][0]=index;}else part[1]=value;}const actual=await open(id,theme,width,stateURL(base,`bioinf-6.${id}`,special));assert.deepEqual(actual.state.parts,special.parts,label+' exact intended critical state');await replay(id,theme,width,label+' exact critical '+JSON.stringify(values));if(width===320)await screenshot(`${dir}/${label}-critical-${criticalIndex++}.png`);}

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
 const ids=process.argv.slice(2).length?process.argv.slice(2).map(Number):Array.from({length:9},(_,i)=>i+1);
 for(const id of ids)for(const theme of ['light','dark'])for(const width of [1200,320]){
  const label=`6.${id}-${theme}-${width}`;if(process.env.BIOINF_AUDIT){try{await open(id,theme,width);if(process.env.BIOINF_AUDIT_CAPTURE){await screenshot(`${dir}/${label}-default.png`);await page.screenshot({path:`${dir}/${label}-full.png`,fullPage:true});}console.log('AUDIT PASS',label);}catch(e){console.log('AUDIT FAIL',label,e.message);await page.screenshot({path:`${dir}/${label}-audit-failure.png`,fullPage:true});}continue;}await open(id,theme,width);await screenshot(`${dir}/${label}-default.png`);await page.screenshot({path:`${dir}/${label}-full.png`,fullPage:true});if(!process.env.BIOINF_DEFAULTS_ONLY)await controls(id,theme,width,label);await savedStates(id,theme,width,label);layouts++;fs.writeFileSync(`${dir}/progress.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks},null,2));console.log('PASS',label,{actions,replays,checks,modelChecks});
 }
 fs.writeFileSync(`${dir}/result.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks},null,2));console.log(JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
