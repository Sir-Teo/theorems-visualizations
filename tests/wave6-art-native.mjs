import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import chapter from '../content/art/ch06.js';
import syllabus from '../content/art/syllabus.js';
import {stateURL} from '../assets/js/share-state.js';
import {installArtProbe,captureArt,artScreenshot,artPixels} from './wave6-art-browser.shared.mjs';
import {artScience} from './wave6-art-native-science.mjs';
import {criticalCases,rawControls} from './wave6-art-native-cases.mjs';
const built=JSON.parse(fs.readFileSync(new URL('../data/col/art.json',import.meta.url))),outline=syllabus.chapters.find(c=>c.n===6).items;
for(const item of chapter.items){const row=outline.find(i=>i.num===item.num);assert.equal(row.pic,item.caption,'preflight: exact researched caption mirror');assert.deepEqual(row.refs,item.refs,'preflight: researched references');assert.equal(built['art-'+item.num].st,item.statement,'preflight: build matches statement');assert.equal(built['art-'+item.num].scope,item.scope,'preflight: build matches scope');}
const out=process.env.ART_SHOTS||'/tmp/wave6-art-native';fs.mkdirSync(out,{recursive:true});
const ids=(process.env.ART_ITEMS||'1,2,3,4,5,6,7,8,9,10,11,12,13,14').split(',').map(Number),widths=(process.env.ART_WIDTHS||'320,1200').split(',').map(Number),themes=(process.env.ART_THEMES||'light,dark').split(',');
const server=createServer();await new Promise(r=>server.listen(0,r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),page=await browser.newPage({viewport:{width:320,height:1200},deviceScaleFactor:1});
await installArtProbe(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const totals={layouts:0,actions:0,shares:0,invalid:0,raw:0,critical:0,checks:0,modelComparisons:0,domRangeRounding:0,pixelComparisons:0,customActions:0};const rows=[];
const sources=[...fs.readdirSync(new URL('../content/art/',import.meta.url)).filter(p=>/^ch06(?:\.[a-z]+)*\.js$/.test(p)).map(p=>'../content/art/'+p),'../content/art/syllabus.js','../assets/js/viz/core.js','../assets/js/viz/math.js','../assets/js/share-state.js','../assets/js/app.js','../assets/css/style.css','./fixtures/wave6-art-reference.json','../data/col/art.json','../data/index.json','./wave6-art-native.mjs','./wave6-art-native-science.mjs','./wave6-art-native-cases.mjs','./wave6-art-browser.shared.mjs'];
const sourceHashes=Object.fromEntries(sources.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')]));
async function check(id,label){
 if(process.env.ART_STOP_FILE&&fs.existsSync(process.env.ART_STOP_FILE))throw Error('Native run stopped through its explicit stop file; finally closes browser/server.');
 const q=await captureArt(page);assert.equal(q.drawErrors.length,0,label+' draw error '+q.drawErrors.join(' '));assert.equal(errors.length,0,label+' page errors '+errors.join(' '));assert.equal(q.issues.length,0,label+' ink/geometry '+JSON.stringify(q.issues.slice(0,6)));const science=artScience(id,q,await artPixels(page,id));totals.modelComparisons+=science.modelComparisons;totals.pixelComparisons+=science.pixelComparisons;totals.domRangeRounding+=q.controls.filter(c=>!Object.is(c.value,q.state.parts.find(([k])=>k.startsWith('slider:'+c.label+':'))?.[1])).length;totals.checks++;return q;
}
async function open(id,theme,width,url){
 errors.length=0;await page.setViewportSize({width,height:1200});const target=new URL(url||`${base}/#/t/art-6.${id}`);target.searchParams.set('qaTheme',theme);await page.goto('about:blank');await page.goto(target.href);await page.waitForFunction(()=>document.querySelector('.viz-error')||window.__artRuntime?.readoutFn&&document.querySelector('.viz-readout')?.textContent.length);const q=await check(id,`${id}/${theme}/${width}`);assert.equal(q.theme,theme);return q;
}
async function share(id,theme,width,label){
 const before=await check(id,label+' before Share');if(!await page.locator('.viz-share').evaluate(e=>e.open))await page.locator('.viz-share summary').click();await page.getByRole('button',{name:'Create state link',exact:true}).click();totals.actions++;const url=await page.locator('.share-url').inputValue();assert.ok(url.includes(`#/t/art-6.${id}?s=`));const after=await open(id,theme,width,url);assert.deepEqual(after.state.parts,before.state.parts,label+' exact actual Share replay');assert.equal(after.readout,before.readout,label+' identical shared readout');totals.shares++;return after;
}
function intended(baseline,c){const state=structuredClone(baseline);for(const[label,value]of Object.entries(c.sliders??{})){const part=state.parts.find(([k])=>k.startsWith('slider:'+label+':'));assert.ok(part,'case slider '+label);part[1]=value;}for(const[label,value]of Object.entries(c.selects??{})){const part=state.parts.find(([k])=>k.startsWith('select:'+label+':'));assert.ok(part,'case select '+label);const optionValue=label==='Albers-style exercise'?value==='one'?'One colour, two contexts':'Two colours, similar appearance?':value;const i=part[1][1].findIndex(option=>String(option)===String(optionValue));assert.ok(i>=0,'case option '+value);part[1][0]=i;}for(const[label,value]of Object.entries(c.toggles??{})){const part=state.parts.find(([k])=>k.startsWith('toggle:'+label+':'));assert.ok(part,'case toggle '+label);part[1]=value;}for(const[name,value]of Object.entries(c.custom??{})){const part=state.parts.find(([k])=>k.startsWith('custom:'+name+':'));assert.ok(part,'custom '+name);part[1]=structuredClone(value);}if(c.sliders?.['comparison bridge']!==undefined){const part=state.parts.find(([k])=>k.startsWith('handle:'));if(part)part[1]=[c.sliders['comparison bridge']*8+1,.3];}if(c.clock!==undefined)state.parts.find(([k])=>k.startsWith('clock:'))[1]=c.clock;if(c.camera)state.parts.find(([k])=>k.startsWith('camera:'))[1]=c.camera;return state;}

async function controls(id,theme,width,label){
 const seen=new Set();
 async function sliders(){const names=await page.locator('#viz .ctl-slider input').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));for(const name of names){const el=page.getByRole('slider',{name,exact:true});if(seen.has(name)||!await el.isVisible())continue;seen.add(name);for(const key of['Home','End']){await el.press(key);totals.actions++;await check(id,label+' '+name+' '+key);}await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();await page.mouse.click(b.x+.37*b.width,b.y+b.height/2);totals.actions++;await check(id,label+' native position '+name);await share(id,theme,width,label+' '+name);}}
 await sliders();
 const toggles=await page.locator('#viz .ctl-toggle').evaluateAll(es=>es.map(e=>e.textContent.trim()));
 for(const name of toggles){const el=page.getByLabel(name,{exact:true});if(!await el.isVisible())continue;const original=await el.isChecked();for(const value of[!original,original]){if(await el.isChecked()!==value)await el.locator('..').click();assert.equal(await el.isChecked(),value,'visible native switch toggled');totals.actions++;await check(id,label+' native toggle '+name+' '+value);await share(id,theme,width,label+' toggle '+name);if(width===320)await artScreenshot(page,`${out}/${label}-toggle-${name.replace(/[^a-z0-9]/gi,'_')}-${value}.png`);}}
 const groups=await page.locator('#viz .seg').evaluateAll(es=>es.map(e=>[e.getAttribute('aria-label'),[...e.querySelectorAll('button')].map(b=>b.textContent)]));
 for(const[name,options]of groups){let group=page.getByRole('group',{name,exact:true});if(!await group.isVisible())continue;const original=await group.locator('button.on').textContent();for(const option of options){group=page.getByRole('group',{name,exact:true});await group.getByRole('button',{name:option,exact:true}).click();totals.actions++;await check(id,label+' '+option);await sliders();await share(id,theme,width,label+' '+option);if(width===320)await artScreenshot(page,`${out}/${label}-mode-${name.replace(/[^a-z0-9]/gi,'_')}-${option.replace(/[^a-z0-9]/gi,'_')}.png`);}await page.getByRole('group',{name,exact:true}).getByRole('button',{name:original,exact:true}).click();totals.actions++;await check(id,label+' restore '+name);}

}
async function animation(id,theme,width,label){
 if(id!==13)return;
 const before=await check(id,label+' before animation'),beforePixels=await artPixels(page,id);
 await page.getByRole('button',{name:'Play animation',exact:true}).click();totals.actions++;await page.waitForTimeout(650);await page.getByRole('button',{name:'Pause animation',exact:true}).click();totals.actions++;
 const moved=await check(id,label+' actual clock advance');assert.ok(moved.state.parts.find(([k])=>k.startsWith('clock:'))[1]>0);assert.notDeepEqual((await artPixels(page,id)).filter(p=>p.tag==='colour').map(p=>p.rgba),beforePixels.filter(p=>p.tag==='colour').map(p=>p.rgba),'actual colour stripe pixels move with the clock');await share(id,theme,width,label+' paused animation');
 await page.getByRole('button',{name:'Restart animation',exact:true}).click();totals.actions++;const reset=await check(id,label+' animation reset');assert.equal(reset.state.parts.find(([k])=>k.startsWith('clock:'))[1],0);assert.deepEqual(await artPixels(page,id),beforePixels,'restart restores actual raster phase');
}
async function customControls(id,theme,width,label){
 if([3,4,14].includes(id)){
  await page.locator('#viz canvas').first().scrollIntoViewIfNeeded();const p=await page.evaluate(()=>{const s=window.__artRuntime.stages[0],h=s.handles[0],b=s.canvas.getBoundingClientRect();return{x:b.x+s.X(h.x),y:b.y+s.Y(h.y),end:b.x+s.X(7.3)};});
  const before=await check(id,label+' before physical drag');await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.end,p.y,{steps:8});await page.mouse.up();totals.actions++;totals.customActions++;const after=await check(id,label+' physical comparison bridge');assert.notDeepEqual(after.state.parts,before.state.parts);await share(id,theme,width,label+' dragged bridge');if(width===320)await artScreenshot(page,`${out}/${label}-custom-bridge.png`);
 }
 if(id===8){await page.locator('#viz canvas').first().scrollIntoViewIfNeeded();const p=await page.evaluate(()=>{const s=window.__artRuntime.stages[0],b=s.canvas.getBoundingClientRect();return{x:b.x+s.X(8.8),y:b.y+s.Y(6.3)};});await page.mouse.click(p.x,p.y);totals.actions++;totals.customActions++;const q=await check(id,label+' actual Mondrian click');assert.equal(q.state.parts.find(([k])=>k.startsWith('slider:selected Mondrian patch:'))[1],12);await share(id,theme,width,label+' selected patch');if(width===320)await artScreenshot(page,`${out}/${label}-custom-selected-patch.png`);}
 for(const name of id===11?['Set gray to equal Y']:id===13?['Use nearest-byte CIE Y match']:[]){await page.getByRole('slider',{name:id===11?'your gray choice: linear Y':'green channel byte',exact:true}).press('End');totals.actions++;const before=await check(id,label+' before matching button');await page.getByRole('button',{name,exact:true}).click();totals.actions++;totals.customActions++;const matched=await check(id,label+' '+name);assert.notDeepEqual(matched.state.parts,before.state.parts,'matching button changes the prepared unequal state');await share(id,theme,width,label+' '+name);if(width===320)await artScreenshot(page,`${out}/${label}-custom-match.png`);}
}
function progress(){fs.writeFileSync(out+'/progress.json',JSON.stringify({totals,rows},null,2)+'\n');}
try{
 for(const id of ids)for(const theme of themes)for(const width of widths){
  const label=`${id}-${theme}-${width}`,start={...totals},baseline=await open(id,theme,width);await artScreenshot(page,`${out}/${label}-default.png`);
  if(!process.env.ART_SKIP_CONTROLS){await customControls(id,theme,width,label);await controls(id,theme,width,label);await animation(id,theme,width,label);}
  const custom=baseline.state.parts.find(([k])=>k.startsWith('custom:'));
  if(custom){for(const value of custom[0].includes('tap-offsets')?[[0,0],[1,2]]:['1','x'.repeat(24)]){const invalid=structuredClone(baseline.state);invalid.parts.find(([k])=>k===custom[0])[1]=value;invalid.parts.find(([k])=>k.startsWith('clock:'))[1]=1.25;const restored=await open(id,theme,width,stateURL(base,`art-6.${id}`,invalid));assert.deepEqual(restored.state.parts,baseline.state.parts,'invalid custom component rejects the whole payload');totals.invalid++;}}
 const bad=structuredClone(baseline.state),invalidSlider=bad.parts.find(([k])=>k.startsWith('slider:'));if(invalidSlider)invalidSlider[1]=1e99;else bad.parts.find(([k])=>k.startsWith('select:'))[1][0]=1e99;
  const rejected=await open(id,theme,width,stateURL(base,`art-6.${id}`,bad));assert.deepEqual(rejected.state.parts,baseline.state.parts,'whole invalid state returns fresh defaults');assert.match(await page.locator('.share-status').innerText(),/could not|invalid|saved|restor/i);totals.invalid++;if(invalidSlider&&baseline.controls[0].step===1){const fractional=structuredClone(baseline.state);fractional.parts.find(([k])=>k.startsWith('slider:'))[1]=baseline.controls[0].min+.5;const fallback=await open(id,theme,width,stateURL(base,`art-6.${id}`,fractional));assert.deepEqual(fallback.state.parts,baseline.state.parts,'fractional integer-control payload rejected whole');totals.invalid++;}
  if(rawControls[id]){const [rawName,rawValue]=rawControls[id],raw=intended(baseline.state,{sliders:{[rawName]:rawValue}}),rawAfter=await open(id,theme,width,stateURL(base,`art-6.${id}`,raw));assert.deepEqual(rawAfter.state.parts,raw.parts,'raw binary64 value restored exactly');await share(id,theme,width,label+' raw binary64');totals.raw++;}
  let caseNumber=0;
  for(const c of process.env.ART_SKIP_CRITICAL?[]:criticalCases[id]){
   const wanted=intended(baseline.state,c),actual=await open(id,theme,width,stateURL(base,`art-6.${id}`,wanted));assert.deepEqual(actual.state.parts,wanted.parts,c.label+' exact intended components');await artScreenshot(page,`${out}/${label}-critical-${caseNumber}.png`);await share(id,theme,width,label+' critical '+c.label);totals.critical++;caseNumber++;progress();
  }
  totals.layouts++;rows.push({id,theme,width,criticalCases:caseNumber,totals:Object.fromEntries(Object.keys(totals).map(k=>[k,totals[k]-start[k]]))});progress();console.log(JSON.stringify({label,totals}));
 }
 for(const[p,h]of Object.entries(sourceHashes))assert.equal(createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex'),h,'tested source remained frozen: '+p);
 fs.writeFileSync(out+'/summary.json',JSON.stringify({status:'PASS',totals,rows,errors,sourceHashes},null,2)+'\n');
}catch(error){fs.writeFileSync(out+'/failure.txt',String(error.stack||error));try{fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await captureArt(page),null,2));await page.screenshot({path:out+'/failure.png',fullPage:true});}catch{}throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
