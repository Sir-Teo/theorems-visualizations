// Real production routes, native controls, text/marker bounds and actual share replay.
import assert from 'node:assert/strict';
import * as H from '../content/cg/ch06.shared.js';
import * as S from '../content/cg/ch06.spatial.shared.js';
let modelChecks=0;
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
const dir=process.env.CG_SHOTS||'/tmp/wave6-cg-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));let groups=0,actions=0,replays=0,invalidReplays=0,minGlyph=Infinity,minMarker=Infinity,minStroke=Infinity,minTip=Infinity;
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route(/\/assets\/js\/viz\/core\.js$/,async route=>{let body=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');assert.ok(body.includes('try { vizFn(instance.api); }'));body=body.replace('try { vizFn(instance.api); }',`window.__cgRuntime=instance;const makeSteps=instance.api.steps;instance.__steps=[];instance.api.steps=o=>{const S=makeSteps(o);instance.__steps.push(S);return S;};
 for(const kind of ['stage','stage3d']){const create=instance.api[kind];instance.api[kind]=o=>{const s=create(o),begin=s.begin.bind(s),ctx=s.ctx;
 for(const name of ['fillText','strokeText']){const original=ctx[name].bind(ctx);ctx[name]=(str,x,y,...rest)=>{const m=ctx.measureText(String(str)),pad=name==='strokeText'?ctx.lineWidth/2:0;(s.__glyphs||=[]).push({str:String(str),x,y,kind:name,clip:s._clipped?{...s._m}:null,left:x-m.actualBoundingBoxLeft-pad,right:x+m.actualBoundingBoxRight+pad,top:y-m.actualBoundingBoxAscent-pad,bottom:y+m.actualBoundingBoxDescent+pad});return original(str,x,y,...rest);};}
 if(kind==='stage3d'||kind==='stage'){let points=[];const beginPath=ctx.beginPath.bind(ctx);ctx.beginPath=()=>{points=[];return beginPath();};for(const name of ['moveTo','lineTo']){const original=ctx[name].bind(ctx);ctx[name]=(x,y)=>{points.push([x,y]);return original(x,y);};}const arc=ctx.arc.bind(ctx);ctx.arc=(x,y,r,...rest)=>{points.push([x-r,y-r],[x+r,y+r]);return arc(x,y,r,...rest);};for(const name of ['fillRect','strokeRect']){const original=ctx[name].bind(ctx);ctx[name]=(x,y,w,h)=>{const pad=name==='strokeRect'?ctx.lineWidth/2:0;if(name==='fillRect'&&s.o.title==='Selected implication route')(s.__boxes||=[]).push({x,y,w,h});s.__strokeClear=Math.min(s.__strokeClear??Infinity,x-pad,s.W-x-w-pad,y-pad,s.H-y-h-pad);return original(x,y,w,h);};}for(const name of ['stroke','fill']){const original=ctx[name].bind(ctx);ctx[name]=(...args)=>{const pad=name==='stroke'?ctx.lineWidth/2:0;for(const [x,y]of points)s.__strokeClear=Math.min(s.__strokeClear??Infinity,x-pad,s.W-x-pad,y-pad,s.H-y-pad);return original(...args);};}}
 if(kind==='stage'){const axes=s.axes.bind(s);s.axes=()=>{s.__axesView=structuredClone(s.view);return axes();};}
 if(kind==='stage'){const band=s.vband.bind(s);s.vband=(...args)=>{(s.__bands||=[]).push(args);return band(...args);};const arrow=s.arrow.bind(s);s.arrow=(...args)=>{(s.__arrows||=[]).push(args);return arrow(...args);};}const dot=s.dot.bind(s);s.dot=(...args)=>{(s.__dots||=[]).push(args);return dot(...args);};s.begin=()=>{s.__glyphs=[];s.__boxes=[];s.__dots=[];s.__arrows=[];s.__bands=[];s.__strokeClear=Infinity;return begin();};return s;};}try { vizFn(instance.api); }`);await route.fulfill({contentType:'text/javascript',body});});
async function paint(){await page.locator('#viz').scrollIntoViewIfNeeded();await page.evaluate(async()=>{await document.fonts.ready;window.__cgRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function vizShot(path){await page.evaluate(async()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await page.screenshot({path:dir+'/capture-settle.png',fullPage:true});await page.waitForTimeout(100);const clip=await page.locator('#viz').evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});await page.screenshot({path,clip,fullPage:true});}
async function check(label){await paint();const q=await page.evaluate(()=>{const rt=window.__cgRuntime,fields=[],glyphs=[],dots=[],tips=[];for(const s of rt.stages){const gs=s.__glyphs||[];for(let i=0;i<gs.length;i++)for(let j=i+1;j<gs.length;j++){const a=gs[i],b=gs[j];if(a.str===b.str&&a.x===b.x&&a.y===b.y)continue;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5)fields.push({canvasOverlap:[a.str,b.str]});}for(const a of s.__arrows||[])for(const box of s.__boxes||[])for(const p of[[a[0],a[1]],[a[2],a[3]]]){const x=s.X(p[0]),y=s.Y(p[1]),d=Math.hypot(Math.max(box.x-x,0,x-box.x-box.w),Math.max(box.y-y,0,y-box.y-box.h));if(d<5)fields.push({arrowBoxClearance:d});}if(s.o.equal&&Math.abs(s.sx-s.sy)>1e-10)fields.push({equalScale:[s.sx,s.sy]});for(const a of s.__arrows||[])for(const d of s.__dots||[]){if(Array.isArray(d[0]))continue;const r=(d[2]?.r??4)+.75;for(const p of[[a[0],a[1]],[a[2],a[3]]])tips.push(Math.hypot(s.X(p[0])-s.X(d[0]),s.Y(p[1])-s.Y(d[1]))-r);}for(const t of s.__glyphs||[])glyphs.push({...t,clear:Math.min(t.left-(t.clip?.l??0),s.W-(t.clip?.r??0)-t.right,t.top-(t.clip?.t??0),s.H-(t.clip?.b??0)-t.bottom)});for(const args of s.__dots||[]){const three=Array.isArray(args[0]),o=args[three?1:2]||{},r=(o.r??4)+(three?(o.ring===false?0:.7):o.hollow?(o.width??1.8)/2:o.ring===false?0:.75),P=three?s.project(args[0]):[s.X(args[0]),s.Y(args[1])];dots.push({clear:Math.min(P[0]-(s.o.gutter?s._m.l:0),s.W-(s.o.gutter?s._m.r:0)-P[0],P[1]-(s.o.gutter?s._m.t:0),s.H-(s.o.gutter?s._m.b:0)-P[1])-r});}}
 for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout,.cg6-detail,.steps-code')){const box=el.getBoundingClientRect(),cs=getComputedStyle(el),l=box.left+parseFloat(cs.paddingLeft||0),r=box.right-parseFloat(cs.paddingRight||0),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(node);for(const z of range.getClientRects())if(z.width>1&&(z.left<l-1||z.right>r+1))fields.push({text:node.textContent,left:z.left,right:z.right,l,r});}}
 const snap=rt.state.capture(),ranges=[...document.querySelectorAll('#viz .ctl-slider input[type=range]')],parts=snap.parts.filter(([k])=>k.startsWith('slider:'));
 return{detail:[...document.querySelectorAll('.cg6-detail')].map(e=>e.textContent).join('\n---\n'),num:location.hash.match(/cg-(6\.\d+)/)?.[1],inputs:Object.fromEntries([...document.querySelectorAll('#viz .ctl-input input,#viz .ctl-input textarea')].map(e=>[e.getAttribute('aria-label'),e.value])),sliders:Object.fromEntries([...document.querySelectorAll('#viz .ctl-slider input')].map(e=>[e.getAttribute('aria-label'),+e.value])),selections:Object.fromEntries([...document.querySelectorAll('#viz .seg')].map(e=>[e.getAttribute('aria-label'),e.querySelector('button.on')?.textContent])),stageInk:rt.stages.map(s=>(s.__glyphs||[]).filter(g=>g.kind==='fillText').map(g=>g.str)),steps:rt.__steps.map(s=>({i:s.i,n:s.n,frame:s.frame})),tips,stroke:Math.min(...rt.stages.map(s=>s.__strokeClear??Infinity)),snap,fields,glyphs,dots,raw:parts.map((p,i)=>[p[1],+ranges[i].value,ranges[i].closest('.ctl-slider').querySelector('output').textContent]),errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,read:document.querySelector('.viz-readout')?.textContent};});
 assert.ok(q.stroke>=-.1,label+' canvas path bounds '+q.stroke);minStroke=Math.min(minStroke,q.stroke);assert.deepEqual(errors,[],label);assert.deepEqual(q.errors,[],label);assert.equal(q.tex,0,label);assert.deepEqual(q.fields,[],label+' rich text bounds');assert.ok(q.overflow<=1,label+' overflow');assert.ok(q.read?.length,label+' readout');for(const S of q.steps){assert.ok(S.i>=0&&S.i<S.n,label+' step bounds');}assert.doesNotMatch(q.read,/NaN|undefined|\[object Object\]/,label);for(const g of q.glyphs){assert.ok(g.clear>=-.1,label+' glyph '+JSON.stringify(g));minGlyph=Math.min(minGlyph,g.clear);}for(const d of q.dots){assert.ok(d.clear>=-.1,label+' marker '+JSON.stringify(d));minMarker=Math.min(minMarker,d.clear);}for(const t of q.tips){assert.ok(t>=-.1,label+' arrow endpoint / marker clearance '+t);minTip=Math.min(minTip,t);}for(const[m,d,t]of q.raw){assert.ok(Math.abs(m-d)<=16*Number.EPSILON*Math.max(1,Math.abs(m)),label+' slider model/DOM');assert.ok(Math.abs(Number(t.replace('−','-'))-m)<=5.1e-4*Math.abs(m),label+' visible slider value '+t+' versus '+m);}assertModel(q,label);return q;}
async function open(n,theme,width,url){errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/cg-${n}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__cgRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);return check(`${n}/${theme}/${width}`);}
async function fill(name,raw,label){await page.getByRole('textbox',{name,exact:true}).fill(raw);await page.waitForTimeout(190);actions++;return check(label+' '+name);}
async function select(name,value,label){await page.getByRole('group',{name,exact:true}).getByRole('button',{name:value,exact:true}).click();actions++;return check(label+' '+value);}
async function key(name,key,label){await page.getByRole('slider',{name,exact:true}).press(key);actions++;return check(label+' '+name+' '+key);}
async function stepEnds(label){const range=page.getByRole('slider',{name:'Step',exact:true});if(!await range.count()||!await range.isEnabled())return;for(const key of ['Home','ArrowRight','ArrowRight','End']){await range.press(key);actions++;await check(label+' step '+key);}}
async function replay(n,theme,width,label){const before=await check(label+' before replay');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const link=await page.locator('.share-url').inputValue();assert.ok(link.includes(`#/t/cg-${n}?s=`));await open(n,theme,width,link);const after=await check(label+' after replay');assert.deepEqual(after.snap.parts,before.snap.parts,label+' replay state');assert.equal(after.read,before.read,label+' replay readout');assert.equal(after.detail,before.detail,label+' replay detail');assert.deepEqual(after.steps,before.steps,label+' replay frame');replays++;}
function assertModel(q,label){
 const I=q.inputs,C=q.selections,V=q.sliders,k=+q.num.split('.')[1],handle=i=>q.snap.parts.find(([key])=>key===`handle:0:${i}:0`)?.[1];
 try{
  if(k===1||k===2){const P=JSON.parse(I['points JSON']),a=handle(64),b=handle(65),R=[a[0],b[0],a[1],b[1]],T=k===1?H.kdTree(P):H.rangeTree(P),r=k===1?H.kdRange(T,R):H.rangeQuery(T,R,C['y search']==='cascading');assert(q.read.includes(k===1?`${r.hits.length} hits`:`[${H.rangeQuery(T,R,true).hits}]`));assert(q.detail.includes(k===1?`Visited nodes: ${r.visited}`:`${T.entries} stored y-list entries`));}
  if(k===3){const P=JSON.parse(I['disjoint segments JSON']),T=S.trapezoidalMap(P,S.shuffledOrder(P.length,V['permutation seed'])),at=q.steps[0].i,r=S.locateTrapezoid(T,handle(0),at);assert.equal(q.steps[0].n,T.frames.length);assert(q.read.includes(`query depth ${r.depth}`));assert(q.detail.includes(`leaf ${r.leaf}`));}
  if(k===4){const A=H.checkedIntervals(JSON.parse(I['closed intervals JSON'])),isInterval=C.structure==='interval tree',T=isInterval?H.intervalTree(A):H.segmentTree(A),r=isInterval?H.intervalQuery(T,V['query x']):H.segmentQuery(T,V['query x']);assert(q.read.includes(`${r.hits.length} closed intervals`));assert(q.detail.includes(`Hits: [${r.hits}]`));}
  if(k===5){const A=JSON.parse(I['segments JSON']),T=S.bsp(A,S.shuffledOrder(A.length,V['splitter order seed'])),r=S.painterOrder(T,handle(0));assert(q.read.includes(`has ${r.fragments.length} fragments`));assert(q.detail.includes(`${T.splits.length} exact splits`));}
  if(k===6){const curve=JSON.parse(I['refinement polyline JSON']),M=S.quadMesh(curve,V['maximum dyadic level'],C.balance==='2:1 face balance');assert(q.read.includes(`${M.leaves.length} cells`));assert(q.detail.includes(`${M.triangles.length} triangles`));}
  if(k===7){const T=S.bvh(JSON.parse(I['3D triangles JSON']),C['build method'],V['relative box-test cost']),a=handle(0),b=handle(1),r=S.rayQuery(T,[...a,-8],[b[0]-a[0],b[1]-a[1],16]);assert(q.read.includes(`${r.boxTests} box tests and ${r.triangleTests} triangle tests`));assert(q.detail.includes(`Closest triangle: ${r.triangle<0?'none':r.triangle}`));}
  if(k===8){const d=V['ambient dimension'],P=H.cloud(V['sample size'],d,V['cloud seed'],C['data model']),r=H.nearestQuery(H.nearestTree(P),Array(d).fill(.5));assert(q.read.includes(`${r.pointTests}/${P.length} points tested`));assert(q.detail.includes(`Nearest identity ${r.index}`));}
 }catch(e){if(e.code==='ERR_ASSERTION')throw e;assert(q.read?.length,label+' rejection readout');assert(q.detail?.length,label+' rejection detail');}
 modelChecks++;
}
async function dragHandles(label){
 const hs=await page.evaluate(()=>{const s=window.__cgRuntime.stages[0];return s.handles.map((h,i)=>({i,x:h.x,y:h.y,visible:h.visible})).filter(h=>h.visible);});
 for(const item of [...new Map([hs[0],hs.at(-1)].filter(Boolean).map(h=>[h.i,h])).values()]){
  await page.locator('#viz canvas').first().scrollIntoViewIfNeeded();const p=await page.evaluate(i=>{const s=window.__cgRuntime.stages[0],h=s.handles[i],b=s.canvas.getBoundingClientRect();return {x:b.left+s.X(h.x),y:b.top+s.Y(h.y),tx:b.left+s.X(h.x>0?h.x-1.2:h.x+1.2),ty:b.top+s.Y(h.y>0?h.y-.9:h.y+.9)};},item.i);
  const before=await page.evaluate(()=>window.__cgRuntime.state.capture());await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.tx,p.ty,{steps:8});await page.mouse.up();actions++;
  const after=await check(label+' physical handle '+item.i);assert.notDeepEqual(after.snap.parts,before.parts,label+' handle must change state');
 }
}
const edits={
 'points JSON':'[[-7,7],[-2,-3],[0,0],[0,0],[5,4],[7,-7]]',
 'disjoint segments JSON':'[[[-7,-4],[5,-3]],[[-6,3],[4,5]],[[-3,0],[7,1]]]',
 'closed intervals JSON':'[[-8,8],[0,0],[0,0],[-3,0],[0,4],[6,7]]',
 'segments JSON':'[[[-7,-4],[5,3]],[[-5,5],[6,-2]],[[0,-7],[0,7]]]',
 'refinement polyline JSON':'[[-7,5],[0,-3],[7,4]]',
 '3D triangles JSON':'[[[-2,-2,0],[2,-2,0],[0,2,0]],[[-1,-1,3],[1,-1,3],[0,1,3]]]'
};
async function controls(n,theme,width,label){
 await open(n,theme,width);const modes=await page.locator('#viz .seg').evaluateAll(a=>a.map(e=>({name:e.getAttribute('aria-label'),options:[...e.querySelectorAll('button')].map(b=>b.textContent)})));
 for(const group of modes)for(const [j,value]of group.options.entries()){await open(n,theme,width);await select(group.name,value,label);await stepEnds(label);if(width===320)await vizShot(`${dir}/${label}-mode-${group.name.replace(/\W/g,'_')}-${j}.png`);await replay(n,theme,width,label+' mode');}
 await open(n,theme,width);const sliders=await page.locator('#viz .ctl-slider input').evaluateAll(a=>a.map(e=>e.getAttribute('aria-label')));
 for(const name of sliders){await open(n,theme,width);for(const keyName of ['Home','End'])await key(name,keyName,label);const el=page.getByRole('slider',{name,exact:true});await el.scrollIntoViewIfNeeded();const b=await el.boundingBox(),before=await el.inputValue();await page.mouse.click(b.x+b.width*.373,b.y+b.height/2);actions++;assert.notEqual(await el.inputValue(),before,label+' slider pointer changes value');await check(label+' slider pointer');await replay(n,theme,width,label+' slider');}
 await open(n,theme,width);const names=await page.locator('#viz .ctl-input input').evaluateAll(a=>a.map(e=>e.getAttribute('aria-label')));
 for(const name of names){await open(n,theme,width);const original=await page.getByRole('textbox',{name,exact:true}).inputValue();assert(Object.hasOwn(edits,name));await fill(name,edits[name],label);await stepEnds(label);await replay(n,theme,width,label+' edited');await fill(name,'{broken',label);if(width===320)await vizShot(`${dir}/${label}-invalid.png`);await replay(n,theme,width,label+' invalid');await fill(name,'[]',label);await check(label+' empty');await fill(name,original,label);}
 await open(n,theme,width);await dragHandles(label);await replay(n,theme,width,label+' handles');
 const remove=page.getByRole('button',{name:'remove last point',exact:true});if(await remove.count()){await remove.click();actions++;await check(label+' remove');await replay(n,theme,width,label+' remove');}
}
async function invalidSaved(n,theme,width,label){
 const good=await open(n,theme,width),cases=[];
 for(const [key,value]of good.snap.parts){const bad=structuredClone(good.snap),part=bad.parts.find(([k])=>k===key);
  if(key.startsWith('slider:'))part[1]=1e9;
  else if(key.startsWith('input:'))part[1]=42;
  else if(key.startsWith('select:'))part[1]='not an option';
  else continue;cases.push([key,bad]);
 }
 const h=good.snap.parts.find(([key])=>key.startsWith('handle:'));if(h){for(const value of [[99,0],[1]]){const bad=structuredClone(good.snap);bad.parts.find(([key])=>key===h[0])[1]=value;cases.push(['handle bound/shape',bad]);}}
 if(['6.1','6.2','6.6'].includes(n)){const bad=structuredClone(good.snap);bad.parts.find(([key])=>key==='handle:0:0:0')[1]=[7.125,6.75];cases.push(['contradictory saved point',bad]);}
 for(const [name,bad]of cases){await open(n,theme,width,stateURL(base+'/',`cg-${n}`,bad));assert.match(await page.locator('.viz-state-notice').innerText(),/could not be restored/);const restored=await check(label+' rejected '+name);assert.deepEqual(restored.snap.parts,good.snap.parts);assert.equal(restored.read,good.read);assert.equal(restored.detail,good.detail);invalidReplays++;}
}
async function boundaryCases(n,theme,width,label){
 const shot=async suffix=>{await check(label+' '+suffix);await stepEnds(label);if(width===320)await vizShot(`${dir}/${label}-${suffix}.png`);await replay(n,theme,width,label+' '+suffix);};
 const start=()=>open(n,theme,width);
 const raw=async(suffix,change)=>{const good=await start(),state=structuredClone(good.snap),get=key=>state.parts.find(([k])=>k===key),put=(key,value)=>{const row=get(key);assert(row,key);row[1]=value;};change({state,get,put});const observed=await open(n,theme,width,stateURL(base+'/',`cg-${n}`,state));assert.deepEqual(observed.snap.parts,state.parts,label+' raw state exact');await shot(suffix);};
 await start();
 if(n==='6.1'||n==='6.2'){
  await fill('points JSON',JSON.stringify(Array.from({length:64},(_,i)=>[(i%8)*2-7,Math.floor(i/8)*2-7])),label);await shot('64-sites');
  await fill('points JSON',JSON.stringify(Array.from({length:64},()=>[0,0])),label);await shot('64-coincident');
  for(const [suffix,a,b]of [['full-box',[-8,-8],[8,8]],['point-box',[0,0],[0,0]],['raw-query',[.123456789123,-.987654321987],[7.654321123,.333333333333]]])await raw(suffix,({get,put})=>{put('handle:0:64:0',a);put('handle:0:65:0',b);if(n==='6.1'){const P=JSON.parse(get('input:points JSON:0')[1]),r=H.kdRange(H.kdTree(P),[a[0],b[0],a[1],b[1]]);put('steps::0',[0,Math.max(1,r.trace.length)]);}else put('slider:inspect node fraction:0',.123456789123);});
 }
 if(n==='6.3'){
  await fill('disjoint segments JSON',JSON.stringify(Array.from({length:8},(_,i)=>[[-8+i/16,-7+i*2],[7+i/16,-6.8+i*2]])),label);await shot('eight-segments');
  await fill('disjoint segments JSON','[[[-1,-1],[1,1]],[[-2,2],[2,-2]]]',label);assert((await check(label+' crossing')).read.includes('disjoint'));await shot('crossing-rejected');
  await raw('raw-boundary-query',({put})=>put('handle:0:0:0',[-7,-3]));
  await raw('raw-query',({put})=>put('handle:0:0:0',[.123456789123,-.987654321987]));
 }
 if(n==='6.4'){
  await fill('closed intervals JSON',JSON.stringify(Array.from({length:32},(_,i)=>[i/2-8,i/2-8])),label);for(const kind of ['interval tree','segment tree']){await select('structure',kind,label);await shot('32-endpoints-'+kind.replace(' ','-'));}
  await raw('raw-query',({put})=>put('slider:query x:0',.123456789123));
 }
 if(n==='6.5'){
  const A=Array.from({length:10},(_,i)=>[[-7,-6+i*1.2],[7,6-i*1.1]]);await fill('segments JSON',JSON.stringify(A),label);await shot('ten-split-segments');
  await raw('edge-viewer',({put})=>{put('handle:0:0:0',[-8,8]);put('slider:view direction (radians):0',-.123456789123);});
  await fill('segments JSON','[[[-8,0],[8,0]],[[-8,1],[8,1]]]',label);await shot('parallel-segments');
 }
 if(n==='6.6'){
  const curve=Array.from({length:12},(_,i)=>[i%2?7:-7,-7+i*14/11]);await fill('refinement polyline JSON',JSON.stringify(curve),label);await key('maximum dyadic level','End',label);for(const balance of ['unbalanced','2:1 face balance']){await select('balance',balance,label);await shot('12-vertex-'+balance.replace(/\W/g,'_'));}
  await start();const good=await check(label),original=good.inputs['refinement polyline JSON'];await fill('refinement polyline JSON','  '+original+'  ',label);await shot('formatted-curve');
 }
 if(n==='6.7'){
  const T=Array.from({length:48},(_,i)=>{const x=(i%6)*2-6,y=(Math.floor(i/6)%4)*3-6,z=Math.floor(i/24)*6-3;return [[x,y,z],[x+1,y,z],[x,y+1,z]];});await fill('3D triangles JSON',JSON.stringify(T),label);await shot('48-triangles');
  await raw('extreme-ray',({put})=>{put('handle:0:0:0',[-8,8]);put('handle:0:1:0',[8,-8]);put('slider:relative box-test cost:0',.123456789123);put('slider:inspect node fraction:0',.876543211234);});
  await select('triangle scene','edge',label);await shot('shared-edge-scene');
 }
 if(n==='6.8'){
  for(const name of ['sample size','ambient dimension'])await key(name,'End',label);for(const model of ['cube','plane']){await select('data model',model,label);await shot('max-'+model);}
 }
 // The complete accepted text budget and literal TeX-looking syntax must remain
 // shareable without being interpreted as a mathematical expression in errors.
 await start();const fields=await page.locator('#viz .ctl-input input').evaluateAll(a=>a.map(e=>e.getAttribute('aria-label')));
 for(const name of fields){const original=await page.getByRole('textbox',{name,exact:true}).inputValue();assert(original.length<=4096);await fill(name,original.padEnd(4096,' '),label);assert.equal((await check(label+' text budget')).inputs[name].length,4096);await shot('4096-chars');await fill(name,'$\\notacommand$',label);assert((await check(label+' literal malformed')).read.includes('valid JSON list'));await shot('literal-malformed');await fill(name,original,label);}
}

async function polishCases(n,theme,width,label){
 const name=n==='6.6'?'refinement polyline JSON':n==='6.7'?'3D triangles JSON':'points JSON';
 if(['6.1','6.2','6.6','6.7'].includes(n)){
  const original=await page.getByRole('textbox',{name,exact:true}).inputValue();
  for(const raw of ['[]','{broken',n==='6.7'?'[[[0,0,0],[1,0,0],[0,1,0]]]':'[[0,0]]',original]){
   await fill(name,raw,label);const remove=page.getByRole('button',{name:'remove last point',exact:true});if(await remove.count())assert.equal(await remove.isDisabled(),raw==='[]'||raw==='{broken');
   if(n==='6.2'||n==='6.7')assert.equal(await page.getByRole('slider',{name:'inspect node fraction',exact:true}).isVisible(),raw===original);
   await replay(n,theme,width,label+' polish '+raw.slice(0,12));
   if(width===320)await vizShot(`${dir}/${label}-polish-${raw===original?'restored':raw==='[]'?'empty':raw==='{broken'?'invalid':'singleton'}.png`);
  }
 }
 if(n==='6.5'){assert.match(await page.locator('.statement').innerText(),/collinear fragments/);assert.match(await page.locator('.scope').innerText(),/Collinear rays/);}
 if(n==='6.8')assert.match((await check(label)).detail,/coordinates 3…d are exactly 1\/2.*same 2D/);
}

const results=[];
try{for(const n of (process.env.CG_ITEMS||Array.from({length:8},(_,i)=>'6.'+(i+1)).join(',')).split(','))for(const theme of (process.env.CG_THEMES||'light,dark').split(','))for(const width of (process.env.CG_WIDTHS||'1200,320').split(',').map(Number)){
 const label=`cg-${n}-${theme}-${width}`;
 try{await open(n,theme,width);await vizShot(`${dir}/${label}-viz.png`);await page.screenshot({path:`${dir}/${label}.png`,fullPage:true});const regions=await page.locator('.statement,#idea,#caption,.scope,.cg6-detail,.steps-code').evaluateAll(es=>es.map(e=>({selector:e.className||e.id,box:{x:e.getBoundingClientRect().x+scrollX,y:e.getBoundingClientRect().y+scrollY,width:e.offsetWidth,height:e.offsetHeight}})));fs.writeFileSync(`${dir}/${label}-regions.json`,JSON.stringify(regions));await stepEnds(label);await replay(n,theme,width,label+' defaults');if(process.env.CG_POLISH==='1'){await polishCases(n,theme,width,label);}else if(process.env.CG_FINAL==='1'){await controls(n,theme,width,label);await boundaryCases(n,theme,width,label);await invalidSaved(n,theme,width,label);}else if(process.env.CG_BOUNDARIES==='1'){await boundaryCases(n,theme,width,label);await invalidSaved(n,theme,width,label);}else if(process.env.CG_QUICK!=='1'){await controls(n,theme,width,label);await invalidSaved(n,theme,width,label);}groups++;results.push({label,ok:true});console.log('PASS',label,JSON.stringify({groups,actions,replays,invalidReplays,modelChecks}));}
 catch(e){results.push({label,ok:false,error:e.stack});console.log('FAIL',label,e.stack);}
}}finally{await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync(dir+'/results.json',JSON.stringify({results,groups,actions,replays,invalidReplays,modelChecks,minGlyph,minStroke},null,2));}
console.log(JSON.stringify({groups,actions,replays,invalidReplays,modelChecks,minGlyph,minStroke,failed:results.filter(x=>!x.ok).length}));if(results.some(x=>!x.ok))process.exitCode=1;
