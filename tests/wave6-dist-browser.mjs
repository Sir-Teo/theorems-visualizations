// Real production routes, native controls, text/marker bounds and actual share replay.
import assert from 'node:assert/strict';
import * as H from '../content/dist/ch06.shared.js';
let modelChecks=0;
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
const dir=process.env.DIST_SHOTS||'/tmp/wave6-dist-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));let groups=0,actions=0,replays=0,minGlyph=Infinity,minMarker=Infinity,minStroke=Infinity,minTip=Infinity;
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route(/\/assets\/js\/viz\/core\.js$/,async route=>{let body=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');assert.ok(body.includes('try { vizFn(instance.api); }'));body=body.replace('try { vizFn(instance.api); }',`window.__distRuntime=instance;const makeSteps=instance.api.steps;instance.__steps=[];instance.api.steps=o=>{const S=makeSteps(o);instance.__steps.push(S);return S;};
 for(const kind of ['stage','stage3d']){const create=instance.api[kind];instance.api[kind]=o=>{const s=create(o),begin=s.begin.bind(s),ctx=s.ctx;
 for(const name of ['fillText','strokeText']){const original=ctx[name].bind(ctx);ctx[name]=(str,x,y,...rest)=>{const m=ctx.measureText(String(str)),pad=name==='strokeText'?ctx.lineWidth/2:0;(s.__glyphs||=[]).push({str:String(str),x,y,kind:name,clip:s._clipped?{...s._m}:null,left:x-m.actualBoundingBoxLeft-pad,right:x+m.actualBoundingBoxRight+pad,top:y-m.actualBoundingBoxAscent-pad,bottom:y+m.actualBoundingBoxDescent+pad});return original(str,x,y,...rest);};}
 if(kind==='stage3d'||kind==='stage'){let points=[];const beginPath=ctx.beginPath.bind(ctx);ctx.beginPath=()=>{points=[];return beginPath();};for(const name of ['moveTo','lineTo']){const original=ctx[name].bind(ctx);ctx[name]=(x,y)=>{points.push([x,y]);return original(x,y);};}const arc=ctx.arc.bind(ctx);ctx.arc=(x,y,r,...rest)=>{points.push([x-r,y-r],[x+r,y+r]);return arc(x,y,r,...rest);};for(const name of ['fillRect','strokeRect']){const original=ctx[name].bind(ctx);ctx[name]=(x,y,w,h)=>{const pad=name==='strokeRect'?ctx.lineWidth/2:0;if(name==='fillRect'&&s.o.title==='Selected implication route')(s.__boxes||=[]).push({x,y,w,h});s.__strokeClear=Math.min(s.__strokeClear??Infinity,x-pad,s.W-x-w-pad,y-pad,s.H-y-h-pad);return original(x,y,w,h);};}for(const name of ['stroke','fill']){const original=ctx[name].bind(ctx);ctx[name]=(...args)=>{const pad=name==='stroke'?ctx.lineWidth/2:0;for(const [x,y]of points)s.__strokeClear=Math.min(s.__strokeClear??Infinity,x-pad,s.W-x-pad,y-pad,s.H-y-pad);return original(...args);};}}
 if(kind==='stage'){const axes=s.axes.bind(s);s.axes=()=>{s.__axesView=structuredClone(s.view);return axes();};}
 if(kind==='stage'){const band=s.vband.bind(s);s.vband=(...args)=>{(s.__bands||=[]).push(args);return band(...args);};const arrow=s.arrow.bind(s);s.arrow=(...args)=>{(s.__arrows||=[]).push(args);return arrow(...args);};}const dot=s.dot.bind(s);s.dot=(...args)=>{(s.__dots||=[]).push(args);return dot(...args);};s.begin=()=>{s.__glyphs=[];s.__boxes=[];s.__dots=[];s.__arrows=[];s.__bands=[];s.__strokeClear=Infinity;return begin();};return s;};}try { vizFn(instance.api); }`);await route.fulfill({contentType:'text/javascript',body});});
async function paint(){await page.locator('#viz').scrollIntoViewIfNeeded();await page.evaluate(async()=>{await document.fonts.ready;window.__distRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function vizShot(path){await page.evaluate(async()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await page.screenshot({path:dir+'/capture-settle.png',fullPage:true});await page.waitForTimeout(100);const clip=await page.locator('#viz').evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});await page.screenshot({path,clip,fullPage:true});}
async function check(label){await paint();const q=await page.evaluate(()=>{const rt=window.__distRuntime,fields=[],glyphs=[],dots=[],tips=[];for(const s of rt.stages){const gs=s.__glyphs||[];for(let i=0;i<gs.length;i++)for(let j=i+1;j<gs.length;j++){const a=gs[i],b=gs[j];if(a.str===b.str&&a.x===b.x&&a.y===b.y)continue;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5)fields.push({canvasOverlap:[a.str,b.str]});}for(const a of s.__arrows||[])for(const box of s.__boxes||[])for(const p of[[a[0],a[1]],[a[2],a[3]]]){const x=s.X(p[0]),y=s.Y(p[1]),d=Math.hypot(Math.max(box.x-x,0,x-box.x-box.w),Math.max(box.y-y,0,y-box.y-box.h));if(d<5)fields.push({arrowBoxClearance:d});}if(s.o.equal&&Math.abs(s.sx-s.sy)>1e-10)fields.push({equalScale:[s.sx,s.sy]});for(const a of s.__arrows||[])for(const d of s.__dots||[]){if(Array.isArray(d[0]))continue;const r=(d[2]?.r??4)+.75;for(const p of[[a[0],a[1]],[a[2],a[3]]])tips.push(Math.hypot(s.X(p[0])-s.X(d[0]),s.Y(p[1])-s.Y(d[1]))-r);}for(const t of s.__glyphs||[])glyphs.push({...t,clear:Math.min(t.left-(t.clip?.l??0),s.W-(t.clip?.r??0)-t.right,t.top-(t.clip?.t??0),s.H-(t.clip?.b??0)-t.bottom)});for(const args of s.__dots||[]){const three=Array.isArray(args[0]),o=args[three?1:2]||{},r=(o.r??4)+(three?(o.ring===false?0:.7):o.hollow?(o.width??1.8)/2:o.ring===false?0:.75),P=three?s.project(args[0]):[s.X(args[0]),s.Y(args[1])];dots.push({clear:Math.min(P[0]-(s.o.gutter?s._m.l:0),s.W-(s.o.gutter?s._m.r:0)-P[0],P[1]-(s.o.gutter?s._m.t:0),s.H-(s.o.gutter?s._m.b:0)-P[1])-r});}}
 for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout')){const box=el.getBoundingClientRect(),cs=getComputedStyle(el),l=box.left+parseFloat(cs.paddingLeft||0),r=box.right-parseFloat(cs.paddingRight||0),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(node);for(const z of range.getClientRects())if(z.width>1&&(z.left<l-1||z.right>r+1))fields.push({text:node.textContent,left:z.left,right:z.right,l,r});}}
 const snap=rt.state.capture(),ranges=[...document.querySelectorAll('#viz .ctl-slider input[type=range]')],parts=snap.parts.filter(([k])=>k.startsWith('slider:'));
 return{num:location.hash.match(/dist-(6\.\d+)/)?.[1],inputs:Object.fromEntries([...document.querySelectorAll('#viz .ctl-input input')].map(e=>[e.getAttribute('aria-label'),e.value])),sliders:Object.fromEntries([...document.querySelectorAll('#viz .ctl-slider input')].map(e=>[e.getAttribute('aria-label'),+e.value])),selections:Object.fromEntries([...document.querySelectorAll('#viz .seg')].map(e=>[e.getAttribute('aria-label'),e.querySelector('button.on')?.textContent])),stageInk:rt.stages.map(s=>(s.__glyphs||[]).filter(g=>g.kind==='fillText').map(g=>g.str)),steps:rt.__steps.map(s=>({i:s.i,n:s.n,frame:s.frame})),tips,stroke:Math.min(...rt.stages.map(s=>s.__strokeClear??Infinity)),snap,fields,glyphs,dots,raw:parts.map((p,i)=>[p[1],+ranges[i].value,ranges[i].closest('.ctl-slider').querySelector('output').textContent]),errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,read:document.querySelector('.viz-readout')?.textContent};});
 assert.ok(q.stroke>=-.1,label+' canvas path bounds '+q.stroke);minStroke=Math.min(minStroke,q.stroke);assert.deepEqual(errors,[],label);assert.deepEqual(q.errors,[],label);assert.equal(q.tex,0,label);assert.deepEqual(q.fields,[],label+' rich text bounds');assert.ok(q.overflow<=1,label+' overflow');assert.ok(q.read?.length,label+' readout');for(const S of q.steps){assert.ok(S.i>=0&&S.i<S.n,label+' step bounds');}assert.doesNotMatch(q.read,/NaN|undefined|\[object Object\]/,label);for(const g of q.glyphs){assert.ok(g.clear>=-.1,label+' glyph '+JSON.stringify(g));minGlyph=Math.min(minGlyph,g.clear);}for(const d of q.dots){assert.ok(d.clear>=-.1,label+' marker '+JSON.stringify(d));minMarker=Math.min(minMarker,d.clear);}for(const t of q.tips){assert.ok(t>=-.1,label+' arrow endpoint / marker clearance '+t);minTip=Math.min(minTip,t);}for(const[m,d,t]of q.raw){assert.ok(Math.abs(m-d)<=16*Number.EPSILON*Math.max(1,Math.abs(m)),label+' slider model/DOM');assert.ok(Math.abs(Number(t.replace('−','-'))-m)<=5.1e-4*Math.abs(m),label+' visible slider value '+t+' versus '+m);}assertModel(q,label);return q;}
async function open(n,theme,width,url){await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/dist-${n}`);target.searchParams.set('qaTheme',theme);if(url)await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__distRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);const stale=await page.evaluate(()=>window.__distRuntime.stages.filter(s=>s.o.axes&&JSON.stringify(s.__axesView)!==JSON.stringify(s.view)).map(s=>({title:s.o.title,axes:s.__axesView,view:s.view})));assert.deepEqual(stale,[],`cold axes ${n}/${theme}/${width}`);return check(`${n}/${theme}/${width}`);}


