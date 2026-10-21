import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const page = await browser.newPage({ viewport: { width: 1450, height: 1450 } }), errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch(); let body = await response.text();
  body = body.replace('stats.stages++;', `stats.stages++;(window.__S||=[]).push(s);if(s.begin){const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];return begin();};}for(const[k,list]of[['path','__P'],['dot','__D']]){const f=s[k].bind(s);s[k]=(...a)=>{(s[list]||=[]).push(a);return f(...a);};}`);
  body = body.replace('return item.viz(v);', 'const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();return window.__R;});return item.viz(v);');
  await route.fulfill({ response, body });
});
const slide = async (j, end) => { await page.locator('input[type=range]').nth(j).focus(); await page.keyboard.press(end ? 'End' : 'Home'); await page.waitForTimeout(35); };
const sample = () => page.evaluate(() => ({ r: window.__R, e: window.__vizErrors || [], tex: document.querySelectorAll('.katex-error').length,
  S: window.__S.map(s => ({ b: s.bounds, p: s.__P || [], d: s.__D || [], h: s.handles.map(h => [h.x, h.y]) })) }));
function clean(q) {
  assert.deepEqual(q.e, []); assert.equal(q.tex, 0); assert.doesNotMatch(q.r, /NaN|Infinity|undefined/);
  for (const s of q.S) {
    const inside = p => assert.ok(Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[0] >= s.b.x[0] - 1e-9 && p[0] <= s.b.x[1] + 1e-9 && p[1] >= s.b.y[0] - 1e-9 && p[1] <= s.b.y[1] + 1e-9, `clipped data ${JSON.stringify({ p, b: s.b })}`);
    for (const [points] of s.p) if (Array.isArray(points)) for (const p of points) inside(p);
    for (const [x, y] of s.d) inside([x, y]);
    for (const p of s.h) inside(p);
  }
}
try {
  for(const theme of ['light','dark']) for(const id of ['3.7','3.8']) {
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/energy/ch03-b.js&id=energy-${id}&theme=${theme}&w=1380&still=1&wait=150`);
    await page.waitForFunction(()=>window.__done);
    const done=await page.evaluate(()=>window.__done);assert.deepEqual(done.errors,[]);assert.deepEqual(done.texErrors,[]);assert.deepEqual(done.blank,[]);
    if(id==='3.7'){
      for(const dollars of [.05,.99,1,1.01,1.3])for(const high of [false,true]){
        await page.locator('input[type=range]').evaluateAll((es,[d,h])=>{es[0].value=d;es[1].value=h?es[1].max:es[1].min;es.forEach(e=>e.dispatchEvent(new Event('input',{bubbles:true})));},[dollars,high]);
        await page.waitForTimeout(65);const q=await sample();clean(q);assert.match(q.r,/Small-reactivity time scale/);if(dollars>=1)assert.match(q.r,/jump approximation is unavailable/);
      }
    }else{
      for(let mode=0;mode<3;mode++){
        await page.locator('.ctl-select').first().locator('button').nth(mode).click();
        for(let mask=0;mask<8;mask++)for(let toggle=0;toggle<2;toggle++){
          await page.locator('input[type=range]').evaluateAll((es,m)=>es.forEach((e,j)=>{e.value=(m&(1<<j))?e.max:e.min;e.dispatchEvent(new Event('input',{bubbles:true}));}),mask);
          await page.waitForTimeout(65);let q=await sample();clean(q);assert.match(q.r,/Run complete|Run power ceiling/);
          await page.locator('.ctl-toggle').click();await page.waitForTimeout(65);
        }
      }
    }
    await page.screenshot({path:`/tmp/atlas-energy-kinetics-${id}-${theme}.png`,fullPage:true});
    console.log(`PASS kinetics ${id} ${theme}: full coefficient/input corners, threshold or program/feedback boundaries, finite bounded curves and honest stop readouts`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); await new Promise(r => server.close(r)); }
