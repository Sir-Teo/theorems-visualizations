// Real production routes, native controls, text/marker bounds and actual share replay.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
const dir=process.env.INFO_SHOTS||'/tmp/wave6-info-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));let groups=0,actions=0,replays=0,minGlyph=Infinity,minMarker=Infinity,minStroke=Infinity,minTip=Infinity;
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route(/\/assets\/js\/viz\/core\.js$/,async route=>{let body=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');assert.ok(body.includes('try { vizFn(instance.api); }'));body=body.replace('try { vizFn(instance.api); }',`window.__infoRuntime=instance;const makeSteps=instance.api.steps;instance.__steps=[];instance.api.steps=o=>{const S=makeSteps(o);instance.__steps.push(S);return S;};
 for(const kind of ['stage','stage3d']){const create=instance.api[kind];instance.api[kind]=o=>{const s=create(o),begin=s.begin.bind(s),ctx=s.ctx;
 for(const name of ['fillText','strokeText']){const original=ctx[name].bind(ctx);ctx[name]=(str,x,y,...rest)=>{const m=ctx.measureText(String(str)),pad=name==='strokeText'?ctx.lineWidth/2:0;(s.__glyphs||=[]).push({str:String(str),clip:s._clipped?{...s._m}:null,left:x-m.actualBoundingBoxLeft-pad,right:x+m.actualBoundingBoxRight+pad,top:y-m.actualBoundingBoxAscent-pad,bottom:y+m.actualBoundingBoxDescent+pad});return original(str,x,y,...rest);};}
 if(kind==='stage3d'||kind==='stage'){let points=[];const beginPath=ctx.beginPath.bind(ctx);ctx.beginPath=()=>{points=[];return beginPath();};for(const name of ['moveTo','lineTo']){const original=ctx[name].bind(ctx);ctx[name]=(x,y)=>{points.push([x,y]);return original(x,y);};}const arc=ctx.arc.bind(ctx);ctx.arc=(x,y,r,...rest)=>{points.push([x-r,y-r],[x+r,y+r]);return arc(x,y,r,...rest);};for(const name of ['fillRect','strokeRect']){const original=ctx[name].bind(ctx);ctx[name]=(x,y,w,h)=>{const pad=name==='strokeRect'?ctx.lineWidth/2:0;s.__strokeClear=Math.min(s.__strokeClear??Infinity,x-pad,s.W-x-w-pad,y-pad,s.H-y-h-pad);return original(x,y,w,h);};}for(const name of ['stroke','fill']){const original=ctx[name].bind(ctx);ctx[name]=(...args)=>{const pad=name==='stroke'?ctx.lineWidth/2:0;for(const [x,y]of points)s.__strokeClear=Math.min(s.__strokeClear??Infinity,x-pad,s.W-x-pad,y-pad,s.H-y-pad);return original(...args);};}}
 if(kind==='stage'){const axes=s.axes.bind(s);s.axes=()=>{s.__axesView=structuredClone(s.view);return axes();};}
 if(kind==='stage'){const band=s.vband.bind(s);s.vband=(...args)=>{(s.__bands||=[]).push(args);return band(...args);};const arrow=s.arrow.bind(s);s.arrow=(...args)=>{(s.__arrows||=[]).push(args);return arrow(...args);};}const dot=s.dot.bind(s);s.dot=(...args)=>{(s.__dots||=[]).push(args);return dot(...args);};s.begin=()=>{s.__glyphs=[];s.__dots=[];s.__arrows=[];s.__bands=[];s.__strokeClear=Infinity;return begin();};return s;};}try { vizFn(instance.api); }`);await route.fulfill({contentType:'text/javascript',body});});
async function paint(){await page.locator('#viz').scrollIntoViewIfNeeded();await page.evaluate(async()=>{await document.fonts.ready;window.__infoRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function vizShot(path){await page.evaluate(async()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await page.screenshot({path:dir+'/capture-settle.png',fullPage:true});await page.waitForTimeout(100);const clip=await page.locator('#viz').evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});await page.screenshot({path,clip,fullPage:true});}
async function check(label){await paint();const q=await page.evaluate(()=>{const rt=window.__infoRuntime,fields=[],glyphs=[],dots=[],tips=[];for(const s of rt.stages){if(s.o.equal&&Math.abs(s.sx-s.sy)>1e-10)fields.push({equalScale:[s.sx,s.sy]});for(const a of s.__arrows||[])for(const d of s.__dots||[]){if(Array.isArray(d[0]))continue;const r=(d[2]?.r??4)+.75;for(const p of[[a[0],a[1]],[a[2],a[3]]])tips.push(Math.hypot(s.X(p[0])-s.X(d[0]),s.Y(p[1])-s.Y(d[1]))-r);}for(const t of s.__glyphs||[])glyphs.push({...t,clear:Math.min(t.left-(t.clip?.l??0),s.W-(t.clip?.r??0)-t.right,t.top-(t.clip?.t??0),s.H-(t.clip?.b??0)-t.bottom)});for(const args of s.__dots||[]){const three=Array.isArray(args[0]),o=args[three?1:2]||{},r=(o.r??4)+(three?(o.ring===false?0:.7):o.hollow?(o.width??1.8)/2:o.ring===false?0:.75),P=three?s.project(args[0]):[s.X(args[0]),s.Y(args[1])];dots.push({clear:Math.min(P[0]-(s.o.gutter?s._m.l:0),s.W-(s.o.gutter?s._m.r:0)-P[0],P[1]-(s.o.gutter?s._m.t:0),s.H-(s.o.gutter?s._m.b:0)-P[1])-r});}}
 for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout')){const box=el.getBoundingClientRect(),cs=getComputedStyle(el),l=box.left+parseFloat(cs.paddingLeft||0),r=box.right-parseFloat(cs.paddingRight||0),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(node);for(const z of range.getClientRects())if(z.width>1&&(z.left<l-1||z.right>r+1))fields.push({text:node.textContent,left:z.left,right:z.right,l,r});}}
 const snap=rt.state.capture(),ranges=[...document.querySelectorAll('#viz .ctl-slider input[type=range]')],parts=snap.parts.filter(([k])=>k.startsWith('slider:'));
 return{steps:rt.__steps.map(s=>({i:s.i,n:s.n,frame:s.frame})),tips,stroke:Math.min(...rt.stages.map(s=>s.__strokeClear??Infinity)),snap,fields,glyphs,dots,raw:parts.map((p,i)=>[p[1],+ranges[i].value,ranges[i].closest('.ctl-slider').querySelector('output').textContent]),errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,read:document.querySelector('.viz-readout')?.textContent};});
 assert.ok(q.stroke>=-.1,label+' canvas path bounds '+q.stroke);minStroke=Math.min(minStroke,q.stroke);assert.deepEqual(errors,[],label);assert.deepEqual(q.errors,[],label);assert.equal(q.tex,0,label);assert.deepEqual(q.fields,[],label+' rich text bounds');assert.ok(q.overflow<=1,label+' overflow');assert.ok(q.read?.length,label+' readout');for(const S of q.steps){assert.ok(S.i>=0&&S.i<S.n,label+' step bounds');}assert.doesNotMatch(q.read,/NaN|undefined|\[object Object\]/,label);for(const g of q.glyphs){assert.ok(g.clear>=-.1,label+' glyph '+JSON.stringify(g));minGlyph=Math.min(minGlyph,g.clear);}for(const d of q.dots){assert.ok(d.clear>=-.1,label+' marker '+JSON.stringify(d));minMarker=Math.min(minMarker,d.clear);}for(const t of q.tips){assert.ok(t>=-.1,label+' arrow endpoint / marker clearance '+t);minTip=Math.min(minTip,t);}for(const[m,d,t]of q.raw){assert.ok(Math.abs(m-d)<=16*Number.EPSILON*Math.max(1,Math.abs(m)),label+' slider model/DOM');assert.ok(Math.abs(Number(t.replace('−','-'))-m)<=5.1e-4*Math.abs(m),label+' visible slider value '+t+' versus '+m);}return q;}
async function open(n,theme,width,url){await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/info-${n}`);target.searchParams.set('qaTheme',theme);if(url)await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__infoRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);const stale=await page.evaluate(()=>window.__infoRuntime.stages.filter(s=>s.o.axes&&JSON.stringify(s.__axesView)!==JSON.stringify(s.view)).map(s=>({title:s.o.title,axes:s.__axesView,view:s.view})));assert.deepEqual(stale,[],`cold axes ${n}/${theme}/${width}`);return check(`${n}/${theme}/${width}`);}


