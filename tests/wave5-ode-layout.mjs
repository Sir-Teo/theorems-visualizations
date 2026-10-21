// Chapter-specific supplementary layout acceptance: catch clipped math that page-overflow checks miss.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {loadAll} from '../scripts/lib.mjs';
const items=(await loadAll()).items.filter(i=>i.col==='ode'&&i.chapter===5);
assert.equal(items.length,18);
const server=createServer();await new Promise(r=>server.listen(0,r));
let browser;
try{
 browser=await chromium.launch({executablePath:findBrowser(),headless:true});
 const page=await browser.newPage({viewport:{width:320,height:1100}});
 for(const item of items)for(const theme of['light','dark']){
  const url=new URL(`http://localhost:${server.address().port}/tools/harness.html`);url.search=new URLSearchParams({file:item.file,id:item.id,theme,w:'284',still:'1',wait:'50'});
  await page.goto(url.href);await page.waitForFunction(()=>window.__done);await page.evaluate(()=>document.fonts.ready);
  const q=await page.evaluate(()=>({errors:window.__done.errors,tex:window.__done.texErrors,math:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({text:e.textContent,scroll:e.scrollWidth,width:e.clientWidth})),raw:[...document.querySelectorAll('.viz-readout')].filter(e=>/\\times|\\frac|\\sqrt/.test(e.textContent)).map(e=>e.textContent)}));
  assert.deepEqual(q.errors,[],`${item.id} runtime`);assert.deepEqual(q.tex,[],`${item.id} TeX`);assert.deepEqual(q.math,[],`${item.id} ${theme}: clipped display math`);assert.deepEqual(q.raw,[],`${item.id}: raw readout TeX`);
  if(item.num==='5.14'){
   await page.getByRole('button',{name:'One full turn',exact:true}).click();const control=page.locator('input[type=range]').nth(1);assert.equal(await control.getAttribute('step'),'any');assert.ok(Math.abs(Number(await control.inputValue())-2*Math.PI)<16*Number.EPSILON*Math.PI,'full-turn button avoids step-grid snapping within native serialization precision');
  }
  if(item.num==='5.16'){
   await page.getByRole('button',{name:'Critical energy',exact:true}).click();const control=page.locator('input[type=range]').nth(1);assert.equal(await control.getAttribute('step'),'any');assert.ok(Math.abs(Number(await control.inputValue())-Math.SQRT1_2)<16*Number.EPSILON,'critical-energy button avoids step-grid snapping');
  }
  if(item.num==='5.18'){
   const ranges=page.locator('input[type=range]');await ranges.nth(0).evaluate(e=>{e.value='0.05';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.getByRole('button',{name:'Choose b=1+k²/4',exact:true}).click();assert.equal(await ranges.nth(1).getAttribute('step'),'any');assert.ok(Math.abs(Number(await ranges.nth(1).inputValue())-(1+.05*.05/4))<16*Number.EPSILON,'certificate button retains an off-grid quadratic weight');
  }
  if(item.num==='5.17')await page.screenshot({path:`/tmp/atlas-wave5-native/${item.id}-${theme}-320.png`,fullPage:true});
 }
 console.log('PASS ODE5 supplementary mobile math layout: 18 items × 2 themes, no clipped display formulas or raw readout TeX');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
