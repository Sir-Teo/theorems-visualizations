import test from 'node:test';
import assert from 'node:assert/strict';
import { secondOrderValue, secondOrderMetrics, laggedSecondOrderValue, lagErrorBound } from '../content/ctrl/ctrl-source-audit.shared.js';
const near = (a, b, tol = 1e-8) => assert.ok(Math.abs(a - b) <= tol * (1 + Math.abs(a) + Math.abs(b)), `${a} ≈ ${b}`);
const add = (a, b, k) => a.map((x, i) => x + k * b[i]);
const rk = (x, f, dt) => { const a = f(x), b = f(add(x, a, dt / 2)), c = f(add(x, b, dt / 2)), d = f(add(x, c, dt)); return x.map((v, i) => v + dt / 6 * (a[i] + 2 * b[i] + 2 * c[i] + d[i])); };

test('closed forms solve independent state ODEs for the second-order system and its lag cascade', () => {
  for (const z of [.01, .2, .5, .9, .999]) for (const ratio of [1, 5, 15]) {
    const wn = 1.7, p = ratio * z * wn, dt = .001, f = x => [x[1], wn * wn * (1 - x[0]) - 2 * z * wn * x[1], p * (x[0] - x[2])];
    let x = [0, 0, 0];
    for (let i = 0; i <= 12000; i++) { if (i % 1000 === 0) { near(x[0], secondOrderValue(z, wn, i * dt), 1e-9); near(x[2], laggedSecondOrderValue(z, wn, p, i * dt), 1e-9); } x = rk(x, f, dt); }
  }
});

test('exact metrics locate first crossings and final settling entrance beyond any plotting window', () => {
  for (const z of [.001, .05, .2, .5, .69, .9, .9999]) for (const wn of [.08, 1, 7.8]) {
    const q = secondOrderMetrics(z, wn); near(secondOrderValue(z, wn, q.t10), .1); near(secondOrderValue(z, wn, q.t90), .9); near(secondOrderValue(z, wn, q.tp) - 1, q.Mp);
    assert.ok(q.t90 > q.t10 && q.ts > 0 && q.ts <= q.envelope + 1e-8);
    near(Math.abs(secondOrderValue(z, wn, q.ts) - 1), .02);
    assert.ok(Math.abs(secondOrderValue(z, wn, q.ts - 1e-5 / wn) - 1) > .02);
    for (let i = 1; i <= 10000; i++) assert.ok(Math.abs(secondOrderValue(z, wn, q.ts + i / wn / 100) - 1) <= .02 + 1e-10);
  }
  assert.equal(secondOrderMetrics(-.1, 1), null); assert.equal(secondOrderMetrics(0, 1), null);
});

test('design circles and half-planes admit real counterexamples to their approximate promises', () => {
  const q = secondOrderMetrics(.9, 1);
  assert.ok(q.tr > 1.8); // the nominal circle is insufficient for the actual 10–90% rise
  let miss = null;
  for (let z = .01; z < .999; z += .001) { const m = secondOrderMetrics(z, 1); if (m.ts > 4 / z + .001) { miss = m; break; } }
  assert.ok(miss, 'the 4/sigma design rule is not a sufficient settling bound');
  near(secondOrderMetrics(.5, 1).tr, 1.637572947328347, 1e-10); // even at zeta=.5, 1.8 is rounded engineering guidance
});

test('all-time cascade error bound is valid, while a five-times real-part ratio is no fixed error tolerance', () => {
  for (const z of [.2, .5, .9]) for (const ratio of [1, 3, 5, 15]) {
    const p = ratio * z, bound = lagErrorBound(z, 1, p);
    for (let i = 0; i <= 5000; i++) { const t = i * 50 / 5000; assert.ok(Math.abs(laggedSecondOrderValue(z, 1, p, t) - secondOrderValue(z, 1, t)) <= bound + 1e-10); }
  }
  let low = 0, high = 0;
  for (let i = 0; i <= 5000; i++) { const t = i / 100; low = Math.max(low, Math.abs(laggedSecondOrderValue(.2, 1, 1, t) - secondOrderValue(.2, 1, t))); high = Math.max(high, Math.abs(laggedSecondOrderValue(.9, 1, 4.5, t) - secondOrderValue(.9, 1, t))); }
  assert.ok(low > .5 && high < .12);
});