async function stepEnds(label){const range=page.getByRole('slider',{name:'Step',exact:true});if(!await range.count()||!await range.isEnabled())return;for(const key of ['Home','ArrowRight','ArrowRight','End']){await range.press(key);actions++;await check(label+' step '+key);}}
async function fill(field,raw,label){await field.fill(raw);await page.waitForTimeout(190);actions++;return check(label);}
async function replay(n,theme,width,label){const before=await check(label+' before replay');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();const link=await page.locator('.share-url').inputValue();assert.ok(link.includes(`#/t/info-${n}?s=`));await open(n,theme,width,link);const after=await check(label+' after replay');assert.deepEqual(after.snap.parts,before.snap.parts,label+' replay state');assert.equal(after.read,before.read,label+' replay readout');assert.deepEqual(after.steps,before.steps,label+' replay frame');replays++;return before;}


async function sliders(n,theme,width,label){
 const names=await page.locator('#viz .ctl-slider input[type=range]').evaluateAll(a=>a.map(e=>e.getAttribute('aria-label')));
 for(const name of names){await open(n,theme,width);const slider=page.getByRole('slider',{name,exact:true});if(!await slider.isVisible())continue;const step=await slider.getAttribute('step');assert.ok(step==='any'||step==='1',name+' continuous range must be unsnapped');for(const key of ['Home','End']){await slider.press(key);actions++;await check(label+' '+name+' '+key);}const box=await slider.boundingBox();await page.mouse.click(box.x+box.width*.373,box.y+box.height/2);actions++;await check(label+' fractional '+name);await replay(n,theme,width,label+' fractional '+name);}
}

