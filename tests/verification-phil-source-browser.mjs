import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';
const items=[['3.7','ch03.js'],['4.1','ch04.js'],['4.7','ch04-b.js'],['4.8','ch04-b.js']];
const selected=process.env.VERIFY_IDS?new Set(process.env.VERIFY_IDS.split(',')):null;
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true,args:['--mute-audio']});
const results=[];mkdirSync('/tmp/atlas-phil-source-shots',{recursive:true});
try{for(const theme of ['light','dark'])for(const [num,file]of items.filter(([n])=>!selected||selected.has(n))){
 const page=await browser.newPage({viewport:{width:1100,height:1600}});await installBrowserAssets(page.context());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=async()=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.doesNotMatch((await page.locator('.viz-readout').allInnerTexts()).join(' '),/NaN|Infinity|undefined/);};
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/phil/${file}&id=phil-${num}&theme=${theme}&wait=200&still=1`);await page.waitForFunction(()=>window.__done,null,{timeout:60000});
  const done=await page.evaluate(()=>window.__done);for(const key of ['errors','texErrors','blank'])assert.deepEqual(done[key],[]);assert.equal(done.renderer,'KaTeX 0.16.11');
  for(const input of await page.locator('#viz input[type=range]:visible').all())for(const edge of ['min','max']){await input.evaluate((el,k)=>{el.value=el[k];el.dispatchEvent(new Event('input',{bubbles:true}));},edge);await check();}
  for(const input of await page.locator('#viz input[type=checkbox]:visible').all()){await input.locator('..').click();await check();}
  for(const select of await page.locator('#viz select:visible').all())for(const option of await select.locator('option').all()){await select.selectOption(await option.getAttribute('value'));await check();}
  for(const button of await page.locator('#viz button:visible').elementHandles())if(await button.isVisible()&&await button.isEnabled()){await button.click();await check();}
  for(const canvas of await page.locator('#viz canvas').all()){const box=await canvas.boundingBox();if(!box)continue;await page.mouse.move(box.x+box.width*.45,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.4,{steps:3});await page.mouse.up();await check();}
  if(num==='4.1'){
   await page.getByRole('group',{name:'semantics',exact:true}).getByRole('button',{name:'with a gap',exact:true}).click();
   for(const [sentence,pattern] of [['liar',/Surviving assignments:.*gap/],['strengthened liar',/No assignment survives/],['truth-teller',/true, false, gap/]]){
    await page.getByRole('group',{name:'sentence',exact:true}).getByRole('button',{name:sentence,exact:true}).click();await check();assert.match((await page.locator('.viz-readout').allInnerTexts()).join(' '),pattern);
   }
  }
  if(num==='4.8'){
   await page.getByRole('button',{name:'Uniform',exact:true}).click();
   for(let i=0;i<5;i++)await page.getByRole('button',{name:'Teacher repairs',exact:true}).click();
   await check();assert.match((await page.locator('.viz-readout').allInnerTexts()).join(' '),/no day is possible/);
   await page.getByRole('button',{name:'Uniform',exact:true}).click();await check();
  }
  await check();const screenshot=`/tmp/atlas-phil-source-shots/phil-${num}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id:`phil-${num}`,theme,status:'passed',screenshot});
 }catch(error){results.push({id:`phil-${num}`,theme,status:'failed',error:String(error.stack||error)});console.error(results.at(-1).error);}finally{await page.close();}console.log(results.at(-1).status,num,theme);
}}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`/tmp/atlas-phil-source-browser${selected?'-targeted':''}.json`,JSON.stringify(results,null,2)+'\n');process.exitCode=results.some(r=>r.status==='failed')?1:0;
