import test from 'node:test';
import assert from 'node:assert/strict';
import { planarSpectrum, bestPlanarAngle } from '../content/robot/robot-source-audit.shared.js';
import { planarFK, planarJ, ik2R, svd2xn } from '../content/robot/ch04.shared.js';
const near = (a, b, tol = 1e-8) => assert.ok(Math.abs(a - b) <= tol * (1 + Math.abs(a) + Math.abs(b)), `${a} ≈ ${b}`);
const norm = a => Math.hypot(...a), dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), matvec = (a, b) => a.map(row => dot(row, b));

test('two-link spectral identities agree with independently differentiated forward kinematics and matrix invariants', () => {
  const h = 1e-5;
  for (const l2 of [.3, 1 / Math.sqrt(2), .8, 1.6]) for (const a of [-2, .3, 2]) for (const b of [.001, .4, 2.2, Math.PI - .001]) {
    const q = [a, b], J = [[], []];
    for (let j = 0; j < 2; j++) { const left = [...q], right = [...q]; left[j] -= h; right[j] += h; const p = planarFK([1, l2], left).tip, r = planarFK([1, l2], right).tip; for (let i = 0; i < 2; i++) J[i][j] = (r[i] - p[i]) / (2 * h); }
    const s = planarSpectrum(1, l2, b), det = J[0][0] * J[1][1] - J[0][1] * J[1][0], tr = J.flat().reduce((sum, x) => sum + x * x, 0);
    near(s[0] ** 2 + s[1] ** 2, tr); near(s[0] * s[1], Math.abs(det));
    const actual = svd2xn(planarJ([1, l2], q)); near(s[0], actual.s[0]); near(s[1], actual.s[1]);
  }
});

test('analytical best angles beat a dense independent search for all four measures; exact isotropy is available', () => {
  const value = (m, q) => { const J = planarJ([1, q[0]], [0, q[1]]), s = svd2xn(J).s; return m === 'w' ? s[0] * s[1] : m === 'smin' ? s[1] : m === 'inv' ? s[1] / s[0] : -s[0] / s[1]; };
  for (const r of [.3, .5, .707, 1 / Math.sqrt(2), .8, 1, 1.6]) for (const m of ['w', 'smin', 'inv', 'kappa']) {
    const angle = bestPlanarAngle(r, m), best = value(m, [r, angle]);
    for (let k = 1; k < 5000; k++) assert.ok(best >= value(m, [r, Math.PI * k / 5000]) - 1e-7);
  }
  const s = planarSpectrum(1, 1 / Math.sqrt(2), 3 * Math.PI / 4); near(s[0] / s[1], 1); near(bestPlanarAngle(1 / Math.sqrt(2), 'inv'), 3 * Math.PI / 4);
  assert.equal(planarSpectrum(1, .8, 0)[1], 0);
});

test('pseudoinverse null projection is symmetric, idempotent, preserves task velocity and decreases a stationary-task cost', () => {
  for (const q of [[.3, .7, -.2], [-2, .1, 2], [0, Math.PI, .3]]) {
    const J = planarJ([1, .9, .6], q), a = dot(J[0], J[0]), b = dot(J[0], J[1]), d = dot(J[1], J[1]), det = a * d - b * b;
    const plus = q.map((_, i) => [(J[0][i] * d - J[1][i] * b) / det, (J[1][i] * a - J[0][i] * b) / det]);
    const P = q.map((_, i) => q.map((_, j) => (i === j ? 1 : 0) - plus[i][0] * J[0][j] - plus[i][1] * J[1][j]));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { near(P[i][j], P[j][i]); near(P[i].reduce((s, x, k) => s + x * P[k][j], 0), P[i][j]); }
    const grad = [1, -2, .7], secondary = matvec(P, grad).map(x => -x), V = [.4, -.2], primary = matvec(plus, V), velocity = primary.map((x, i) => x + secondary[i]);
    for (let i = 0; i < 2; i++) { near(dot(J[i], secondary), 0); near(dot(J[i], velocity), V[i]); }
    near(dot(grad, secondary), -(norm(secondary) ** 2)); near(dot(primary, secondary), 0);
    // A finite tangent step has second-order drift: it is not an exact self-motion.
    const p = planarFK([1, .9, .6], q).tip, drift = eps => norm(planarFK([1, .9, .6], q.map((x, i) => x + eps * secondary[i])).tip.map((x, i) => x - p[i]));
    if (norm(secondary) > 1e-8) { assert.ok(drift(.001) > 0); near(drift(.001) / drift(.0005), 4, .002); }
  }
});

test('exact heading parameterization preserves tool position for both branches and reports infeasible headings', () => {
  const L = [1, .9, .6]; let feasible = 0, infeasible = 0;
  for (const p of [[1.1, .6], [2.3, 0], [0, 0]]) for (let k = 0; k < 360; k++) {
    const phi = k * Math.PI / 180, wrist = [p[0] - L[2] * Math.cos(phi), p[1] - L[2] * Math.sin(phi)], sol = ik2R(...L.slice(0, 2), ...wrist);
    if (!sol) { infeasible++; continue; }
    for (const [q1, q2] of sol) { const q = [q1, q2, phi - q1 - q2], actual = planarFK(L, q).tip; near(actual[0], p[0]); near(actual[1], p[1]); feasible++; }
  }
  assert.ok(feasible > 0 && infeasible > 0);
});
