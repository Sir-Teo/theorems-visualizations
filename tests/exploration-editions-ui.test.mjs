import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,stat,mkdir,readdir,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {findBrowser} from '../scripts/browser.mjs';
import {ROOT} from '../scripts/lib.mjs';
import {buildEditions,loadEditionArchive} from '../scripts/build-exploration-editions.mjs';
import {editionPath,BROWSER_CODE} from '../scripts/exploration-editions.mjs';
let browser,server,origin,output,owned,archive,report;
const shots=process.env.ATLAS_EDITION_SCREENSHOTS||'/tmp/atlas-editions-20261022-shots';
before(async()=>{
 output=process.env.ATLAS_EDITION_CANDIDATE;
 if(!output){owned=await mkdtemp(join(tmpdir(),'atlas-edition-ui-'));output=join(owned,'site');await buildEditions({out:output});}
 output=resolve(output);archive=await loadEditionArchive();report=JSON.parse(await readFile(join(output,'edition-build.json'),'utf8'));
 const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.py':'text/plain'};
 server=http.createServer(async(req,res)=>{try{
  let path=decodeURIComponent(new URL(req.url,'http://local').pathname);if(path.startsWith('/project/'))path=path.slice('/project'.length);if(path.endsWith('/'))path+='index.html';
  // Same-origin old-preview fixture only: these paths are absent from the delivered candidate.
  const source=/^\/(?:labs\/atlas|explorations)\//.test(path)?ROOT:output,file=resolve(source,'.'+path);
  if(!file.startsWith(source+'/')){res.writeHead(403);res.end();return;}
  if(!(await stat(file).catch(()=>null))?.isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
 }catch{res.writeHead(500);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
 // Serialize this suite and wait for a free lane without interrupting another chat's browser.
 const activeBrowsers=()=>execFileSync('ps',['-ax','-o','pid=,command='],{encoding:'utf8'}).split('\n').filter(row=>/^\s*\d+\s+\//.test(row)&&/chrome|chromium/i.test(row)&&row.includes('--remote-debugging-pipe')&&!row.includes('--type=')).length;
 const deadline=Date.now()+45000;while(activeBrowsers()>=2&&Date.now()<deadline)await new Promise(r=>setTimeout(r,1000));
 assert.ok(activeBrowsers()<2,'Both shared browser lanes remain occupied; retry after actual closure');
 browser=await chromium.launch({executablePath:findBrowser(),headless:true});await mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));if(owned)await rm(owned,{recursive:true,force:true});});
async function pageRun(fn,options={}){
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',...options}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push(r.status()+' '+r.url());});
 try{await fn(page,context);assert.deepEqual(errors,[]);}finally{await context.close();}
}
test('all candidate exploration links and module imports resolve; unaccepted and private archives are absent',async()=>{
 assert.equal(report.currentExplorations,4);assert.equal(report.retainedEditions,4);assert.equal(report.mode,'preview');
 let pages=0,links=0;const targets=new Set();
 async function walk(prefix){for(const e of await readdir(join(output,prefix),{withFileTypes:true})){const path=prefix+'/'+e.name;if(e.isDirectory())await walk(path);else if(path.endsWith('.html')){
  pages++;const html=await readFile(join(output,path),'utf8');assert.ok(!html.includes('rel="canonical"'));assert.ok(html.includes('noindex,nofollow'));
  for(const [,href]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(/^(?:https?:|#|data:)/.test(href))continue;const u=new URL(href.replaceAll('&amp;','&'),'https://local/'+path);let target=u.pathname.slice(1);if(!target||target.endsWith('/'))target+='index.html';targets.add(target);links++;}
 }}}
 await walk('explore');for(const path of targets)assert.ok((await stat(join(output,path)).catch(()=>null))?.isFile(),path);
 for(const [digest,runtime]of archive.runtimes)for(const path of BROWSER_CODE){const delivered=`assets/editions/${digest}/${path.slice('explorations/'.length)}`,bytes=await readFile(join(output,delivered),'utf8');assert.equal(bytes,runtime.files[path]);for(const [,relative]of bytes.matchAll(/from ['"](\.\/[^'"]+)['"]/g)){const target=new URL(relative,'https://local/'+delivered).pathname.slice(1);assert.ok((await stat(join(output,target))).isFile(),target);}}
 for(const p of ['labs','explorations','editions','docs','explore/x-craft-0001','explore/x-performance-0001'])assert.equal(await stat(join(output,p)).catch(()=>null),null,p);
 console.log(JSON.stringify({editionPages:pages,localReferences:links,localTargets:targets.size,runtimeFiles:BROWSER_CODE.length}));
});
test('without JavaScript every retained edition exposes exact source text, guides and navigable reproduction files',async()=>{
 for(const {bundle}of archive.bundles.values())await pageRun(async page=>{
  await page.goto(origin+'/project/'+editionPath(bundle.id,bundle.revision));await page.locator('h1').waitFor();assert.equal(await page.locator('h1').textContent(),bundle.record.title);
  for(const p of bundle.record.passages)assert.equal(await page.locator('#passage-'+p.id+' .passage, #passage-'+p.id+' blockquote').textContent(),p.text);
  if(bundle.record.activity.type==='measured-data'){assert.equal(await page.locator('.activity tbody tr').count(),278);assert.match(await page.locator('.synthetic').textContent(),/60 mm/);}
  else assert.ok(await page.locator('.static-guide').count()>0);
  assert.equal(await page.locator('#notes').isVisible(),false);
  if(bundle.id==='x-agriculture-0001'){await page.getByText('Attribution and reproducible selection',{exact:true}).click();await page.getByRole('link',{name:'Reproduction script',exact:true}).click();assert.match(await page.locator('h1').textContent(),/Reproduce/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.getByRole('link',{name:'Return to this edition',exact:true}).click();}
  await page.getByRole('link',{name:'← Editions of this exploration',exact:true}).click();assert.ok((await page.locator('main').textContent()).includes('Open edition '+bundle.revision));
 },{javaScriptEnabled:false,viewport:{width:320,height:900}});
});
test('same-origin old preview notes and selections survive delivery; shared links stay revision-specific and exclude private notes',async()=>{
 for(const {bundle}of archive.bundles.values())await pageRun(async page=>{
  const r=bundle.record,key=`atlas.exploration.v1.${r.id}.${r.revision}`,note='PRIVATE local note '+r.id;
  await page.goto(origin+'/project/labs/atlas/'+r.id+'/');await page.locator('#notes').waitFor();
  await page.locator('#notes').fill(note);const controls=page.locator('.interactive select:not([data-unshared])');if(await controls.count()){const control=controls.first(),options=await control.locator('option').evaluateAll(xs=>xs.map(x=>x.value));await control.selectOption(options.at(-1));}
  const before=await page.evaluate(k=>localStorage.getItem(k),key);await page.evaluate(()=>localStorage.setItem('atlas.progress','PRESERVE-LEGACY'));
  await page.goto(origin+'/project/'+editionPath(r.id,r.revision));await page.locator('#notes').waitFor();assert.equal(await page.locator('#notes').inputValue(),note);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before);
  await page.getByRole('button',{name:'Copy a link to these selections',exact:true}).click();const link=await page.locator('#share-url').inputValue();assert.equal(new URL(link).pathname,'/project/'+editionPath(r.id,r.revision));assert.ok(!link.includes('PRIVATE'));
  const expected=JSON.parse(before).state;await page.goto(link);await page.locator('#notes').waitFor();assert.equal(await page.locator('#notes').inputValue(),note);
  const state=Object.fromEntries(new URLSearchParams(new URL(link).hash.slice(1)));for(const [k,v]of Object.entries(expected))if(typeof v==='string')assert.equal(state[k],v,k);
  assert.equal(await page.evaluate(()=>localStorage.getItem('atlas.progress')),'PRESERVE-LEGACY');
 });
});
test('earlier and malformed notes remain exportable without silent migration, overwrite or legacy-store reset',()=>pageRun(async page=>{
 const id='x-history-0001',key=`atlas.exploration.v1.${id}.0.1.2`,earlier=`atlas.exploration.v1.${id}.0.1.1`;
 await page.addInitScript(({key,earlier})=>{localStorage.setItem(key,'{broken PRIVATE');localStorage.setItem(earlier,'earlier PRIVATE bytes');localStorage.setItem('atlas.progress','PRESERVE');},{key,earlier});
 await page.goto(origin+'/project/'+editionPath(id,'0.1.2'));await page.locator('#notes').waitFor();assert.match(await page.locator('#save-status').textContent(),/not been overwritten/);await page.locator('#notes').fill('new page-only note');assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'{broken PRIVATE');
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export earlier notes',exact:true}).click()]);const data=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(data.earlier[0].savedData,'earlier PRIVATE bytes');
 const [current]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export notes',exact:true}).click()]);const currentData=JSON.parse(await readFile(await current.path(),'utf8'));assert.equal(currentData.unrestoredSavedData,'{broken PRIVATE');assert.equal(currentData.notes,'new page-only note');
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),earlier),'earlier PRIVATE bytes');assert.equal(await page.evaluate(()=>localStorage.getItem('atlas.progress')),'PRESERVE');
}));
test('root navigation reaches the edition catalog; all four editions fit phone/desktop in both themes',async()=>{
 await pageRun(async page=>{await page.goto(origin+'/project/');await page.getByRole('link',{name:'Explore',exact:true}).click();assert.equal(await page.locator('main article').count(),4);});
 for(const {bundle}of archive.bundles.values())for(const width of [320,1280])for(const colorScheme of ['light','dark'])await pageRun(async page=>{
  await page.goto(origin+'/project/'+editionPath(bundle.id,bundle.revision));await page.locator('#notes').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,bundle.id+' '+width+' '+colorScheme);await page.screenshot({path:join(shots,`${bundle.id}-${width}-${colorScheme}.png`)});
  await page.locator('.activity').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);if(width===320&&colorScheme==='light')await page.screenshot({path:join(shots,`${bundle.id}-activity-320-light.png`)});
 },{viewport:{width,height:900},colorScheme});
});
