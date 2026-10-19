import assert from 'node:assert/strict';
import { auditBrowser } from './verification-sig-ctrl-robot-browser.shared.mjs';
const q = await auditBrowser();
try {
  for (const theme of ['light', 'dark']) {
    await q.open('robot/ch04-b.js', 'robot-4.7', theme);
    for (let mode = 0; mode < 4; mode++) { await q.menu(0, mode); for (const end of [false, true]) { await q.slide(0, end); await q.drag(0, 0, 1.2, .4); await q.clean(); } }
    await q.page.getByRole('button', { name: 'Isotropic link ratio', exact: true }).click(); await q.settle(); await q.clean(); assert.match(await q.read(), /1\.000/); await q.snap('robot-manipulability-isotropic', theme);
    await q.drag(0, 0, 0, 0); await q.clean(); const h = (await q.state())[0].handles[0]; assert.ok(Math.hypot(h.x, h.y) >= 1 - 1 / Math.sqrt(2));
    console.log(`PASS ${theme} robot-4.7 all four actual measures and link-ratio limits, origin drag and exact isotropy button`);
    await q.open('robot/ch04-b.js', 'robot-4.8', theme);
    for (const branch of [0, 1]) { await q.menu(0, branch); for (const end of [false, true]) { await q.slide(0, end); await q.clean(); assert.match(await q.read(), /position residual/); } }
    await q.page.locator('.switch-track').click(); await q.settle(); await q.clean();
    await q.drag(0, 0, 2.3, 0); await q.slide(0, true); await q.clean(); assert.match(await q.read(), /out of reach/); await q.snap('robot-nullspace-infeasible-heading', theme);
    await q.drag(0, 0, 1.1, .6); await q.clean(); assert.match(await q.read(), /central-difference residual/); await q.snap('robot-nullspace-exact-self-motion', theme);
    console.log(`PASS ${theme} robot-4.8 both actual branches/heading limits, family toggle and feasible/infeasible native tool positions`);
  }
} finally { await q.close(); }
