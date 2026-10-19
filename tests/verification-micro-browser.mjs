import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';
import { createServer } from '../scripts/serve.mjs';

const wanted = new Set(['9.4','9.6','9.7','9.20','9.21','10.4','10.5','10.7','10.9','10.12','10.13','10.14','10.15','10.20','10.22']);
const files = ['ch09.js','ch09-b.js','ch09-d.js','ch10.js','ch10-b.js','ch10-c.js','ch10-d.js'];
const selected = process.env.VERIFY_IDS ? new Set(process.env.VERIFY_IDS.split(',')) : null;
const items = [];
for (const file of files) for (const item of (await import(`../content/micro/${file}`)).default.items) if (wanted.has(item.num)) items.push({id:`micro-${item.num}`,file:`content/micro/${file}`});
const server = createServer(); await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const browser = await chromium.launch({executablePath:findBrowser(),headless:true});
mkdirSync('/tmp/atlas-micro-shots',{recursive:true}); const results=[];
try {
  for (const theme of ['light','dark']) for (const {id,file} of items.filter(x=>!selected||selected.has(x.id))) {
    const page=await browser.newPage({viewport:{width:1100,height:1600}}); await installBrowserAssets(page.context());
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    const check=async()=>{
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      assert.deepEqual(errors,[]); assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]); assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);
      assert.doesNotMatch((await page.locator('.viz-readout').allInnerTexts()).join(' '),/NaN|Infinity|undefined/);
    };
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=${file}&id=${id}&theme=${theme}&wait=200&still=1`); await page.waitForFunction(()=>window.__done,null,{timeout:60000});
      const done=await page.evaluate(()=>window.__done); for(const key of ['errors','texErrors','blank'])assert.deepEqual(done[key],[]); assert.equal(done.renderer,'KaTeX 0.16.11');
      for(const input of await page.locator('#viz input[type=range]:visible').all()) for(const edge of ['min','max']) {
        await input.evaluate((el,key)=>{el.value=el[key];el.dispatchEvent(new Event('input',{bubbles:true}));},edge); await check();
      }
      for(const input of await page.locator('#viz input[type=checkbox]:visible').all()){await input.locator('..').click();await check();}
      for(const button of await page.locator('#viz button:visible').elementHandles()) {
        if(/play|pause|▶|❚❚/i.test(await button.innerText()))continue;
        if(await button.isVisible()&&await button.isEnabled()){await button.click();await check();}
      }
      for(const input of await page.locator('#viz input[type=range]:visible').all()) for(const edge of ['min','max']) {
        await input.evaluate((el,key)=>{el.value=el[key];el.dispatchEvent(new Event('input',{bubbles:true}));},edge); await check();
      }
      if(id==='micro-10.4') {
        await page.getByRole('button',{name:'constant elasticity',exact:true}).click();
        for(const [i,value]of [[0,'.5'],[1,'4']])await page.locator('#viz input[type=range]').nth(i).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
        await check();assert.match(await page.locator('.viz-readout').innerText(),/65536/);
      }
      const handles=await page.evaluate(()=>(window.__vizStages||[]).flatMap((s,si)=>s.handles.map((h,hi)=>({si,hi}))));
      for(const {si,hi} of handles) {
        const pos=await page.evaluate(({si,hi})=>{const s=window.__vizStages[si],h=s.handles[hi],r=s.canvas.getBoundingClientRect();return{x:r.x+s.X(h.x),y:r.y+s.Y(h.y)};},{si,hi});
        await page.mouse.move(pos.x,pos.y);await page.mouse.down();await page.mouse.move(pos.x+25,pos.y-15,{steps:3});await page.mouse.up();await check();
      }
      if(id==='micro-10.13') {
        for(const [i,value]of [[0,'0'],[1,'5']])await page.locator('#viz input[type=range]').nth(i).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
        await check(); assert.match(await page.locator('.viz-readout').innerText(),/boundary solution: follower exits/);
      }
      await check();const screenshot=`/tmp/atlas-micro-shots/${id}-${theme}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({id,theme,status:'passed',screenshot});
    }catch(e){results.push({id,theme,status:'failed',error:String(e.stack||e)});console.error(results.at(-1).error);}finally{await page.close();}
    console.log(`${results.at(-1).status==='passed'?'✓':'✗'} ${id} ${theme}`);
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`/tmp/atlas-micro-browser${selected?'-targeted':''}.json`,JSON.stringify(results,null,2)+'\n');process.exitCode=results.some(r=>r.status==='failed')?1:0;
