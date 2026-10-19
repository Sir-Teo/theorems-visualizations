import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser, installBrowserAssets} from '../scripts/browser.mjs';

const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath: findBrowser(), headless: true});
const results = [];
mkdirSync('/tmp/philosophers-followup', {recursive: true});
try {
  for (const theme of ['light', 'dark']) for (const id of ['dist-4.6', 'dist-4.7']) {
    const page = await browser.newPage({viewport: {width: 1250, height: 1400}});
    await installBrowserAssets(page.context());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/dist/ch04-b.js&id=${id}&theme=${theme}&w=1150`);
    await page.waitForFunction(() => window.__done);
    const initial = await page.evaluate(() => window.__done);
    assert.deepEqual(initial.errors, []);
    assert.deepEqual(initial.blank, []);
    const text = () => page.locator('.viz-readout').innerText();
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const click = async name => { await page.getByRole('button', {name, exact: true}).click(); await settle(); };
    const checks = [];
    if (id === 'dist-4.6') {
      assert.match(await text(), /meals eaten so far 0/);
      await click('polite (put fork back)');
      assert.match(await text(), /meals eaten so far 0/);
      await click('one at a time');
      assert.ok(+((await text()).match(/meals eaten so far (\d+)/)?.[1]) > 0);
      await click('lockstep');
      assert.match(await text(), /meals eaten so far 0/);
      await page.locator('input[type=checkbox]').locator('..').click(); await settle();
      await page.locator('input[type=checkbox]').locator('..').click(); await settle();
      await click('hold and wait');
      checks.push('both programs, both schedules, handedness toggle');
    } else {
      await click('always left first (deterministic)');
      await click('lockstep');
      assert.match(await text(), /nobody ate/);
      assert.match(await text(), /300 runs never produced a meal/);
      await click('coin flip first fork');
      assert.doesNotMatch(await text(), /nobody ate/);
      await click('new seed');
      await click('random order');
      checks.push('deterministic collective starvation, coin recovery, both schedules, new seed');
    }
    // Native keyboard input visits both endpoints and restores each original value.
    for (const slider of await page.locator('input[type=range]').all()) {
      const original = await slider.inputValue();
      await slider.focus(); await slider.press('Home'); await settle();
      await slider.press('End'); await settle();
      assert.doesNotMatch(await text(), /NaN|Infinity|undefined/);
      await slider.evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', {bubbles: true})); }, original);
      await settle();
    }
    checks.push('both slider endpoints and restored state');
    assert.deepEqual(errors, []);
    assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    const screenshot = `/tmp/philosophers-followup/${id}-${theme}.png`;
    await page.locator('#shot').screenshot({path: screenshot});
    results.push({id, theme, renderer: initial.renderer, checks, readout: await text(), screenshot, errors});
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
const sourceHash = createHash('sha256').update(readFileSync('content/dist/ch04-b.js')).digest('hex');
writeFileSync('docs/verification/philosophers-browser.json', JSON.stringify({sourceHash, results}, null, 2) + '\n');
console.log('4/4 philosopher item/theme groups pass, including mode changes and slider extremes.');
