import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
import {createServer} from '../scripts/serve.mjs';
const dir='/tmp/nla-rank-followup';mkdirSync(dir,{recursive:true});
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),ctx=await browser.newContext({viewport:{width:1150,height:1600}});await installBrowserAssets(ctx,{local:true});
const results=[],frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const slider=async(p,i,value)=>{await p.locator('#viz input[type=range]').nth(i).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await frame(p);};
const tex=p=>p.locator('.viz-readout annotation[encoding="application/x-tex"]').allTextContents();
try{for(const theme of['light','dark'])for(const num of['1.8','1.9']){
 const id='nla-'+num,page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/nla/ch01-b.js&id=${id}&theme=${theme}&wait=150&still=2&w=1080`);await page.waitForFunction(()=>window.__done,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);assert.equal(await page.evaluate(()=>window.katex.version),'0.16.11');
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-default.png`});
  if(num==='1.8'){
   await slider(page,0,5);await slider(page,1,0);assert.ok((await tex(page)).includes('\\operatorname{rank} A_5=5\\le 5'));assert.equal(await page.locator('.viz-readout strong').last().innerText(),'0');
   await page.getByRole('group',{name:'norm',exact:true}).getByRole('button').nth(1).click();await page.getByRole('group',{name:'competitors',exact:true}).getByRole('button').nth(1).click();await frame(page);assert.equal(await page.locator('.viz-readout strong').last().innerText(),'0');
   await slider(page,0,1);await slider(page,1,.2);await page.getByRole('button',{name:'New matrix',exact:true}).click();await frame(page);assert.ok((await tex(page)).includes('\\operatorname{rank} A_1=1\\le 1'));assert.equal(await page.locator('.viz-readout strong').last().innerText(),'0');
  }else{
   await slider(page,0,0);let values=await tex(page);assert.ok(values.includes('k=0'));assert.ok(values.includes('0\\%'));assert.ok(values.includes('1'));
   await page.getByRole('group',{name:'image',exact:true}).getByRole('button').nth(1).click();await slider(page,0,64);values=await tex(page);assert.ok(values.includes('k=64'));assert.ok(values.includes('100\\%'));assert.ok(values.includes('0'));
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.equal(await page.locator('.katex-error').count(),0);assert.doesNotMatch(await page.locator('.viz-readout').innerText(),/NaN|undefined/);
  await page.locator('#shot').screenshot({path:`${dir}/${id}-${theme}-controls.png`});results.push({id,theme,status:'passed',readoutTex:await tex(page)});
 }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(id,theme,String(e));}finally{await page.close();}console.log(results.at(-1).status,id,theme);
}}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`${dir}/browser.json`,JSON.stringify(results,null,2)+'\n');process.exitCode=results.some(r=>r.status!=='passed')?1:0;
