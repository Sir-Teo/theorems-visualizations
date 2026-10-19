// Native Web Audio checks for the master plan's listening follow-ups.
// This verifies gestures, finite non-silent source data and graph wiring;
// listening quality and fidelity remain a human check.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { loadAll } from '../scripts/lib.mjs';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser, installBrowserAssets } from '../scripts/browser.mjs';

const { items } = await loadAll();
const targets = items.filter(i => typeof i.viz === 'function' && i.viz.toString().includes('soundButton') && (
  ['sig-3.15', 'sig-4.12', 'physio-4.14', 'pde-4.2'].includes(i.id) ||
  (i.col === 'music' && [7, 8].includes(i.chapter)) || i.col === 'ling'));
assert.ok(targets.length >= 20, 'expected named audio chapters to be loaded');
const selected = process.argv.length > 2 ? targets.filter(i => process.argv.slice(2).includes(i.id)) : targets;
assert.ok(selected.length, 'select at least one known audio item');
const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let browser; const results = [];
try {
  browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
  for (const theme of ['light', 'dark']) for (const it of selected) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1200 } });
    await installBrowserAssets(page.context());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.__audioAudit = { starts: [], stops: 0, destinations: 0 };
      const connect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function(destination, ...args) {
        if (destination instanceof AudioDestinationNode) window.__audioAudit.destinations++;
        return connect.call(this, destination, ...args);
      };
      const stop = AudioScheduledSourceNode.prototype.stop;
      AudioScheduledSourceNode.prototype.stop = function(...args) { window.__audioAudit.stops++; return stop.apply(this, args); };
      for (const Type of [AudioBufferSourceNode, OscillatorNode]) {
        const start = Type.prototype.start;
        Type.prototype.start = function(...args) {
          const record = { kind: this.constructor.name };
          if (this.buffer) {
            const d = this.buffer.getChannelData(0); let sum = 0, peak = 0, finite = true;
            for (const x of d) { finite &&= Number.isFinite(x); sum += x * x; peak = Math.max(peak, Math.abs(x)); }
            Object.assign(record, { length: d.length, sampleRate: this.buffer.sampleRate, finite, peak, rms: Math.sqrt(sum / d.length) });
          } else record.frequency = this.frequency.value;
          window.__audioAudit.starts.push(record);
          return start.apply(this, args);
        };
      }
    });
    try {
      await page.goto(`${base}/tools/harness.html?file=${encodeURIComponent(it.file)}&id=${it.id}&theme=${theme}&wait=200`);
      await page.waitForFunction(() => window.__done, null, { timeout: 30000 });
      assert.deepEqual(await page.evaluate(() => window.__done.errors), [], it.id);
      assert.deepEqual(await page.evaluate(() => window.__texErrors || []), [], `${it.id}: rendered formulas`);
      assert.equal(await page.evaluate(() => window.__audioAudit.starts.length), 0, 'no autoplay');
      const buttons = page.locator('#viz button.ctl-button').filter({ has: page.locator('svg') });
      const n = await buttons.count(); assert.ok(n > 0, `${it.id}: speaker controls`);
      if (it.id === 'physio-4.14') {
        await buttons.first().click();
        assert.equal(await page.evaluate(() => window.__audioAudit.starts.length), 0, 'laminar model is silent');
        await page.locator('#viz input[type=range]').first().evaluate(el => { el.value = '1.5'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.waitForTimeout(100);
      }
      for (let k = 0; k < n; k++) {
        const before = await page.evaluate(() => window.__audioAudit.starts.length);
        await buttons.nth(k).click(); await page.waitForTimeout(80);
        assert.ok(await page.evaluate(() => window.__audioAudit.starts.length) > before, `${it.id}: button ${k + 1} produces audio`);
      }
      // Short phonetic examples may finish naturally before the next gesture.
      // Keep a quiet sentinel sustained so stopping on replay is testable even
      // when the browser is busy; the real speaker button must stop that voice.
      const beforeReplay = await page.evaluate(() => {
        window.__vizStages[0].rt._sound.tone(173, { sustain: true, gain: .001 });
        return window.__audioAudit.stops;
      });
      await buttons.last().click();
      assert.ok(await page.evaluate(() => window.__audioAudit.stops) > beforeReplay, 'replay stops sustained preceding sound');
      const cleanup = await page.evaluate(() => {
        window.__vizStages[0].rt._sound.tone(173, { sustain: true, gain: .001 });
        const before = window.__audioAudit.stops;
        window.__destroyViz();
        return { before, after: window.__audioAudit.stops };
      });
      assert.ok(cleanup.after > cleanup.before, 'unmount stops sustained sound');
      const audit = await page.evaluate(() => window.__audioAudit);
      assert.ok(audit.destinations > 0, 'sound graph connects to the native output');
      for (const s of audit.starts) {
        if (s.kind === 'AudioBufferSourceNode') {
          assert.equal(s.finite, true, `${it.id}: finite samples`);
          assert.ok(s.rms > 0 && s.peak <= 1.000001, `${it.id}: non-silent normalized buffer`);
          assert.ok(s.sampleRate >= 8000 && s.length > 0);
        } else assert.ok(s.frequency > 0 && Number.isFinite(s.frequency), 'positive oscillator frequency');
      }
      assert.deepEqual(errors, [], 'no browser exceptions');
      results.push({ id: it.id, theme, buttons: n, status: 'passed', ...audit });
    } catch (error) {
      results.push({ id: it.id, theme, status: 'failed', error: String(error.stack || error) });
    } finally { await page.close(); }
    console.log(`${results.at(-1).status === 'passed' ? '✓' : '✗'} ${it.id} ${theme}`);
  }
} finally {
  await browser?.close(); await new Promise(r => server.close(r));
}
writeFileSync('/tmp/atlas-verification-audio.json', JSON.stringify({ scope: 'Native source scheduling and signal data; subjective listening remains open.', results }, null, 2) + '\n');
const failures = results.filter(r => r.status !== 'passed');
for (const f of failures) console.error(f.id, f.theme, f.error);
console.log(`${results.length} audio groups, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
