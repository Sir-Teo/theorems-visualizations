import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import http from 'node:http';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
let browser,server,base;
const shots=process.env.ATLAS_ORIENTATION_SCREENSHOTS||'/tmp/atlas-orientation-20261022/screenshots';
before(async()=>{
 const files=createServer();server=http.createServer((req,res)=>{if(req.url.startsWith('/project/'))req.url=req.url.slice('/project'.length);files.emit('request',req,res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:findBrowser(),headless:true});await mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));});
async function run(fn,options={}){
 const context=await browser.newContext({viewport:{width:1280,height:900},colorScheme:'light',reducedMotion:'reduce',...options}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{if(!route.request().url().startsWith(base)){requests.push(route.request().url());return route.abort();}return route.continue();});
 try{await fn(page);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.equal(await page.evaluate(()=>localStorage.length),0);}
 finally{await context.close();}
}
const path='/labs/atlas/domains/';
test('keyboard search, method filtering, empty state and reset work without storing state',async()=>run(async page=>{
 await page.goto(base+path);await page.locator('#query').focus();await page.keyboard.type('  D20 HISTORY  ');
 assert.equal(await page.locator('.domain-card:visible').count(),1);assert.match(await page.locator('.domain-card:visible').textContent(),/D20/);
 await page.keyboard.press('Enter');assert.ok(page.url().endsWith(path));
 await page.locator('#method').selectOption('proof');assert.equal(await page.locator('.domain-card:visible').count(),0);assert.ok(await page.locator('#empty').isVisible());
 await page.getByRole('button',{name:'Clear filters'}).focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('.domain-card:visible').count(),30);assert.equal(await page.locator('#query').inputValue(),'');assert.equal(await page.locator('#method').inputValue(),'');
 await page.locator('#method').selectOption('proof');assert.ok(await page.locator('.domain-card:visible').count()>0);
 assert.equal(await page.locator('.domain-card:visible').evaluateAll(cards=>cards.every(c=>c.dataset.methods.split(' ').includes('proof'))),true);
 await page.reload();assert.equal(await page.locator('.domain-card:visible').count(),30);
}));
test('every domain loads directly and at a project prefix with intact local targets',async()=>run(async page=>{
 for(const prefix of ['', '/project'])for(let i=1;i<=30;i++){
  const id='D'+String(i).padStart(2,'0');const response=await page.goto(base+prefix+path+id+'/');assert.equal(response.status(),200);
  assert.equal(await page.locator('h1').count(),1);assert.ok(await page.getByRole('heading',{name:'A next reading step'}).isVisible());
  assert.equal(await page.locator('.source').count(),1);assert.equal(await page.locator('link[rel="canonical"]').count(),0);
  const links=await page.locator('a').evaluateAll(as=>as.map(a=>({href:a.getAttribute('href'),url:a.href})));assert.ok(links.some(a=>a.url.startsWith('https://')));
  for(const a of links.filter(a=>!a.href.startsWith('#')&&!a.href.startsWith('https:')))assert.ok(new URL(a.url).pathname.startsWith(prefix+'/'));
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('system-ui')),true);
 }
}));
test('all source content and navigation remain available with JavaScript disabled',async()=>run(async page=>{
 await page.goto(base+path);assert.equal(await page.locator('.domain-card:visible').count(),30);assert.equal(await page.locator('#filters').isVisible(),false);
 await page.locator('[data-domain="D20"] h2 a').click();
 assert.ok(await page.getByRole('heading',{name:'What this field asks'}).isVisible());assert.match(await page.locator('.source').textContent(),/Reading scope/);
 await page.getByText('Reuse scope',{exact:true}).click();assert.match(await page.locator('.source details').textContent(),/summary|summaries/);
 assert.match(await page.locator('aside').textContent(),/locally accepted; see lesson for check scope/);
},{javaScriptEnabled:false}));
test('index and all 30 domain pages fit phone width in both themes and enlarged text',async()=>{
 for(const colorScheme of ['light','dark'])await run(async page=>{
  for(const suffix of ['',...Array.from({length:30},(_,i)=>'D'+String(i+1).padStart(2,'0')+'/')]){
   await page.goto(base+path+suffix);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,suffix+' overflow');
   if(suffix===''||suffix==='D20/')await page.screenshot({path:shots+'/'+(suffix?'history':'index')+'-320-'+colorScheme+'.png',fullPage:suffix!==''});
   await page.addStyleTag({content:'html{font-size:200%} body{font-size:32px}'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,suffix+' enlarged overflow');
  }
 },{viewport:{width:320,height:900},colorScheme});
});
test('desktop layout and visible keyboard focus retain the reading hierarchy',async()=>run(async page=>{
 await page.goto(base+path);await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Skip to content');await page.keyboard.press('Enter');
 await page.locator('#query').focus();assert.equal(await page.locator('#query').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
 await page.screenshot({path:shots+'/index-1280-light.png'});
 await page.goto(base+path+'D20/');const reading=await page.locator('.reading').boundingBox(),aside=await page.locator('aside').boundingBox();assert.ok(aside.x>reading.x+reading.width);
 await page.screenshot({path:shots+'/history-1280-light.png',fullPage:true});
}));
