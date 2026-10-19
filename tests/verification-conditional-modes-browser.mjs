// Supplemental conditional-control coverage; the shared checker is intentionally unchanged.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
import {externalContentHashes} from '../scripts/verification-external-imports.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),value=(name,fallback)=>args.find(x=>x.startsWith(name+'='))?.slice(name.length+1)??fallback;
const themeArg=value('--theme','both');assert.ok(['light','dark','both'].includes(themeArg),'--theme must be light, dark or both');
const themes=themeArg==='both'?['light','dark']:[themeArg];
const selected=args.filter(x=>!x.startsWith('--'));
const inventoryPath=join(ROOT,'docs/verification/conditional-control-inventory.json');
const inventory=JSON.parse(readFileSync(inventoryPath,'utf8'));
const targets=inventory.items.filter(x=>!selected.length||selected.includes(x.id));
assert.ok(targets.length,'No conditional inventory targets selected');
for(const id of selected)assert.ok(targets.some(x=>x.id===id),'Unknown inventory ID '+id);
const reportPath=resolve(value('--report',`/tmp/atlas-conditional-${themeArg}.json`));
const shotDir=resolve(value('--shots-dir',join(dirname(reportPath),'conditional',themeArg)));
const maxStates=Number(value('--max-states','400')),maxDepth=Number(value('--max-depth','8'));
assert.ok(maxStates>0&&maxDepth>0);
mkdirSync(dirname(reportPath),{recursive:true});mkdirSync(shotDir,{recursive:true});
const hashFiles=files=>{const h=createHash('sha256');for(const file of [...files].sort()){h.update(file);h.update(readFileSync(join(ROOT,file)));}return h.digest('hex');};
const commonFiles=['scripts/check.mjs','scripts/browser.mjs','scripts/serve.mjs','scripts/verification-external-imports.mjs','tests/verification-conditional-modes-browser.mjs','docs/verification/conditional-control-inventory.json','tools/harness.html','data/atlas.css',
 ...readdirSync(join(ROOT,'assets/js/viz'),{recursive:true}).filter(x=>x.endsWith('.js')).map(x=>'assets/js/viz/'+x),
 ...readdirSync(join(ROOT,'assets/css'),{recursive:true}).filter(x=>x.endsWith('.css')).map(x=>'assets/css/'+x)];
const runtimeHash=()=>hashFiles(commonFiles);
const inputs=item=>({contentHash:hashFiles(readdirSync(join(ROOT,'content',item.id.split('-')[0])).filter(x=>x.endsWith('.js')).map(x=>`content/${item.id.split('-')[0]}/${x}`)),externalContentHashes:externalContentHashes(item.id.split('-')[0],{root:ROOT}),runtimeHash:runtimeHash()});
const report={schemaVersion:1,startedAt:new Date().toISOString(),complete:false,theme:themeArg,targets:targets.map(x=>x.id),inventoryHash:hashFiles(['docs/verification/conditional-control-inventory.json']),runnerHash:hashFiles(['tests/verification-conditional-modes-browser.mjs']),
 scope:{controls:'segmented choices and checkbox toggles; explicit inventory range/text triggers only',traversal:'individual default-visible alternatives, recursively only newly exposed controls or changed option signatures; parent selections restored',excluded:'Cartesian products of independent siblings; general text, ranges, ordinary buttons, pointer exploration except listed bounded triggers',assets:'pinned local KaTeX 0.16.11',settling:'fonts, visible layout, double animation frames, completed CSS transitions',browserWorkers:1,screenshotsManuallyInspected:false},results:[]};
