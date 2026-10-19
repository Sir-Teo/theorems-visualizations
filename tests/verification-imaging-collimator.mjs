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
  for (const theme of ['light', 'dark']) {
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/imaging/ch04.js&id=imaging-4.4&theme=${theme}&w=1380&still=1&wait=150`);
    await page.waitForFunction(() => window.__done);
    const r = await page.evaluate(() => window.__done); assert.deepEqual(r.errors, []); assert.deepEqual(r.texErrors, []); assert.deepEqual(r.blank, []);
    for (let mask = 0; mask < 16; mask++) {
      for (let j = 0; j < 4; j++) await slide(j, !!(mask & 1 << j));
      const q = await sample(); clean(q);
      assert.match(q.r, /not exactly 4/); assert.match(q.r, /not modelled|does not replace/);
      assert.match(q.r, /2\.632.*mm⁻¹/);
      if (!(mask & 8)) assert.match(q.r, /Outside the many-hole regime/);
      assert.equal(q.S[0].h[0][1], mask & 8 ? 200 : 5, 'the source handle tracks the full slider range');
    }
    for (let j = 0; j < 3; j++) { await page.locator('.ctl-select').first().locator('button').nth(j).click(); await page.waitForTimeout(40); clean(await sample()); }
    // Formerly clipped worst corner: 6 mm aperture / 12 mm length / z=200 mm.
    await slide(0, true); await slide(1, false); await slide(2, false); await slide(3, true);
    const q = await sample(); clean(q); assert.ok(q.S[1].b.y[1] > 100);
    await page.screenshot({ path: `/tmp/atlas-imaging-collimator-${theme}.png`, fullPage: true });
    console.log(`PASS collimator ${theme}: sixteen physical input corners, three presets, source synchronization and unclipped geometry/curves`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); await new Promise(r => server.close(r)); }
