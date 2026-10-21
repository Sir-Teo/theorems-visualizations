import assert from 'node:assert/strict';
import { divergenceBlockPeak, divergenceAssemblyPeak } from '../content/sig/sig-source-audit.shared.js';
import { auditBrowser } from './verification-sig-ctrl-robot-browser.shared.mjs';
const q = await auditBrowser(), near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9);
try {
  for (const theme of ['light', 'dark']) {
    await q.open('sig/ch04-b.js', 'sig-4.6', theme);
    for (let preset = 0; preset < 5; preset++) { await q.menu(0, preset); for (const end of [false, true]) { await q.slide(0, end); await q.clean(); const s = await q.state(); assert.equal(Object.values(s[1].bars[0][0]).length, 31); assert.ok(Object.values(s[2].bars[0][0]).every((x, i, a) => i === 0 || x >= a[i - 1] - 1e-12)); } }
    assert.match(await q.read(), /0\.00000/); await q.snap('sig-parseval-zero-safe', theme);
    await q.drag(0, null, 0, 1.2); await q.clean(); assert.doesNotMatch(await q.read(), /Time domain:[^\n]*=0\.00000/); await q.snap('sig-parseval-drawn', theme);
    console.log(`PASS ${theme} sig-4.6 five actual presets, both harmonic limits, full 31-bin range, zero and native drawing`);
    await q.open('sig/ch04-d.js', 'sig-4.13', theme);
    for (const end of [false, true]) { await q.slide(0, end); await q.clean(); const s = await q.state(), n = end ? 600 : 2, peak = s[0].dots.find(a => a[2]?.color === 'gold'); near(peak[1], divergenceBlockPeak(n)); const bars = Object.values(s[1].bars[0][0]); for (let j = 1; j <= 14; j++) near(bars[j - 1], divergenceAssemblyPeak(j)); for (const [points] of s[0].paths) for (const [, y] of points) assert.ok(y >= s[0].y[0] && y <= s[0].y[1]); }
    await q.snap('sig-divergence-weighted-blocks', theme);
    console.log(`PASS ${theme} sig-4.13 both native log-slider limits, exact block cutoff and all fourteen assembled bars`);
  }
} finally { await q.close(); }
