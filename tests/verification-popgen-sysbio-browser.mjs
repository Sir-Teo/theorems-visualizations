import assert from 'node:assert/strict';import {mkdirSync,writeFileSync}from'node:fs';import{chromium}from'playwright-core';
import{createServer}from'../scripts/serve.mjs';import{findBrowser,installBrowserAssets}from'../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const dir='/tmp/popgen-sysbio-verification-shots';mkdirSync(dir,{recursive:true});const results=[];
try{for(const theme of ['light','dark'])for(const[col,num,file]of [['sysbio','3.1','ch03.js'],['sysbio','3.7','ch03-b.js'],['popgen','2.10','ch02-b.js'],['popgen','3.12','ch03-b.js'],['popgen','3.14','ch03-b.js']]){const id=`${col}-${num}`,page=await browser.newPage({viewport:{width:1300,height:1800}});await installBrowserAssets(page.context());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const read=async()=>{await settle();return page.locator('.viz-readout').innerText();};
 const slider=async(n,value)=>{await page.locator('#viz input[type=range]').nth(n).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await settle();};
 try{await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/${col}/${file}&id=${id}&theme=${theme}&wait=150&still`,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.__done,null,{timeout:120000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);
 const clickStage=async(index,x,y)=>{const p=await page.evaluate(([index,x,y])=>{const s=window.__vizStages[index],r=s.canvas.getBoundingClientRect();return[r.left+s.X(x),r.top+s.Y(y)];},[index,x,y]);await page.mouse.click(...p);await settle();};
 if(id==='sysbio-3.1'){
  for(let k=0;k<8;k++){await clickStage(1,k%4+.5,k<4?1.6:.5);assert.match(await read(),new RegExp(`${k<4?'C':'I'}${k%4+1}`));}await page.getByRole('button',{name:'OR',exact:true}).click();assert.match(await read(),/I4/);await page.locator('.ctl-select').nth(0).locator('button').nth(0).click();assert.match(await read(),/C1/);
 }else if(id==='sysbio-3.7'){
  for(const gate of ['AND','OR','SUM']){await page.getByRole('button',{name:gate,exact:true}).click();for(const[x,y]of[[1.5,1.8],[3.5,.6]])await clickStage(0,x,y);assert.match(await read(),new RegExp(gate));assert.doesNotMatch(await read(),/NaN|Infinity/);}
 }else if(id==='popgen-2.10'){
  assert.match(await read(),/105 simulated lines/);await page.getByRole('button',{name:'I: 107 lines',exact:true}).click();assert.match(await read(),/107 simulated lines/);await slider(1,0);assert.match(await read(),/0 lines lost/);assert.match(await read(),/107 still segregating/);await slider(0,4);await slider(1,19);const first=await read();await page.getByRole('button',{name:'Resample lines',exact:true}).click();assert.notEqual(await read(),first);await slider(0,16);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }else if(id==='popgen-3.12'){
  await slider(0,-9);await slider(2,1);assert.ok(await page.evaluate(()=>{const s=window.__vizStages[0];return s.Y(4e-8)<s.canvas.height&&s.Y(4e-8)>0;}));await page.locator('#viz .ctl-toggle label').click();await slider(1,4);await slider(2,12);assert.doesNotMatch(await read(),/NaN|Infinity/);assert.match(await read(),/2012 compilation/);
 }else{
  assert.match(await read(),/1\.75/);await slider(0,10);await slider(1,-9);await slider(2,Math.log10(30));await slider(3,2);await slider(4,-2);assert.ok(await page.evaluate(()=>{const s=window.__vizStages[1];return s.X(.01/(300*100))>0;}));await slider(0,8);await slider(1,-11);await slider(2,Math.log10(.5));await slider(3,Math.log10(3));await slider(4,Math.log10(.5));assert.match(await read(),/100\.00%/);assert.doesNotMatch(await read(),/NaN|Infinity/);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.ok(await page.evaluate(()=>typeof window.katex?.render==='function'));assert.ok(await page.locator('.katex').count()>0);
 const screenshot=`${dir}/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',screenshot});
 }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});}finally{await page.close();}console.log(`${results.at(-1).status} ${id} ${theme}`);}}
finally{await browser.close();await new Promise(r=>server.close(r));}writeFileSync('/tmp/popgen-sysbio-verification-browser.json',JSON.stringify(results,null,2)+'\n');for(const r of results.filter(r=>r.status==='failed'))console.error(r.id,r.theme,r.error);process.exitCode=results.some(r=>r.status==='failed')?1:0;
