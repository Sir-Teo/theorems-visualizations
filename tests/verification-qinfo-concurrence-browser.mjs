import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),results=[],dir='/tmp/atlas-qinfo-concurrence';mkdirSync(dir,{recursive:true});
try {
  for(const theme of ['light','dark']) {
    const page=await browser.newPage({viewport:{width:1150,height:1400}});await installBrowserAssets(page.context(),{local:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/qinfo/ch02.js&id=qinfo-2.8&theme=${theme}&wait=200`);await page.waitForFunction(()=>window.__done,null,{timeout:120000});
      const done=await page.evaluate(()=>window.__done);assert.deepEqual(done.errors,[]);assert.deepEqual(done.texErrors,[]);assert.deepEqual(done.blank,[]);assert.equal(done.renderer,'KaTeX 0.16.11');
      const text=async()=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return(await page.locator('.viz-readout').innerText()).replace(/\s+/g,' ');};
      const slider=async(n,x)=>{await page.locator('#viz input[type=range]').nth(n).evaluate((el,x)=>{el.value=String(x);el.dispatchEvent(new Event('input',{bubbles:true}));},x);return text();};
      await page.getByRole('button',{name:'W class',exact:true}).click();await slider(0,500);await slider(1,0);let t=await text();assert.match(t,/500 states/);assert.match(t,/500 within/);assert.match(t,/3-tangle =\s*1\.000/);assert.doesNotMatch(t,/bound holds|never negative/);
      await slider(1,90);t=await text();assert.match(t,/0\.444/);assert.match(t,/0\.889/);assert.match(t,/3-tangle =\s*-?0\.000/);
      const before=await page.locator('canvas').first().evaluate(c=>c.toDataURL());await page.getByRole('button',{name:'Resample',exact:true}).click();await text();const after=await page.locator('canvas').first().evaluate(c=>c.toDataURL());assert.notEqual(before,after);
      await page.getByRole('button',{name:'Haar random',exact:true}).click();await slider(0,20);assert.match(await text(),/20 states/);await page.getByRole('button',{name:'both',exact:true}).click();await slider(0,250);await slider(1,51);t=await text();assert.match(t,/250 states/);assert.match(t,/sampled states/);assert.deepEqual(errors,[]);
      const shot=`${dir}/qinfo-2.8-${theme}.png`;await page.screenshot({path:shot,fullPage:true});results.push({id:'qinfo-2.8',theme,ok:true,renderer:done.renderer,inputs:['W class:500 samples','GHZ endpoint','W endpoint','Resample changes canvas','Haar:20 samples','both:250 samples,theta51degrees'],readout:t,screenshot:shot});
    }finally{await page.close();}
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`${dir}/native-controls.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({id,theme,ok})=>({id,theme,ok}))));
