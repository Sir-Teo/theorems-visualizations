import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {mkdir,readFile} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
let browser,server,base;
const shots=process.env.ATLAS_COVERAGE_SCREENSHOTS||'/tmp/atlas-coverage-dashboard-20261022/screenshots',path='/labs/atlas/coverage/';
const snapshot=JSON.parse(await readFile(new URL('../coverage-dashboard/src/data.json',import.meta.url),'utf8'));
before(async()=>{const files=createServer();server=http.createServer((req,res)=>{if(req.url.startsWith('/project/'))req.url=req.url.slice('/project'.length);files.emit('request',req,res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:findBrowser(),headless:true});await mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function run(fn,options={}){const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write'],...options}),page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{if(!r.request().url().startsWith(base)){external.push(r.request().url());return r.abort();}return r.continue();});try{await fn(page);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);}finally{await context.close();}}
const card=(page,id)=>page.locator('[data-component-id="'+id+'"]');
async function choose(page,label,choice){await page.locator('button[aria-label="'+label+'"]').click();await page.getByRole('menuitemradio',{name:choice,exact:typeof choice==='string'}).click();}
async function ready(page,prefix=''){await page.goto(base+prefix+path);await page.getByText('Accepted production ideas',{exact:true}).waitFor();}
async function copied(page,id){await card(page,id).getByRole('button',{name:/actions$/}).click();await page.getByRole('menuitem',{name:'Copy data',exact:true}).click();return page.evaluate(()=>navigator.clipboard.readText());}
test('domain filter scopes headline, plot, copied evidence and table; All restores the unique totals',()=>run(async page=>{
 await ready(page);assert.match(await card(page,'production-accepted').innerText(),/7,751/);assert.match(await card(page,'local-pilots').innerText(),/4 \/ 8/);
 assert.ok(await card(page,'coverage:domain-chart').locator('svg path').count()>0);
 await choose(page,'Domain',/D20 · History/);assert.match(await card(page,'production-accepted').innerText(),/109/);assert.match(await card(page,'local-pilots').innerText(),/1 \/ 1/);
 const copiedData=await copied(page,'production-accepted');assert.ok(copiedData.includes('D20'));assert.ok(!copiedData.includes('D01'));
 const data=await copied(page,'coverage:domain-chart');assert.ok(data.includes('109'));assert.ok(!data.includes('Mathematics'));
 await page.getByRole('button',{name:'Clear all',exact:true}).click();assert.match(await card(page,'production-accepted').innerText(),/7,751/);
 await card(page,'coverage:domain-table').getByRole('button',{name:'Next page',exact:true}).click();assert.match(await card(page,'coverage:domain-table').innerText(),/Page 2 of 4/);
 await page.screenshot({path:shots+'/coverage-1280.png'});
}));
test('work streams retain distinct scopes and independent tab filters',()=>run(async page=>{
 await ready(page);await choose(page,'Domain',/D20 · History/);await page.getByRole('tab',{name:'Work streams',exact:true}).click();assert.match(await card(page,'streams:wave').innerText(),/1,057/);assert.match(await card(page,'streams:visual').innerText(),/1,101/);
 const text=await copied(page,'streams:wave'),lines=text.trim().split('\n'),keys=lines.shift().split('\t'),rows=lines.map(line=>Object.fromEntries(line.split('\t').map((v,i)=>[keys[i],v])));assert.equal(rows.length,80);assert.equal(rows.reduce((n,r)=>n+Number(r.awaitingReview),0),239);assert.equal(rows.reduce((n,r)=>n+Number(r.outsideReviewedCheckpoints),0),782);
 assert.match(await card(page,'streams:human').innerText(),/not established/);assert.match(await card(page,'streams:reconciliation').innerText(),/\(26\).*36/s);
 await choose(page,'Domain',/D20 · History/);assert.ok(!(await card(page,'streams:wave').innerText()).includes('1,057'));
 await choose(page,'Domain','All');await page.getByRole('tab',{name:'Coverage',exact:true}).click();assert.match(await card(page,'production-accepted').innerText(),/109/);
 await page.getByRole('tab',{name:'Work streams',exact:true}).click();await page.screenshot({path:shots+'/streams-1280.png'});
}));
test('review filters, empty search and scoped copied data preserve pilot and classification queues',()=>run(async page=>{
 await ready(page);await page.getByRole('tab',{name:'Review queue',exact:true}).click();assert.equal(await page.locator('button[aria-label="Domain"]').count(),0);
 await choose(page,'Pilot state','In review');assert.match(await card(page,'review:pilots').innerText(),/P07/);assert.match(await card(page,'review:pilots').innerText(),/P08/);assert.ok(!(await card(page,'review:pilots').innerText()).includes('P01'));
 const data=await copied(page,'review:pilots');assert.match(data,/P07/);assert.ok(!data.includes('P01'));
 await card(page,'review:pilots').getByRole('textbox',{name:/Search/}).fill('no matching pilot');assert.match(await card(page,'review:pilots').innerText(),/No results|No rows|0 results/i);await card(page,'review:pilots').getByRole('textbox',{name:/Search/}).fill('');
 await choose(page,'Pilot state','All');await choose(page,'Classification','ich');assert.match(await card(page,'review:classifications').innerText(),/1–5 of 5/);const classes=await copied(page,'review:classifications');assert.ok(!classes.includes('ford'));
 await choose(page,'Classification','All');assert.match(await card(page,'review:sequence').innerText(),/6 authored.*4 locally accepted.*24/s);
 await page.screenshot({path:shots+'/reviews-1280.png'});
}));
test('source inspection exposes the pinned commits, scope definitions and unknown human evidence',()=>run(async page=>{
 await ready(page);await card(page,'production-accepted').getByRole('button',{name:/actions$/}).click();await page.getByRole('menuitem',{name:'View data source'}).click();await page.getByRole('tab',{name:'Overview',exact:true}).waitFor();const body=await page.locator('body').innerText();assert.match(body,/facab15e/);assert.match(body,/primary home/);assert.match(body,/not a live monitor/);assert.match(body,/not zero/);await page.getByRole('tab',{name:'Evidence flow',exact:true}).click();const evidence=await page.locator('.source-sidebar').innerText();assert.match(evidence,/facab15e297c645d4826935f2c011a4cf367ee88/);assert.match(evidence,/sha256/);
}));
test('all tabs fit narrow light/dark screens and navigation works at a project prefix',async()=>{
 for(const colorScheme of ['light','dark'])await run(async page=>{
  await ready(page,'/project');for(const tab of ['Coverage','Work streams','Review queue']){await page.getByRole('tab',{name:tab,exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,tab+' overflow');await page.screenshot({path:shots+'/'+tab.replaceAll(' ','-')+'-320-'+colorScheme+'.png'});}
  const links=await page.getByRole('navigation',{name:'Atlas navigation'}).getByRole('link').evaluateAll(es=>es.map(e=>e.href));assert.ok(links.every(url=>new URL(url).pathname.startsWith('/project/')));
  await page.getByRole('link',{name:'Explore 30 domains',exact:true}).click();assert.ok(page.url().endsWith('/project/labs/atlas/domains/'));
 },{viewport:{width:320,height:900},colorScheme});
});
