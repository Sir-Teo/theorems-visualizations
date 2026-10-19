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
mkdirSync('/tmp/dijkstra-followup', {recursive: true});
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({viewport: {width: 1150, height: 1500}});
    await installBrowserAssets(page.context());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/dist/ch04-d.js&id=dist-4.13&theme=${theme}`);
    await page.waitForFunction(() => window.__done);
    const initial = await page.evaluate(() => window.__done);
    assert.deepEqual(initial.errors, []);
    assert.deepEqual(initial.blank, []);
    const text = () => page.locator('.viz-readout').innerText();
    const click = async name => {
      await page.getByRole('button', {name, exact: true}).click();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    await click('explore every schedule');
    assert.match(await text(), /Complete reachable-state search over 52674 states/);
    assert.match(await text(), /no mutual-exclusion violation found/);
    await click('2');
    await click('explore every schedule');
    assert.match(await text(), /Complete reachable-state search over 548 states/);
    await click('3000 random steps');
    assert.match(await text(), /0 steps with two processes critical/);
    await click('raise flag, then wait');
    await click('explore every schedule');
    assert.match(await text(), /frozen state reachable/);
    await click('replay the shortest failing schedule');
    await click('look, then raise flag');
    await click('explore every schedule');
    assert.match(await text(), /mutual exclusion fails/);
    await click('replay the shortest failing schedule');
    assert.match(await text(), /Mutual exclusion violated/);
    await click('Dijkstra 1965');
    await click('3');
    await click('reset');
    await click('step P0');
    const readout = await text();
    assert.match(readout, /After 1 steps/);
    assert.match(readout, /does not check livelock or starvation freedom/);
    assert.deepEqual(errors, []);
    assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    const screenshot = `/tmp/dijkstra-followup/${theme}.png`;
    await page.locator('#shot').screenshot({path: screenshot});
    results.push({theme, renderer: initial.renderer, checks: 'both process counts, complete exploration, random run, both naive counterexamples and replays, reset and individual step', readout, screenshot, errors});
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
const sources = Object.fromEntries(['content/dist/ch04-d.js', 'content/dist/ch04.shared.js'].map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]));
writeFileSync('docs/verification/dijkstra-browser.json', JSON.stringify({sources, results}, null, 2) + '\n');
console.log('2/2 native theme groups pass, including exploration and counterexample replay.');
