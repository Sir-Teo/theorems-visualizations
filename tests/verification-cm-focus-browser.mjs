import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[];await mkdir('/tmp/cm-focus-shots',{recursive:true});
try{
 for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width:1280,height:1000},colorScheme:theme});await installBrowserAssets(ctx);
  for(const [num,file] of [['3.12','ch03-b.js'],['4.10','ch04-b.js'],['4.12','ch04-b.js']]){
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/cm/${file}&id=cm-${num}&theme=${theme}&w=1100&wait=5`);
   await page.waitForFunction(()=>window.__done);assert.equal((await page.evaluate(()=>window.__done)).ok,true);
   if(num==='4.10'){await page.locator('input[type=range]').first().focus();await page.keyboard.press('Home');}
   if(num==='4.12'){await page.locator('.ctl-select').first().locator('button').nth(1).click();await page.locator('input[type=range]').last().focus();await page.keyboard.press('Home');}
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const txt=await page.locator('.viz-readout').innerText();
   if(num==='4.10')assert.match(txt,/accumulation/);
   if(num==='3.12')assert.match(txt,/5.105/);
   assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
   await page.screenshot({path:`/tmp/cm-focus-shots/cm-${num}-${theme}.png`,fullPage:true});results.push({num,theme,readout:txt});await page.close();
  }await ctx.close();
 }
 await writeFile('/tmp/cm-focus-browser.json',JSON.stringify(results,null,2));console.log('Passed6 focused light/dark cases: corrected NaCl preset, negative-gate accumulation, GaAs exciton comparison.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
