// Production routes, native controls, rich-text bounds and actual state-link replay.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
import * as H from '../content/sysbio/ch06.shared.js';
const dir=process.env.SYSBIO_SHOTS||'/tmp/wave6-sysbio-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true});
let actions=0,replays=0,checks=0,layouts=0,invalidReplays=0,rawReplays=0,modelChecks=0;const errors=[];
const page=await browser.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route('**/assets/js/viz/core.js',async route=>{
 let src=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
 const needle='try { vizFn(instance.api); }';assert.ok(src.includes(needle));
 src=src.replace(needle,`window.__sysbioRuntime=instance;
 const oldStage=instance.api.stage;
 instance.api.stage=(...args)=>{const s=oldStage(...args),begin=s.begin.bind(s);s.__points=[];
 s.begin=(...a)=>{s.__points=[];return begin(...a);};
 s.__paths=[];s.__dots=[];s.__glyphs=[];s.__radii=[];s.__rects=[];const reset=s.begin;s.begin=(...a)=>{s.__paths=[];s.__dots=[];s.__glyphs=[];s.__radii=[];s.__rects=[];return reset(...a);};
 const text=s.textPx.bind(s);s.textPx=(str,X,Y,st={})=>{const c=s.ctx;c.save();c.font=s._font(st);c.textAlign=st.align||'left';c.textBaseline=st.baseline||'middle';const m=c.measureText(String(str));s.__glyphs.push({text:String(str),l:X+(st.dx||0)-m.actualBoundingBoxLeft,r:X+(st.dx||0)+m.actualBoundingBoxRight,t:Y+(st.dy||0)-m.actualBoundingBoxAscent,b:Y+(st.dy||0)+m.actualBoundingBoxDescent,W:s.W,H:s.H});c.restore();return text(str,X,Y,st);};
 for(const name of ['path','dot','line','arrow','rect']){const old=s[name].bind(s);s[name]=(...a)=>{if(name==='path'){s.__points.push(...a[0]);s.__paths.push(a[0]);}else if(name==='dot'){s.__points.push([a[0],a[1]]);s.__dots.push([a[0],a[1]]);s.__radii.push({x:s.X(a[0]),y:s.Y(a[1]),r:(a[2]?.r??4)+1,W:s.W,H:s.H,g:s.o.gutter?s._m:{l:0,r:0,t:0,b:0}});}else{s.__points.push([a[0],a[1]],[a[2],a[3]]);if(name==='rect')s.__rects.push(a.slice(0,4));}return old(...a);};}
 return s;};
 ${needle}`);
 await route.fulfill({contentType:'text/javascript',body:src});
});
async function check(label){
 await page.locator('#viz').scrollIntoViewIfNeeded();
 await page.evaluate(async()=>{await document.fonts.ready;window.__sysbioRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const q=await page.evaluate(()=>{
  const rt=window.__sysbioRuntime,issues=[],points=[];
  for(const s of rt.stages)for(const p of s.__points){if(!p||!Number.isFinite(p[0])||!Number.isFinite(p[1]))issues.push({nonfinite:p});else points.push({x:s.X(p[0]),y:s.Y(p[1]),W:s.W,H:s.H});}
  for(const s of rt.stages)for(const el of s.overlay.querySelectorAll('.tex-label')){if(getComputedStyle(el).display==='none')continue;const b=el.getBoundingClientRect(),p=s.overlay.getBoundingClientRect();if(b.width>0&&(b.left<p.left-1||b.right>p.right+1||b.top<p.top-1||b.bottom>p.bottom+1))issues.push({overlay:el.textContent,bounds:[b.left-p.left,b.top-p.top,b.right-p.left,b.bottom-p.top],canvas:[p.width,p.height]});const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement.closest('.katex-mathml,annotation'))continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>1&&(r.left<p.left-1||r.right>p.right+1||r.top<p.top-1||r.bottom>p.bottom+1))issues.push({overlayGlyph:n.textContent,bounds:[r.left-p.left,r.top-p.top,r.right-p.left,r.bottom-p.top],canvas:[p.width,p.height]});}}
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout')){
   const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1||r.top<b.top-1||r.bottom>b.bottom+1))issues.push({text:n.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom,container:[left,b.top,right,b.bottom]});}
  }
  const ranges=[...document.querySelectorAll('#viz input[type=range]')],state=rt.state.capture(),sliderParts=state.parts.filter(([k])=>k.startsWith('slider:'));
  return {ticks:rt.stages.map(s=>s.o.yticks),rects:rt.stages.map(s=>s.__rects),labels:rt.stages.map(s=>[s.o.xlabel,s.o.ylabel]),glyphs:rt.stages.flatMap(s=>s.__glyphs),radii:rt.stages.flatMap(s=>s.__radii),issues,points,state,paths:rt.stages.map(s=>s.__paths),dots:rt.stages.map(s=>s.__dots),id:Number(location.hash.match(/sysbio-6\.(\d+)/)?.[1]),selections:Object.fromEntries([...document.querySelectorAll('#viz .seg')].map(e=>[e.getAttribute('aria-label'),e.querySelector('button.on')?.textContent])),read:document.querySelector('.viz-readout')?.textContent,errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,sliders:sliderParts.map(([k,v],i)=>({key:k,model:v,dom:+ranges[i].value,output:ranges[i].closest('.ctl-slider').querySelector('output').textContent}))};
 });
 if(q.overflow>1||q.issues.length){fs.writeFileSync(`${dir}/failure.json`,JSON.stringify({label,...q},null,2));await page.screenshot({path:`${dir}/failure.png`,fullPage:true});}
 assert.deepEqual(errors,[],label+' page errors');assert.deepEqual(q.errors,[],label+' visualization errors');assert.equal(q.tex,0,label+' TeX');assert.ok(q.overflow<=1,label+' viewport overflow');assert.deepEqual(q.issues,[],label+' rich text / finite geometry');assert.ok(q.read?.length,label+' readout');assert.doesNotMatch(q.read,/NaN|Infinity|\[object Object\]/,label);
 for(const g of q.glyphs)assert.ok(g.l>=-1&&g.r<=g.W+1&&g.t>=-1&&g.b<=g.H+1,label+' glyph outside canvas '+JSON.stringify(g));
 for(const p of q.radii)assert.ok(p.x-p.r>=p.g.l-1&&p.x+p.r<=p.W-p.g.r+1&&p.y-p.r>=p.g.t-1&&p.y+p.r<=p.H-p.g.b+1,label+' marker outside canvas '+JSON.stringify(p));
 for(const p of q.points)assert.ok(p.x>=-1&&p.x<=p.W+1&&p.y>=-1&&p.y<=p.H+1,label+' geometry outside canvas '+JSON.stringify(p));
 for(const s of q.sliders){assert.ok(Math.abs(s.model-s.dom)<=16*Number.EPSILON*Math.max(1,Math.abs(s.model)),label+' slider state mismatch '+JSON.stringify(s));assert.ok(Math.abs(Number(s.output)-s.model)<=5.1e-5*Math.abs(s.model)+Number.MIN_VALUE,label+' slider output hides its value '+JSON.stringify(s));}
 try{assertModel(q,label);}catch(e){fs.writeFileSync(`${dir}/failure.json`,JSON.stringify({label,...q},null,2));await page.screenshot({path:`${dir}/failure.png`,fullPage:true});throw e;}checks++;return q;
}
const modelCache=new Map();
function cached(name,args,fn){const key=name+JSON.stringify(args);if(!modelCache.has(key))modelCache.set(key,fn());return modelCache.get(key);}
function assertModel(q,label){
 const x=Object.fromEntries(q.sliders.map(s=>[s.key.slice(7,s.key.lastIndexOf(':')),s.model])),sel=q.selections;
 const number=(tail,value,abs=1e-12)=>{assert.ok(tail!==undefined,label+' missing text');if(value===null)assert.ok(tail.startsWith('not defined'),label);else{const m=tail.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);assert.ok(m,label+' numeric '+tail);assert.ok(Math.abs(+m[0]-value)<=5.1e-5*Math.abs(value)+abs,label+' '+tail+' vs '+value);}modelChecks++;};
 const numeric=(prefix,value,abs)=>number(q.read.split(prefix)[1],value,abs),metric=(prefix,value)=>{const tail=q.read.split(prefix)[1];assert.ok(tail!==undefined,label+' missing '+prefix);if(['positive','zero'].includes(value.status))number(tail,value.value);else{assert.ok(tail.startsWith(value.status),label+' metric status');number(tail.split('natural log=')[1],value.log);}};
 const vector=(a,b)=>{assert.equal(a.length,b.length);a.forEach((v,i)=>{assert.ok(Number.isFinite(v)&&Math.abs(v-b[i])<=3e-10*Math.max(1,Math.abs(b[i])),label+' plotted '+v+' vs '+b[i]);modelChecks++;});};
 const path=(stage,index,rows)=>{assert.ok(q.paths[stage][index],label+' missing path');assert.equal(q.paths[stage][index].length,rows.length);q.paths[stage][index].forEach((p,i)=>vector(p,rows[i]));};
 const cachedModel=(name,args,fn)=>cached(name,args,fn);
 if(q.id===1){const z=H.proofreading({n:x['extra checkpoints'],selectivity:x['wrong / correct off-rate'],advance:x['forward activation [1/s]'],affinity:x['fuel affinity [kBT per activation]']}),j=Math.min(z.n,Math.floor(x['selected checkpoint position']*(z.n+1)));numeric('Wrong/right reporter ratio=',z.error);numeric('Free enzyme=',z.free);numeric('selected R concentration=',z.bound[0][j]);numeric('selected W concentration=',z.bound[1][j]);numeric('reverse activation=',z.reverse);numeric('rare reporter rate=',z.reporterRate);metric('net fuel rate=',z.fuel);z.bound.forEach((r,i)=>path(1,i,r.map((y,x)=>[x,y])));}
 if(q.id===2){const args={n:x['highlighted extra checkpoints'],selectivity:x['wrong / correct off-rate'],advance:x['forward activation [1/s]'],affinity:x['fuel affinity [kBT per activation]']},z=H.proofreading(args);numeric('Selected error=',z.error);metric('Net fuel rate=',z.fuel);metric('chemical dissipation=',z.dissipation);metric('network work per rare reporter=',z.work);if(args.advance>0)for(let j=0;j<3;j++)path(0,j,H.lin(121,.001,30).map(affinity=>{const q=H.proofreading({...args,n:j+1,affinity});return[q.work.log/Math.LN10,Math.log10(q.error)];}));for(let j=0;j<4;j++)path(1,j,H.lin(121,-5,1).map(t=>[t,Math.log10(H.proofreading({...args,n:j,advance:10**t}).error)]));}
 if(q.id===3){const args={d:x['native mismatch d [length units]'],k:x['elastic stiffness [kBT / length²]'],gap:x['target geometry difference Δ'],background:x['nonspecific binding weight']},z=H.conformational(args),rows=H.lin(161,0,8).map(d=>H.conformational({...args,d})),max=Math.max(...rows.map(q=>q.logAdvantage)),scale=max<Math.log(1e-4)&&max!==-Infinity?Math.floor(max/Math.LN10)*Math.LN10:0;numeric('correct yield=',z.correct);numeric('wrong yield=',z.wrong);if(z.yieldOptimum.d!==null)numeric('Correct-yield optimum=',z.yieldOptimum.d);numeric('elastic penalty=',z.penalty);numeric('natural-log scale factor for the specificity panel=',scale);path(1,0,rows.map(q=>[q.d,q.logAdvantage===-Infinity?0:Math.exp(q.logAdvantage-scale)]));path(2,0,rows.map(q=>[q.d,q.correct]));}
 if(q.id===4){const z=H.acr({mode:sel['ACR example']==='stable equilibrium'?'stable':'unstable',total:x['conserved A + B [µM]'],a:x['first reaction coefficient'],b:x['second reaction coefficient']});numeric('ACR value A*=',z.threshold);numeric('selected phase drift=',z.drift(z.total*x['phase position A / total']));assert.ok(q.read.includes('positive equilibrium in selected class='+(z.positive?'yes':'no')));path(2,0,z.phase);}
 if(q.id===5){const args={sensor:x['sensor inventory [µM]'],regulator:x['regulator inventory [µM]'],signal:x['sensor input rate [1/s]'],architecture:sel['phosphatase architecture']},z=cachedModel('bifunctional',args,()=>H.bifunctional(args)),other=cachedModel('other',args,()=>H.bifunctional({...args,architecture:args.architecture==='bifunctional'?'separate phosphatase':'bifunctional'})),row=z.trace[Math.min(240,Math.floor(x['time position']*241))];numeric('Analytic equilibrium BP=',z.BP);numeric('Selected time=',row[0]);numeric('sensor total=',row[1]+row[2]);numeric('regulator total=',row[3]+row[4]);path(1,0,z.trace.map(r=>[r[0],r[4]]));path(1,1,z.trace.map(r=>[r[0],r[2]]));path(1,2,other.trace.map(r=>[r[0],r[4]]));}
 if(q.id===6){const names=['closed binding','driven cycle','broken chain','open multistability'],keys=['binding','cycle','chain','schloegl'],args={name:keys[names.indexOf(sel['reaction network'])],total:x['first inventory [µM]'],poolB:x['second binding inventory [µM]'],initial:x['initial allocation fraction'],T:x['observation duration [s]']},z=cachedModel('network',args,()=>H.networkExperiment(args));for(const[k,prefix]of[['n','Complexes='],['linkage','linkage classes='],['rank','stoichiometric rank='],['deficiency','deficiency=']])numeric(prefix,z[k]);z.species.forEach((_,j)=>path(1,j,z.trace.map(r=>[r[0],r[j+1]])));}
 if(q.id===7){assert.equal(q.ticks[0].length,5,label+' explicit pulse ticks');assert.equal(new Set(q.ticks[0].map(t=>t[1])).size,5,label+' distinguishable pulse tick labels');const args={n:x['cascade tiers'],alpha:x['activation coefficient [1/s]'],beta:x['deactivation rate [1/s]']},z=cachedModel('cascade',args,()=>H.cascade(args));numeric('plotted duration=',z.T);numeric('omitted phase-uniformization tail bound=',z.tail);for(let j=0;j<=args.n;j++)path(0,j,z.trace.map(r=>[r[0],r[j+1]]));assert.equal(q.labels[1][1],sel['summary quantity']==='area gain'?'log10(area gain)':'time [s]',label+' deterministic summary units');if(args.alpha>0){if(sel['summary quantity']==='area gain')path(1,0,z.metrics.map(q=>[q.tier,q.gain.log/Math.LN10]));else{path(1,0,z.metrics.map(q=>[q.tier,q.mean]));path(1,1,z.metrics.map(q=>[q.tier,q.sd]));}}}
 if(q.id===8){const args={ligand:x['free ligand [µM]'],Kd:x['binding Kd [µM]'],receptors:x['receptor inventory [µM]'],KE:x['downstream scale KE [µM]']},z=H.receptor(args);metric('Bound receptor=',z.boundMetric);metric('free receptor=',z.freeMetric);metric('absolute downstream response=',z.responseMetric);metric('response maximum=',z.maximumMetric);numeric('EC50 relative to that maximum=',z.EC50);metric('reduction from Kd=',z.shift);const rows=H.lin(161,-4,2).map(t=>H.receptor({...args,ligand:10**t}));path(0,0,rows.map(q=>[q.ligand,q.occupancy]));if(args.receptors>0){path(0,1,rows.map(q=>[q.ligand,q.normalized]));path(0,2,rows.map(q=>[q.ligand,q.response]));assert.equal(q.rects[1].length,3);}else{path(0,1,rows.map(q=>[q.ligand,q.response]));assert.equal(q.rects[1].length,0);}}
}

