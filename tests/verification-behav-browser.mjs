import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';
const items=[['4.6','ch04-b.js'],['4.7','ch04-b.js'],['5.3','ch05.js'],['5.8','ch05-b.js'],['5.9','ch05-b.js']];
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[];mkdirSync('/tmp/atlas-behav-shots',{recursive:true});
try{for(const theme of ['light','dark'])for(const [num,file]of items){
 const page=await browser.newPage({viewport:{width:1100,height:1600}});await installBrowserAssets(page.context());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=async()=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.doesNotMatch((await page.locator('.viz-readout').allInnerTexts()).join(' '),/NaN|Infinity|undefined/);};
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/behav/${file}&id=behav-${num}&theme=${theme}&wait=200&still=1`);await page.waitForFunction(()=>window.__done,null,{timeout:60000});
  const done=await page.evaluate(()=>window.__done);for(const key of ['errors','texErrors','blank'])assert.deepEqual(done[key],[]);assert.equal(done.renderer,'KaTeX 0.16.11');
  for(const input of await page.locator('#viz input[type=range]:visible').all())for(const edge of ['min','max']){await input.evaluate((el,k)=>{el.value=el[k];el.dispatchEvent(new Event('input',{bubbles:true}));},edge);await check();}
  for(const input of await page.locator('#viz input[type=checkbox]:visible').all()){await input.locator('..').click();await check();}
  for(const select of await page.locator('#viz select:visible').all())for(const option of await select.locator('option').all()){await select.selectOption(await option.getAttribute('value'));await check();}
  for(const button of await page.locator('#viz button:visible').elementHandles())if(await button.isEnabled()){await button.click();await check();}
  for(const canvas of await page.locator('#viz canvas').all()){const box=await canvas.boundingBox();if(!box)continue;await page.mouse.move(box.x+box.width*.45,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.4,{steps:5});await page.mouse.up();await check();}
  if(num==='4.6'){for(const [i,x]of [[0,'4'],[1,'.5'],[2,'4']])await page.locator('#viz input[type=range]').nth(i).evaluate((el,val)=>{el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));},x);await check();assert.match(await page.locator('.viz-readout').innerText(),/need not be monotone/i);}
  const screenshot=`/tmp/atlas-behav-shots/behav-${num}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id:`behav-${num}`,theme,status:'passed',screenshot});
 }catch(error){results.push({id:`behav-${num}`,theme,status:'failed',error:String(error.stack||error)});console.error(results.at(-1).error);}finally{await page.close();}console.log(results.at(-1).status,num,theme);
}}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync('/tmp/atlas-behav-browser.json',JSON.stringify(results,null,2)+'\n');process.exitCode=results.some(r=>r.status==='failed')?1:0;
