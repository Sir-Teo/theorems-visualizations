import assert from 'node:assert/strict';import {mkdirSync,writeFileSync}from'node:fs';import{chromium}from'playwright-core';
import{createServer}from'../scripts/serve.mjs';import{findBrowser,installBrowserAssets}from'../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const dir='/tmp/bioinf-source-verification-shots';mkdirSync(dir,{recursive:true});const results=[];
try{for(const theme of ['light','dark'])for(const[num,file]of [['3.9','ch03-b.js'],['4.1','ch04.js'],['4.5','ch04.js']]){const id=`bioinf-${num}`,page=await browser.newPage({viewport:{width:1300,height:1800}});await installBrowserAssets(page.context());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const read=async()=>{await settle();return page.locator('.viz-readout').innerText();};
 const slider=async(n,value)=>{await page.locator('#viz input[type=range]').nth(n).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await settle();};
 try{await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/bioinf/${file}&id=${id}&theme=${theme}&wait=150&still`,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.__done,null,{timeout:120000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
 if(num==='3.9'){
  assert.match(await read(),/neighbourhood setup excluded/);await slider(0,18);await slider(1,40);await page.locator('#viz .ctl-toggle label').click();await page.getByRole('button',{name:'4',exact:true}).click();await slider(0,24);await slider(2,2);assert.match(await read(),/two-hit/);assert.doesNotMatch(await read(),/NaN|Infinity|outside the range/);
 }else if(num==='4.1'){
  await page.locator('.ctl-select').nth(0).locator('button').nth(2).click();await page.locator('.ctl-select').nth(1).locator('button').nth(1).click();await slider(0,Math.log10(200000));assert.match(await read(),/200000/);await page.getByRole('button',{name:'Resample',exact:true}).click();await slider(0,2);assert.match(await read(),/N=100|N = 100|N100/);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else{
  await slider(0,500);await slider(1,.2);await slider(2,.2);await slider(3,.02);assert.match(await read(),/500 rolls/);const before=await read();await page.getByRole('button',{name:'Resample',exact:true}).click();assert.notEqual(await read(),before);await slider(1,.9);await slider(2,.01);await slider(3,.4);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.ok(await page.evaluate(()=>typeof window.katex?.render==='function'));assert.ok(await page.locator('.katex').count()>0);
 const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',screenshot});
 }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});}finally{await page.close();}console.log(`${results.at(-1).status} ${id} ${theme}`);}}
finally{await browser.close();await new Promise(r=>server.close(r));}writeFileSync('/tmp/bioinf-source-verification-browser.json',JSON.stringify(results,null,2)+'\n');for(const r of results.filter(r=>r.status==='failed'))console.error(r.id,r.theme,r.error);process.exitCode=results.some(r=>r.status==='failed')?1:0;
