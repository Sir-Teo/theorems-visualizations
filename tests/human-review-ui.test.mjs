import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
let browser, server, base;
before(async () => {
  server = createServer(); await new Promise(r => server.listen(0, r)); base = `http://localhost:${server.address().port}`;
  browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
});
after(async () => { await browser?.close(); await new Promise(r => server?.close(r)); });

test('reviewer attestations, persistence and exported records work through the real UI', async () => {
  const page = await browser.newPage({ viewport: { width: 1350, height: 1100 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${base}/tools/human-review.html`); await page.locator('#items button').first().waitFor();
    assert.match(await page.locator('#progress').innerText(), /Visual: 0\/113 passed/);
    const id = await page.locator('#items button').first().getAttribute('data-id');
    await page.getByRole('button', { name: 'Pass visual review', exact: true }).click();
    assert.match(await page.locator('#message').innerText(), /reviewer name/);
    await page.locator('#name').fill('Automated UI fixture');
    await page.getByRole('button', { name: 'Pass visual review', exact: true }).click();
    assert.match(await page.locator('#message').innerText(), /Complete the review steps/);
    for (const checkbox of await page.locator('#review input[type=checkbox]').all()) await checkbox.check();
    await page.getByRole('button', { name: 'Pass visual review', exact: true }).click();
    assert.match(await page.locator('#progress').innerText(), /Visual: 1\/113 passed/);
    await page.reload(); await page.locator('#items button').first().waitFor();
    assert.match(await page.locator('#progress').innerText(), /Visual: 1\/113 passed/);
    const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export reviews', exact: true }).click();
    const download = await downloadPromise, stream = await download.createReadStream(); let json = '';
    for await (const chunk of stream) json += chunk;
    const exported = JSON.parse(json); assert.equal(exported.records.length, 1); assert.equal(exported.records[0].id, id);
    const stale = structuredClone(exported); stale.records[0].fingerprint = 'outdated';
    await page.locator('#import').setInputFiles({ name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(stale)) });
    await page.locator('#message').filter({ hasText: 'ignored 1 stale' }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('atlas-human-review-v1')).records.length), 1);
    await page.getByRole('button', { name: 'View dark', exact: true }).click();
    assert.match(await page.locator('#example').getAttribute('src'), /theme=dark/);
    await page.setViewportSize({ width: 375, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    // Test records stay in this isolated browser context; they never enter the repository.
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});
