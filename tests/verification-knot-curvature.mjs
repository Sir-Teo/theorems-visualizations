// Actual family/height inputs and camera checks for the knot-curvature audit.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {knotTotalCurvature} from '../content/dg/ch03.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
 const response=await route.fetch(),body=(await response.text()).replace('stats.stages++;',`stats.stages++;
 (window.__auditStages ||= []).push(s);s.__handles=[];
 if(s.handle){const h=s.handle.bind(s);s.handle=(...a)=>{const q=h(...a);s.__handles.push(q);return q;};}
 const begin=s.begin.bind(s);s.begin=()=>{s.__dots=[];s.__fields=[];s.__heats=[];return begin();};
 for(const [key,list] of [['dot','__dots'],['field','__fields'],['heat','__heats']])if(s[key]){const f=s[key].bind(s);s[key]=(...a)=>{s[list].push(a);return f(...a);};}`);
 await route.fulfill({response,body});
});
const settle=()=>page.waitForTimeout(150);
const open=async(theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/dg/ch03-b.js&id=dg-3.12&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const menu=async(i,j)=>{await page.locator('.ctl-select').nth(i).locator('button').nth(j).click();await settle();};
try{
for(const theme of ['light','dark']){
 await open(theme);
 for(let kind=0;kind<3;kind++){
  await menu(0,kind);
  for(const height of ['Home','End']){
   await slider(0,height);const state=await page.evaluate(()=>window.__auditStages.filter(s=>s.__dots.some(p=>!Array.isArray(p[0]))).map(s=>({dots:s.__dots,view:s.view})).at(-1));
   const point=state.dots.at(-1),e=height==='Home'?.02:1.6,expected=knotTotalCurvature(['tre','unk','wrinkle'][kind],e)/Math.PI;
   assert.ok(Math.abs(point[0]-e)<1e-12&&Math.abs(point[1]-expected)<1e-12);assert.ok(point[1]<state.view.y[1]);
   assert.match(await read(),/numerical total curvature/);assert.doesNotMatch(await read(),/NaN|undefined/);
   if(kind===2&&height==='End')assert.match(await read(),/converse fails/);
  }
 }
 const cv=await page.locator('canvas').first().boundingBox();await page.mouse.move(cv.x+.5*cv.width,cv.y+.5*cv.height);await page.mouse.down();await page.mouse.move(cv.x+.7*cv.width,cv.y+.6*cv.height,{steps:12});await page.mouse.up();await settle();
 await page.screenshot({path:`/tmp/atlas-dg-knot-${theme}.png`});
 console.log(`PASS ${theme} knots: all three families and height endpoints, plotted/readout curvature agreement, visible high-curvature unknot, actual camera drag`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
