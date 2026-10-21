import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import * as B from '../assets/js/bridge-models.js';
const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} versus ${b}`);
function integrate(f, lo, hi, n = 2048) { const h = (hi - lo) / n; let sum = f(lo) + f(hi); for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(lo + i * h); return sum * h / 3; }
const multiply = (A, C) => A.map(row => C[0].map((_, j) => row.reduce((s, x, k) => s + x * C[k][j], 0)));

test('all fifteen pictures have distinct written bridge anchors, named contexts and explicit scope limits', async () => {
  const index = JSON.parse(await readFile(new URL('../data/index.json', import.meta.url))), written = new Set(index.items.map(x => x.id));
  const files = await readdir(new URL('../content/bridges/', import.meta.url));
  assert.equal(Object.keys(B.BRIDGE_PICTURES).length, 15); assert.equal(files.length, 15);
  for (const f of files) {
    const bridge = (await import(`../content/bridges/${f}`)).default, picture = B.BRIDGE_PICTURES[bridge.slug]; assert.ok(picture, bridge.slug);
    assert.ok(picture.contexts.length >= 2 && picture.model.length > 60 && picture.limit.length > 100);
    assert.ok(picture.anchors.length >= 2);
    for (const id of picture.anchors) { assert.ok(written.has(id), id); assert.ok(bridge.steps.some(s => s.id === id), `${bridge.slug}: ${id}`); }
  }
});
test('action agrees with a numerical path derivative and kinetic integral; its first variation vanishes only at the straight path', () => {
  for (const a of [-.5, 0, .4]) { const m = B.actionModel(a), dt = 1e-5; close(m.path(0), 0); close(m.path(1), 1); close(integrate(t => .5 * ((m.path(t + dt) - m.path(t - dt)) / (2 * dt)) ** 2, 0, 1), m.action, 1e-8); const da = 1e-5; close((B.actionModel(a + da).action - B.actionModel(a - da).action) / (2 * da), m.derivative, 1e-9); }
  assert.equal(B.actionModel(0).derivative, 0); assert.ok(B.actionModel(.1).action > B.actionModel(0).action);
});
test('quadratic dual bound matches independent supremum optimization and the free-energy curvature has the opposite sign', () => {
  for (const k of [.4, 1, 3]) for (const y of [-1, .3, 1]) { let l = -5, r = 5; const f = x => y * x - .5 * k * x * x; for (let i = 0; i < 100; i++) { const a = (2 * l + r) / 3, b = (l + 2 * r) / 3; if (f(a) < f(b)) l = a; else r = b; } const m = B.dualityModel(k, y, -.7); close(f((l + r) / 2), m.conjugate); close(m.f - y * -.7 + m.conjugate, m.gap); assert.ok(m.gap >= 0); close(B.dualityModel(k, y, m.touching).gap, 0); assert.ok(B.dualityModel(k, y + .1, 0).freeEnergy + B.dualityModel(k, y - .1, 0).freeEnergy - 2 * m.freeEnergy < 0); }
});
test('causal comparisons follow a coherent joint population and demonstrate a pooling reversal without changing stratum effects', () => {
  for (const q of [.05, .5, .9]) { const delta = .1, m = B.causalModel(q, delta); let jointY1A1 = 0, jointY1A0 = 0; for (const z of [0, 1]) { const assignment = z ? q : 1 - q, risk0 = z ? .75 : .15; jointY1A1 += .5 * assignment * (risk0 - delta); jointY1A0 += .5 * (1 - assignment) * risk0; } close(m.mean1, jointY1A1 / .5); close(m.mean0, jointY1A0 / .5); close(.5 * m.treated[0] + .5 * m.treated[1] - .5 * m.untreated[0] - .5 * m.untreated[1], m.adjusted); }
  assert.ok(B.causalModel(.9, .1).crude > 0); assert.ok(B.causalModel(.9, .1).adjusted < 0);
});
test('Poisson extinction matches the offspring series and the independent known mean-two root; its complement solves the ER equation', () => {
  for (const mu of [.5, 1, 1.2, 2, 3]) { const m = B.contagionModel(mu); let p = Math.exp(-mu), sum = 0; for (let k = 0; k < 50; k++) { sum += p * m.extinction ** k; p *= mu / (k + 1); } close(sum, m.extinction, 1e-12); close(m.giant, 1 - Math.exp(-mu * m.giant)); if (mu <= 1) assert.equal(m.extinction, 1); else assert.ok(m.extinction > 0 && m.extinction < 1); }
  close(B.contagionModel(2).extinction, .20318786997997995, 1e-13);
});
test('Gaussian diffusion preserves integrated mass, has the stated second moment and solves the PDE by finite differences', () => {
  const D = .3, t = .7, m = B.diffusionModel(D, t), L = 12 * Math.sqrt(m.variance); close(integrate(m.density, -L, L), 1); close(integrate(x => x * x * m.density(x), -L, L), m.variance);
  const x = .8, h = 1e-4, ut = (B.diffusionModel(D, t + h).density(x) - B.diffusionModel(D, t - h).density(x)) / (2 * h), uxx = (m.density(x + h) - 2 * m.density(x) + m.density(x - h)) / (h * h); close(ut, D * uxx, 1e-7);
});
test('binary entropy has the correct units, independent-product additivity and expected-log-loss/KL relation', () => {
  close(B.entropyModel(.5, .5).bits, 1); close(B.entropyModel(.5, .5).entropy, Math.LN2);
  for (const p of [.01, .3, .8, .99]) { const m = B.entropyModel(p, .6), probs = [p * p, p * (1 - p), (1 - p) * p, (1 - p) ** 2]; close(-probs.reduce((s, x) => s + x * Math.log(x), 0), 2 * m.entropy); assert.ok(m.kl >= 0); close(B.entropyModel(p, p).kl, 0); close(m.crossEntropy, m.entropy + m.kl); }
});
test('feedback response agrees with numerical integration of its closed-loop differential equation', () => {
  for (const K of [0, 1, 5]) { const m = B.feedbackModel(K), dt = .00005; let y = 0, d = 0; for (let i = 0; i < 20000; i++) { y += dt * (K - (1 + K) * y); d += dt * (1 - (1 + K) * d); } close(y, m.reference(1), 4e-5); close(d, m.disturbance(1), 4e-5); close(m.perturbation(2 * m.tau), Math.exp(-2)); close(m.sensitivity * (1 + K), 1); }
});
test('affine contraction is exactly the coordinate iteration of the specified two-page Google matrix', () => {
  for (const r of [.05, .5, .95]) { let v = [.9, .1]; const G = [[(1 + r) / 2, (1 - r) / 2], [(1 - r) / 2, (1 + r) / 2]]; for (let n = 0; n < 20; n++) { const m = B.fixedPointModel(r, n); close(v[0], m.value); close(Math.abs(v[0] - .5), m.error); v = [0, 1].map(j => v.reduce((s, x, i) => s + x * G[i][j], 0)); } }
});
test('Fourier energy and truncation error agree with direct quadrature and all harmonics are recovered by a direct 32-point DFT', () => {
  for (const a of [0, .7, 1.2]) for (const N of [1, 3, 5]) { const m = B.fourierModel(a, N); close(integrate(x => m.value(x) ** 2, -Math.PI, Math.PI) / (2 * Math.PI), m.energy); close(integrate(x => (m.value(x) - m.value(x, true)) ** 2, -Math.PI, Math.PI) / (2 * Math.PI), m.error); for (const [k, amp] of m.harmonics) { let im = 0, re = 0; for (let j = 0; j < 32; j++) { const x = 2 * Math.PI * j / 32; im -= m.value(x) * Math.sin(k * x) / 32; re += m.value(x) * Math.cos(k * x) / 32; } close(re, 0); close(-2 * im, amp); } }
});
test('harmonic polynomial obeys off-center circle means, zero integrated normal flux and the gradient convention', () => {
  for (const a of [-.5, 0, .7]) { const m = B.harmonicModel(a), cx = .3, cy = -.2, r = .6; let avg = 0, flux = 0; for (let j = 0; j < 256; j++) { const t = 2 * Math.PI * j / 256, x = cx + r * Math.cos(t), y = cy + r * Math.sin(t), g = m.gradient(x, y); avg += m.value(x, y) / 256; flux += (g[0] * Math.cos(t) + g[1] * Math.sin(t)) * 2 * Math.PI * r / 256; } close(avg, m.value(cx, cy)); close(flux, 0); const h = 1e-5; close((m.value(cx + h, cy) - m.value(cx - h, cy)) / (2 * h), m.gradient(cx, cy)[0]); }
});
test('ridge reconstruction satisfies independent normal equations and minimizes the stated lambda-squared objective', () => {
  for (const eps of [.05, .3, 1]) for (const lambda of [0, .2, .5]) { const m = B.inverseModel(eps, .08, lambda), objective = x => (x[0] - m.measured[0]) ** 2 + (eps * x[1] - m.measured[1]) ** 2 + lambda ** 2 * (x[0] ** 2 + x[1] ** 2); close((1 + lambda ** 2) * m.ridge[0], m.measured[0]); close((eps ** 2 + lambda ** 2) * m.ridge[1], eps * m.measured[1]); for (const i of [0, 1]) for (const dx of [-.01, .01]) { const x = [...m.ridge]; x[i] += dx; assert.ok(objective(x) > objective(m.ridge)); } }
});
test('cylindrical distortion agrees with finite differences of actual projection formulae and the spherical metric', () => {
  for (const latitude of [0, 35, 70]) for (const projection of ['mercator', 'equal-area', 'equirectangular']) { const p = latitude * Math.PI / 180, h = 1e-6, y = projection === 'mercator' ? x => Math.log(Math.tan(Math.PI / 4 + x / 2)) : projection === 'equal-area' ? Math.sin : x => x, m = B.distortionModel(latitude, projection); close((y(p + h) - y(p - h)) / (2 * h), m.b, 1e-8); close(1 / Math.cos(p), m.a); if (projection === 'equal-area') close(m.area, 1); if (projection === 'mercator') close(m.ratio, 1); }
});
test('spectral axes diagonalize the matrix, its contour has unit quadratic energy and unit-mass modes obey the physical ODE', () => {
  for (const theta of [0, .7, Math.PI / 2]) for (const ratio of [.2, 1, 2.5]) { const m = B.spectralModel(theta, ratio), A = m.matrix; for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) close(A[k].reduce((s, x, j) => s + x * m.axes[i][j], 0), m.eigenvalues[i] * m.axes[i][k]); for (let t = 0; t < 6; t += .3) { const x = m.ellipse(t); close(x.reduce((s, v, i) => s + v * A[i].reduce((z, a, j) => z + a * x[j], 0), 0), 1); } close(A[0][0] * A[1][1] - A[0][1] * A[1][0], ratio); }
  for (const theta of [.2, .7]) for (const ratio of [.2, 2.5]) {
    const m = B.spectralModel(theta, ratio), h = 1e-4;
    for (let mode = 0; mode < 2; mode++) for (const t of [.3, 1.1]) {
      const position = time => m.axes[mode].map(x => x * Math.cos(Math.sqrt(m.eigenvalues[mode]) * time));
      const x = position(t), before = position(t - h), after = position(t + h);
      for (let i = 0; i < 2; i++) close((after[i] - 2 * x[i] + before[i]) / h ** 2 + m.matrix[i].reduce((sum, a, j) => sum + a * x[j], 0), 0, 1e-7);
    }
  }
});
test('continuous decay, Euler and gradient descent have the stated distinct stability boundary', () => {
  for (const h of [.5, 2, 2.5]) { const m = B.stabilityModel(1, h); let x = 1; for (let n = 0; n < 10; n++) { close(x, m.discrete(n)); x -= h * x; } assert.equal(m.stable, h < 2); assert.ok(m.exact(10) < 1); }
  assert.equal(B.stabilityModel(1, 2).discrete(8), 1); assert.ok(Math.abs(B.stabilityModel(1, 2.5).discrete(8)) > 1);
});
test('cyclic matrix representations preserve length, determinant and the same modular composition as pitch-class permutations', () => {
  for (const n of [3, 6, 12]) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const m = B.symmetryModel(n, j, k), A = m.rotation(j), C = multiply(A, m.rotation(k)), expected = m.rotation(j + k); for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) close(C[x][y], expected[x][y]); close(A[0][0] * A[1][1] - A[0][1] * A[1][0], 1); assert.equal(((4 + j) % n + k) % n, (4 + m.composition) % n); }
});
