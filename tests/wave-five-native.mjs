// Independent browser acceptance for written items in the frozen Wave 5 plan.
// Usage: node tests/wave-five-native.mjs ml [vcalc ...]
// This checks real controls and layout; chapter-specific tests check the math.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { loadAll } from '../scripts/lib.mjs';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

const requested = new Set(process.argv.slice(2));
assert.ok(requested.size, 'Supply at least one collection to keep acceptance bounded');
const plan = JSON.parse(await readFile(new URL('../docs/wave-five-plan.json', import.meta.url)));
const expected = plan.chapters.filter(chapter => requested.has(chapter.collection)).flatMap(chapter => chapter.items.map(item => item.id));
assert.equal(new Set(plan.chapters.filter(chapter => requested.has(chapter.collection)).map(chapter => chapter.collection)).size, requested.size, 'Unknown collection in wave');
const atlas = await loadAll(), byId = new Map(atlas.items.map(item => [item.id, item]));
for (const id of expected) assert.ok(byId.has(id), `Wave chapter is incomplete: ${id}`);
const output = process.env.WAVE5_SHOTS || '/tmp/atlas-wave5-native';
await mkdir(output, { recursive: true });
const server = createServer();
await new Promise(resolve => server.listen(0, resolve));
let browser;
let groups = 0, actions = 0;
try {
  browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function paint() {
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.dispatchEvent(new Event('vizpause'));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  }
  async function check(label) {
    await paint();
    const result = await page.evaluate(() => ({
      errors: [...(window.__vizErrors || []), ...(window.__texErrors || [])],
      tex: document.querySelectorAll('.katex-error').length,
      overflow: document.documentElement.scrollWidth - innerWidth,
      readout: document.querySelector('.viz-readout')?.textContent?.trim(),
      boxes: [...document.querySelectorAll('.stage canvas')].map(canvas => {
        const box = canvas.getBoundingClientRect();
        return [box.left, box.right, box.width, box.height];
      }),
    }));
    assert.deepEqual(errors, [], `${label}: page errors`);
    assert.deepEqual(result.errors, [], `${label}: visualization/TeX errors`);
    assert.equal(result.tex, 0, `${label}: malformed TeX`);
    assert.ok(result.overflow <= 1, `${label}: page overflows by ${result.overflow}px`);
    assert.ok(result.readout?.length, `${label}: missing live readout`);
    assert.doesNotMatch(result.readout, /\b(?:NaN|undefined)\b/, `${label}: invalid numeric readout`);
    for (const [left, right, width, height] of result.boxes) {
      assert.ok(width > 0 && height > 0, `${label}: zero-size canvas`);
      assert.ok(left >= -1 && right <= page.viewportSize().width + 1, `${label}: canvas outside viewport`);
    }
  }
  for (const id of expected) {
    const item = byId.get(id);
    for (const theme of ['light', 'dark']) for (const width of [1200, 320]) {
      const label = `${id} ${theme} ${width}`;
      errors.length = 0;
      await page.setViewportSize({ width, height: 1100 });
      const url = new URL(`http://localhost:${server.address().port}/tools/harness.html`);
      url.search = new URLSearchParams({ file: item.file, id, theme, w: String(width - 36), still: '1', wait: '100' });
      await page.goto(url.href);
      await page.waitForFunction(() => window.__done);
      const done = await page.evaluate(() => window.__done);
      assert.deepEqual(done.errors, [], `${label}: mount errors`);
      assert.deepEqual(done.texErrors, [], `${label}: initial TeX`);
      assert.deepEqual(done.blank, [], `${label}: blank canvas`);
      assert.ok(done.quality.interactive > 0, `${label}: no interaction`);
      await check(label);
      await page.screenshot({ path: `${output}/${id}-${theme}-${width}.png`, fullPage: true });
      const ranges = page.locator('input[type=range]');
      for (let index = 0; index < await ranges.count(); index++) {
        const input = ranges.nth(index);
        if (!(await input.isVisible()) || !(await input.isEnabled())) continue;
        const original = await input.inputValue();
        for (const key of ['Home', 'End']) {
          await input.press(key);
          await check(`${label}: slider ${index} ${key}`);
          actions++;
        }
        await input.evaluate((element, value) => {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }, original);
      }
      const segments = page.locator('.seg');
      for (let index = 0; index < await segments.count(); index++) {
        const segment = segments.nth(index), buttons = segment.locator('button');
        if (!(await segment.isVisible())) continue;
        const original = await buttons.evaluateAll(elements => elements.findIndex(element => element.classList.contains('on')));
        for (let choice = 0; choice < await buttons.count(); choice++) {
          const button = buttons.nth(choice);
          if (!(await button.isVisible()) || !(await button.isEnabled())) continue;
          await button.click();
          await check(`${label}: choice ${index}/${choice}`);
          actions++;
        }
        if (original >= 0) await buttons.nth(original).click();
      }
      const toggles = page.locator('.ctl-toggle input');
      for (let index = 0; index < await toggles.count(); index++) {
        const input = toggles.nth(index);
        if (!(await input.isEnabled())) continue;
        // Native switches may visually hide the input; operate its label.
        const labelElement = input.locator('..').locator('label');
        if (await labelElement.count() && await labelElement.first().isVisible()) {
          await labelElement.first().click(); await check(`${label}: toggle ${index}`);
          await labelElement.first().click(); actions++;
        }
      }
      await check(`${label}: restored controls`);
      groups++;
      console.log(`PASS ${label}: real control endpoints/options, live readout, TeX, canvases and page bounds`);
    }
  }
  console.log(`PASS Wave 5: ${expected.length} items, ${groups} theme/width groups, ${actions} real control actions. Screenshots: ${output}`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
