// Browser checks for the source-reviewed Gaussian and Lebesgue examples.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {sliceExtrema} from '../content/vcalc/ch04.shared.js';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();
  const body=(await response.text()).replace('stats.stages++;',`stats.stages++;
    (window.__auditStages ||= []).push(s);
    const begin=s.begin.bind(s),rect=s.rect.bind(s),path=s.path.bind(s);
    s.begin=()=>{s.__rects=[];s.__paths=[];return begin();};
    s.rect=(...a)=>{s.__rects.push(a.slice(0,4));return rect(...a);};
    s.path=(pts,st={})=>{s.__paths.push(pts.map(p=>p&&Array.from(p)));return path(pts,st);};`);
  await route.fulfill({response,body});
});
const open=async(id,theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/vcalc/ch04-b.js&id=vcalc-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);assert.deepEqual(await page.evaluate(()=>window.__done.errors),[]);assert.deepEqual(await page.evaluate(()=>window.__done.texErrors),[]);};
const settle=()=>page.waitForTimeout(100);
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const read=()=>page.locator('.viz-readout').innerText();
try {
  for(const theme of ['light','dark']) {
    await open('4.8',theme);
    for(const key of ['Home','End']) {
      await slider(0,key);assert.doesNotMatch(await read(),/NaN|Infinity/);
      const stages=await page.evaluate(()=>window.__auditStages.map(s=>({view:s.view,paths:s.__paths})));
      for(const pts of stages[1].paths)for(const p of pts)if(p)assert.ok(p[0]>=0&&p[0]<=3.2&&p[1]>=0&&p[1]<=3.6);
    }
    console.log(`PASS ${theme} Gaussian: radius endpoints and full exhaustion curves in view`);
    await open('4.11',theme);
    for(const [i,k] of ['wavy','chirp'].entries()) {
      await page.locator('.ctl-select button').nth(i).click();
      await page.locator('.ctl-select button').nth(4).click();
      for(const [key,m] of [['Home',1],['End',60]]) {
        await slider(0,key);
        assert.match(await read(),/sample-mean bracket/);assert.match(await read(),/≤/);
        const rects=await page.evaluate(()=>window.__auditStages[0].__rects);
        assert.equal(rects.length,2*m);
        for(let j=0;j<m;j++){
          const [lo,up]=sliceExtrema(k,j/m,(j+1)/m);
          assert.ok(Math.abs(rects[2*j][3]-up)<1e-14);
          assert.ok(Math.abs(rects[2*j+1][3]-lo)<1e-14);
        }
        await page.locator('.ctl-select button').nth(5).click();await settle();
        assert.equal(await page.evaluate(()=>window.__auditStages[0].__rects.length),0);
        await page.locator('.ctl-select button').nth(4).click();await settle();
      }
    }
    await page.locator('.ctl-select button').nth(2).click();await settle();
    assert.match(await read(),/exact range-band bounds/);assert.match(await read(),/integral.*0\.0000/s);
    await page.locator('.ctl-select button').nth(3).click();await settle();await slider(1,'End');
    assert.match(await read(),/0\.0164/);assert.equal(await page.evaluate(()=>window.__auditStages[1].o.xlabel),'n');
    await page.locator('.ctl-select button').nth(0).click();await settle();
    assert.equal(await page.evaluate(()=>window.__auditStages[1].o.xlabel),'m');
    assert.doesNotMatch(await read(),/NaN|Infinity/);
    console.log(`PASS ${theme} slicing: analytic cell rectangles at m=1/60, both slicing modes, rational and sequence states`);
  }
  assert.deepEqual(errors,[]);
} finally {await browser.close();server.close();}
