import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,mkdtemp,rm,stat} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {findBrowser} from '../scripts/browser.mjs';
import {buildEditions,loadEditionArchive} from '../scripts/build-exploration-editions.mjs';
import {renderEditions,editionPath} from '../scripts/exploration-editions.mjs';
const id='x-history-0001',revision='0.1.2',old='0.1.1',prefix='atlas.exploration.v1.',sourceKey=prefix+id+'.'+old,targetKey=prefix+id+'.'+revision;
const sourceRaw=JSON.stringify({revision:old,state:{v:'1'},notes:'PRIVATE original <img src=x onerror=alert(1)> 私'});
const targetRaw=JSON.stringify({revision,state:{v:'1',task:'t-claim',category:'inference',evidence:'none'},notes:'PRIVATE destination'});
const route='/project/explore/notebooks/',shots=process.env.ATLAS_NOTEBOOK_SCREENSHOTS||'/tmp/atlas-notebooks-20261022-shots';
let browser,servers=[],origins=[],output,owned,withdrawn;
before(async()=>{
  output=process.env.ATLAS_NOTEBOOK_CANDIDATE;
  if(!output){owned=await mkdtemp(join(tmpdir(),'atlas-notebooks-ui-'));output=join(owned,'site');await buildEditions({out:output});}
  output=resolve(output);const archive=await loadEditionArchive(),source=archive.bundles.get(id+'@'+revision);
  withdrawn=renderEditions([{...source,state:'withdrawn',reason:'Synthetic browser fixture only'}],archive.runtimes,{mode:'release',base:'https://example.org/project/'}).outputs;
  for(let i=0;i<2;i++){
    const server=http.createServer(async(req,res)=>{try{
      let path=decodeURIComponent(new URL(req.url,'http://local').pathname),isWithdrawn=path.startsWith('/withdrawn/');
      path=path.replace(/^\/(?:project|withdrawn)\//,'');if(path.endsWith('/'))path+='index.html';
      const file=resolve(output,path);if(!file.startsWith(output+'/')){res.writeHead(403);res.end();return;}
      const content=isWithdrawn&&withdrawn.has(path)?withdrawn.get(path):(await stat(file).catch(()=>null))?.isFile()?await readFile(file):null;
      if(content===null){res.writeHead(404);res.end();return;}
      res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'})[extname(file)]||'application/octet-stream'});res.end(content);
    }catch{res.writeHead(500);res.end();}});
    servers.push(server);await new Promise(r=>server.listen(0,'127.0.0.1',r));origins.push('http://127.0.0.1:'+server.address().port);
  }
  const active=()=>execFileSync('ps',['-ax','-o','pid=,command='],{encoding:'utf8'}).split('\n').filter(s=>/^\s*\d+\s+\//.test(s)&&/chrome|chromium/i.test(s)&&s.includes('--remote-debugging-pipe')&&!s.includes('--type=')).length;
  const deadline=Date.now()+45000;while(active()>=2&&Date.now()<deadline)await new Promise(r=>setTimeout(r,1000));
  assert.ok(active()<2,'Both shared browser lanes remain occupied');
  browser=await chromium.launch({executablePath:findBrowser(),headless:true});await mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();for(const s of servers)await new Promise(r=>s.close(r));if(owned)await rm(owned,{recursive:true,force:true});});
async function run(fn,options={}){const context=await browser.newContext({viewport:{width:1280,height:900},...options}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));try{await fn(page,context);assert.deepEqual(errors,[]);}finally{await context.close();}}
async function seed(page){await page.goto(origins[0]+route);await page.locator('#notebook-app').waitFor();await page.evaluate(({sourceKey,targetKey,sourceRaw,targetRaw})=>{localStorage.setItem(sourceKey,sourceRaw);localStorage.setItem(targetKey,targetRaw);localStorage.setItem('atlas.progress','KEEP');},{sourceKey,targetKey,sourceRaw,targetRaw});await page.locator('#refresh').click();}
async function preview(page){await page.locator('#source').selectOption({label:`${id} · ${old} · This browser`});await page.locator('#target').selectOption('0');await page.locator('#draft').fill('PRIVATE migrated 私');await page.locator('#preview').click();await page.locator('#preview-details').waitFor();}
async function saveBackup(page){const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#backup').click()]);return {download,text:await readFile(await download.path(),'utf8')};}
test('explicit preview/download/copy/reader/undo preserves original notes and destination selections; no private network or URL data',()=>run(async(page)=>{
  const requests=[];page.on('request',r=>requests.push(r.url()));await seed(page);await preview(page);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),targetKey),targetRaw);assert.equal(await page.locator('#commit').isDisabled(),true);
  const {text}=await saveBackup(page);const backup=JSON.parse(text);assert.equal(backup.entries.length,3);assert.equal(backup.entries[0].raw,sourceRaw);assert.equal(backup.entries[1].raw,targetRaw);
  await page.locator('#confirm').check();await page.locator('#commit').click();await page.getByText('Notes copied.',{exact:false}).waitFor();
  const after=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),targetKey));assert.equal(after.notes,'PRIVATE migrated 私');assert.deepEqual(after.state,JSON.parse(targetRaw).state);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),sourceKey),sourceRaw);assert.equal(await page.evaluate(()=>localStorage.getItem('atlas.progress')),'KEEP');
  const reader=await page.context().newPage();await reader.goto(origins[0]+'/project/'+editionPath(id,revision));await reader.locator('#notes').waitFor();assert.equal(await reader.locator('#notes').inputValue(),'PRIVATE migrated 私');await reader.close();
  const row=page.locator('#recovery-list article');await row.getByRole('checkbox').check();await row.getByRole('button',{name:'Undo this copy'}).click();await page.getByText('Previous destination restored.',{exact:false}).waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),targetKey),targetRaw);assert.equal(await page.evaluate(k=>localStorage.getItem(k),sourceKey),sourceRaw);
  assert.ok(requests.every(url=>url.startsWith(origins[0]+'/')));assert.ok(requests.every(url=>!url.includes('PRIVATE')&&!url.includes('migrated')));assert.equal(new URL(page.url()).hash,'');assert.equal(new URL(page.url()).search,'');
}));
test('other-tab edits invalidate previews and prevent stale undo without losing newer values',()=>run(async(page,context)=>{
  await seed(page);await preview(page);await saveBackup(page);await page.locator('#confirm').check();
  const other=await context.newPage();await other.goto(origins[0]+route);await other.evaluate(k=>localStorage.setItem(k,JSON.stringify({revision:'0.1.2',state:{v:'1'},notes:'Newer before copy'})),targetKey);
  await page.getByText('Saved data changed in another tab.',{exact:false}).waitFor();assert.equal(await page.locator('#commit').isDisabled(),true);
  await page.locator('#refresh').click();await preview(page);await saveBackup(page);await page.locator('#confirm').check();await page.locator('#commit').click();await page.getByText('Notes copied.',{exact:false}).waitFor();
  await other.evaluate(k=>localStorage.setItem(k,JSON.stringify({revision:'0.1.2',state:{v:'1'},notes:'Newer after copy'})),targetKey);
  await page.getByText('Destination differs from this copy.',{exact:false}).waitFor();assert.equal(await page.getByRole('button',{name:'Undo this copy'}).isDisabled(),true);
  assert.equal(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),targetKey)).notes,'Newer after copy');await other.close();
}));
test('native cross-origin export/import is explicit, notes-only and leaves the first origin unchanged',()=>run(async(page,context)=>{
  await seed(page);await page.locator('#source').selectOption({label:`${id} · ${old} · This browser`});
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-source').click()]);const text=await readFile(await download.path(),'utf8');
  const second=await context.newPage();await second.goto(origins[1]+route);await second.locator('#notebook-app').waitFor();assert.equal(await second.locator('#source option').count(),1);
  await second.locator('#import').setInputFiles({name:'notes.json',mimeType:'application/json',buffer:Buffer.from(text)});await second.getByText('Imported 1 entries', {exact:false}).waitFor();assert.equal(await second.evaluate(()=>localStorage.length),0);
  await second.locator('#source').selectOption('0');assert.equal(await second.locator('#draft').inputValue(),JSON.parse(sourceRaw).notes);assert.equal(await second.locator('#source-raw img').count(),0);
  await second.locator('#target').selectOption('0');await second.locator('#preview').click();await saveBackup(second);await second.locator('#confirm').check();await second.locator('#commit').click();await second.getByText('Notes copied.',{exact:false}).waitFor();
  assert.equal(JSON.parse(await second.evaluate(k=>localStorage.getItem(k),targetKey)).notes,JSON.parse(sourceRaw).notes);assert.equal(await page.evaluate(k=>localStorage.getItem(k),targetKey),targetRaw);assert.equal(await page.evaluate(k=>localStorage.getItem(k),sourceKey),sourceRaw);await second.close();
}));
test('withdrawn pages recover raw notes without old lesson payloads or write targets',()=>run(async(page)=>{
  await page.goto(origins[0]+'/withdrawn/'+editionPath(id,revision));await page.evaluate(({targetKey})=>localStorage.setItem(targetKey,'{broken PRIVATE recovery'),{targetKey});
  await page.getByRole('link',{name:'My notes',exact:true}).click();await page.locator('#source').selectOption('0');assert.equal(await page.locator('#target option').count(),1);assert.equal(await page.locator('#preview').isDisabled(),true);
  assert.match(await page.locator('#source-info').textContent(),/Unreadable/);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-source').click()]);const value=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(value.entries[0].raw,'{broken PRIVATE recovery');assert.equal(await page.locator('#exploration-data').count(),0);
}));
test('oversized source and unreadable journal downloads preserve the full string, including lone surrogates',()=>run(async(page)=>{
  await seed(page);const raw='x'.repeat(200001)+'\uD800';
  await page.evaluate(({sourceKey,raw})=>{localStorage.setItem(sourceKey,raw);localStorage.setItem('atlas.notebook.recovery.v1.11111111-1111-4111-8111-111111111111','{broken \uD800');},{sourceKey,raw});
  await page.locator('#refresh').click();await page.locator('#source').selectOption({label:`${id} · ${old} · This browser`});assert.equal(await page.locator('#target option').count(),1);assert.match(await page.locator('#source-info').textContent(),/too large to copy/);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-source').click()]);assert.equal(JSON.parse(await readFile(await download.path(),'utf8')).raw,raw);
  const [journal]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export this recovery'}).click()]);assert.equal(JSON.parse(await readFile(await journal.path(),'utf8')).raw,'{broken \uD800');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),sourceKey),raw);
}));
test('malformed imports, long drafts, unavailable locks and blocked storage fail without saved-note writes',()=>run(async(page,context)=>{
  await seed(page);await page.locator('#import').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('JSON'));assert.equal(await page.evaluate(k=>localStorage.getItem(k),targetKey),targetRaw);
  await preview(page);await page.locator('#draft').fill('x'.repeat(1501));await page.locator('#preview').click();await page.getByText('Notes exceed 1,500 characters.',{exact:false}).waitFor();assert.equal(await page.locator('#preview-details').isVisible(),false);
  const blocked=await context.newPage();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));await blocked.goto(origins[0]+route);await blocked.getByText('Browser storage is unavailable.',{exact:false}).first().waitFor();assert.equal(await blocked.locator('#preview').isDisabled(),true);
  const file=JSON.stringify({schemaVersion:1,explorationId:id,revision,notes:'Imported while blocked',selections:{v:'1'}});await blocked.locator('#import').setInputFiles({name:'notes.json',mimeType:'application/json',buffer:Buffer.from(file)});await blocked.locator('#source').selectOption('0');assert.equal(await blocked.locator('#draft').inputValue(),'Imported while blocked');await blocked.close();
  const noLocks=await context.newPage();await noLocks.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined}));await noLocks.goto(origins[0]+route);await noLocks.getByText('Copying and undo need', {exact:false}).waitFor();await noLocks.locator('#source').selectOption({label:`${id} · ${old} · This browser`});await noLocks.locator('#target').selectOption('0');assert.equal(await noLocks.locator('#preview').isDisabled(),true);await noLocks.close();
}));
test('phone/desktop and both themes fit; controls work by keyboard; no-JavaScript explanation stays readable',async()=>{
  for(const width of [320,1280])for(const colorScheme of ['light','dark'])await run(async page=>{
    await seed(page);await preview(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.locator('#backup').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#confirm').evaluate(e=>e===document.activeElement),true);
    await page.screenshot({path:join(shots,`notebooks-${width}-${colorScheme}.png`),fullPage:true});
  },{viewport:{width,height:900},colorScheme});
  await run(async page=>{await page.goto(origins[0]+route);assert.equal(await page.locator('noscript').isVisible(),true);assert.equal(await page.locator('#notebook-app').isVisible(),false);},{javaScriptEnabled:false});
});
