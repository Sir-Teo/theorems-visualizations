import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
import {createServer} from '../scripts/serve.mjs';
const dir='/tmp/bighist-life/shots';mkdirSync(dir,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const results=[],frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const set=async(page,i,value)=>{await page.locator('#viz input[type=range]').nth(i).evaluate((el,val)=>{el.value=String(val);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await frame(page);};
try{
for(const theme of['light','dark'])for(const num of['3.1','3.2','3.3','3.4','3.5']){
 const id='bighist-'+num,page=await browser.newPage({viewport:{width:1150,height:1500}});await installBrowserAssets(page.context());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/bighist/ch03.js&id=${id}&theme=${theme}&wait=150&still=2&w=1080`);await page.waitForFunction(()=>window.__done,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);assert.equal(await page.evaluate(()=>window.katex.version),'0.16.11');
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-default.png`});
  if(num==='3.1'){await set(page,1,7);assert.match(await page.locator('.viz-readout').innerText(),/after 7\.0 days ≈ 2\.40/);await page.getByRole('group',{name:'carbon source',exact:true}).getByRole('button').nth(1).click();await set(page,0,0);assert.match(await page.locator('.viz-readout').innerText(),/0\.0010%/);await set(page,0,2);assert.match(await page.locator('.viz-readout').innerText(),/after 7\.0 days ≈ 2\.00/);}
  if(num==='3.2'){for(let i=0;i<5;i++)await set(page,i,0);assert.match(await page.locator('.viz-readout').innerText(),/all criteria are switched off/);await set(page,1,3);assert.match(await page.locator('.viz-readout').innerText(),/Top of the current weighting: RNA world/);const box=await page.locator('#viz canvas').first().boundingBox();await page.mouse.click(box.x+box.width*(3.5+2.3)/10.3,box.y+box.height*(5.1-.7)/5.3);await frame(page);}
  if(num==='3.3'){await page.getByRole('group',{name:'tree',exact:true}).getByRole('button').nth(1).click();await page.getByRole('button',{name:'illustrative date: 3.65 Ga',exact:true}).click();await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/3\.65/);assert.match(await page.locator('.viz-readout').innerText(),/not a hard minimum/);}
  if(num==='3.4'){await set(page,1,.3);assert.match(await page.locator('.viz-readout').innerText(),/source remains at or below/);await set(page,1,2.5);assert.match(await page.locator('.viz-readout').innerText(),/persists beyond 2\.31 Ga/);assert.doesNotMatch(await page.locator('.viz-readout').innerText(),/gone by/);}
  if(num==='3.5'){await page.getByRole('group',{name:'highlight count',exact:true}).getByRole('button').nth(2).click();await set(page,0,1);assert.match(await page.locator('.viz-readout').innerText(),/13\+1123=1136/);assert.match(await page.locator('.viz-readout').innerText(),/98\.86/);assert.match(await page.locator('.viz-readout').innerText(),/not tell how many/);}
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.equal(await page.locator('.katex-error').count(),0);assert.doesNotMatch(await page.locator('.viz-readout').innerText(),/NaN|undefined/);
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-controls.png`});results.push({id,theme,status:'passed',readout:await page.locator('.viz-readout').innerText()});
 }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(id,theme,String(e));}finally{await page.close();}console.log(`${results.at(-1).status} ${id} ${theme}`);
}
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync('/tmp/bighist-life/browser.json',JSON.stringify(results,null,2)+'\n');process.exitCode=results.some(r=>r.status!=='passed')?1:0;
