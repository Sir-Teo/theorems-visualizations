import assert from 'node:assert/strict';
import { auditBrowser } from './verification-sig-ctrl-robot-browser.shared.mjs';
const q = await auditBrowser();
try {
  for (const theme of ['light', 'dark']) {
    await q.open('ctrl/ch04.js', 'ctrl-4.4', theme);
    for (const end of [false, true]) { for (let slider = 0; slider < 3; slider++) await q.slide(slider, end); await q.clean(); }
    await q.drag(0, 0, -.08, 1.9); await q.clean(); assert.ok((await q.state())[1].x[1] > 40); assert.match(await q.read(), /exact response/); await q.snap('ctrl-regions-long-settling', theme);
    await q.drag(0, 0, 1, 1.5); await q.clean(); assert.match(await q.read(), /Unstable/); await q.snap('ctrl-regions-unstable', theme);
    await q.drag(0, 0, -2, 2); await q.clean(); assert.match(await q.read(), /sufficient envelope bound/);
    console.log(`PASS ${theme} ctrl-4.4 actual specification limits, stable/unstable handle and uncensored long-time metrics`);
    await q.open('ctrl/ch04-b.js', 'ctrl-4.8', theme);
    for (const damp of [false, true]) for (const ratio of [false, true]) { await q.slide(0, damp); await q.slide(1, ratio); await q.clean(); const s = await q.state(); for (const [x, y] of s[2].paths[0][0]) assert.ok(y >= s[2].y[0] && y <= s[2].y[1]); assert.match(await q.read(), /rigorous all-time bound/); }
    await q.drag(0, 0, 2, 0); await q.clean(); await q.snap('ctrl-dominant-pole-exact-cascade', theme);
    console.log(`PASS ${theme} ctrl-4.8 four actual damping/ratio corners, rescaled complete error curve and native pole drag`);
  }
} finally { await q.close(); }
