import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

test('basis reduction can return to its empty first frame and continue through the complete proof', async () => {
  const server = createServer(); await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: findBrowser(), headless: true }), page = await browser.newPage();
  try {
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/ladr/ch02-b.js&id=ladr-2.30&still=1&wait=100`);
    await page.waitForFunction(() => window.__done);
    await page.getByRole('button', { name: 'First step', exact: true }).click();
    await page.waitForTimeout(40);
    assert.match(await page.locator('.steps-count').innerText(), /step 1 \/ 7/);
    assert.match(await page.locator('.steps-note').innerText(), /Start with the spanning list/);
    for (let n = 2; n <= 7; n++) {
      await page.getByRole('button', { name: 'Next step', exact: true }).click();
      await page.waitForTimeout(20);
      assert.match(await page.locator('.steps-count').innerText(), new RegExp(`step ${n} / 7`));
      assert.equal(await page.locator('.viz-error').count(), 0);
    }
    assert.match(await page.locator('.steps-note').innerText(), /it is a basis/);
    assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []);
  } finally { await browser.close(); await new Promise(r => server.close(r)); }
});
