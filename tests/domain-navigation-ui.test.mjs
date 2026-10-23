import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,stat,mkdir,readdir,mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {findBrowser} from '../scripts/browser.mjs';
import {buildDomainNavigation,prepareNavigation} from '../scripts/build-domain-navigation.mjs';
import {renderDomainNavigation} from '../scripts/domain-navigation.mjs';
let browser,server,origin,output,owned,prepared,withdrawn;
const shots=process.env.ATLAS_DOMAIN_NAVIGATION_SCREENSHOTS||'/tmp/atlas-domain-navigation-20261022-shots';
before(async()=>{
  output=process.env.ATLAS_DOMAIN_NAVIGATION_CANDIDATE;
  if(!output){owned=await mkdtemp(join(tmpdir(),'atlas-domain-navigation-ui-'));output=join(owned,'site');await buildDomainNavigation({out:output});}
  output=resolve(output);prepared=await prepareNavigation();
  const states=prepared.entries.map(s=>({...s,state:s.id==='D20'?'withdrawn':'published',...(s.id==='D20'?{reason:'Synthetic browser fixture only'}:{})}));
  withdrawn=renderDomainNavigation(prepared.data,states,{schemaVersion:1,mode:'release',explorations:[]},{mode:'release',base:'https://example.org/project/'}).outputs;
  const types={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
  server=http.createServer(async(req,res)=>{try{
    let path=decodeURIComponent(new URL(req.url,'http://local').pathname),fixture=path.startsWith('/withdrawn/');path=path.replace(/^\/(?:project|withdrawn)\//,'/');if(path.endsWith('/'))path+='index.html';
    const file=resolve(output,'.'+path);if(!file.startsWith(output+'/')){res.writeHead(403);res.end();return;}
    const content=fixture&&withdrawn.has(path.slice(1))?withdrawn.get(path.slice(1)):(await stat(file).catch(()=>null))?.isFile()?await readFile(file):null;
    if(content===null){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'});res.end(content);
  }catch{res.writeHead(500);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
  const active=()=>execFileSync('ps',['-ax','-o','pid=,command='],{encoding:'utf8'}).split('\n').filter(s=>/^\s*\d+\s+\//.test(s)&&/chrome|chromium/i.test(s)&&s.includes('--remote-debugging-pipe')&&!s.includes('--type=')).length;
  const deadline=Date.now()+45000;while(active()>=2&&Date.now()<deadline)await new Promise(r=>setTimeout(r,1000));assert.ok(active()<2,'Both shared browser lanes remain occupied');
  browser=await chromium.launch({executablePath:findBrowser(),headless:true});await mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));if(owned)await rm(owned,{recursive:true,force:true});});
async function run(fn,options={}){const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',...options}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push(r.status()+' '+r.url());});try{await fn(page,context);assert.deepEqual(errors,[]);}finally{await context.close();}}
test('all32domain HTML pages, local targets and delivered module/style bytes resolve without private/draft roots',async()=>{
  const targets=new Set();let pages=0,refs=0;
  async function walk(prefix){for(const e of await readdir(join(output,prefix),{withFileTypes:true})){const path=prefix+'/'+e.name;if(e.isDirectory())await walk(path);else if(path.endsWith('.html')){
    pages++;const html=await readFile(join(output,path),'utf8');assert.ok(html.includes('noindex,nofollow'));assert.ok(!html.includes('rel="canonical"'));
    for(const [,href]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(/^(?:https?:|#|data:)/.test(href))continue;const u=new URL(href.replaceAll('&amp;','&'),'https://local/'+path);let target=u.pathname.slice(1);if(!target||target.endsWith('/'))target+='index.html';targets.add(target);refs++;}
  }}}
  await walk('domains');assert.equal(pages,32);for(const path of targets)assert.ok((await stat(join(output,path)).catch(()=>null))?.isFile(),path);
  for(const [path,bytes]of Object.entries(prepared.assets))assert.equal(await readFile(join(output,path),'utf8'),bytes);
  for(const path of ['labs','docs','orientation','navigation','explorations','editions'])assert.equal(await stat(join(output,path)).catch(()=>null),null,path);
  console.log(JSON.stringify({domainHTMLPages:pages,localReferences:refs,localTargets:targets.size,deliveredAssets:Object.keys(prepared.assets).length}));
});
test('all30orientations retain readable source scopes and next steps without JavaScript at root and project paths',()=>run(async page=>{
  for(const [i,r]of prepared.data.catalog.overviews.entries()){
    await page.goto(origin+(i%2?'/project':'')+'/domains/'+r.domainId+'/');assert.equal(await page.locator('.lead').textContent(),r.summary);assert.equal(await page.locator('.next-step p').nth(1).textContent(),r.nextStep.task);
    for(const sourceId of r.sourceIds){const source=prepared.data.sources.sources.find(s=>s.id===sourceId);assert.ok((await page.locator('.source').allTextContents()).some(t=>t.includes(source.access.locator)&&t.includes(source.limitations)&&t.includes(source.reuse)));}
    assert.equal(await page.getByRole('link',{name:'Available fields',exact:true}).count(),1);
  }
  await page.goto(origin+'/project/domains/');assert.equal(await page.locator('.domain-card:visible').count(),30);assert.equal(await page.locator('#filters').isVisible(),false);
},{javaScriptEnabled:false}));
test('field/question/method/route filters compose and reset using keyboard without saved-state or external-request writes',()=>run(async page=>{
  const requests=[];page.on('request',r=>requests.push(r.url()));await page.goto(origin+'/project/domains/');await page.locator('#filters').waitFor();
  await page.evaluate(()=>{localStorage.setItem('atlas.progress','PRESERVE');localStorage.setItem('atlas.exploration.v1.x-history-0001.0.1.2','PRIVATE PRESERVE');});
  const before=await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
  await page.locator('#query').fill('ＭＡＴＨＥＭＡＴＩＣＳ');assert.ok(await page.locator('[data-domain="D01"]').isVisible());await page.locator('#query').fill('evidence');await page.locator('#method').selectOption('source-comparison');assert.ok(await page.locator('.domain-card:visible').count()>0);
  assert.ok((await page.locator('.domain-card:visible').evaluateAll(xs=>xs.map(x=>x.dataset.methods))).every(s=>s.split(' ').includes('source-comparison')));
  await page.getByRole('button',{name:'Clear filters'}).click();await page.locator('#route').selectOption('editions');const available=new Set(prepared.data.catalog.overviews.filter(r=>prepared.catalog.explorations.some(e=>e.domainIds.includes(r.domainId))).map(r=>r.domainId)).size;assert.equal(await page.locator('.domain-card:visible').count(),available);assert.equal(await page.locator('#results').textContent(),available+' of 30 available orientations');
  await page.locator('#query').fill('zzzznoresult');assert.equal(await page.locator('#empty').isVisible(),true);await page.locator('#query').press('Enter');assert.equal(new URL(page.url()).search,'');
  await page.getByRole('button',{name:'Clear filters'}).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.domain-card:visible').count(),30);
  assert.equal(await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),before);assert.ok(requests.every(u=>u.startsWith(origin+'/')));assert.ok(requests.every(u=>!u.includes('PRIVATE')));
}));
test('root/library/collection/exploration/notebook entry links reach fields and exact collection mappings without rewriting private notes',()=>run(async page=>{
  await page.goto(origin+'/project/');await page.getByRole('link',{name:'Fields',exact:true}).click();assert.equal(new URL(page.url()).pathname,'/project/domains/');
  await page.locator('[data-domain="D01"] h2 a').click();
  // Locate the exact canonical collection target rather than relying on presentation casing.
  await page.locator('a[href="../../ideas/collections/mathbio/"]').click();assert.equal(new URL(page.url()).pathname,'/project/ideas/collections/mathbio/');
  assert.equal(await page.getByRole('navigation',{name:'Related fields'}).getByRole('link').count(),2);await page.getByRole('navigation',{name:'Related fields'}).getByRole('link',{name:'Mathematics',exact:true}).click();assert.equal(new URL(page.url()).pathname,'/project/domains/D01/');
  await page.goto(origin+'/project/domains/D20/');await page.locator('a[href="../../explore/x-history-0001/"]').click();assert.equal(new URL(page.url()).pathname,'/project/explore/x-history-0001/');
  await page.getByRole('link',{name:'Browse fields, questions and methods'}).click();assert.equal(new URL(page.url()).pathname,'/project/domains/');
  for(const path of ['ideas/','explore/notebooks/','explore/x-literature-0001/versions/0.1.2/']){await page.goto(origin+'/project/'+path);assert.equal(await page.getByRole('link',{name:'Browse fields, questions and methods'}).count(),1);}
}));
test('withdrawn orientation links remain navigable while former body/source content and canonical entry stay absent',()=>run(async page=>{
  await page.goto(origin+'/withdrawn/domains/');assert.equal(await page.locator('.domain-card').count(),29);await page.getByRole('link',{name:'D20 · withdrawn',exact:true}).click();assert.equal(await page.locator('h1').textContent(),'This orientation has been withdrawn');assert.equal(await page.locator('.source').count(),0);assert.equal(await page.locator('link[rel="canonical"]').count(),0);
  await page.getByRole('link',{name:'Fields of knowledge',exact:true}).click();assert.equal(new URL(page.url()).pathname,'/withdrawn/domains/');
}));
test('every domain fits320px in both themes; index/detail layouts and enlarged text remain usable',async()=>{
  for(const colorScheme of ['light','dark'])await run(async page=>{
    for(const r of prepared.data.catalog.overviews){await page.goto(origin+'/project/domains/'+r.domainId+'/');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,r.domainId+' '+colorScheme);}
    await page.goto(origin+'/project/domains/');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:join(shots,`index-320-${colorScheme}.png`)});
    await page.goto(origin+'/project/domains/D24/');await page.addStyleTag({content:'html{font-size:24px}body{font-size:24px}'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:join(shots,`literature-320-large-${colorScheme}.png`)});
  },{viewport:{width:320,height:900},colorScheme});
  for(const [path,name,colorScheme]of [['domains/','index-1280-light','light'],['domains/D29/','craft-1280-dark','dark']])await run(async page=>{await page.goto(origin+'/project/'+path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:join(shots,name+'.png')});},{colorScheme});
});
