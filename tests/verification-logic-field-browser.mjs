import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
import {createServer} from '../scripts/serve.mjs';
const dir='/tmp/logic-field-followup';mkdirSync(dir,{recursive:true});
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const ctx=await browser.newContext({viewport:{width:1150,height:1600}});await installBrowserAssets(ctx,{local:true});
const results=[],frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
try{for(const theme of['light','dark'])for(const num of['5.4','5.12']){
 const id='logic-'+num,file=num==='5.4'?'ch05.js':'ch05-b.js',page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=async(mode)=>{
  await frame(page);assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.equal(await page.locator('.katex-error').count(),0);
  const readout=await page.locator('.viz-readout').innerText();assert.doesNotMatch(readout,/NaN|undefined|source check remains open/);
  const screenshot=`${dir}/${id}-${theme}-${mode}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,mode,status:'passed',readout,screenshot});console.log('passed',id,theme,mode);
 };
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/logic/${file}&id=${id}&theme=${theme}&wait=150&still=2&w=1080`);await page.waitForFunction(()=>window.__done,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);assert.equal(await page.evaluate(()=>window.katex.version),'0.16.11');
  if(num==='5.4'){
   const b=await page.locator('#viz canvas').first().boundingBox();
   for(const [i,x]of[56,72,88].entries()){
    await page.mouse.click(b.x+b.width*x/100,b.y+b.height*.756);await frame(page);
    const text=await page.locator('.viz-readout').innerText();assert.match(text,i===0?/continuum many countable/:/cofinalities ω and ω₁/);if(i>0)assert.match(text,/Both have size κ/);await check(`RCF-column-${i}`);
   }
  }else{
   const caption=await page.locator('#shot').innerText();assert.match(caption,/division uses a finite truncation/);assert.match(caption,/is not real closed/);assert.match(caption,/neither that closure nor an ultrapower/);
   const zoom=page.getByRole('group',{name:'zoom (unit)',exact:true});
   for(let i=0;i<5;i++){await zoom.getByRole('button').nth(i).click();await check(`zoom-${i}`);}
   const input=page.locator('#viz input[type=text]').first();await input.fill('1/(1-e)');await input.press('Enter');await frame(page);assert.match(await page.locator('.viz-readout').innerText(),/finite/);assert.doesNotMatch(await page.locator('.viz-readout').innerText(),/cannot read/);
   await page.locator('#viz input[type=range]').first().evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});await check('rational-expression');
  }
 }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(id,theme,String(e));}finally{await page.close();}
}}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`${dir}/browser.json`,JSON.stringify(results,null,2)+'\n');process.exitCode=results.some(x=>x.status!=='passed')?1:0;
