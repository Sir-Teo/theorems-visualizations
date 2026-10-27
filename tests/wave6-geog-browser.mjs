// Production routes, native controls, rich-text bounds and actual state-link replay.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {stateURL} from '../assets/js/share-state.js';
import * as H from '../content/geog/ch08.shared.js';
import {deaths,pumps} from '../content/geog/ch08.snow.js';
const dir=process.env.GEOG_SHOTS||'/tmp/wave6-geog-native';fs.mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:findBrowser(),headless:true});
let actions=0,replays=0,checks=0,layouts=0,invalidReplays=0,rawReplays=0,modelChecks=0;const errors=[];
const page=await browser.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route('**/assets/js/viz/core.js',async route=>{
 let src=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
 const needle='try { vizFn(instance.api); }';assert.ok(src.includes(needle));
 src=src.replace(needle,`window.__geogRuntime=instance;
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
 await page.evaluate(async()=>{await document.fonts.ready;window.__geogRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const q=await page.evaluate(()=>{
  const rt=window.__geogRuntime,issues=[],points=[];
  for(const s of rt.stages)for(const p of s.__points){if(!p||!Number.isFinite(p[0])||!Number.isFinite(p[1]))issues.push({nonfinite:p});else points.push({x:s.X(p[0]),y:s.Y(p[1]),W:s.W,H:s.H});}
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout')){
   const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   while(walk.nextNode()){const n=walk.currentNode;if(n.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1))issues.push({text:n.textContent,left:r.left,right:r.right,container:[left,right]});}
  }
  const ranges=[...document.querySelectorAll('#viz input[type=range]')],state=rt.state.capture(),sliderParts=state.parts.filter(([k])=>k.startsWith('slider:'));
  return {issues,points,state,paths:rt.stages.map(s=>s.__paths),dots:rt.stages.map(s=>s.__dots),id:Number(location.hash.match(/geog-8\.(\d+)/)?.[1]),selections:Object.fromEntries([...document.querySelectorAll('#viz .seg')].map(e=>[e.getAttribute('aria-label'),e.querySelector('button.on')?.textContent])),read:document.querySelector('.viz-readout')?.textContent,errors:[...(window.__vizErrors||[]),...(window.__texErrors||[])],tex:document.querySelectorAll('.katex-error').length,overflow:document.documentElement.scrollWidth-innerWidth,sliders:sliderParts.map(([k,v],i)=>({key:k,model:v,dom:+ranges[i].value,output:ranges[i].closest('.ctl-slider').querySelector('output').textContent}))};
 });
 assert.deepEqual(errors,[],label+' page errors');assert.deepEqual(q.errors,[],label+' visualization errors');assert.equal(q.tex,0,label+' TeX');assert.ok(q.overflow<=1,label+' viewport overflow');assert.deepEqual(q.issues,[],label+' rich text / finite geometry');assert.ok(q.read?.length,label+' readout');assert.doesNotMatch(q.read,/NaN|Infinity|\[object Object\]/,label);
 for(const p of q.points)assert.ok(p.x>=-1&&p.x<=p.W+1&&p.y>=-1&&p.y<=p.H+1,label+' geometry outside canvas '+JSON.stringify(p));
 for(const s of q.sliders)assert.ok(Math.abs(s.model-s.dom)<=16*Number.EPSILON*Math.max(1,Math.abs(s.model)),label+' slider state mismatch '+JSON.stringify(s));
 assertModel(q,label);checks++;return q;
}
function assertModel(q,label){
 const c=q.selections,x=Object.fromEntries(q.sliders.map(s=>[s.key.slice(7,s.key.lastIndexOf(':')),s.model]));
 const numeric=(prefix,expected,absolute=1e-13)=>{const tail=q.read.split(prefix)[1];assert.ok(tail!==undefined,label+' missing '+prefix);if(expected===null)assert.ok(tail.startsWith('not defined'),label+' undefined '+prefix);else{const a=tail.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);assert.ok(a,label+' numeric '+prefix);assert.ok(Math.abs(Number(a[0])-expected)<=5.1e-5*Math.abs(expected)+absolute,label+' value '+prefix+tail+' versus '+expected);}modelChecks++;};
 if(q.id===1){const values=H.field(c['synthetic field'],x['random seed'],4).map(v=>v*x['field amplitude']),pairs=H.pairs(H.grid(4),values);numeric('Mean half-squared difference=',H.sum(pairs.map(p=>p.difference))/pairs.length);}
 if(q.id===2){const z=H.permutation(H.field(c['synthetic arrangement'],12),H.weights(H.grid(),c.neighborhood),x['permutation seed']);numeric('Moran’s I=',z.I);numeric('randomization expectation=',z.expected);numeric('Upper-tail Monte Carlo p=',z.p);
  // Independently fit the actual plotted dots and compare the actual drawn line.
  const dots=q.dots[1],xm=H.sum(dots.map(p=>p[0]))/dots.length,ym=H.sum(dots.map(p=>p[1]))/dots.length,den=H.sum(dots.map(p=>(p[0]-xm)**2));if(den>0){const slope=H.sum(dots.map(p=>(p[0]-xm)*(p[1]-ym)))/den;for(const [xx,yy]of q.paths[1][0]){assert.ok(Math.abs(yy-(ym+slope*(xx-xm)))<2e-12,label+' displayed OLS fit');modelChecks++;}}
 }
 if(q.id===3){const pts=[...H.sites,[x['moving site x'],x['moving site y']]],z=H.nearest(pts,x['query x'],x['query y']);assert.ok(q.read.includes('Nearest site(s): '+z.ties.map(i=>i+1).join(', ')+';'),label+' actual nearest-site ties');modelChecks++;numeric('distance=',z.d);numeric('sum=',H.sum(H.voronoi(pts).map(H.area)));}
 if(q.id===4){const z=c.interpolation==='ordinary kriging'?H.kriging(H.observations,x['query x'],x['query y'],x['covariance range / map units'],x['measurement-error variance']):H.idw(H.observations,x['query x'],x['query y'],x['IDW exponent']);numeric('Prediction=',z.value);numeric('weights sum=',H.sum(z.weights));numeric('latent prediction-error variance=',z.variance);}
 if(q.id===5){const mode=c['decay law'],r=x['selected radius'],length=x['distance scale'],power=x['power-law exponent'],mass=H.radialMass(r,length,mode,power);numeric('K(selected distance)=',H.distanceKernel(r,length,mode,power));numeric('radial integral=',mass);numeric('fraction of the radius-12 disk=',mass/H.radialMass(12,length,mode,power));}
 if(q.id===6){const pts=pumps.map(p=>[p.x,p.y]),i=x['selected pump number']-1,count=deaths.filter(([x,y])=>H.nearest(pts,x,y,c['distance comparison']).index===i).length;assert.ok(q.read.includes(`${count} of 578`)&&q.read.includes(pumps[i].name),label+' historical coordinate assignment');modelChecks++;}
 if(q.id===7){const z=H.adoption({length:x['contact distance scale'],contact:x['social contact intensity'],external:x['external information intensity'],seed:x['random seed'],generations:24}),t=x.generation,count=z.counts[t],fresh=t===0?1:count-z.counts[t-1];assert.ok(q.read.includes(`${count} of 64`)&&q.read.includes(`${fresh} new this generation`),label+' adoption realization');modelChecks++;}
 if(q.id===8){const z=H.urban({length:x['kernel distance scale / cells'],mixing:x['local redistribution fraction'],growth:x['net growth per step'],steps:x['number of steps']});numeric('Population total / initial=',z.total/z.initialTotal);numeric('predicted by net growth=',(1+x['net growth per step'])**x['number of steps']);numeric('mass-balance residual=',z.total-z.initialTotal*(1+x['net growth per step'])**x['number of steps'],3e-10);}
}
async function open(id,theme,width,url){
 errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/geog-8.${id}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>window.__geogRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme,'actual production theme');return check(`${id}/${theme}/${width}`);
}
async function replay(id,theme,width,label){
 const before=await check(label+' before share');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();
 await page.getByRole('button',{name:'Create state link',exact:true}).click();actions++;const url=await page.locator('.share-url').inputValue();assert.ok(url.includes(`#/t/geog-8.${id}?s=`));
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
 const after=await open(id,theme,width,stateURL(base,`geog-8.${id}`,bad));
 assert.deepEqual(after.state.parts,baseState.parts,label+' reject out-of-domain state');
 assert.match(await page.locator('.share-status').innerText(),/could not|invalid|saved|restor/i);invalidReplays++;
 const rawIndex=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.findIndex(e=>e.getAttribute('step')==='any'));
 if(rawIndex<0)return;
 const rawKey=baseState.parts.filter(([k])=>k.startsWith('slider:'))[rawIndex][0];
 const raw=structuredClone(baseState),part=raw.parts.find(([k])=>k===rawKey);part[1]+=.0000123456789;
 const q=await open(id,theme,width,stateURL(base,`geog-8.${id}`,raw));assert.equal(q.state.parts.find(([k])=>k===rawKey)[1],part[1]);rawReplays++;
 await replay(id,theme,width,label+' raw fractional state');
 if(id===3){const critical=structuredClone(baseState),values={'moving site x':2,'moving site y':2.0000000000001,'query x':2,'query y':2};for(const part of critical.parts)if(part[0].startsWith('slider:')){const name=part[0].slice(7,part[0].lastIndexOf(':'));if(name in values)part[1]=values[name];}await open(id,theme,width,stateURL(base,`geog-8.${id}`,critical));await check(label+' near-coincident sites');await replay(id,theme,width,label+' near-coincident sites');}

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
 const ids=process.argv.slice(2).length?process.argv.slice(2).map(Number):Array.from({length:8},(_,i)=>i+1);
 for(const id of ids)for(const theme of ['light','dark'])for(const width of [1200,320]){
  const label=`8.${id}-${theme}-${width}`;await open(id,theme,width);await screenshot(`${dir}/${label}-default.png`);await page.screenshot({path:`${dir}/${label}-full.png`,fullPage:true});if(!process.env.GEOG_DEFAULTS_ONLY)await controls(id,theme,width,label);await savedStates(id,theme,width,label);layouts++;console.log('PASS',label,{actions,replays,checks});
 }
 fs.writeFileSync(`${dir}/result.json`,JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays},null,2));console.log(JSON.stringify({layouts,actions,replays,checks,invalidReplays,rawReplays}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
