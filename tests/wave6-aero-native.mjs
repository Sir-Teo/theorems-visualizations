import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import chapter from '../content/aero/ch06.js';
import syllabus from '../content/aero/syllabus.js';
import {stateURL} from '../assets/js/share-state.js';
import {installAeroProbe,captureAero,aeroScreenshot} from './wave6-aero-browser.shared.mjs';
import {aeroScience} from './wave6-aero-native-science.mjs';
import {criticalCases,rawControls} from './wave6-aero-native-cases.mjs';
const built=JSON.parse(fs.readFileSync(new URL('../data/col/aero.json',import.meta.url))),outline=syllabus.chapters.find(c=>c.n===6).items;
for(const item of chapter.items){const row=outline.find(i=>i.num===item.num);assert.equal(row.pic,item.caption,'preflight: exact researched caption mirror');assert.deepEqual(row.refs,item.refs,'preflight: researched references');assert.equal(built['aero-'+item.num].st,item.statement,'preflight: build matches statement');assert.equal(built['aero-'+item.num].scope,item.scope,'preflight: build matches scope');}
const out=process.env.AERO_SHOTS||'/tmp/wave6-aero-native';fs.mkdirSync(out,{recursive:true});
const ids=(process.env.AERO_ITEMS||'1,2,3,4,5,6,7,8,9,10,11').split(',').map(Number),widths=(process.env.AERO_WIDTHS||'320,1200').split(',').map(Number),themes=(process.env.AERO_THEMES||'light,dark').split(',');
const server=createServer();await new Promise(r=>server.listen(0,r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:320,height:1200},deviceScaleFactor:1});
await installAeroProbe(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const totals={layouts:0,actions:0,shares:0,invalid:0,raw:0,critical:0,checks:0,modelComparisons:0};const rows=[];
const sources=['../content/aero/ch06.js','../content/aero/ch06.viz.js','../content/aero/ch06.shared.js','../content/aero/ch06.exact.shared.js','../content/aero/syllabus.js','../assets/js/viz/core.js','../assets/js/viz/math.js','../assets/js/share-state.js','../data/col/aero.json','../data/index.json','./wave6-aero-native.mjs','./wave6-aero-native-science.mjs','./wave6-aero-native-cases.mjs','./wave6-aero-browser.shared.mjs'];
const sourceHashes=Object.fromEntries(sources.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')]));
const bindings={
 'CG position h / chord':'cg','tail area / wing area':'tailArea','tail incidence / deg':'incidence','required whole-aircraft CL':'targetLift','angle of attack / deg':'alpha','elevator down / deg':'elevator','gust change in angle / deg':'deltaAlpha',
 'trim speed / m per s':'speed','lift / drag ratio':'liftDrag','initial speed change / m per s':'disturbance','pitch stiffness k / s²':'stiffness','pitch damping d / s':'damping','elevator pulse down / deg':'elevator','pulse duration / s':'pulse',
 'fin area scale':'fin','sideslip β / deg':'beta','wing dihedral / deg':'dihedral','fin scale':'fin','attitude gain Kθ / s²':'attitudeGain','rate gain Kq / s':'rateGain','flow-speed parameter V':'speed','equal damping γ':'damping',
 'differential wing incidence / deg':'warp','forward control incidence / deg':'elevator','wind reading overestimate / fraction':'windError','old pressure factor overestimate':'pressureError','old lift factor overestimate':'liftError','unmeasured interference · illustration':'interference'};
function verifyBindings(q,id){
 const sliders=Object.fromEntries(q.state.parts.filter(([k])=>k.startsWith('slider:')).map(([k,v])=>[k.slice(7,k.lastIndexOf(':')),v]));
 const selects=Object.fromEntries(q.state.parts.filter(([k])=>k.startsWith('select:')).map(([k,v])=>[k.slice(7,k.lastIndexOf(':')),v[1][v[0]]]));
 const p=q.model.parameters,clock=q.state.parts.find(([k])=>k.startsWith('clock:'))?.[1]??0;
 for(const[label,value]of Object.entries(sliders))if(bindings[label]){
  if(id===8&&label==='sideslip β / deg')continue;
  if(id===3&&selects.balance==='solved trim'&&q.model.trim.valid&&['alpha','elevator'].includes(bindings[label]))continue;
  assert.equal(p[bindings[label]],value,'exact intended parameter '+label);
 }
 if('selected time / s'in sliders||'selected time / model unit'in sliders){const base=sliders['selected time / s']??sliders['selected time / model unit'],T={4:240,5:10,7:60,9:12,10:12}[id],expected=clock===0?base:(base+clock)%T;assert.equal(id===7?q.lateralTime:p.time,expected,'actual selected physical time');}
 if(id===9)assert.equal(p.mode,selects['pitch control']);
 for(const c of q.controls){const original=sliders[c.label];assert.ok(Math.abs(c.value-original)<=32*Number.EPSILON*Math.max(Math.abs(original),1),c.label+' DOM echo only');}
}
async function check(id,label){
 if(process.env.AERO_STOP_FILE&&fs.existsSync(process.env.AERO_STOP_FILE))throw Error('Native run stopped through its explicit stop file; finally closes browser/server.');
 const q=await captureAero(page);assert.equal(q.drawErrors.length,0,label+' draw error '+q.drawErrors.join(' '));assert.equal(errors.length,0,label+' page errors '+errors.join(' '));assert.equal(q.issues.length,0,label+' ink/geometry '+JSON.stringify(q.issues.slice(0,6)));verifyBindings(q,id);totals.modelComparisons+=aeroScience(id,q);totals.checks++;return q;
}
async function open(id,theme,width,url){
 errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/aero-6.${id}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>document.querySelector('.viz-error')||window.__aeroRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);const q=await check(id,`${id}/${theme}/${width}`);assert.equal(q.theme,theme);return q;
}
async function share(id,theme,width,label){
 const before=await check(id,label+' before Share');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();totals.actions++;const url=await page.locator('.share-url').inputValue();assert.ok(url.includes(`#/t/aero-6.${id}?s=`));const after=await open(id,theme,width,url);assert.deepEqual(after.state.parts,before.state.parts,label+' exact actual Share replay');assert.equal(after.readout,before.readout,label+' identical shared readout');totals.shares++;return after;
}
function intended(baseline,c){const state=structuredClone(baseline);for(const[label,value]of Object.entries(c.sliders??{})){const part=state.parts.find(([k])=>k.startsWith('slider:'+label+':'));assert.ok(part,'case slider '+label);part[1]=value;}for(const[label,value]of Object.entries(c.selects??{})){const part=state.parts.find(([k])=>k.startsWith('select:'+label+':'));assert.ok(part,'case select '+label);const i=part[1][1].indexOf(value);assert.ok(i>=0,'case option '+value);part[1][0]=i;}if(c.clock!==undefined)state.parts.find(([k])=>k.startsWith('clock:'))[1]=c.clock;if(c.camera)state.parts.find(([k])=>k.startsWith('camera:'))[1]=c.camera;return state;}

async function controls(id,theme,width,label){
 const seen=new Set();
 async function sliders(){const names=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));for(const name of names){const el=page.getByRole('slider',{name,exact:true});if(seen.has(name)||!await el.isVisible())continue;seen.add(name);for(const key of['Home','End']){await el.press(key);totals.actions++;await check(id,label+' '+name+' '+key);}await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();await page.mouse.click(b.x+.37*b.width,b.y+b.height/2);totals.actions++;await check(id,label+' native position '+name);await share(id,theme,width,label+' '+name);}}
 await sliders();
 const groups=await page.locator('#viz .seg').evaluateAll(es=>es.map(e=>[e.getAttribute('aria-label'),[...e.querySelectorAll('button')].map(b=>b.textContent)]));
 for(const[name,options]of groups){let group=page.getByRole('group',{name,exact:true});if(!await group.isVisible())continue;const original=await group.locator('button.on').textContent();for(const option of options){group=page.getByRole('group',{name,exact:true});await group.getByRole('button',{name:option,exact:true}).click();totals.actions++;await check(id,label+' '+option);await sliders();await share(id,theme,width,label+' '+option);if(width===320)await aeroScreenshot(page,`${out}/${label}-mode-${option.replace(/[^a-z0-9]/gi,'_')}.png`);}await page.getByRole('group',{name,exact:true}).getByRole('button',{name:original,exact:true}).click();totals.actions++;await check(id,label+' restore '+name);}
 if([7,10,11].includes(id)){const canvas=page.locator('#viz canvas').first();await canvas.scrollIntoViewIfNeeded();const b=await canvas.boundingBox(),before=(await check(id,label+' before camera')).state.parts.find(([k])=>k.startsWith('camera:'))[1];await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.5+35,b.y+b.height*.5+20,{steps:8});await page.mouse.up();totals.actions++;const after=await check(id,label+' actual camera drag');assert.notDeepEqual(after.state.parts.find(([k])=>k.startsWith('camera:'))[1],before);await share(id,theme,width,label+' camera');}
 if([4,5,7,9,10].includes(id)){await page.getByRole('button',{name:'Play animation',exact:true}).click();totals.actions++;await page.waitForTimeout(220);await page.getByRole('button',{name:'Pause animation',exact:true}).click();totals.actions++;const q=await check(id,label+' actual play pause');assert.ok(q.state.parts.find(([k])=>k.startsWith('clock:'))[1]>0,'actual animation clock advanced');await share(id,theme,width,label+' actual nonzero clock');await page.getByRole('button',{name:'Restart animation',exact:true}).click();totals.actions++;assert.equal((await check(id,label+' restart')).state.parts.find(([k])=>k.startsWith('clock:'))[1],0);}
}
function progress(){fs.writeFileSync(out+'/progress.json',JSON.stringify({totals,rows},null,2)+'\n');}
try{
 for(const id of ids)for(const theme of themes)for(const width of widths){
  const label=`${id}-${theme}-${width}`,start={...totals},baseline=await open(id,theme,width);await aeroScreenshot(page,`${out}/${label}-default.png`);
  if(!process.env.AERO_SKIP_CONTROLS)await controls(id,theme,width,label);
  const bad=structuredClone(baseline.state);bad.parts.find(([k])=>k.startsWith('slider:'))[1]=1e99;
  const rejected=await open(id,theme,width,stateURL(base,`aero-6.${id}`,bad));assert.deepEqual(rejected.state.parts,baseline.state.parts,'whole invalid state returns fresh defaults');assert.match(await page.locator('.share-status').innerText(),/could not|invalid|saved|restor/i);totals.invalid++;
  const [rawName,rawValue]=rawControls[id],raw=intended(baseline.state,{sliders:{[rawName]:rawValue}}),rawAfter=await open(id,theme,width,stateURL(base,`aero-6.${id}`,raw));assert.deepEqual(rawAfter.state.parts,raw.parts,'raw binary64 value restored exactly');await share(id,theme,width,label+' raw binary64');totals.raw++;
  let caseNumber=0;
  for(const c of criticalCases[id]){
   const wanted=intended(baseline.state,c),actual=await open(id,theme,width,stateURL(base,`aero-6.${id}`,wanted));assert.deepEqual(actual.state.parts,wanted.parts,c.label+' exact intended components');if(c.status)assert.equal(actual.model.status??actual.model.poles.status,c.status,c.label+' exact model status');await aeroScreenshot(page,`${out}/${label}-critical-${caseNumber}.png`);await share(id,theme,width,label+' critical '+c.label);totals.critical++;caseNumber++;progress();
  }
  totals.layouts++;rows.push({id,theme,width,criticalCases:caseNumber,totals:Object.fromEntries(Object.keys(totals).map(k=>[k,totals[k]-start[k]]))});progress();console.log(JSON.stringify({label,totals}));
 }
 for(const[p,h]of Object.entries(sourceHashes))assert.equal(createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex'),h,'tested source remained frozen: '+p);
 fs.writeFileSync(out+'/summary.json',JSON.stringify({status:'PASS',totals,rows,errors,sourceHashes},null,2)+'\n');
}catch(error){fs.writeFileSync(out+'/failure.txt',String(error.stack||error));try{fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await captureAero(page),null,2));await page.screenshot({path:out+'/failure.png',fullPage:true});}catch{}throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
