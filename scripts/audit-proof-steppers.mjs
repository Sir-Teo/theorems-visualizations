// Audit actual player behavior; source-level v.steps calls alone do not prove a proof stepper works.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { loadAll, ROOT } from './lib.mjs';
import { createServer } from './serve.mjs';
import { findBrowser } from './browser.mjs';
import { join } from 'node:path';
const atlas = await loadAll();
const kinds = new Set(['Theorem', 'Lemma', 'Proposition', 'Corollary']);
const candidates = atlas.items.filter(i => kinds.has(i.kind) && /\.steps\(/.test(String(i.viz)));
const server = createServer(); await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 }, reducedMotion: 'reduce' });
let errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch();
  let body = await response.text();
  body = body.replace('return item.viz(v);', `const steps = v.steps; v.steps = (...args) => { const player = steps(...args); (window.__proofPlayers ||= []).push(player); return player; }; return item.viz(v);`);
  await route.fulfill({ response, body });
});
const results = [];
try {
  for (const item of candidates) {
    errors = [];
    const result = { id: item.id, kind: item.kind, name: item.name, file: item.file, sourceFlag: !!item.verify };
    try {
      const params = new URLSearchParams({ file: item.file, id: item.id, still: '1', wait: '80' });
      await page.goto(`http://localhost:${server.address().port}/tools/harness.html?${params}`);
      await page.waitForFunction(() => window.__done);
      const health = await page.evaluate(() => window.__done);
      for (const key of ['errors', 'texErrors']) assert.deepEqual(health[key], [], key);
      // The short harness observation can precede the first visible canvas
      // paint when several independent browser audits run together. Wait for
      // actual pixels, with a bounded timeout; persistent blank panels fail.
      await page.waitForFunction(() => [...document.querySelectorAll('#viz canvas')].every(cv => {
        if (!cv.getClientRects().length || getComputedStyle(cv).visibility === 'hidden') return true;
        if (!cv.width || !cv.height) return false;
        const data = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let painted = 0; for (let i = 3; i < data.length; i += 148) if (data[i] > 0) painted++;
        return painted >= 3;
      }), null, { timeout: 5000 });
      // This lesson starts in its manual pebble game. The proof player is
      // intentionally hidden until the reader requests the computed strategy.
      if (item.id === 'cplx-1.7') {
        await page.getByRole('button', { name: 'optimal strategy', exact: true }).click();
        result.activation = 'optimal strategy mode selected with the native button';
      }
      const count = await page.locator('.ctl-steps').count(); assert.ok(count > 0, 'no player instantiated');
      result.players = [];
      for (let n = 0; n < count; n++) {
        const control = page.locator('.ctl-steps').nth(n), range = control.locator('input[type=range]');
        const initial = await page.evaluate(n => { const p = window.__proofPlayers[n]; return { frames: p.n, notes: p.frames.map(f => f?.note || '').filter(Boolean).length }; }, n);
        assert.ok(initial.frames >= 2, 'fewer than two proof frames');
        await range.focus(); await range.press('Home');
        assert.equal(await page.evaluate(n => window.__proofPlayers[n].i, n), 0);
        await control.getByRole('button', { name: 'Next step', exact: true }).click();
        assert.equal(await page.evaluate(n => window.__proofPlayers[n].i, n), 1);
        await range.focus(); await range.press('End');
        assert.equal(await page.evaluate(n => window.__proofPlayers[n].i, n), initial.frames - 1);
        await page.waitForTimeout(30);
        assert.equal(await page.locator('.viz-error').count(), 0);
        assert.equal(await page.locator('.katex-error').count(), 0);
        result.players.push(initial);
      }
      assert.deepEqual(errors, []); result.status = 'interaction-checked';
    } catch (error) { result.status = 'needs-fix'; result.error = error.message; }
    results.push(result); console.log(`${result.status === 'interaction-checked' ? 'PASS' : 'FAIL'} ${item.id}${result.error ? ': ' + result.error : ''}`);
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
const report = { version: 1, scope: 'Written theorem-like items whose viz directly calls v.steps',
  limitation: 'Native first/next/last control checks do not establish proof validity, flagship selection, visual quality in all frames or independent human review.',
  total: results.length, passed: results.filter(r => r.status === 'interaction-checked').length, results };
await writeFile(join(ROOT, 'docs/verification/proof-stepper-inventory.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`${report.passed}/${report.total} candidate proof steppers pass native control checks`);
if (report.passed !== report.total) process.exitCode = 1;
