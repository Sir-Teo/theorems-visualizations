// Integration-only native route check. Requires the accepted production build.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[];
try{
  for(const [name,ids] of [['history',['tech','bighist','polsci']],['literature',['ling','art']]]){
    const page=await browser.newPage({viewport:{width:320,height:900},reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const path='/labs/atlas/x-'+name+'-0001/';
    await page.goto(base+path);await page.locator('#notes').fill('Integration round-trip note');
    for(const id of ids){
      const collection=(await import('../content/'+id+'/collection.js')).default;
      await page.locator('.related a[href$="/c/'+id+'"]').click();
      await page.waitForFunction(title=>document.querySelector('#app h1')?.textContent===title,collection.title);
      assert.equal(new URL(page.url()).hash,'#/c/'+id);
      await page.goBack();await page.locator('#notes').waitFor();
      assert.equal(await page.locator('#notes').inputValue(),'Integration round-trip note');
      results.push({pilot:name,collection:id,result:'PASS'});
    }
    await page.locator('.site-header a').click();
    await page.waitForFunction(()=>document.querySelector('#app h1')?.textContent==='Ideas, visualized.');
    assert.equal(new URL(page.url()).hash,'#/');
    await page.goBack();await page.locator('#notes').waitFor();
    assert.equal(await page.locator('#notes').inputValue(),'Integration round-trip note');
    assert.deepEqual(errors,[]);await page.close();
  }
  const home=JSON.parse(await readFile(new URL('../data/home.json',import.meta.url),'utf8'));
  assert.ok(!JSON.stringify(home).includes('x-history-0001'));
  assert.ok(!JSON.stringify(home).includes('x-literature-0001'));
  console.log(JSON.stringify({result:'PASS',collectionRoundTrips:results,homeRoundTrips:2,pilotDraftsExcludedFromHomeCatalog:true},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
