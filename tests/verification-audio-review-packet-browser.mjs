// Synthetic form and native playback tests; never human listening evidence.
import assert from 'node:assert/strict';
import {mkdirSync, readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser, installBrowserAssets} from '../scripts/browser.mjs';

const inventory = JSON.parse(readFileSync('docs/verification/audio-review-inventory.json', 'utf8'));
const server = createServer({verificationAssets: true});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath: findBrowser(), headless: true, args: ['--mute-audio']});
const reviewer = 'AUTOMATED WORKSHEET TEST — NOT A HUMAN LISTENER';
try {
  const context = await browser.newContext({viewport: {width: 1400, height: 1200}, acceptDownloads: true});
  await installBrowserAssets(context);
  await context.addInitScript(() => {
    window.__testAudioStarts = 0;
    for (const Type of [AudioBufferSourceNode, OscillatorNode]) {
      const start = Type.prototype.start;
      Type.prototype.start = function(...args) { window.__testAudioStarts++; return start.apply(this, args); };
    }
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/docs/verification/audio-review.html`);
  assert.equal(await page.locator('nav button').count(), inventory.items.length);
  assert.equal(new Set(inventory.items.map(item => item.id)).size, inventory.items.length);
  await page.frameLocator('#example').locator('#app[data-route]').waitFor();
  const frame = page.frames().find(frame => frame.url().includes('index.html'));
  await frame.locator('.katex').first().waitFor();
  assert.equal(await frame.evaluate(() => window.__testAudioStarts), 0, 'worksheet must not autoplay');
  await frame.locator('button.ctl-button').filter({has: frame.locator('svg')}).first().click();
  assert.ok(await frame.evaluate(() => window.__testAudioStarts) > 0, 'embedded native speaker control must work');
  await page.locator('#export').click();
  assert.match(await page.locator('#state').innerText(), /actual human reviewer/);
  await page.locator('#listened').click();
  assert.equal(await page.locator('#listened').isChecked(), false, 'identity/setup are required');
  await page.locator('#reviewer').fill(reviewer);
  await page.locator('#equipment').fill('Synthetic muted Chromium test');
  await page.locator('#listened').check();
  assert.match(await page.locator('#progress').innerText(), /^0 \//, 'empty observations do not complete listening');
  await page.locator('#result').selectOption('issue');
  await page.locator('#notes').fill('Synthetic form test only: <script>window.injected=true</script>. No actual listening findings.');
  assert.match(await page.locator('#progress').innerText(), /^1 \//);
  assert.equal(await page.evaluate(() => window.injected), undefined);
  await page.reload();
  assert.equal(await page.locator('#reviewer').inputValue(), reviewer);
  assert.equal(await page.locator('#listened').isChecked(), true);
  assert.match(await page.locator('#notes').inputValue(), /No actual listening/);
  await page.locator('#filter').fill(inventory.items[1].id);
  assert.equal(await page.locator('nav button').count(), 1);
  await page.locator('nav button').click();
  assert.equal(await page.locator('#listened').isChecked(), false, 'different page has no inherited findings');
  await page.locator('#filter').fill('');
  await page.locator('nav button').first().click();
  // Source invalidation preserves notes while removing completion credit.
  await page.evaluate(() => { manifest.items[0].sourceHash = 'changed-source-test'; select(manifest.items[0]); });
  assert.match(await page.locator('#state').innerText(), /Sources changed/);
  assert.equal(await page.locator('#listened').isChecked(), false);
  assert.match(await page.locator('#progress').innerText(), /^0 \//);
  const download = page.waitForEvent('download');
  await page.locator('#export').click();
  const downloaded = await download;
  const output = JSON.parse(readFileSync(await downloaded.path(), 'utf8'));
  assert.equal(output.kind, 'subjective-audio-listening');
  assert.equal(output.inventory.length, inventory.items.length);
  assert.equal(output.records.length, 1);
  assert.equal(output.records[0].reviewer, reviewer);
  assert.equal(output.records[0].sourceCurrent, false);
  assert.equal(output.records[0].complete, false);
  assert.match(output.meaning, /integration and review/);
  // Switching identity cannot silently relabel an existing attestation.
  await page.locator('#reviewer').fill('DIFFERENT SYNTHETIC IDENTITY');
  await page.locator('#notes').fill('Edited notes; not a listening confirmation.');
  assert.equal(await page.evaluate(() => saved.records[manifest.items[0].id].listened), false);
  assert.deepEqual(errors, []);
  await context.close();
  // Fresh previews have no synthetic findings or listening credit.
  mkdirSync('/tmp/audio-review-preview', {recursive: true});
  for (const width of [1400, 420]) {
    const preview = await browser.newContext({viewport: {width, height: 1100}});
    await installBrowserAssets(preview);
    const view = await preview.newPage();
    await view.goto(`http://127.0.0.1:${server.address().port}/docs/verification/audio-review.html`);
    assert.match(await view.locator('#progress').innerText(), /^0 \//);
    await view.frameLocator('#example').locator('.katex').first().waitFor();
    assert.ok(await view.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await view.screenshot({path: `/tmp/audio-review-preview/${width}.png`, fullPage: true});
    await preview.close();
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
console.log(`${inventory.items.length} listening pages; embedded playback, guards, persistence, filtering, export and stale-source handling pass. No human credit recorded.`);
