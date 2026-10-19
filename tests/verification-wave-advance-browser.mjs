import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const dir='/tmp/wave-advance-browser';mkdirSync(dir,{recursive:true});const results=[];
try {
  for(const theme of ['light','dark']) {
    const context=await browser.newContext({viewport:{width:1100,height:1400}});await installBrowserAssets(context,{local:true});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/waves/ch03-b.js&id=waves-3.14&theme=${theme}&still`);
    await page.waitForFunction(()=>window.__done);
    await page.evaluate(()=>{window.__advanceCurves=[{},{}];window.__vizStages.forEach((s,i)=>{const path=s.path;s.path=function(points,options){window.__advanceCurves[i][options.color]=points;return path.call(this,points,options)};});});
    for(const secondLine of [false,true]) {
      if(secondLine)await page.locator('#viz .ctl-toggle label').click();
      for(const tau of [0,3]) {
        await page.locator('#viz input[type=range]').nth(3).evaluate((e,tau)=>{e.value=String(tau);e.dispatchEvent(new Event('input',{bubbles:true}));},tau);
        await page.waitForFunction(({tau})=>{const e=document.querySelector('.viz-readout');return e.innerText.includes(tau?'acausal response: the relation fails':'causal response: the relation holds')&&window.__advanceCurves[1].green;},{tau});
        await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
        const metrics=await page.evaluate(()=>{
          const [frequency,time]=window.__advanceCurves,points=time.green;
          const peak=Math.max(...points.map(p=>Math.abs(p[1]))),before=Math.max(...points.filter(p=>p[0]<-.1).map(p=>Math.abs(p[1])));
          const error=Math.max(...frequency.accent.map((p,i)=>Math.abs(p[1]-frequency.orange[i][1])));
          const scale=Math.max(...frequency.accent.map(p=>Math.abs(p[1])));
          return {peak,before,error,scale};
        });
        assert.ok(metrics.peak>0&&Number.isFinite(metrics.error));
        if(tau===0){assert.ok(metrics.before/metrics.peak<.01);assert.ok(metrics.error/metrics.scale<1e-4);}
        else {assert.ok(metrics.before/metrics.peak>.3);assert.ok(metrics.error/metrics.scale>.1);}
        const text=await page.locator('.viz-readout').innerText();assert.doesNotMatch(text,/NaN|Infinity/);
        const screenshot=`${dir}/${theme}-${secondLine?'two':'one'}-tau${tau}.png`;await page.locator('#shot').screenshot({path:screenshot});
        results.push({theme,secondLine,tau,...metrics,text,screenshot});
      }
    }
    assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
    await context.close();
  }
} finally {await browser.close();await new Promise(r=>server.close(r));}
writeFileSync('/tmp/wave-advance-browser.json',JSON.stringify(results,null,2)+'\n');console.log(results.map(({theme,secondLine,tau,before,peak,error})=>({theme,secondLine,tau,before,peak,error})));
