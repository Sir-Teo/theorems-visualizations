// Playback-buffer integrity; this test makes no subjective listening claim.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser, installBrowserAssets} from '../scripts/browser.mjs';

const server = createServer({verificationAssets: true});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath: findBrowser(), headless: true});
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({viewport: {width: 1100, height: 1200}});
    await installBrowserAssets(page.context());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.recordedBuffers = [];
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) {
        const data = this.buffer.getChannelData(0);
        let peak = 0, finite = true;
        for (const sample of data) { peak = Math.max(peak, Math.abs(sample)); finite &&= Number.isFinite(sample); }
        window.recordedBuffers.push({length: data.length, rate: this.buffer.sampleRate,
          first: data[0], last: data[data.length - 1], peak, finite});
        return start.apply(this, args);
      };
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/music/ch04.js&id=music-4.5&theme=${theme}&still=1`);
    await page.waitForFunction(() => window.__done);
    assert.deepEqual(await page.evaluate(() => window.__done.errors), []);
    assert.deepEqual(await page.evaluate(() => window.__texErrors || []), []);
    assert.equal(await page.evaluate(() => window.recordedBuffers.length), 0, 'no autoplay');
    for (const sound of ['organ', 'guitar', 'marimba', 'woodblock', 'click', 'noise']) {
      await page.locator('#viz .seg').first().getByRole('button', {name: sound, exact: true}).click();
      const speaker = page.locator('#viz button.ctl-button').filter({has: page.locator('svg')});
      const count = await page.evaluate(() => window.recordedBuffers.length);
      await speaker.click();
      await page.waitForFunction(before => window.recordedBuffers.length > before, count);
      const data = await page.evaluate(() => window.recordedBuffers.at(-1));
      assert.equal(data.length, 65536, `${sound}: plays the entire FFT input buffer`);
      assert.equal(data.rate, 16000);
      assert.equal(data.first, 0);
      assert.equal(Math.abs(data.last), 0, `${sound}: no abrupt nonzero final sample`);
      assert.equal(data.finite, true);
      assert.ok(data.peak > .79 && data.peak <= .800001, `${sound}: normalized non-silent buffer`);
    }
    // A long decay previously got cut off at 2.5 s with appreciable amplitude.
    await page.locator('#viz .seg').first().getByRole('button', {name: 'guitar', exact: true}).click();
    await page.locator('#viz input[type=range]').first().press('End');
    await page.waitForFunction(() => document.querySelector('#viz .viz-readout')?.textContent.includes('3.00 s'));
    await page.locator('#viz button.ctl-button').filter({has: page.locator('svg')}).click();
    assert.equal(await page.evaluate(() => Math.abs(window.recordedBuffers.at(-1).last)), 0);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('All six spectra play complete, finite buffers with silent endpoints in both themes; long-decay release passes. No listening credit.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