async function open(id,theme,width,url){
 errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/sysbio-6.${id}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__sysbioRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme,'actual production theme');return check(`${id}/${theme}/${width}`);
}
async function replay(id,theme,width,label){
 const before=await check(label+' before share');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();
 await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const url=await page.locator('.share-url').inputValue();assert.ok(url.includes(`#/t/sysbio-6.${id}?s=`));
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
 const after=await open(id,theme,width,stateURL(base,`sysbio-6.${id}`,bad));
 assert.deepEqual(after.state.parts,baseState.parts,label+' reject out-of-domain state');
 assert.match(await page.locator('.share-status').innerText(),/could not|invalid|saved|restor/i);invalidReplays++;
 const rawIndex=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.findIndex(e=>e.getAttribute('step')==='any'));
 if(rawIndex<0)return;
 const rawKey=baseState.parts.filter(([k])=>k.startsWith('slider:'))[rawIndex][0];
 const raw=structuredClone(baseState),part=raw.parts.find(([k])=>k===rawKey),bounds=await page.locator('#viz .ctl-slider input').nth(rawIndex).evaluate(e=>({min:+e.min,max:+e.max})),delta=.0000123456789;part[1]+=part[1]+delta<=bounds.max?delta:-delta;assert.ok(part[1]>=bounds.min&&part[1]<=bounds.max);
 const q=await open(id,theme,width,stateURL(base,`sysbio-6.${id}`,raw));assert.equal(q.state.parts.find(([k])=>k===rawKey)[1],part[1]);rawReplays++;
 await replay(id,theme,width,label+' raw fractional state');
 const cases={
 1:[{'extra checkpoints':0},{'extra checkpoints':4,'fuel affinity [kBT per activation]':0},{'extra checkpoints':4,'fuel affinity [kBT per activation]':Number.MIN_VALUE},{'extra checkpoints':4,'forward activation [1/s]':Number.MIN_VALUE,'fuel affinity [kBT per activation]':Number.MIN_VALUE}],
 2:[{'highlighted extra checkpoints':0,'forward activation [1/s]':0,'fuel affinity [kBT per activation]':0},{'highlighted extra checkpoints':3,'fuel affinity [kBT per activation]':0},{'highlighted extra checkpoints':3,'forward activation [1/s]':Number.MIN_VALUE,'fuel affinity [kBT per activation]':Number.MIN_VALUE}],
 3:[{'elastic stiffness [kBT / length²]':0},{'target geometry difference Δ':0,'native mismatch d [length units]':0},{'nonspecific binding weight':0},{'elastic stiffness [kBT / length²]':Number.MIN_VALUE},{'target geometry difference Δ':Number.MIN_VALUE,'native mismatch d [length units]':0,'nonspecific binding weight':Number.MIN_VALUE}],
 4:[{'@ACR example':'unstable equilibrium','first reaction coefficient':1,'second reaction coefficient':1,'conserved A + B [µM]':2},{'conserved A + B [µM]':1},{'conserved A + B [µM]':1+Number.EPSILON},{'@ACR example':'unstable equilibrium','first reaction coefficient':3,'second reaction coefficient':.1,'phase position A / total':1}],
 5:[{'sensor input rate [1/s]':0,'regulator inventory [µM]':.1,'sensor inventory [µM]':.1},{'regulator inventory [µM]':.6,'sensor input rate [1/s]':.6},{'sensor input rate [1/s]':Number.MIN_VALUE,'@phosphatase architecture':'separate phosphatase'}],
 6:[{'@reaction network':'closed binding','observation duration [s]':0},{'@reaction network':'open multistability','initial allocation fraction':.5,'observation duration [s]':20},{'@reaction network':'broken chain','observation duration [s]':20}],
 7:[{'activation coefficient [1/s]':0,'@summary quantity':'timing moments'},{'cascade tiers':5,'deactivation rate [1/s]':1+Number.EPSILON,'activation coefficient [1/s]':2},{'cascade tiers':5,'activation coefficient [1/s]':3e-64,'deactivation rate [1/s]':.1},{'cascade tiers':5,'activation coefficient [1/s]':Number.MIN_VALUE}],
 8:[{'receptor inventory [µM]':0},{'free ligand [µM]':0},{'free ligand [µM]':Number.MIN_VALUE,'receptor inventory [µM]':.1},{'free ligand [µM]':Number.MIN_VALUE,'receptor inventory [µM]':Number.MIN_VALUE,'binding Kd [µM]':5,'downstream scale KE [µM]':5}]
 }[id];
 let criticalIndex=0;for(const values of cases){const special=structuredClone(baseState);for(const[name,value]of Object.entries(values)){const part=special.parts.find(([k])=>k.startsWith((name.startsWith('@')?'select:'+name.slice(1):'slider:'+name)+':'));if(name.startsWith('@')){const index=part[1][1].indexOf(value);assert.ok(index>=0,'known mode');part[1][0]=index;}else part[1]=value;}const actual=await open(id,theme,width,stateURL(base,`sysbio-6.${id}`,special));assert.deepEqual(actual.state.parts,special.parts,label+' exact intended critical state');await replay(id,theme,width,label+' exact critical '+JSON.stringify(values));if(width===320)await screenshot(`${dir}/${label}-critical-${criticalIndex++}.png`);}

}
async function controls(id,theme,width,label){
 const seen=new Set();async function sliders(){const names=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));
 for(const name of names){const el=page.getByRole('slider',{name,exact:true});if(seen.has(name)||!await el.isVisible())continue;seen.add(name);for(const key of ['Home','End']){await el.press(key);actions++;await check(label+' '+name+' '+key);}await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();await page.mouse.click(b.x+.37*b.width,b.y+b.height/2);actions++;await check(label+' native drag '+name);await replay(id,theme,width,label+' '+name);}}
 await sliders();
 const groups=await page.locator('#viz .seg').evaluateAll(es=>es.map(e=>[e.getAttribute('aria-label'),[...e.querySelectorAll('button')].map(b=>b.textContent)]));
 for(const [name,options]of groups){const group=page.getByRole('group',{name,exact:true});if(!await group.isVisible())continue;const original=await group.locator('button.on').textContent();for(const option of options){await group.getByRole('button',{name:option,exact:true}).click();actions++;await check(label+' '+option);await sliders();await replay(id,theme,width,label+' '+option);await screenshot(`${dir}/${label}-mode-${option.replace(/[^a-z0-9]/gi,'_')}.png`);}await group.getByRole('button',{name:original,exact:true}).click();actions++;await check(label+' restored '+name);}

 const toggles=await page.locator('#viz .ctl-toggle').count();for(let i=0;i<toggles;i++)for(let j=0;j<2;j++){await page.locator('#viz .ctl-toggle').nth(i).locator('label').click();actions++;await check(label+' toggle');await replay(id,theme,width,label+' toggle');await screenshot(`${dir}/${label}-toggle${i}-${j}.png`);}
}
try{
 const ids=process.argv.slice(2).length?process.argv.slice(2).map(Number):Array.from({length:8},(_,i)=>i+1);
 for(const id of ids)for(const theme of ['light','dark'])for(const width of [1200,320]){
  const label=`6.${id}-${theme}-${width}`;if(process.env.SYSBIO_AUDIT){try{await open(id,theme,width);if(process.env.SYSBIO_AUDIT_CAPTURE){await screenshot(`${dir}/${label}-default.png`);await page.screenshot({path:`${dir}/${label}-full.png`,fullPage:true});for(const [selector,name]of [['.statement','statement'],['#idea','idea']])if(await page.locator(selector).count()){const clip=await page.locator(selector).evaluate(e=>{const b=e.getBoundingClientRect();return{x:Math.max(0,b.x+scrollX-2),y:Math.max(0,b.y+scrollY-2),width:b.width+4,height:b.height+8};});await page.screenshot({path:`${dir}/${label}-rich-${name}.png`,clip,fullPage:true});}}console.log('AUDIT PASS',label);}catch(e){console.log('AUDIT FAIL',label,e.message);await page.screenshot({path:`${dir}/${label}-audit-failure.png`,fullPage:true});}continue;}await open(id,theme,width);await screenshot(`${dir}/${label}-default.png`);await page.screenshot({path:`${dir}/${label}-full.png`,fullPage:true});if(!process.env.SYSBIO_DEFAULTS_ONLY)await controls(id,theme,width,label);await savedStates(id,theme,width,label);layouts++;fs.writeFileSync(`${dir}/progress.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks},null,2));console.log('PASS',label,{actions,replays,checks,modelChecks});
 }
 fs.writeFileSync(`${dir}/result.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks},null,2));console.log(JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays,modelChecks}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
