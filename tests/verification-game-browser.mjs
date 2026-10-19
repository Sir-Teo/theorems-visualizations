import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';
const files = ['ch03.js', 'ch03-b.js', 'ch04.js', 'ch04-b.js', 'ch04-c.js'];
const skip = new Set(['3.1','3.2','3.3','3.5','3.7','3.8','3.10']);
const items = [];
for (const file of files) for (const item of (await import(`../content/game/${file}`)).default.items) if (!skip.has(item.num)) items.push({id:`game-${item.num}`, file:`content/game/${file}`});
const selected = process.env.VERIFY_IDS ? new Set(process.env.VERIFY_IDS.split(',')) : null;
const server = createServer(); await new Promise(r => server.listen(0,'127.0.0.1',r));
const browser = await chromium.launch({executablePath:findBrowser(),headless:true});
mkdirSync('/tmp/atlas-game-shots',{recursive:true}); const results=[];
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
   if(id==='game-4.4'){
    const ranges=page.locator('#viz input[type=range]');
    await ranges.nth(0).evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await ranges.nth(1).evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await settle();const text=await page.locator('.viz-readout').innerText();assert.match(text,/subgame perfect:.*Out.*Fight.*In.*Fight.*In.*Accept/);
   }
   if(id==='game-4.10'){await page.getByRole('button',{name:'absent-minded driver',exact:true}).click();await check();assert.match(await page.locator('.viz-readout').innerText(),/best behaviour strategy[\s\S]*4\/3/);}
   await check();const screenshot=`/tmp/atlas-game-shots/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',screenshot});
  }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(results.at(-1).error);}finally{await page.close();}
  console.log(`${results.at(-1).status==='passed'?'✓':'✗'} ${id} ${theme}`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`/tmp/atlas-game-browser${selected?'-targeted':''}.json`,JSON.stringify(results,null,2)+'\n');process.exitCode=results.some(r=>r.status==='failed')?1:0;
