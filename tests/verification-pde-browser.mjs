import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const targets={pde:['3.11','3.12','3.14','4.1','4.2','4.3','4.5','4.6','4.7','4.9','4.12']};
const candidates=[];
for(const [collection,nums] of Object.entries(targets))for(const f of await (await import('node:fs/promises')).readdir(`content/${collection}`)){
 if(!/^ch.*\.js$/.test(f)||f.includes('shared'))continue;
 const m=(await import(`../content/${collection}/${f}`)).default;
 for(const item of m.items||[])if(nums.includes(item.num)&&item.viz)candidates.push({collection,file:f,num:item.num});
}
assert.equal(candidates.length,11);
const requested=process.argv.slice(2), selected=requested.length?candidates.filter(c=>requested.includes(c.num)):candidates;
assert.ok(selected.length>0);
const output = requested.length?`/tmp/pde-focus-${requested.join('-')}-shots`:'/tmp/pde-verification-shots';
const reportPath=requested.length?`/tmp/pde-focus-${requested.join('-')}-browser.json`:'/tmp/pde-verification-browser.json';
await mkdir(output, { recursive: true });
const results = [];
async function frame(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: theme });
    await installBrowserAssets(context);
    for (const { collection, file, num } of selected) {
      const id = `${collection}-${num}`;
      if(results.some(r=>r.id===id&&r.theme===theme)) continue;
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/tools/harness.html?file=content/${collection}/${file}&id=${id}&theme=${theme}&w=1100&wait=5`);
      await page.waitForFunction(() => window.__done);
      const ready = await page.evaluate(() => window.__done);
      assert.equal(ready.ok, true, JSON.stringify(ready));
      assert.equal(ready.renderer, 'KaTeX 0.16.11');
      assert.deepEqual(ready.errors, []);
      assert.deepEqual(ready.texErrors, []);
      assert.deepEqual(ready.blank, []);
      await page.screenshot({ path: `${output}/${id}-${theme}.png`, fullPage: true });
      await page.evaluate(() => { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { const original = AC.prototype.createGain; AC.prototype.createGain = function() { const g = original.call(this); g.gain.value = 0; return g; }; } });
      const before = await page.locator('.viz-readout').innerText();
      const sliders = page.locator('input[type=range]');
      let sliderChecks = 0;
      for (let j = 0; j < await sliders.count(); j++) {
        const input = sliders.nth(j);
        if (!await input.isVisible()) continue;
        const original = await input.inputValue();
        await input.focus(); await input.press('Home'); await frame(page);
        await input.press('End'); await frame(page);
        await input.evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, original);
        await frame(page); sliderChecks++;
      }
      for (const input of await page.locator('input[type=checkbox]').all()) {
        if (!await input.isVisible()) continue;
        await input.locator('..').click(); await frame(page); await input.locator('..').click(); await frame(page);
      }
      for (const group of await page.locator('.ctl-select').all()) {
        const options = group.locator('button');
        for (const button of await options.all()) {
          if (!await button.isVisible()) continue;
          if (collection === 'pl' && ['Y', 'Ω', 'Omega'].includes((await button.innerText()).trim())) continue;
          await button.scrollIntoViewIfNeeded(); await button.click({timeout:5000}); await frame(page);
          for (const input of await sliders.all()) {
            if (!await input.isVisible()) continue;
            const original = await input.inputValue();
            await input.focus(); await input.press('Home'); await frame(page);
            await input.press('End'); await frame(page);
            await input.evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, original);
            await frame(page); sliderChecks++;
          }
        }
      }
      for (const group of await page.locator('.ctl-select').all()) { const b=group.locator('button').first(); if(await b.isVisible()) { await b.click(); await frame(page); } }
      if (id === 'pde-4.2') { await page.getByRole('button', {name:'hear this string'}).click(); await frame(page); }
      // Real pointer input, using only stage coordinate conversion to aim the drag.
      await page.evaluate(()=>window.__vizStages.find(s=>s.handles?.some(h=>h.visible!==false))?.canvas.scrollIntoView({block:"center"}));
      await frame(page);
      const handle = await page.evaluate(() => {
        const s = window.__vizStages.find(s => s.handles?.some(h=>h.visible!==false));
        if (!s) return null;
        const h = s.handles.find(h=>h.visible!==false), box = s.canvas.getBoundingClientRect();
        return { x: box.x + s.X(h.x), y: box.y + s.Y(h.y), old: [h.x, h.y] };
      });
      if (handle) {
        await page.mouse.move(handle.x, handle.y); await page.mouse.down();
        await page.mouse.move(handle.x + 45, handle.y - 30, { steps: 8 }); await page.mouse.up(); await frame(page);
        const changed = await page.evaluate(() => { const s = window.__vizStages.find(s => s.handles?.some(h=>h.visible!==false)); return [s.handles.find(h=>h.visible!==false).x, s.handles.find(h=>h.visible!==false).y]; });
        assert.notDeepEqual(changed, handle.old, `${id}: pointer drag`);
      }
      if (id === 'pde-3.14') {
        for (let j=0;j<3;j++) {
          await page.locator('canvas').first().scrollIntoViewIfNeeded();
          const q=await page.evaluate(j=>{const s=window.__vizStages[0],h=s.handles[j],b=s.canvas.getBoundingClientRect();return{x:b.x+s.X(h.x),y:b.y+s.Y(h.y),zero:b.y+s.Y(0)}},j);
          await page.mouse.move(q.x,q.y);await page.mouse.down();await page.mouse.move(q.x,q.zero,{steps:8});await page.mouse.up();await frame(page);
        }
        assert.match(await page.locator('.viz-readout').innerText(),/zero initial heat/);
        await page.locator('.ctl-select').first().locator('button').nth(1).click();await frame(page);
        assert.match(await page.locator('.viz-readout').innerText(),/zero initial heat/);
        await page.screenshot({path:`${output}/${id}-${theme}-zero-bar.png`,fullPage:true});
      }
      for (const button of await page.locator('.viz-controls > button').all()) { if (!await button.isVisible()) continue;
          if (collection === 'pl' && ['Y', 'Ω', 'Omega'].includes((await button.innerText()).trim())) continue;
          await button.scrollIntoViewIfNeeded(); await button.click({timeout:5000}); await frame(page); }
      await frame(page);
      const live = await page.evaluate(() => ({ errors: window.__vizErrors || [], tex: window.__texErrors || [] }));
      assert.deepEqual(errors, [], `${id}: runtime errors`);
      assert.deepEqual(live.errors, [], `${id}: live errors`);
      assert.deepEqual(live.tex, [], `${id}: live TeX errors`);
      const after = await page.locator('.viz-readout').innerText();
      assert.ok(!/NaN|Infinity|undefined/.test(after), `${id}: ${after}`);
      results.push({ id: `${id}`, theme, sliderChecks, pointer: !!handle, before, after });
      await writeFile(reportPath, JSON.stringify(results, null, 2));
      console.log(`${id} ${theme}: ${sliderChecks} slider sweeps, pointer=${!!handle}`);
      await page.close();
    }
    await context.close();
  }
  await writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`Passed ${results.length} light/dark item checks, ${results.reduce((s, r) => s + r.sliderChecks, 0)} slider endpoint sweeps and ${results.filter(r => r.pointer).length} pointer drags.`);
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