async function editedInputs(n,theme,width,label){
 const fields=page.locator('#viz .ctl-input input'),names=await fields.evaluateAll(a=>a.map(e=>e.getAttribute('aria-label')));
 for(const name of names){let field=page.getByRole('textbox',{name,exact:true});if(!await field.isVisible())continue;const original=await field.inputValue();
  let good=name.includes('codeword')?'[[1,0],[-1,0],[0,1]]':name.includes('noise variances')?'1 1 8 2':name.includes('sinc')?'1 -2 0 3':'3 0 1 2';
  await fill(field,good,label+' edit '+name);await stepEnds(label);await replay(n,theme,width,label+' edited '+name);field=page.getByRole('textbox',{name,exact:true});
  await fill(field,'',label+' empty '+name);await stepEnds(label);
  await fill(field,'{broken',label+' invalid '+name);if(width===320&&name===names[0]){await vizShot(`${dir}/${label}-invalid.png`);await replay(n,theme,width,label+' invalid');}
  await fill(page.getByRole('textbox',{name,exact:true}),original,label+' restore '+name);
 }
}
async function boundaries(n,theme,width,label){
 const put=async(name,value)=>fill(page.getByRole('textbox',{name,exact:true}),value,label+' boundary '+name);
 const select=async(name,value)=>{await page.getByRole('group',{name,exact:true}).getByRole('button',{name:value,exact:true}).click();actions++;await check(label+' boundary '+value);};
 const shot=async suffix=>{await stepEnds(label+' '+suffix);if(width===320)await vizShot(`${dir}/${label}-${suffix}.png`);await replay(n,theme,width,label+' '+suffix);};
 if(n==='6.1'){await put('cell weights (zeros are allowed)','1');await page.getByRole('slider',{name:'total support length',exact:true}).press('Home');actions++;await shot('negative-entropy');await put('cell weights (zeros are allowed)','0 0');await shot('all-zero');}
 if(n==='6.2'){await put('cell weights (zeros are allowed)','1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1');await page.getByRole('slider',{name:'quantizer step Δ',exact:true}).press('Home');actions++;await shot('fine-quantization');}
 if(n==='6.3'){await select('comparison density','histogram');await put('cell weights (zeros are allowed)','1 0 0 10 0 1');await shot('histogram');await put('cell weights (zeros are allowed)','{broken');await select('comparison density','gaussian');await shot('gaussian-ignores-histogram');assert.doesNotMatch((await check(label)).read,/Use 1/);}
 if(n==='6.4'){await select('constraint','nonnegative mean');await put('cell weights (zeros are allowed)','0 0 0 1');await shot('exponential');await put('cell weights (zeros are allowed)','{broken');await select('constraint','mean only on ℝ');await shot('no-maximizer');assert.match((await check(label)).read,/no maximum/);}
 if(n==='6.5'){await put('X cell weights','1');await put('Y cell weights','1');await shot('triangular');await put('X cell weights','{broken');await select('independent inputs','Gaussians');await shot('gaussian-equality');assert.doesNotMatch((await check(label)).read,/Use 1/);}
 if(n==='6.7'){await page.getByRole('slider',{name:'per-use power budget P',exact:true}).press('Home');actions++;await shot('zero-power');await put('two-use codeword directions (JSON pairs)','[[0,0],[0,0],[0,0]]');await shot('duplicate-codewords');}
 if(n==='6.8'){await put('orthonormal sinc coefficients','0 0 0');await shot('zero-waveform');await put('orthonormal sinc coefficients','10 -10 10 -10 10 -10 10 -10 10 -10 10 -10');await page.getByRole('slider',{name:'bandwidth W',exact:true}).press('End');actions++;await shot('wideband-waveform');}
 if(n==='6.9'){await page.getByRole('slider',{name:'spectral efficiency η = R/W',exact:true}).press('Home');actions++;await shot('zero-efficiency-limit');await page.getByRole('slider',{name:'spectral efficiency η = R/W',exact:true}).press('End');await page.getByRole('slider',{name:'fraction of capacity used',exact:true}).press('Home');actions+=2;await shot('small-capacity-fraction');}
 if(n==='6.10'){await put('positive channel noise variances','1 1 10 10');await shot('ties-and-dry-channels');await page.getByRole('slider',{name:'total power budget',exact:true}).press('Home');actions++;await shot('zero-power');await put('positive channel noise variances','1 2 3 4 5 6 7 8 9 10 11 12');await put('comparison allocation weights','1 1 1 1 1 1 1 1 1 1 1 1');await page.getByRole('slider',{name:'total power budget',exact:true}).press('End');actions++;await shot('twelve-channels');}
}

