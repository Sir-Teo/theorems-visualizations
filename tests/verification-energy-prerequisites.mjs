import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
const output = process.env.ENERGY_PREREQUISITES_OUTPUT || '/tmp/atlas-new-imaging-source/energy-prerequisites';
await mkdir(output,{recursive:true});
const entries=[['1.10','ch01-b.js'],['2.7','ch02.js'],['2.8','ch02.js'],['2.9','ch02.js'],['2.12','ch02.js'],['3.7','ch03-b.js'],['3.8','ch03-b.js'],['4.2','ch04.js'],['4.4','ch04.js'],['4.7','ch04-b.js']];
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:320,height:1100}}), errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 for(const theme of ['light','dark'])for(const [num,file] of entries) {
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/energy/${file}&id=energy-${num}&theme=${theme}&w=284&still=1&wait=150`);
  await page.waitForFunction(()=>window.__done);
  const done=await page.evaluate(()=>window.__done);
  for(const key of ['errors','texErrors','blank'])assert.deepEqual(done[key],[],`${num} ${theme} ${key}`);
  const idea=page.locator('#idea');await idea.scrollIntoViewIfNeeded();
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const bounds=await idea.evaluate(el=>{const b=el.getBoundingClientRect();return {text:el.textContent,scroll:el.scrollWidth,client:el.clientWidth,left:b.left,right:b.right,width:innerWidth,descendants:[...el.querySelectorAll('.katex-display,.katex')].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,left:r.left,right:r.right,scroll:e.scrollWidth,client:e.clientWidth};})};});
  assert.ok(bounds.scroll<=bounds.client+1,`${num} idea overflow: ${JSON.stringify(bounds)}`);
  assert.ok(bounds.left>=0&&bounds.right<=bounds.width,`${num} idea viewport`);
  for(const d of bounds.descendants)assert.ok(d.left>=bounds.left-1&&d.right<=bounds.right+1,`${num} math overflows explanation: ${JSON.stringify(d)}`);
  assert.deepEqual(errors,[]);
  await idea.screenshot({path:`${output}/idea-${num}-${theme}-320.png`});
  console.log(`PASS energy-${num} ${theme} 320: changed explanation and all inline math fit; actual visualization has no runtime/TeX/blank errors`);
 }
} finally {await page.close();await browser.close();server.close();}
