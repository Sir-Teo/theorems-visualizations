// Source-audit UI regressions: node tests/verification-growth.mjs.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
import {GA_PWT,rows,NAMES,growthAccounting,pc} from '../content/macro/ch03.shared.js';
import {escapePath} from '../content/macro/ch04.shared.js';

const server=createServer();
await new Promise(resolve=>server.listen(0,resolve));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
// Test-only observation of rendered primitives. Controls use real pointer/keyboard input.
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();
  const body=(await response.text()).replace('stats.stages++;',`stats.stages++;
    (window.__auditStages ||= []).push(s);
    const begin=s.begin.bind(s),rect=s.rect.bind(s);
    s.begin=()=>{s.__auditRects=[];return begin();};
    s.rect=(...args)=>{s.__auditRects.push(args.slice(0,4));return rect(...args);};`);
  await route.fulfill({response,body});
});
const open=async(id,file)=>{
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/macro/${file}&id=macro-${id}&still=1&wait=100`);
  await page.waitForFunction(()=>window.__done);
};
const settle=()=>page.waitForTimeout(80);
const read=()=>page.locator('.viz-readout').innerText();
const slider=async(index,key)=>{await page.locator('input[type=range]').nth(index).focus();await page.keyboard.press(key);await settle();};

try {
  await open('3.9','ch03-b.js');
  for(const [code,name] of Object.entries(NAMES))for(const fixed of [false,true]) {
    await page.getByRole('button',{name,exact:true}).click();
    await page.locator('.ctl-select').nth(1).locator('button').nth(fixed?1:0).click();
    await settle();
    const expected=growthAccounting(rows(GA_PWT,7).filter(r=>r[0]===code),fixed?1/3:null);
    assert.ok((await read()).includes(`mean log GDP growth ${pc(expected.mean.gY,1)}`));
    const {view,rects}=await page.evaluate(()=>({view:window.__auditStages[0].view,rects:window.__auditStages[0].__auditRects}));
    assert.equal(rects.length,24);
    for(const [,a,,b] of rects)assert.ok(Math.min(a,b)>=view.y[0]&&Math.max(a,b)<=view.y[1],'all signed contributions remain visible');
  }
  console.log('PASS growth accounting: ten countries, both share choices, weighted readouts and signed stacks');

  await open('3.11','ch03-b.js');
  for(const key of ['Home','End']) {
    await slider(0,key);
    const state=await page.evaluate(()=>{const s=window.__auditStages[0],h=s.handles[0];return{view:s.view,h:{x:h.x,y:h.y}};});
    assert.ok(state.h.y>state.view.y[0]&&state.h.y<state.view.y[1],'Lucas handle stays visible at capital-share extremes');
    assert.ok((await read()).includes('not a direct test of international investment flows'));
  }
  console.log('PASS Lucas: capital-share endpoints and qualified return comparison');

  await open('4.7','ch04-b.js');
  // Zero population spillover produces an above-subsistence balanced-income path.
  await slider(0,'Home');
  await page.locator('.ctl-toggle label').click();await settle();
  assert.match(await read(),/does not mean income is exactly at subsistence/);
  assert.ok((await read()).includes('1.05'));
  await slider(0,'End');
  const expected=escapePath(2,.0003,.006,false,2.2);
  assert.ok((await read()).includes(`around year ${expected.esc}`));
  // Crossing need not wait for the old arbitrary ln(y)>0.4 condition.
  assert.ok(expected.pts[expected.esc][1]<Math.exp(.4));
  console.log('PASS escape: balanced-income limit and first threshold-crossing readout');

  await open('4.9','ch04-b.js');
  const labels=page.locator('.ctl-toggle label');
  for(let mask=0;mask<8;mask++) {
    for(let i=0;i<3;i++) {
      const input=page.locator('input[type=checkbox]').nth(i);
      if(await input.isChecked()!==!!(mask&(1<<i)))await labels.nth(i).click();
    }
    await settle();
    assert.match(await read(),/homoskedastic se/);
    assert.doesNotMatch(await read(),/NaN|Infinity/);
  }
  console.log('PASS institutions: all eight sample filters and labelled standard errors');
  assert.deepEqual(errors,[]);
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
