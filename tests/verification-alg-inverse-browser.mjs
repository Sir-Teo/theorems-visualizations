import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
import {createServer} from '../scripts/serve.mjs';

const dir='/tmp/alg-inverse-followup';mkdirSync(dir,{recursive:true});
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const ctx=await browser.newContext({viewport:{width:1150,height:1500}});await installBrowserAssets(ctx,{local:true});
const results=[],frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const tex=p=>p.locator('#viz annotation[encoding="application/x-tex"]').allTextContents();
async function chip(page,i,n){
 const b=await page.locator('#viz canvas').first().boundingBox(),w=Math.min(.1,.94/n);
 await page.mouse.click(b.x+b.width*(.5+(i-(n-1)/2)*w),b.y+b.height*.5);await frame(page);
}
try{for(const theme of['light','dark'])for(const num of['3.23a','3.30','3.31']){
 const id='alg-'+num,page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=async(mode,expected=[])=>{
  await frame(page);const values=await tex(page);
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);
  assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);assert.equal(await page.locator('.katex-error').count(),0);
  for(const value of expected)assert.ok(values.some(v=>v.includes(value)),`Missing ${value} in ${id} ${mode}`);
  assert.doesNotMatch(await page.locator('.viz-readout').innerText(),/NaN|undefined/);
  const screenshot=`${dir}/${id}-${theme}-${mode}.png`;await page.locator('#shot').screenshot({path:screenshot});
  results.push({id,theme,mode,status:'passed',readout:await page.locator('.viz-readout').innerText(),readoutTex:await page.locator('.viz-readout annotation').allTextContents(),screenshot});
  console.log('passed',id,theme,mode);
 };
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/alg/ch03-c.js&id=${id}&theme=${theme}&wait=150&still=2&w=1080`);
  await page.waitForFunction(()=>window.__done,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);assert.equal(await page.evaluate(()=>window.katex.version),'0.16.11');
  const modes=num==='3.30'?['Z12','D3','Z']:['Z12','D4','Q8','U15'];
  for(let i=0;i<modes.length;i++){
   await page.getByRole('group',{name:'group',exact:true}).getByRole('button').nth(i).click();await frame(page);
   if(num==='3.30'&&modes[i]==='Z'){
    const subsets=page.locator('[role=group]').filter({has:page.getByRole('button',{name:'odd',exact:true})});
    for(let j=0;j<5;j++){await subsets.getByRole('button').nth(j).click();await check(`Z-subset-${j}`);}
   }else await check(modes[i],num==='3.31'&&modes[i]==='D4'?['(r^{2})^{-1}','(r^{3})^{-1}']:[]);
  }
  if(num==='3.23a'){
   await page.getByRole('group',{name:'group',exact:true}).getByRole('button').nth(1).click();await frame(page);
   await chip(page,2,8);await chip(page,3,8);
   await check('D4-inverse-witness',['(r^{3})^{-1} = r']);
   await page.getByRole('group',{name:'group',exact:true}).getByRole('button').nth(2).click();await frame(page);
   await chip(page,2,8);await chip(page,3,8);
   await check('Q8-negative-inverse-witness',['(-i)^{-1} = i']);
  }
  if(num==='3.31'){
   await page.getByRole('group',{name:'group',exact:true}).getByRole('button').nth(1).click();await frame(page);
   await chip(page,1,8);await check('D4-inverse-witness',['e\\,(r^{3})^{-1} = r\\notin H']);
   for(const i of[0,2,3])await chip(page,i,8);await check('D4-empty');
  }
 }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(id,theme,String(e));}
 finally{await page.close();}
}}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`${dir}/browser.json`,JSON.stringify(results,null,2)+'\n');process.exitCode=results.some(r=>r.status!=='passed')?1:0;