async function stepEnds(label){const range=page.getByRole('slider',{name:'Step',exact:true});if(!await range.count()||!await range.isEnabled())return;for(const key of ['Home','ArrowRight','ArrowRight','End']){await range.press(key);actions++;await check(label+' step '+key);}}
async function fill(field,raw,label){await field.fill(raw);await page.waitForTimeout(190);actions++;return check(label);}
async function replay(n,theme,width,label){const before=await check(label+' before replay');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();const link=await page.locator('.share-url').inputValue();assert.ok(link.includes(`#/t/dist-${n}?s=`));await open(n,theme,width,link);const after=await check(label+' after replay');assert.deepEqual(after.snap.parts,before.snap.parts,label+' replay state');assert.equal(after.read,before.read,label+' replay readout');assert.deepEqual(after.steps,before.steps,label+' replay frame');replays++;return before;}

const invalid=q=>q.glyphs.some(g=>g.str==='Input needs correction');
async function select(name,value,label){await page.getByRole('group',{name,exact:true}).getByRole('button',{name:value,exact:true}).click();actions++;return check(label+' '+value);}
async function key(name,key,label){await page.getByRole('slider',{name,exact:true}).press(key);actions++;return check(label+' '+name+' '+key);}
async function sliders(n,theme,width,label){
 await open(n,theme,width);const names=await page.locator('#viz .ctl-slider input[type=range]').evaluateAll(a=>a.map(e=>e.getAttribute('aria-label')));
 for(const name of names){await open(n,theme,width);for(const k of ['Home','End'])await key(name,k,label);const slider=page.getByRole('slider',{name,exact:true});await slider.scrollIntoViewIfNeeded();const b=await slider.boundingBox();await page.mouse.click(b.x+b.width*.373,b.y+b.height/2);actions++;await check(label+' pointer');await replay(n,theme,width,label+' slider '+name);}
}
async function modes(n,theme,width,label){
 await open(n,theme,width);const groups=await page.locator('#viz .seg').evaluateAll(a=>a.map(e=>({name:e.getAttribute('aria-label'),options:[...e.querySelectorAll('button')].map(b=>b.textContent)})));
 for(const group of groups)for(const [i,value]of group.options.entries()){await open(n,theme,width);await select(group.name,value,label);await stepEnds(label);assert.equal(invalid(await check(label)),false,label+' valid mode');if(width===320)await vizShot(`${dir}/${label}-mode-${group.name.replace(/\W/g,'_')}-${i}.png`);await replay(n,theme,width,label+' mode');}
}
function editedValue(name){
 if(name.includes('inputs around'))return '1 1 1 0 0 0';
 if(name.includes('tree path'))return '0 1';
 if(name.includes('initial'))return '1 1 1 1';
 if(name.includes('undirected'))return '0-1 1-2 2-3 3-4 4-0';
 if(name.includes('quorum A'))return '0 2 3';
 if(name.includes('quorum B'))return '0 1 3';
 if(name.includes('reporter'))return '1 2 3';
 if(name.includes('faulty IDs')||name.includes('internal IDs'))return '';
 if(name.includes('share q'))return '0.3';
 if(name.includes('H ='))return 'H A A R H A R H';
 if(name.includes('0,1,2,3'))return '1 0 1 0';
 return '0 1 0';
}
async function editedInputs(n,theme,width,label){
 await open(n,theme,width);const names=await page.locator('#viz .ctl-input input').evaluateAll(a=>a.map(e=>e.getAttribute('aria-label')));
 for(const [j,name]of names.entries()){await open(n,theme,width);let field=page.getByRole('textbox',{name,exact:true});const original=await field.inputValue();assert.equal(invalid(await fill(field,editedValue(name),label+' valid '+name)),false);await stepEnds(label);await replay(n,theme,width,label+' valid input');
  field=page.getByRole('textbox',{name,exact:true});assert.equal(invalid(await fill(field,'{broken',label+' invalid')),true);if(width===320&&j===0)await vizShot(`${dir}/${label}-invalid.png`);await replay(n,theme,width,label+' invalid input');
  field=page.getByRole('textbox',{name,exact:true});const empty=await fill(field,'',label+' empty');const permitsEmpty=/faulty IDs|internal IDs|tree path|quorum [AB]|undirected|H =/.test(name);assert.equal(invalid(empty),!permitsEmpty,label+' empty semantics '+name);await fill(field,original,label+' corrected');assert.equal(invalid(await check(label)),false);
 }
}
async function boundaries(n,theme,width,label){
 await open(n,theme,width);const put=async(name,value)=>fill(page.getByRole('textbox',{name,exact:true}),value,label);const end=async name=>key(name,'End',label),home=async name=>key(name,'Home',label);
 const shot=async name=>{await stepEnds(label);const r=await check(label);if(width===320)await vizShot(`${dir}/${label}-${name}.png`);await replay(n,theme,width,label+' '+name);return r;};
 if(n==='6.1'||n==='6.10'){await home('faulty ID (−1 means none)');await home('processes');assert.match((await shot('three-honest')).read,/validity.*yes/);await select('decision rule','direct',label);await shot('direct-rule');}
 if(n==='6.2'){await put('inputs around A B C A′ B′ C′','0 1 0 1 0 1');assert.match((await shot('no-forced-pair')).read,/do not yield/);}
 if(n==='6.3'){await put('initial bits (3–7 processes)','0 1 0 1 1 1 0');await put('faulty IDs','0 1');await end('fault bound f');await end('observer ID');await put('tree path to inspect (blank = root)','6 5');assert.match((await shot('seven-process-depth')).read,/agreement yes/);await put('tree path to inspect (blank = root)','6 5 4');await shot('leaf');}
 if(n==='6.4'){await put('initial preferences (3–8 bits)','0 1 1 0 1 0 1');await put('faulty IDs','0 1');await end('fault bound f');assert.match((await shot('two-faults')).read,/agreement yes/);}
 if(n==='6.5'){await end('vertices');await put('undirected edges',Array.from({length:7},(_,a)=>Array.from({length:7-a-1},(_,j)=>`${a}-${a+j+1}`)).flat().join(' '));await end('target');await put('faulty internal IDs','1 2');assert.match((await shot('complete-seven')).read,/κ=6/);await put('undirected edges','0-1 1-2 2-3 3-4 4-5 5-6');await shot('single-long-path');}
 if(n==='6.6'){await select('attack','late-short',label);await select('chain length','accept short',label);assert.match((await shot('late-short-attack')).read,/Agreement NO/);await select('chain length','check round',label);assert.match((await shot('late-short-rejected')).read,/Agreement yes/);await end('processes');await end('fault bound f');await shot('seven-faults');await home('fault bound f');await key('fault bound f','ArrowRight',label);await select('attack','withhold',label);const packet=page.getByRole('slider',{name:'packet index in this round',exact:true});await packet.press('Home');actions++;for(let i=0;i<55;i++){await packet.press('ArrowRight');actions++;}const many=await shot('packet-55');assert.equal(many.sliders['packet index in this round'],55);assert(!many.stageInk[1].includes('no packet at this index'));}
 if(n==='6.7'){await end('processes');await put('quorum A IDs','0 1 2 3 4 5 6 7 8 9');await put('quorum B IDs','0 1 2 3 4 5 6 7 8 9');await put('faulty IDs','0');await shot('ten-overlapping');}
 if(n==='6.8'){await home('faulty replica (−1 means none)');await select('new primary proposal','try replacement',label);assert.match((await shot('reject-conflicting-view')).read,/proposal 0 is rejected/);await select('new primary proposal','carry certificate',label);assert.match((await shot('carry-committed-value')).read,/Agreement across both views: yes/);}
 if(n==='6.9'){await put('attacker discovery share q','1e-100');await end('fixed deficit / honest confirmations z');const r=await shot('tiny-probabilities');assert(r.glyphs.some(g=>g.str==='1e-3000'));await put('H = honest, A = private, R = release',Array(20).fill('H A R').join(' '));await shot('long-tree');await put('attacker discovery share q','0');await shot('zero-share');await put('attacker discovery share q','1');await shot('all-attacker');}
}
async function rawStates(n,theme,width,label){
 await open(n,theme,width);const good=await check(label);
 for(const [name,value]of good.snap.parts.filter(([k])=>k.startsWith('slider:'))){const bad=structuredClone(good.snap);bad.parts.find(([k])=>k===name)[1]=value+.25;await open(n,theme,width,stateURL(base+'/',`dist-${n}`,bad));assert.match(await page.locator('.viz-state-notice').innerText(),/could not be restored/);assert.deepEqual((await check(label+' invalid integer')).snap.parts,good.snap.parts);replays++;}
 const bad=structuredClone(good.snap),part=bad.parts.find(([k])=>k.startsWith('input:'));if(part){part[1]=42;await open(n,theme,width,stateURL(base+'/',`dist-${n}`,bad));assert.match(await page.locator('.viz-state-notice').innerText(),/could not be restored/);replays++;}
}
const ids=process.argv.slice(2);let failures=0;
try{for(const n of ids.length?ids:Array.from({length:10},(_,i)=>'6.'+(i+1)))for(const theme of ['light','dark'])for(const width of [1200,320]){
 const label=`dist-${n}-${theme}-${width}`;try{await open(n,theme,width);await vizShot(`${dir}/${label}-viz.png`);const regions=await page.evaluate(()=>Object.fromEntries(['.statement','#idea','.scope','#caption','.viz-readout','#viz'].map(selector=>{const el=document.querySelector(selector),b=el?.getBoundingClientRect();return[selector,b?{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height}:null];})));fs.writeFileSync(`${dir}/${label}-regions.json`,JSON.stringify(regions));await page.screenshot({path:`${dir}/${label}.png`,fullPage:true});await stepEnds(label);await replay(n,theme,width,label+' default');
 if(!process.env.DIST_DEFAULTS){await sliders(n,theme,width,label);await modes(n,theme,width,label);await editedInputs(n,theme,width,label);await boundaries(n,theme,width,label);await rawStates(n,theme,width,label);}if(process.env.DIST_MODELS)await boundaries(n,theme,width,label);groups++;console.log('PASS '+label);console.log(JSON.stringify({groups,actions,replays,minGlyph}));
 }catch(e){if(!process.env.DIST_COLLECT)throw e;failures++;await page.screenshot({path:dir+'/'+label+'-FAIL.png',fullPage:true});console.log('FAIL '+label+' '+e.message);}}
 console.log(JSON.stringify({groups,actions,replays,minGlyph,minMarker,minStroke,minTip,dir,failures,modelChecks}));if(failures)process.exitCode=1;
}catch(e){await page.screenshot({path:dir+'/FAIL.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
function assertModel(q,label){
 if(invalid(q))return;const I=q.inputs,S=q.sliders,C=q.selections,n=q.num,at=q.steps[0]?.i;
 const assertInk=(stage,values)=>assert.deepEqual(q.stageInk[stage],values.flat(Infinity).map(String),label+' actual canvas data');
 const set=a=>a.length?`{${a.join(',')}}`:'∅';const yes=b=>b===null?'not applicable':b?'yes':'NO';let r;
 if(n==='6.1'||n==='6.10'){
  r=H.oralOne({n:S.processes,faulty:S['faulty ID (−1 means none)'],order:S['honest commander order'],sends:I['faulty commander: orders to 1, 2, 3'],relays:I['faulty lieutenant: reports to 1, 2, 3'],rule:C['decision rule']});
  if(n==='6.1')assertInk(1,[['observer','reports','decision'],r.inbox.slice(1).map((a,i)=>[i+1,a.join(' · '),r.decisions[i+1]])]);
  else assertInk(1,[['observer','own order','all reports'],r.inbox.slice(1).map((a,i)=>[i+1,at>=1?r.direct[i+1]:'—',at>=2?a.join(' · '):'—'])]);
  assert(q.read.includes(`validity: ${yes(r.validity)}`)||q.read.includes(`validity ${yes(r.validity)}`));
 }
 if(n==='6.2'){r=H.hexagon(I['inputs around A B C A′ B′ C′']);const a=S['honest adjacent pair'];assert(q.stageInk[1].includes(r.forced[a]===null?'no value for this pair':`both outputs = ${r.forced[a]}`));}
 if(n==='6.3'){
  r=H.eig({input:I['initial bits (3–7 processes)'],f:S['fault bound f'],faults:I['faulty IDs'],mode:C['Byzantine policy'],seed:S['message seed']});const fr=r.frames[at];
  assertInk(1,[['ID','input','root'],r.initial.map((x,i)=>[i,x,fr.phase==='resolve'&&fr.depth===0?r.decisions[i]:'—'])]);assert(q.read.includes(`${r.nodes} stored nodes`));
 }
 if(n==='6.4'){
  r=H.phaseKing({input:I['initial preferences (3–8 bits)'],f:S['fault bound f'],faults:I['faulty IDs'],mode:C['Byzantine policy'],seed:S['message seed']});const fr=r.frames[at],p=fr.phase<0?null:r.phases[fr.phase];
  assertInk(0,[['ID','C⁰','C¹','D⁰','D¹'],r.initial.map((_,i)=>[i,fr.round>=1?p.C[i][0]:'—',fr.round>=1?p.C[i][1]:'—',fr.round>=2?p.D[i][0]:'—',fr.round>=2?p.D[i][1]:'—'])]);
  assertInk(1,[['ID','preference','king action'],r.initial.map((_,i)=>[i,fr.pref[i],fr.round===3?p.keep[i]?'keep':`take ${p.kingSays[i]}`:'pending'])]);
 }
 if(n==='6.5'){
  r=H.graphModel({n:S.vertices,edgeText:I['undirected edges'],source:S.source,target:S.target,faults:I['faulty internal IDs'],bit:S['sent bit']});assertInk(1,[['route','IDs','report'],r.paths.map((p,i)=>[i,p.join('→'),r.reports[i]])]);assert(q.read.includes(`κ=${r.kappa}`));
 }
 if(n==='6.6'){
  r=H.signedBroadcast({n:S.processes,f:S['fault bound f'],faultySender:C.sender==='faulty',input:S['sender input'],mode:C.attack,strict:C['chain length']==='check round',early:C.deadline==='stop at f'});const fr=r.frames[at];
  assertInk(0,[['ID','set','decision'],fr.sets.map((a,i)=>[i,r.bad.includes(i)?'faulty':set(a),r.bad.includes(i)||fr.round<r.deadline?'—':r.decisions[i]])]);
 }
 if(n==='6.7'){
  r=H.quorum({n:S.processes,f:S['fault bound'],A:I['quorum A IDs'],B:I['quorum B IDs'],faults:I['faulty IDs']});assertInk(1,[['intersection lower bound',r.lower],['actual overlap',r.overlap.length],['actual honest overlap',r.honest.length],['honest overlap forced for any ≤ f faults',yes(r.guaranteed)]]);
 }
 if(n==='6.8'){
  r=H.pbft({faulty:S['faulty replica (−1 means none)'],input:S['honest primary request'],proposals:I['faulty primary proposals to 0,1,2,3'],prepareLies:I['faulty backup prepares to 0,1,2,3'],commitLies:I['faulty commits to 0,1,2,3'],isolated:S['isolated receiver in view 0 (−1 none)'],reports:I['three view-change reporter IDs'],replacement:S['replacement request'],violate:C['new primary proposal']==='try replacement'});
  const slot=r.frames[at].slot;if(slot)assertInk(1,[['ID','digest','prepares','commits'],[0,1,2,3].map(i=>[i,slot.pp[i],at>=1?slot.prepares[i].filter(m=>m.value===slot.pp[i]).map(m=>m.sender).join('')||'—':'—',[2,3,5].includes(at)?slot.commits[i].filter(m=>m.value===slot.pp[i]).map(m=>m.sender).join('')||'—':'—'])]);
 }
 if(n==='6.9'){
  r=H.miningRisk(Number(I['attacker discovery share q']),S['fixed deficit / honest confirmations z'],S['finite discovery horizon']);assertInk(1,[['eventual catch-up from a fixed deficit',r.fixed.text],[`catch-up within ${r.horizon} discoveries`,r.finite.text],['Poisson confirmation approximation',r.poisson.text],['exact stopping-time confirmation model',r.exact.text]]);
  const tree=H.blockTree(I['H = honest, A = private, R = release']),fr=tree.frames[at];assert(q.read.includes(`public tip ${fr.publicTip} has work ${fr.nodes[fr.publicTip].work}`));
 }
 modelChecks++;
}
