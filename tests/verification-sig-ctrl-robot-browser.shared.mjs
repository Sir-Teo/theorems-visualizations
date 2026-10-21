import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
export async function auditBrowser() {
  const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
  const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1500 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/\/tools\/harness\.html\?/, async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('stats.stages++;', `stats.stages++;(window.__auditStages||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__texts=[];s.__dots=[];s.__paths=[];s.__bars=[];s.__fns=[];return begin();};for(const[k,list]of [['text','__texts'],['dot','__dots'],['path','__paths'],['bars','__bars'],['fn','__fns']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}`);
    await route.fulfill({ response, body });
  });
  const settle = () => page.waitForTimeout(120);
  const read = () => page.locator('.viz-readout').innerText();
  const state = () => page.evaluate(() => window.__auditStages.map(s => ({ dots: s.__dots, paths: s.__paths, bars: s.__bars, x: s.xr, y: s.yr, handles: s.handles.map(h => ({ x: h.x, y: h.y })) })));
  const open = async (file, id, theme) => {
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/${file}&id=${id}&still=1&wait=150&theme=${theme}`);
    await page.waitForFunction(() => window.__done, null, { timeout: 60000 });
    const done = await page.evaluate(() => window.__done); assert.deepEqual(done.errors, []); assert.deepEqual(done.texErrors, []);
  };
  const menu = async (i, j) => { await page.locator('.ctl-select').nth(i).locator('button').nth(j).click(); await settle(); };
  const slide = async (i, end) => { await page.locator('.ctl-slider input[type=range]').nth(i).focus(); await page.keyboard.press(end ? 'End' : 'Home'); await settle(); };
  const drag = async (stage, id, x, y) => {
    const points = await page.evaluate(({ stage, id, x, y }) => { const s = window.__auditStages[stage], h = id === null ? { x, y: 0 } : s.handles[id], b = s.canvas.getBoundingClientRect(); return [[b.x + s.X(h.x), b.y + s.Y(h.y)], [b.x + s.X(x), b.y + s.Y(y)]]; }, { stage, id, x, y });
    await page.mouse.move(...points[0]); await page.mouse.down(); await page.mouse.move(...points[1], { steps: 12 }); await page.mouse.up(); await settle();
  };
  const clean = async () => {
    assert.deepEqual(errors, []); assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    assert.doesNotMatch(await read(), /NaN|undefined|\$\{/);
    for (const s of await state()) {
      for (const a of s.dots) assert.ok(a.slice(0, 2).every(Number.isFinite));
      for (const [values] of s.bars) assert.ok(Object.values(values).every(Number.isFinite));
      for (const [points] of s.paths) for (const p of points) if (p) assert.ok(p.every(Number.isFinite));
    }
  };
  const snap = (name, theme) => page.screenshot({ path: `/tmp/atlas-${name}-${theme}.png`, fullPage: true });
  const close = async () => { await browser.close(); server.close(); };
  return { page, open, menu, slide, drag, read, state, clean, snap, close, settle };
}