async function tinyState(n,theme,width,label){
 const names={'6.7':'per-use power budget P','6.9':'spectral efficiency η = R/W','6.10':'total power budget'};
 if(!names[n])return;
 await open(n,theme,width);const q=await check(label+' tiny initial'),snap=structuredClone(q.snap);
 const part=snap.parts.find(([k])=>k.startsWith('slider:')&&k.includes(names[n]));assert.ok(part,`${label} tiny slider key`);part[1]=1e-100;
 // This tiny budget stays below the next floor: initialization and final split only.
 if(n==='6.10')snap.parts.find(([k])=>k.startsWith('steps:'))[1]=[1,2];
 await open(n,theme,width,stateURL(base+'/',`info-${n}`,snap));const actual=await check(label+' tiny restored');
 assert.equal(actual.snap.parts.find(([k])=>k===part[0])[1],1e-100);assert.match(actual.raw.find(([v])=>v===1e-100)?.[2]||'',/e-100/);
 assert.match(actual.read,/1(?:\.0+)?e-100/);await replay(n,theme,width,label+' tiny positive');
 if(width===320)await vizShot(`${dir}/${label}-tiny-positive.png`);
}

const ids=process.argv.slice(2);
try { for (const n of ids.length?ids:['6.1','6.2','6.3','6.4','6.5','6.7','6.8','6.9','6.10']) for(const theme of ['light','dark']) for(const width of [1200,320]) {
 const label=`info-${n}-${theme}-${width}`;await open(n,theme,width);await vizShot(`${dir}/${label}-viz.png`);
 const regions=await page.evaluate(()=>Object.fromEntries(['.statement','#idea','.scope','#caption','.viz-readout','#viz'].map(selector=>{const el=document.querySelector(selector),b=el?.getBoundingClientRect();return[selector,b?{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height}:null];})));fs.writeFileSync(`${dir}/${label}-regions.json`,JSON.stringify(regions));await page.screenshot({path:`${dir}/${label}.png`,fullPage:true});
 if(!process.env.INFO_DEFAULTS){
 await stepEnds(label);await replay(n,theme,width,label+' default');await sliders(n,theme,width,label);
 for(let j=0;j<await page.locator('#viz .seg').count();j++){const seg=page.locator('#viz .seg').nth(j);if(!await seg.isVisible())continue;const buttons=seg.locator('button'),original=await buttons.evaluateAll(a=>a.findIndex(b=>b.classList.contains('on')));for(let k=0;k<await buttons.count();k++){await buttons.nth(k).click();actions++;await check(label+' option '+k);await stepEnds(label+' option '+k);}await buttons.nth(original).click();actions++;await check(label+' restored option');}
 for(const toggle of await page.locator('#viz .ctl-toggle label').all()){if(await toggle.isVisible()){await toggle.click();actions++;await check(label+' toggle');await replay(n,theme,width,label+' toggle');}}
 for(const button of await page.locator('#viz .ctl-button').all()){await button.click();actions++;await check(label+' example');await stepEnds(label+' example');}
 // Reload defaults before independent edits so demonstration buttons cannot retain invalid inputs.
 await open(n,theme,width);await editedInputs(n,theme,width,label);await open(n,theme,width);await boundaries(n,theme,width,label);
 await tinyState(n,theme,width,label);
 const range=page.getByRole('slider',{name:'Step',exact:true});if(await range.count()&&await range.isEnabled()){await range.press('Home');await range.press('ArrowRight');actions+=2;await check(label+' intermediate');if(width===320)await vizShot(`${dir}/${label}-intermediate.png`);}
 const good=await replay(n,theme,width,label+' final'),bad=structuredClone(good.snap),part=bad.parts.find(([k])=>k.startsWith('input:'))||bad.parts.find(([k])=>k.startsWith('slider:'));part[1]=part[0].startsWith('input:')?42:'invalid';await open(n,theme,width,stateURL(base+'/',`info-${n}`,bad));assert.match(await page.locator('.viz-state-notice').innerText(),/could not be restored/);replays++;
 }
 groups++;console.log('PASS '+label);console.log(JSON.stringify({groups,actions,replays,minGlyph}));
 }console.log(JSON.stringify({groups,actions,replays,minGlyph,minMarker,minStroke,minTip,dir}));}
 catch(e){await page.screenshot({path:dir+'/FAIL.png',fullPage:true});throw e;}
 finally{await browser.close();await new Promise(r=>server.close(r));}