const resumePath=value('--resume',null),resumeRows=new Map();
if(resumePath){
 const previous=JSON.parse(readFileSync(resolve(resumePath),'utf8'));
 for(const key of ['theme','inventoryHash','runnerHash'])assert.equal(previous[key],report[key],`Resume report ${key} mismatch`);
 for(const row of previous.results||[])resumeRows.set(`${row.id}|${row.theme}`,row);
 report.resume={path:resolve(resumePath),startedAt:previous.startedAt,resumedItemThemes:0,invalidated:[]};
}
const save=()=>{report.counts={processedItemThemes:report.results.length,expectedItemThemes:targets.length*themes.length,rootVisibleStates:report.results.reduce((n,x)=>n+x.counts.rootVisibleStates,0),newConditionalStates:report.results.reduce((n,x)=>n+x.counts.newConditionalStates,0),restorationStates:report.results.reduce((n,x)=>n+x.counts.restorationStates,0),unresolvedControls:report.results.reduce((n,x)=>n+x.unresolvedControls.length,0),failedItemThemes:report.results.filter(x=>x.status==='failed').length};writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');};
save();
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;window.dispatchEvent(new Event('vizpause'));document.querySelector('#viz')?.scrollIntoView({block:'start'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().filter(a=>typeof CSSTransition!=='undefined'&&a instanceof CSSTransition&&a.playState==='running').map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function controls(page){return page.evaluate(()=>{
 const state=window.__conditionalAudit??={next:0,ids:new WeakMap()};
 const text=el=>{const c=el.cloneNode(true);c.querySelectorAll('.katex-mathml').forEach(x=>x.remove());return(c.textContent||'').replace(/\s+/g,' ').trim();};
 const visible=el=>{if(!el||!el.getClientRects().length)return false;for(let e=el;e&&e!==document;e=e.parentElement){const s=getComputedStyle(e);if(e.hidden||s.display==='none'||s.visibility==='hidden')return false;}return true;};
 return [...document.querySelectorAll('#viz .seg,#viz .ctl-toggle')].map(el=>{let key=state.ids.get(el);if(!key){key='c'+state.next++;state.ids.set(el,key);el.dataset.conditionalAudit=key;}
  const toggle=el.classList.contains('ctl-toggle'),input=el.querySelector('input[type=checkbox]'),buttons=toggle?[]:[...el.querySelectorAll('button')];
  const options=toggle?[{label:'off',visible:true,disabled:false},{label:'on',visible:true,disabled:false}]:buttons.map(b=>({label:text(b),visible:visible(b),disabled:b.disabled}));
  return {key,kind:toggle?'toggle':'segmented',label:toggle?text(el.querySelector('.ctl-label')||el):el.getAttribute('aria-label')||text(el.parentElement.querySelector('.ctl-label')||el),visible:visible(toggle?el.querySelector('label'):el),selected:toggle?Number(input?.checked):buttons.findIndex(b=>b.classList.contains('on')),options,signature:JSON.stringify(options.map(x=>[x.label,x.disabled]))};
 });
});}
async function choose(page,c,index){const loc=page.locator(`[data-conditional-audit="${c.key}"]`);if(c.kind==='toggle'){const checked=await loc.locator('input[type=checkbox]').isChecked();if(Number(checked)!==index)await loc.locator('label').click();}else await loc.locator('button').nth(index).click();await settle(page);}
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
try{for(const theme of themes)for(const item of targets){
 const prior=resumeRows.get(`${item.id}|${theme}`);
 if(prior){
  const current=inputs(item),requiredShots=(prior.states||[]).filter(x=>x.conditional||x.phase==='default');
  const reusable=prior.status==='passed'&&JSON.stringify(prior.before)===JSON.stringify(current)&&JSON.stringify(prior.after)===JSON.stringify(current)&&requiredShots.length>0&&requiredShots.every(x=>x.screenshot&&existsSync(x.screenshot));
  if(reusable){report.results.push({...prior,resumedFrom:resolve(resumePath)});report.resume.resumedItemThemes++;save();console.log(JSON.stringify({id:item.id,theme,status:'resumed',counts:prior.counts}));continue;}
  report.resume.invalidated.push({id:item.id,theme,reason:'Prior row failed, unresolved, stale inputs, or required screenshot missing'});
 }
 const before=inputs(item),row={id:item.id,file:item.file,theme,status:'running',before,states:[],unresolvedControls:[],counts:{rootVisibleStates:0,newConditionalStates:0,restorationStates:0},existingFocusedCoverage:item.existingFocusedCoverage,parentTriggerTypes:item.parentTriggerTypes};
 report.active=row;save();
 const context=await browser.newContext({viewport:{width:1150,height:1600},deviceScaleFactor:1,colorScheme:theme,reducedMotion:'no-preference'});await installBrowserAssets(context,{local:true});
 const page=await context.newPage();page.setDefaultTimeout(30000);const pageErrors=[],consoleErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.stack||e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 let defaultControls=[],allKnown=new Map(),seenVisible=new Set(),visitedConfigurations=new Set(),pendingFailure=null;
 const remember=snapshot=>{for(const c of snapshot){allKnown.set(c.key,c);if(c.visible)seenVisible.add(c.key);}};
 async function inspect(path,phase,conditional=false){
  if(row.states.length>=maxStates)throw new Error(`Bounded state limit ${maxStates} reached; coverage incomplete`);
  await settle(page);const snap=await controls(page);remember(snap);
  const evidence=await page.evaluate(()=>{const e=document.querySelector('.viz-readout'),c=e?.cloneNode(true);c?.querySelectorAll('.katex-mathml').forEach(x=>x.remove());return{errors:window.__vizErrors||[],tex:window.__texErrors||[],katexErrors:document.querySelectorAll('.katex-error').length,blank:window.__inspectCanvases?.()||[],readout:c?.textContent||''};});
  const state={index:row.states.length,path,phase,conditional,visibleControls:snap.filter(x=>x.visible).map(({key,label,kind,selected,signature})=>({key,label,kind,selected,signature})),...evidence,pageErrors:[...pageErrors],consoleErrors:[...consoleErrors]};
  // The base sweeps already capture root choices; retain images for each newly
  // conditional configuration, its restoration, and this run's default only.
  if(conditional||phase==='default'){const screenshot=join(shotDir,`${item.id}-${theme}-${String(state.index).padStart(3,'0')}.png`);await page.locator('#shot').screenshot({path:screenshot});state.screenshot=screenshot;}
  row.states.push(state);
  if(phase==='restore')row.counts.restorationStates++;else if(conditional)row.counts.newConditionalStates++;else row.counts.rootVisibleStates++;
  save();
  assert.deepEqual(pageErrors,[],`${item.id} page errors`);assert.deepEqual(consoleErrors.filter(m=>!/favicon|Failed to load resource/.test(m)),[],`${item.id} console errors (same resource filter as base checker; raw messages retained)`);assert.deepEqual(evidence.errors,[],`${item.id} visualization errors`);assert.deepEqual(evidence.tex,[],`${item.id} TeX errors`);assert.equal(evidence.katexErrors,0);assert.deepEqual(evidence.blank,[],`${item.id} blank visible canvases at ${JSON.stringify(path)}`);
  return snap;
 }
 async function explore(c,path=[],conditional=false){
  if(path.length>=maxDepth)throw new Error(`Bounded dependency depth ${maxDepth} reached; coverage incomplete`);
  const initial=(await controls(page)).find(x=>x.key===c.key);if(!initial?.visible)return;
  const old=initial.selected;
  for(let option=0;option<initial.options.length;option++){
   if(option===old||initial.options[option].disabled||!initial.options[option].visible)continue;
   const pre=await controls(page),current=pre.find(x=>x.key===c.key);if(!current?.visible)throw new Error('Expected restored control is hidden: '+c.label);
   const branch=[...path,{key:c.key,label:c.label,kind:c.kind,choice:initial.options[option].label,option,signature:initial.signature}];
   const key=JSON.stringify(branch);if(visitedConfigurations.has(key))continue;visitedConfigurations.add(key);
   await choose(page,current,option);
   let post=await controls(page);const newControls=post.filter(x=>x.visible&&!branch.some(a=>a.key===x.key)&&(!pre.find(p=>p.key===x.key)?.visible||pre.find(p=>p.key===x.key)?.signature!==x.signature));
   post=await inspect(branch,'choice',conditional||newControls.length>0);
   for(const exposed of newControls)await explore(exposed,branch,true);
   const restored=(await controls(page)).find(x=>x.key===c.key);if(!restored?.visible)throw new Error('Parent disappeared before restoration: '+c.label);
   await choose(page,restored,old);await inspect(path,'restore',conditional);
  }
 }
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${encodeURIComponent(item.file)}&id=${item.id}&theme=${theme}&w=1080&still=1`);await page.waitForFunction(()=>window.__done,null,{timeout:90000});
  const done=await page.evaluate(()=>window.__done);assert.equal(done.ok,true);assert.equal(done.renderer,'KaTeX 0.16.11');assert.deepEqual(done.errors,[]);row.renderer=done.renderer;
  defaultControls=await inspect([],'default');
  for(const c of defaultControls.filter(x=>x.visible))await explore(c);
  for(const trigger of item.boundedTriggers||[]){
   const pre=await controls(page);let restore;
   if(trigger.kind==='range'){const input=page.locator('#viz input[type=range]').nth(trigger.index),old=await input.inputValue();await input.focus();await input.press(trigger.key);restore=async()=>{await input.focus();await input.press('Home');await input.evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},old);};}
   else if(trigger.kind==='text'){const input=page.locator('#viz input[type=text]').nth(trigger.index),old=await input.inputValue();await input.fill(trigger.value);await input.press('Enter');await page.waitForTimeout(220);restore=async()=>{await input.fill(old);await input.press('Enter');await page.waitForTimeout(220);};}
   else throw new Error('Unsupported bounded trigger: '+trigger.kind);
   await settle(page);const post=await controls(page),exposed=post.filter(x=>x.visible&&(!pre.find(p=>p.key===x.key)?.visible||pre.find(p=>p.key===x.key)?.signature!==x.signature));
   const branch=[{kind:trigger.kind,label:trigger.label}];await inspect(branch,'bounded-trigger',true);for(const c of exposed)await explore(c,branch,true);await restore();await inspect([],'restore');
  }
  row.status='passed';
 }catch(error){row.status='failed';row.error=String(error.stack||error);pendingFailure=error;}
 finally{
  for(const c of allKnown.values())if(!seenVisible.has(c.key))row.unresolvedControls.push({key:c.key,label:c.label,kind:c.kind,reason:'Control present in DOM but never visible during tested parent configurations; this is not verified by zero discovered states.'});
  row.defaultControls=defaultControls.map(({key,label,kind,visible,signature})=>({key,label,kind,visible,signature}));row.initiallyHiddenControls=defaultControls.filter(x=>!x.visible).length;
  row.after=inputs(item);try{assert.deepEqual(row.after,row.before,'Content, cross-import or runtime changed during item verification');}catch(error){row.status='failed';row.hashError=String(error);}
  if(row.status==='passed'&&row.unresolvedControls.length)row.status='unresolved';
  row.finishedAt=new Date().toISOString();report.results.push(row);delete report.active;save();await context.close();
 }
 console.log(JSON.stringify({id:item.id,theme,status:row.status,counts:row.counts,unresolved:row.unresolvedControls.length,error:pendingFailure?.message}));
}}finally{await browser.close();await new Promise(r=>server.close(r));report.complete=report.results.length===targets.length*themes.length;report.finishedAt=new Date().toISOString();report.ok=report.complete&&report.results.every(x=>x.status==='passed');save();}
process.exitCode=report.ok?0:1;
