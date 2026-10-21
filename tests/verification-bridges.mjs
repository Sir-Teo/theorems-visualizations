// Browser audit of every bridge in both themes; run after a strict build.
// BRIDGE_SCREENSHOTS optionally selects an output directory for visual review.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { loadBridges } from '../scripts/lib.mjs';

const { bridges } = await loadBridges();
const index = JSON.parse(await readFile(new URL('../data/index.json', import.meta.url)));
assert.deepEqual(index.bridges.map((bridge) => bridge.slug), bridges.map((bridge) => bridge.slug), 'build includes the current bridge inventory');
const out = process.env.BRIDGE_SCREENSHOTS || '/tmp/theorems-bridges';
await mkdir(out, { recursive: true });
const server = createServer();
await new Promise((resolve) => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const results = [], errors = [];
try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    for (const bridge of bridges) {
      await page.goto(`http://localhost:${server.address().port}/#/bridge/${bridge.slug}`);
      await page.locator('.bridge-page h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('.bridge-page h1').textContent(), bridge.title);
      assert.equal(await page.locator('.j-step').count(), bridge.steps.length);
      assert.equal(await page.locator('.j-step.planned').count(), 0);
      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
      assert.deepEqual(await page.locator('.j-card').evaluateAll((cards) => cards.map((card) => card.getAttribute('href'))), bridge.steps.map((step) => `#/t/${step.id}`));
      const screenshot = join(out, `${bridge.slug}-${theme}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      results.push({ slug: bridge.slug, theme, steps: bridge.steps.length, screenshot });
    }
    await page.setViewportSize({ width: 320, height: 900 });
    for (const bridge of bridges) {
      await page.goto(`http://localhost:${server.address().port}/#/bridge/${bridge.slug}`);
      await page.locator('.bridge-page h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, `${bridge.slug}: narrow viewport`);
      assert.equal(await page.locator('.katex-error').count(), 0);
    }
    await page.close();
  }
  assert.deepEqual(errors, [], 'no browser or console errors');
  await writeFile(join(out, 'results.json'), JSON.stringify({ desktop: '1280x900', narrow: '320x900', results, errors }, null, 2));
  console.log(`${results.length} bridge/theme pages, ${bridges.length * 2} narrow pages, ${errors.length} errors; screenshots: ${out}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
