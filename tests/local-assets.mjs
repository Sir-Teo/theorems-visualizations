import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

const server = createServer(); await new Promise(resolve => server.listen(0, resolve));
const origin = `http://localhost:${server.address().port}`, browser = await chromium.launch({ executablePath: findBrowser(), headless: true }), evidence = [];
try {
  for (const theme of ['light', 'dark']) for (const [name, route] of [
    ['home', '/#/'], ['proof', '/#/t/ladr-2.30'], ['bridge', '/#/bridge/fourier'],
    ['harness', `/tools/harness.html?file=content/ladr/ch02-b.js&id=ladr-2.30&still=1&wait=80&theme=${theme}`],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce' });
    const external = [], errors = [], failed = [], fonts = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => failed.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => { if (/\.woff2?(?:\?|$)/.test(response.url())) { assert.equal(response.status(), 200); fonts.add(new URL(response.url()).pathname); } });
    await page.route('**/*', async request => {
      if (new URL(request.request().url()).origin !== origin) { external.push(request.request().url()); await request.abort(); }
      else await request.continue();
    });
    try {
      await page.goto(origin + route, { timeout: 10000 });
      if (name === 'harness') await page.waitForFunction(() => window.__done);
      else if (name === 'home') await page.locator('.tm-field-control').first().waitFor();
      else if (name === 'bridge') await page.locator('.bridge-picture .viz-readout').waitFor();
      else await page.locator('.ctl-steps').waitFor();
      assert.equal(await page.evaluate(() => window.katex.version), '0.16.11');
      const loaded = await page.evaluate(async () => {
        const requests = [['Inter', 'normal', 400], ['Inter', 'normal', 500], ['Inter', 'normal', 600], ['Newsreader', 'normal', 400], ['Newsreader', 'normal', 500], ['Newsreader', 'normal', 600], ['Newsreader', 'italic', 400], ['Newsreader', 'italic', 500], ['JetBrains Mono', 'normal', 400], ['JetBrains Mono', 'normal', 500]];
        const results = [];
        for (const [family, style, weight] of requests) { const faces = await document.fonts.load(`${style} ${weight} 16px "${family}"`, 'Latin ΩЖđệ'); results.push({ family, style, weight, faces: faces.length, loaded: faces.every(f => f.status === 'loaded') }); }
        await document.fonts.ready; return results;
      });
      assert.ok(loaded.every(f => f.faces > 0 && f.loaded));
      if (name === 'proof' || name === 'harness') {
        const player = page.locator('.ctl-steps').first(), range = player.locator('input');
        await range.focus(); await range.press('Home'); assert.equal(await range.inputValue(), '0');
        await player.getByRole('button', { name: 'Next step', exact: true }).click(); assert.equal(await range.inputValue(), '1');
        await range.focus(); await range.press('End'); assert.equal(await range.inputValue(), await range.getAttribute('max'));
      }
      if (name === 'bridge') { await page.locator('.bridge-picture .ctl-select').first().locator('button').last().click(); await page.locator('.bridge-picture input').first().focus(); await page.keyboard.press('End'); }
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('.katex-error,.viz-error').count(), 0);
      if (name !== 'home') assert.ok(await page.locator('.katex').count() > 0, 'real mathematical typesetting');
      if (name === 'harness') assert.deepEqual((await page.evaluate(() => window.__done)).errors, []);
      assert.deepEqual(await page.evaluate(() => window.__vizErrors || []), []); assert.deepEqual(errors, []); assert.deepEqual(failed, []); assert.deepEqual(external, [], 'no external requests are even attempted');
      assert.ok(fonts.size > 0); assert.ok([...fonts].every(path => path.startsWith('/assets/vendor/')));
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
      const screenshot = `/tmp/atlas-local-assets-${name}-${theme}.png`; await page.screenshot({ path: screenshot, fullPage: name === 'harness' });
      evidence.push({ name, theme, externalRequests: external.length, localFontFilesLoaded: fonts.size, loadedFaces: loaded, screenshot });
      console.log(`PASS ${name} ${theme}: local startup, KaTeX 0.16.11, all typeface/weight/style faces loaded, native controls, no external attempts/errors`);
    } finally { await page.close(); }
  }
  await writeFile('/tmp/atlas-local-assets-native.json', JSON.stringify({ browser: browser.version(), evidence }, null, 2));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
