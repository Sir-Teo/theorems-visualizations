import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
const dir='/tmp/imaging-mlem-shots';await mkdir(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[];
const settle=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
try{
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1280,height:1050},colorScheme:theme});await installBrowserAssets(context);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/imaging/ch04-c.js&id=imaging-4.8&theme=${theme}&w=1120&wait=5`);
  await page.waitForFunction(()=>window.__done);const ready=await page.evaluate(()=>window.__done);assert.equal(ready.ok,true);assert.equal(ready.renderer,'KaTeX 0.16.11');assert.deepEqual(ready.errors,[]);assert.deepEqual(ready.texErrors,[]);assert.deepEqual(ready.blank,[]);
  const ranges=page.locator('input[type=range]');assert.equal(await ranges.count(),2);
  const buttons=page.locator('.ctl-select button');assert.equal(await buttons.count(),4,'MLEM plus all three subset choices');
  let checks=0;const modes=[];
  await page.screenshot({path:`${dir}/imaging-4.8-${theme}-default.png`,fullPage:true});
  for(let mode=0;mode<4;mode++){
   await buttons.nth(mode).click();await settle(page);const samples=[];
   for(const counts of ['Home','End']){
    await ranges.nth(0).focus();await ranges.nth(0).press(counts);await settle(page);
    for(const k of ['Home','ArrowRight','End']){
     await ranges.nth(1).focus();await ranges.nth(1).press(k);await settle(page);
     const text=await page.locator('.viz-readout').evaluate(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('.katex-mathml').forEach(node=>node.remove());return copy.textContent});assert.ok(!/NaN|Infinity|undefined/.test(text),text);
     const pass=k==='Home'?0:k==='ArrowRight'?1:60;assert.match(text,new RegExp(`Pass ${pass},`));
     assert.match(text,/within the displayed/i);assert.match(text,/higher likelihood need not mean lower image error/i);
     if(mode===0){const match=text.match(/error\s*([\d.]+)\s*\(MLEM at the same pass:\s*([\d.]+)/);assert.ok(match,text);assert.equal(match[1],match[2]);assert.match(text,/counts\s*\/\s*measured counts:\s*1\.0000/)}
     samples.push({counts,pass,text});checks++;
    }
   }
   await page.screenshot({path:`${dir}/imaging-4.8-${theme}-S${[1,2,4,8][mode]}-end.png`,fullPage:true});
   modes.push({S:[1,2,4,8][mode],samples});
  }
  const live=await page.evaluate(()=>({errors:window.__vizErrors||[],tex:window.__texErrors||[]}));assert.deepEqual(errors,[]);assert.deepEqual(live.errors,[]);assert.deepEqual(live.tex,[]);
  results.push({id:'imaging-4.8',theme,nativeStates:checks,nativeModeClicks:4,pointerHandles:0,renderer:ready.renderer,modes});console.log(`${theme}: ${checks} native count/iteration states; four mode clicks`);
  await context.close();
 }
 await writeFile('/tmp/imaging-mlem-browser.json',JSON.stringify({results},null,2)+'\n');
}finally{await browser.close();await new Promise(r=>server.close(r))}
