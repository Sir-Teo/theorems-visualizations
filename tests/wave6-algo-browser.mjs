// Real production routes, native controls, text/marker bounds and actual share replay.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
const dir=process.env.ALGO_SHOTS||'/tmp/wave6-algo-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));let groups=0,actions=0,replays=0,minGlyph=Infinity,minMarker=Infinity,minStroke=Infinity,minTip=Infinity;
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route(/\/assets\/js\/viz\/core\.js$/,async route=>{let body=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');assert.ok(body.includes('try { vizFn(instance.api); }'));body=body.replace('try { vizFn(instance.api); }',`window.__algoRuntime=instance;const makeSteps=instance.api.steps;instance.__steps=[];instance.api.steps=o=>{const S=makeSteps(o);instance.__steps.push(S);return S;};
 for(const kind of ['stage','stage3d']){const create=instance.api[kind];instance.api[kind]=o=>{const s=create(o),begin=s.begin.bind(s),ctx=s.ctx;
 for(const name of ['fillText','strokeText']){const original=ctx[name].bind(ctx);ctx[name]=(str,x,y,...rest)=>{const m=ctx.measureText(String(str)),pad=name==='strokeText'?ctx.lineWidth/2:0;(s.__glyphs||=[]).push({str:String(str),clip:s._clipped?{...s._m}:null,left:x-m.actualBoundingBoxLeft-pad,right:x+m.actualBoundingBoxRight+pad,top:y-m.actualBoundingBoxAscent-pad,bottom:y+m.actualBoundingBoxDescent+pad});return original(str,x,y,...rest);};}
 if(kind==='stage3d'){let points=[];const beginPath=ctx.beginPath.bind(ctx);ctx.beginPath=()=>{points=[];return beginPath();};for(const name of ['moveTo','lineTo']){const original=ctx[name].bind(ctx);ctx[name]=(x,y)=>{points.push([x,y]);return original(x,y);};}for(const name of ['stroke','fill']){const original=ctx[name].bind(ctx);ctx[name]=(...args)=>{const pad=name==='stroke'?ctx.lineWidth/2:0;for(const [x,y]of points)s.__strokeClear=Math.min(s.__strokeClear??Infinity,x-pad,s.W-x-pad,y-pad,s.H-y-pad);return original(...args);};}}
 if(kind==='stage'){const axes=s.axes.bind(s);s.axes=()=>{s.__axesView=structuredClone(s.view);return axes();};}
 if(kind==='stage'){const band=s.vband.bind(s);s.vband=(...args)=>{(s.__bands||=[]).push(args);return band(...args);};const arrow=s.arrow.bind(s);s.arrow=(...args)=>{(s.__arrows||=[]).push(args);return arrow(...args);};}const dot=s.dot.bind(s);s.dot=(...args)=>{(s.__dots||=[]).push(args);return dot(...args);};s.begin=()=>{s.__glyphs=[];s.__dots=[];s.__arrows=[];s.__bands=[];s.__strokeClear=Infinity;return begin();};return s;};}try { vizFn(instance.api); }`);await route.fulfill({contentType:'text/javascript',body});});
async function paint(){await page.locator('#viz').scrollIntoViewIfNeeded();await page.evaluate(async()=>{await document.fonts.ready;window.__algoRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function vizShot(path){await page.evaluate(async()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});const clip=await page.locator('#viz').evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});await page.screenshot({path,clip,fullPage:true});}
async function check(label){await paint();const q=await page.evaluate(()=>{const rt=window.__algoRuntime,fields=[],glyphs=[],dots=[],tips=[];for(const s of rt.stages){if(s.o.equal&&Math.abs(s.sx-s.sy)>1e-10)fields.push({equalScale:[s.sx,s.sy]});for(const a of s.__arrows||[])for(const d of s.__dots||[]){if(Array.isArray(d[0]))continue;const r=(d[2]?.r??4)+.75;for(const p of[[a[0],a[1]],[a[2],a[3]]])tips.push(Math.hypot(s.X(p[0])-s.X(d[0]),s.Y(p[1])-s.Y(d[1]))-r);}for(const t of s.__glyphs||[])glyphs.push({...t,clear:Math.min(t.left-(t.clip?.l??0),s.W-(t.clip?.r??0)-t.right,t.top-(t.clip?.t??0),s.H-(t.clip?.b??0)-t.bottom)});for(const args of s.__dots||[]){const three=Array.isArray(args[0]),o=args[three?1:2]||{},r=(o.r??4)+(three?(o.ring===false?0:.7):o.hollow?(o.width??1.8)/2:o.ring===false?0:.75),P=three?s.project(args[0]):[s.X(args[0]),s.Y(args[1])];dots.push({clear:Math.min(P[0]-(s.o.gutter?s._m.l:0),s.W-(s.o.gutter?s._m.r:0)-P[0],P[1]-(s.o.gutter?s._m.t:0),s.H-(s.o.gutter?s._m.b:0)-P[1])-r});}}
 for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout')){const box=el.getBoundingClientRect(),cs=getComputedStyle(el),l=box.left+parseFloat(cs.paddingLeft||0),r=box.right-parseFloat(cs.paddingRight||0),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(node);for(const z of range.getClientRects())if(z.width>1&&(z.left<l-1||z.right>r+1))fields.push({text:node.textContent,left:z.left,right:z.right,l,r});}}
 const snap=rt.state.capture(),ranges=[...document.querySelectorAll('#viz input[type=range]')],parts=snap.parts.filter(([k])=>k.startsWith('slider:'));
 return{steps:rt.__steps.map(s=>({i:s.i,n:s.n,frame:s.frame})),tips,stroke:Math.min(...rt.stages.map(s=>s.__strokeClear??Infinity)),snap,fields,glyphs,dots,raw:parts.map((p,i)=>[p[1],+ranges[i].value,ranges[i].closest('.ctl-slider').querySelector('output').textContent]),errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,read:document.querySelector('.viz-readout')?.textContent};});
 assert.ok(q.stroke>=-.1,label+' 3D path bounds '+q.stroke);minStroke=Math.min(minStroke,q.stroke);assert.deepEqual(errors,[],label);assert.deepEqual(q.errors,[],label);assert.equal(q.tex,0,label);assert.deepEqual(q.fields,[],label+' rich text bounds');assert.ok(q.overflow<=1,label+' overflow');assert.ok(q.read?.length,label+' readout');for(const S of q.steps){assert.ok(S.i>=0&&S.i<S.n,label+' step bounds');}assert.doesNotMatch(q.read,/NaN|\[object Object\]/,label);for(const g of q.glyphs){assert.ok(g.clear>=-.1,label+' glyph '+JSON.stringify(g));minGlyph=Math.min(minGlyph,g.clear);}for(const d of q.dots){assert.ok(d.clear>=-.1,label+' marker '+JSON.stringify(d));minMarker=Math.min(minMarker,d.clear);}for(const t of q.tips){assert.ok(t>=-.1,label+' arrow endpoint / marker clearance '+t);minTip=Math.min(minTip,t);}for(const[m,d,t]of q.raw){assert.ok(Math.abs(m-d)<=16*Number.EPSILON*Math.max(1,Math.abs(m)),label+' slider model/DOM');assert.ok(Math.abs(Number(t.replace('−','-'))-m)<=5.1e-4*Math.abs(m),label+' visible slider value '+t+' versus '+m);}return q;}
async function open(n,theme,width,url){await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/algo-${n}`);target.searchParams.set('qaTheme',theme);if(url)await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__algoRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);const stale=await page.evaluate(()=>window.__algoRuntime.stages.filter(s=>s.o.axes&&JSON.stringify(s.__axesView)!==JSON.stringify(s.view)).map(s=>({title:s.o.title,axes:s.__axesView,view:s.view})));assert.deepEqual(stale,[],`cold axes ${n}/${theme}/${width}`);return check(`${n}/${theme}/${width}`);}


