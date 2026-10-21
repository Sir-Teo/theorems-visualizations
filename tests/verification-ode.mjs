// Source-audit browser checks: node tests/verification-ode.mjs.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { slProblem, slEigenvalues } from '../content/ode/ch04.shared.js';

const server = createServer();
await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({executablePath: findBrowser(), headless: true});
const page = await browser.newPage({viewport: {width: 1200, height: 1800}});
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch();
  const body = (await response.text()).replace('stats.stages++;', `stats.stages++;
    (window.__auditStages ||= []).push(s);
    const begin=s.begin.bind(s),path=s.path.bind(s),contour=s.contour.bind(s);
    s.begin=()=>{s.__paths=[];s.__contours=[];return begin();};
    s.path=(pts,st={})=>{s.__paths.push({pts:pts.map(p=>Array.from(p)),color:st.color,view:JSON.parse(JSON.stringify(s.view))});return path(pts,st);};
    s.contour=(f,levels,st)=>{s.__contours.push(levels);return contour(f,levels,st);};`);
  await route.fulfill({response, body});
});
const open = async (id, file = 'ch04-b.js') => {
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/ode/${file}&id=ode-${id}&still=1&wait=100`);
  await page.waitForFunction(() => window.__done);
};
const settle = () => page.waitForTimeout(100);
const read = () => page.locator('.viz-readout').innerText();
const choice = async (index, option) => {
  await page.locator('.ctl-select').nth(index).locator('button').nth(option).click();
  await settle();
};
const state = () => page.evaluate(() => window.__auditStages.map(s => ({view: s.view, paths: s.__paths, contours: s.__contours})));

try {
  await open('4.8');
  for (let op = 0; op < 3; op++) {
    await choice(0, op);
    await choice(1, 1); // unit load; compare with the exact Dirichlet solution
    const [left, map] = await state();
    const green = left.paths.find(p => p.color === 'green');
    for (const [x, y] of green.pts) {
      const k = Math.sqrt(40);
      const exact = op === 0 ? x * (1 - x) / 2 : op === 1 ? (1 - Math.cosh(k * (x - .5)) / Math.cosh(k / 2)) / 40 : Math.log(1 + 3 * x) / (3 * Math.log(4)) - x / 3;
      assert.ok(Math.abs(y - exact) < 2e-6, `operator ${op}, load response at ${x}`);
    }
    for (const [color, source] of [['accent', .3], ['orange', .7]]) {
      for (const [x, y] of left.paths.find(p => p.color === color).pts) {
        const a = Math.min(x, source), b = Math.max(x, source), k = Math.sqrt(40), A = z => Math.log(1 + 3 * z) / 3;
        const exact = op === 0 ? a * (1 - b) : op === 1 ? Math.sinh(k * a) * Math.sinh(k * (1 - b)) / (k * Math.sinh(k)) : A(a) * (A(1) - A(b)) / A(1);
        assert.ok(Math.abs(y - exact) < 2e-6, `operator ${op}, Green kernel at ${x},${source}`);
      }
    }
    for (let load = 0; load < 4; load++) {
      await choice(1, load);
      const [a, m] = await state();
      for (const path of a.paths) {
        assert.deepEqual(path.view, a.view, 'all curves drawn in the final coordinate system');
        for (const [x, y] of path.pts) assert.ok(x >= a.view.x[0] && x <= a.view.x[1] && y >= a.view.y[0] && y <= a.view.y[1], 'signed loads remain visible');
      }
      assert.equal(m.contours[0].length, 7);
      assert.ok(m.contours[0].every(l => l > 0 && l < (op === 0 ? .25 : op === 1 ? .1 : .15)));
      assert.doesNotMatch(await read(), /NaN|Infinity/);
    }
    assert.ok(map.contours.length);
  }
  // Real pointer input moves the source/observation pair and updates reciprocity.
  // Canvas handles are internal primitives; convert their world coordinates via the stage.
  const drag = await page.evaluate(() => {
    const s = window.__auditStages[1], h = s.handles[0], r = s.canvas.getBoundingClientRect();
    return {x: r.left + s.X(h.x), y: r.top + s.Y(h.y), tx: r.left + s.X(.4), ty: r.top + s.Y(.6)};
  });
  await page.mouse.move(drag.x, drag.y); await page.mouse.down();
  await page.mouse.move(drag.tx, drag.ty, {steps: 8}); await page.mouse.up(); await settle();
  assert.match(await read(), /0\.40.*0\.60/);
  console.log('PASS Green functions: three exact load solutions, twelve operator/load modes, contours, signed bounds and pointer reciprocity');

  await open('4.9');
  for (let bc = 0; bc < 3; bc++) for (let preset = 0; preset < 4; preset++) {
    await choice(0, bc); await choice(1, preset);
    const [e, , w] = await state();
    for (const path of e.paths) assert.deepEqual(path.view, e.view);
    const ratios = w.paths.find(p => p.color === 'accent').pts;
    assert.equal(ratios.length, 12);
    for (const [, y] of ratios) assert.ok(y >= w.view.y[0] && y <= w.view.y[1]);
    if (preset === 0) {
      const exact = bc === 0 ? 1 : bc === 1 ? (11 / 12) ** 2 : (11.5 / 12) ** 2;
      assert.ok(Math.abs(ratios[11][1] - exact) < 1e-6, 'n*pi/S denominator for every boundary condition');
    }
    assert.doesNotMatch(await read(), /NaN|Infinity/);
  }
  console.log('PASS spectra: twelve preset/boundary modes, correct Weyl normalization and visible ratios');

  await open('4.10');
  for (let bc = 0; bc < 3; bc++) for (let preset = 0; preset < 4; preset++) {
    await choice(0, bc); await choice(1, preset);
    for (const key of ['Home', 'End']) {
      await page.locator('input[type=range]').focus(); await page.keyboard.press(key); await settle();
      assert.doesNotMatch(await read(), /NaN|Infinity/);
      const [, , err] = await state();
      assert.ok(err.view.y[0] > 0 && err.view.y[1] > err.view.y[0]);
    }
  }
  await choice(0, 1); await choice(1, 0); await choice(2, 3); // NN uniform, constant
  assert.match(await read(), /Error[\s\S]*=0\.00000/);
  console.log('PASS expansions: twelve preset/boundary modes at both term-slider endpoints; constant Neumann zero mode');

  await open('4.13', 'ch04-c.js');
  await choice(0, 1); // heavy end: more than eight eigenvalues below 400
  await page.locator('input[type=range]').focus(); await page.keyboard.press('End'); await settle();
  const pr = slProblem(() => 1, () => 0, x => 1 + 4 * x);
  const count = slEigenvalues(pr, 'DD', 16).filter(e => e < 400).length;
  assert.ok(count > 8);
  const countStage = (await state())[2];
  assert.ok(count < countStage.view.y[1], "every visible eigenvalue count fits the plot");
  assert.match(await read(), new RegExp(`eigenvalues below[\\s\\S]*?: ${count}`));
  assert.match(await read(), new RegExp(`interior zeros of[\\s\\S]*?: ${count}`));
  await choice(0, 0);
  await page.locator('input[type=range]').focus(); await page.keyboard.press('Home'); await settle();
  for (let n = 1; n <= 6; n++) {
    await page.getByRole('button', {name: 'next eigenvalue', exact: true}).click(); await settle();
    assert.match(await read(), new RegExp(`interior zeros of[\\s\\S]*?: ${n - 1}`));
    assert.match(await read(), new RegExp(`eigenvalues below[\\s\\S]*?: ${n - 1}`));
  }
  console.log('PASS oscillation: full heavy-end count and six exact-eigenvalue jumps exclude endpoint zeros');

  await open('4.14', 'ch04-c.js');
  for (let preset = 0; preset < 4; preset++) {
    await choice(0, preset);
    await page.getByRole('button', {name: 'sample ground state', exact: true}).click(); await settle();
    assert.doesNotMatch(await read(), /NaN|Infinity/);
    const formulas = await page.locator('.viz-readout annotation').allTextContents();
    const R = Number(formulas[0].match(/approx([0-9.]+)/)[1]), first = Number(formulas[1].split('=')[1]);
    assert.ok(R >= first - .001 && R - first < .02 * first, 'five ground-state samples approximate the minimum within two percent');
    await page.locator('.ctl-toggle label').click(); await settle();
    assert.doesNotMatch(await read(), /NaN|Infinity/);
    const orthFormulas = await page.locator('.viz-readout annotation').allTextContents();
    const Ro = Number(orthFormulas[0].match(/approx([0-9.]+)/)[1]), second = Number(orthFormulas[1].split('=')[1]);
    assert.ok(Ro >= second - .001, 'orthogonal trial respects second-eigenvalue bound within quadrature tolerance');
    await page.locator('.ctl-toggle label').click(); await settle();
  }
  // Five real pointer drags create a zero trial and exercise the undefined quotient.
  for (let i = 0; i < 5; i++) {
    const p = await page.evaluate(i => {
      const s = window.__auditStages[0], h = s.handles[i], r = s.canvas.getBoundingClientRect();
      return {x: r.left + s.X(h.x), y: r.top + s.Y(h.y), z: r.top + s.Y(0)};
    }, i);
    await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x, p.z, {steps: 4}); await page.mouse.up(); await settle();
  }
  await page.getByRole('button', {name: 'zero trial', exact: true}).click(); await settle();
  assert.match(await read(), /trial function is zero/);
  console.log('PASS Rayleigh: four presets, ground-state sampling, orthogonalisation and pointer edits and zero-trial guard');

  await open('4.15', 'ch04-c.js');
  for (const n of [1, 2, 3]) for (let forcing = 0; forcing < 5; forcing++) {
    await choice(0, forcing);
    await page.getByRole('button', {name: `λ = ${n * n}`, exact: true}).click(); await settle();
    const compatible = forcing === 0 ? n !== 1 : forcing === 1 ? n !== 2 : forcing === 2 ? n % 2 === 1 : forcing === 3 ? n % 2 === 0 : n % 2 === 1;
    assert.match(await read(), compatible ? /infinitely many/ : /no.*solution/);
    assert.doesNotMatch(await read(), /NaN|Infinity/);
  }
  // Close to resonance is still a unique solution.
  await page.locator('input[type=range]').focus(); await page.keyboard.press('ArrowLeft'); await settle();
  assert.match(await read(), /Not an eigenvalue: unique solution/);
  console.log('PASS Fredholm: fifteen exact forcing/resonance cases and a nearby nonresonant value');

  await open('4.1', 'ch04.js');
  for (const key of ['Home', 'End']) {
    await page.locator('input[type=range]').focus(); await page.keyboard.press(key); await settle();
    assert.doesNotMatch(await read(), /NaN|Infinity/);
  }
  console.log('PASS analytic solutions: both polynomial-degree endpoints render finite readouts');

  await open('3.12', 'ch03-b.js');
  for (const damping of ['Home', 'End']) {
    await page.locator('input[type=range]').nth(0).focus(); await page.keyboard.press(damping);
    await page.locator('input[type=range]').nth(1).focus(); await page.keyboard.press('End'); await settle();
    const [, response] = await state();
    for (const path of response.paths) for (const [, y] of path.pts) assert.ok(y >= response.view.y[0] && y <= response.view.y[1]);
    const sum = response.paths.find(p => p.color === 'accent').pts.at(-1)[1];
    const rk = response.paths.find(p => p.color === 'green').pts.at(-1)[1];
    assert.ok(Math.abs(sum - rk) < .005);
  }
  console.log('PASS Duhamel: slice convergence and visible responses at both damping extremes');
  assert.deepEqual(errors, []);
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
