import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,r));const browser=await chromium.launch({executablePath:findBrowser(),headless:true});const dir='/tmp/minkowski-gauge-browser';mkdirSync(dir,{recursive:true});const results=[];
try{for(const theme of['light','dark']){
  const context=await browser.newContext({viewport:{width:1100,height:1300}});await installBrowserAssets(context,{local:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/fa/ch01-a4.js&id=fa-1.33&theme=${theme}&still`);await page.waitForFunction(()=>window.__done);
  const move=async(x,y)=>{const cv=page.locator('#viz canvas');await cv.scrollIntoViewIfNeeded();const q=await page.evaluate(({x,y})=>{const s=window.__vizStages[0],h=s.handles[0],b=s.canvas.getBoundingClientRect();return{from:[b.left+s.X(h.x),b.top+s.Y(h.y)],to:[b.left+s.X(x),b.top+s.Y(y)]}},{x,y});await page.mouse.move(...q.from);await page.mouse.down();await page.mouse.move(...q.to,{steps:5});await page.mouse.up();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  const save=async(name)=>{const text=await page.locator('.viz-readout').innerText();assert.doesNotMatch(text,/NaN|undefined/);const screenshot=`${dir}/${theme}-${name}.png`;await page.locator('#shot').screenshot({path:screenshot});results.push({theme,name,text,screenshot});};
  const options=page.getByRole('group',{name:'A',exact:true}).getByRole('button');
  for(let i=0;i<4;i++){
    await options.nth(i).click();await move(0,0);assert.deepEqual(await page.evaluate(()=>{const h=window.__vizStages[0].handles[0];return[h.x,h.y]}),[0,0]);const annotations=await page.locator('.viz-readout annotation').allTextContents();assert.ok(annotations[0].includes('0.000'));await save(`mode${i}-origin`);
    await move(1,.2);if(i===3)assert.match(await page.locator('.viz-readout annotation').first().textContent(),/infty/);else assert.doesNotMatch(await page.locator('.viz-readout annotation').first().textContent(),/infty/);await save(`mode${i}-point`);
  }
  await options.nth(2).click();await move(-1,.2);assert.match(await page.locator('.viz-readout annotation').first().textContent(),/infty/);await save('disk-outward');
  await options.nth(3).click();await move(1,.02);assert.equal(await page.evaluate(()=>window.__vizStages[0].handles[0].y),0);assert.doesNotMatch(await page.locator('.viz-readout annotation').first().textContent(),/infty/);await save('segment-snapped');
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__vizErrors||[]),[]);assert.deepEqual(await page.evaluate(()=>window.__texErrors||[]),[]);await context.close();
}}finally{await browser.close();await new Promise(r=>server.close(r));}writeFileSync('/tmp/minkowski-gauge-browser.json',JSON.stringify(results,null,2)+'\n');console.log(`${results.length} native states passed`);