async function stepEnds(label){const range=page.getByRole('slider',{name:'Step',exact:true});if(!await range.count()||!await range.isEnabled())return;for(const key of ['Home','ArrowRight','ArrowRight','End']){await range.press(key);actions++;await check(label+' step '+key);}}
async function fill(field,raw,label){await field.fill(raw);await page.waitForTimeout(190);actions++;return check(label);}
async function replay(n,theme,width,label){const before=await check(label+' before replay');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();const link=await page.locator('.share-url').inputValue();assert.ok(link.includes(`#/t/algo-${n}?s=`));await open(n,theme,width,link);const after=await check(label+' after replay');assert.deepEqual(after.snap.parts,before.snap.parts,label+' replay state');assert.equal(after.read,before.read,label+' replay readout');assert.deepEqual(after.steps,before.steps,label+' replay frame');replays++;return before;}
async function editedInputs(n,theme,width,label){
 const fields=page.locator('#viz .ctl-input input'),initial=await fields.evaluateAll(a=>a.map(e=>e.value));
 for(let i=0;i<await fields.count();i++){const field=fields.nth(i);if(!await field.isVisible())continue;const dictionary=(await field.getAttribute('aria-label')).startsWith('Dictionary');
  await fill(field,JSON.stringify(dictionary?['','a','a','😀','a$<b>']:'a$<b>😀\n'),label+' Unicode edit');await stepEnds(label);await replay(n,theme,width,label+' Unicode');
  await fill(fields.nth(i),JSON.stringify(dictionary?[]:''),label+' empty input');await stepEnds(label);
  const invalid=await fill(fields.nth(i),'{broken',label+' invalid JSON');assert.match(invalid.read,/JSON/);if(i===0){if(width===320)await vizShot(`${dir}/${label}-invalid.png`);await replay(n,theme,width,label+' invalid');}
  const over=await fill(fields.nth(i),JSON.stringify(dictionary?Array(9).fill('a'):'a'.repeat(40)),label+' oversized');assert.match(over.read,/at most/);
  await fill(fields.nth(i),initial[i],label+' restore input');
 }
}
async function maxInputs(n,theme,width,label){
 const fields=page.locator('#viz .ctl-input input');
 for(let i=0;i<await fields.count();i++){const field=fields.nth(i);if(!await field.isVisible())continue;const name=await field.getAttribute('aria-label');let value;
  if(name.startsWith('Dictionary'))value=Array.from({length:8},(_,j)=>String.fromCharCode(97+j)+'zzzzz');
  else if(name.includes('Suffix-trie'))value='abcdefgh';
  else if(name.startsWith('Pattern'))value=name.includes('16')?'aaaaaaabaaaaaaab':'abababababac';
  else if(name.startsWith('Text'))value=name.includes('32')?(n==='13.13'?'x'.repeat(32):'ab'.repeat(16)):'$😀a$😀a$😀a$😀$';
  else if(name.startsWith('First'))value='a'.repeat(11)+'b';
  else if(name.startsWith('Second'))value='b'+'a'.repeat(11);
  else value=n==='13.8'?'':'$';
  await fill(field,JSON.stringify(value),label+' maximum valid '+name);
 }
 if(n==='13.3'){await page.locator('#viz .seg').getByRole('button',{name:'31',exact:true}).click();actions++;}
 if(n==='13.5'){await page.locator('#viz .seg').getByRole('button',{name:'16',exact:true}).click();actions++;}
 await stepEnds(label+' maximum');let q=await check(label+' maximum');assert.doesNotMatch(q.read,/Input needs correction|at most .*not truncated/);
 if(width===320)await vizShot(`${dir}/${label}-maximum.png`);await replay(n,theme,width,label+' maximum');
 if(['13.6','13.7','13.11'].includes(n)){
  const index=await page.evaluate(n=>window.__algoRuntime.__steps[0].frames.findIndex(f=>n==='13.11'?f.kind==='reuse'&&f.h>0:f.kind==='fallback'),n);
  assert.ok(index>=0,label+' substantive event exists');const range=page.getByRole('slider',{name:'Step',exact:true});await range.press('Home');actions++;for(let i=0;i<index;i++){await range.press('ArrowRight');actions++;}await check(label+' substantive event');if(width===320)await vizShot(`${dir}/${label}-substantive.png`);await replay(n,theme,width,label+' substantive');
 }
 if(n==='13.8'){
  await page.locator('#viz .seg').getByRole('button',{name:'suffix trie',exact:true}).click();actions++;await fill(page.getByRole('textbox',{name:'Suffix-trie text (JSON, max 8)',exact:true}),JSON.stringify('abcdefgh'),label+' suffix maximum');await stepEnds(label);await check(label+' suffix maximum');if(width===320)await vizShot(`${dir}/${label}-suffix-maximum.png`);await replay(n,theme,width,label+' suffix maximum');
 }
 if(n==='13.13'){
  await fill(page.getByRole('textbox',{name:'Text (JSON, max 32)',exact:true}),JSON.stringify('a'.repeat(32)),label+' output-rich text');await fill(page.getByRole('textbox',{name:'Dictionary (JSON array, ≤8 words)',exact:true}),JSON.stringify(Array.from({length:8},(_,i)=>'a'.repeat(i))),label+' output-rich dictionary');await stepEnds(label);q=await check(label+' output-rich');assert.match(q.read,/first 16 shown here/);if(width===320)await vizShot(`${dir}/${label}-output-rich.png`);await replay(n,theme,width,label+' output-rich');
 }
}
const ids=process.argv.slice(2);
try { for (const n of ids.length?ids:Array.from({length:13},(_,i)=>'13.'+(i+1))) for(const theme of ['light','dark']) for(const width of [1200,320]) {
 const label=`algo-${n}-${theme}-${width}`;await open(n,theme,width);await vizShot(`${dir}/${label}-viz.png`);
 const regions=await page.evaluate(()=>Object.fromEntries(['.statement','#idea','.scope','#caption','.viz-readout','#viz'].map(selector=>{const el=document.querySelector(selector),b=el?.getBoundingClientRect();return[selector,b?{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height}:null];})));fs.writeFileSync(`${dir}/${label}-regions.json`,JSON.stringify(regions));await page.screenshot({path:`${dir}/${label}.png`,fullPage:true});
 if(!process.env.ALGO_DEFAULTS){
  await stepEnds(label);
  for(let j=0;j<await page.locator('#viz .seg').count();j++){const seg=page.locator('#viz .seg').nth(j);if(!await seg.isVisible())continue;const buttons=seg.locator('button'),original=await buttons.evaluateAll(a=>a.findIndex(b=>b.classList.contains('on')));for(let k=0;k<await buttons.count();k++){await buttons.nth(k).click();actions++;await check(label+' option '+k);await stepEnds(label+' option '+k);}await buttons.nth(original).click();await check(label+' restored option');}
  for(const b of await page.locator('#viz .ctl-button').all()){await b.click();actions++;await check(label+' example');await stepEnds(label+' example');}
  await editedInputs(n,theme,width,label);
  await maxInputs(n,theme,width,label);
  const range=page.getByRole('slider',{name:'Step',exact:true});if(await range.count()&&await range.isEnabled()){await range.press('Home');await range.press('ArrowRight');actions+=2;await check(label+' intermediate');if(width===320)await vizShot(`${dir}/${label}-intermediate.png`);}
  const good=await replay(n,theme,width,label+' final');const bad=structuredClone(good.snap);bad.parts.find(([key])=>key.startsWith('input:'))[1]=42;await open(n,theme,width,stateURL(base+'/',`algo-${n}`,bad));assert.match(await page.locator('.viz-state-notice').innerText(),/could not be restored/);replays++;
 }
 groups++;console.log('PASS '+label);console.log(JSON.stringify({groups,actions,replays,minGlyph}));
 }console.log(JSON.stringify({groups,actions,replays,minGlyph,minMarker,minTip,dir}));}
 catch(e){await page.screenshot({path:dir+'/FAIL.png',fullPage:true});throw e;}
 finally{await browser.close();await new Promise(r=>server.close(r));}
