import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';
const files=['ch04-b.js','ch05.js','ch05-b.js','ch05-c.js'];
const ids=new Set(['4.7','4.11','5.1','5.4','5.5','5.7','5.10','5.11','5.12','5.13','5.14','5.15']);
const items=[];for(const file of files)for(const item of (await import(`../content/fin/${file}`)).default.items)if(ids.has(item.num))items.push({id:`fin-${item.num}`,file:`content/fin/${file}`});
const selected = process.env.VERIFY_IDS ? new Set(process.env.VERIFY_IDS.split(',')) : null;
const server = createServer(); await new Promise(r => server.listen(0,'127.0.0.1',r));
const browser = await chromium.launch({executablePath:findBrowser(),headless:true});
mkdirSync('/tmp/atlas-fin-shots',{recursive:true}); const results=[];
try {
 for (const theme of ['light','dark']) for (const {id,file} of items.filter(x=>!selected||selected.has(x.id))) {
  const page=await browser.newPage({viewport:{width:1100,height:1600}}); await installBrowserAssets(page.context());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const settle=async()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const check=async()=>{await settle();assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);const s=await page.locator('.viz-readout').allInnerTexts();assert.doesNotMatch(s.join(' '),/NaN|Infinity|undefined/);};
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=200&still=1`);await page.waitForFunction(()=>window.__done,null,{timeout:60000});
   const done=await page.evaluate(()=>window.__done);for(const key of ['errors','texErrors','blank'])assert.deepEqual(done[key],[]);assert.equal(done.renderer,'KaTeX 0.16.11');
   for(const input of await page.locator('#viz input[type=range]:visible').all()){
    for(const edge of ['min','max']){await input.evaluate((el,key)=>{el.value=el[key];el.dispatchEvent(new Event('input',{bubbles:true}));},edge);await check();}
   }
   for(const input of await page.locator('#viz input[type=checkbox]:visible').all()){await input.locator('..').click();await check();}
   const buttons=await page.locator('#viz button:visible').elementHandles();let clicked=0;
   for(const button of buttons){if(clicked>=12)break;const label=await button.innerText();if(/play|pause|▶|❚❚/i.test(label))continue;if(await button.isVisible() && await button.isEnabled()){await button.click();await check();clicked++;}}
   if(id==='fin-5.7'){
    const ranges=page.locator('#viz input[type=range]');for(const [i,value]of [[1,'30'],[4,'20']])await ranges.nth(i).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
    await settle();const text=await page.locator('.viz-readout').innerText();assert.match(text,/cannot open/);assert.match(text,/average final equity 1.00/);
   }
   if(id==='fin-5.13'){
    await page.locator('#viz input[type=range]').nth(2).evaluate(el=>{el.value='85';el.dispatchEvent(new Event('input',{bubbles:true}));});await settle();assert.match(await page.locator('.viz-readout').innerText(),/already reached/);
   }
   await check();const screenshot=`/tmp/atlas-fin-shots/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',screenshot});
  }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(results.at(-1).error);}finally{await page.close();}
  console.log(`${results.at(-1).status==='passed'?'✓':'✗'} ${id} ${theme}`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`/tmp/atlas-fin-browser${selected?'-targeted':''}.json`,JSON.stringify(results,null,2)+'\n');process.exitCode=results.some(r=>r.status==='failed')?1:0;
