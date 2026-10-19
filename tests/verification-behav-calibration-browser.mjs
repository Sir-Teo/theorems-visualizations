// Native controls and exact rare-tail comparison for the calibration benchmark.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [];
mkdirSync('/tmp/calibration-followup', { recursive: true });
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1150, height: 1500 } });
    await installBrowserAssets(page.context());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/behav/ch03-b.js&id=behav-3.13&theme=${theme}`);
    await page.waitForFunction(() => window.__done);
    const initial = await page.evaluate(() => window.__done);
    assert.deepEqual(initial.errors, []);
    assert.deepEqual(initial.blank, []);
    assert.equal(initial.renderer, 'KaTeX 0.16.11');
    const text = () => page.locator('.viz-readout').innerText();
    const click = async name => {
      await page.getByRole('button', { name, exact: true }).click();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    assert.match(await text(), /independent intervals/);
    await click('lock in this interval');
    assert.match(await text(), /of 1/);
    await click('next question ▶');
    await click('lock in this interval');
    assert.match(await text(), /of 2/);
    await click('◀ previous question');
    await click('lock in this interval');
    assert.match(await text(), /of 2/);
    await click('reveal all (demo)');
    const readout = await text();
    const match = readout.match(/P\(at most (\d+) hits in (\d+)\) ([=<]) (\d+(?:\.\d+)?)/);
    assert.ok(match);
    assert.equal(+match[2], 10);
    // Exact numerator for Bin(10,9/10), independent of the production PMF.
    let choose = 1n, weight = 0n;
    for (let k = 0; k <= +match[1]; k++) {
      weight += choose * 9n ** BigInt(k);
      choose = choose * BigInt(10 - k) / BigInt(k + 1);
    }
    const exact = Number(weight) / 10 ** 10;
    if (match[3] === '<') {
      assert.ok(exact > 0 && exact < Number(match[4]));
      assert.equal(match[4], '0.001');
    } else {
      assert.ok(Math.abs(exact - Number(match[4])) <= 0.000500001);
    }
    assert.match(readout, /Correlated errors/);
    assert.doesNotMatch(readout, /your intervals are too narrow|NaN|Infinity|= 0\.000/);
    assert.deepEqual(errors, []);
    assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    const screenshot = `/tmp/calibration-followup/${theme}.png`;
    await page.locator('#shot').screenshot({ path: screenshot });
    results.push({ theme, renderer: initial.renderer, checks: 'lock, next, previous, repeated lock, reveal, exact independent-binomial tail', hits: +match[1], tail: exact, readout, screenshot, errors });
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
const sourceHash = createHash('sha256').update(readFileSync('content/behav/ch03-b.js')).digest('hex');
writeFileSync('docs/verification/behav-calibration-browser.json', JSON.stringify({ sourceHash, results }, null, 2) + '\n');
console.log('2/2 native theme groups pass; exact tail and actual button transitions verified.');
