import test from 'node:test';
import assert from 'node:assert/strict';
import { linearPeriodicSpectrum, harmonic, divergenceBound, divergenceBlockPeak, divergenceAssemblyPeak } from '../content/sig/sig-source-audit.shared.js';
import { partial } from '../content/sig/ch04.shared.js';
const near = (a, b, tol = 1e-8) => assert.ok(Math.abs(a - b) <= tol * (1 + Math.abs(a) + Math.abs(b)), `${a} ≈ ${b}`);
const tau = 2 * Math.PI;

test('periodic linear coefficients and power agree with independent segment quadrature, including zero/DC and frequencies above knot Nyquist', () => {
  for (const ys of [new Array(48).fill(0), new Array(48).fill(1.7), Array.from({ length: 48 }, (_, j) => Math.sin(tau * j / 48) + .3 * Math.cos(7 * tau * j / 48)), [1, -.8, .3, -.7, .6]]) {
    const c = linearPeriodicSpectrum(ys, 60), M = 12000, N = ys.length;
    let power = 0; const a = new Float64Array(61), b = new Float64Array(61);
    for (let j = 0; j < N; j++) for (let i = 0; i < M; i++) {
      const u = (i + .5) / M, t = -Math.PI + tau * (j + u) / N, y = ys[j] * (1 - u) + ys[(j + 1) % N] * u;
      power += y * y / (M * N);
      for (const k of [0, 1, 7, 24, 30, 48, 60]) { a[k] += y * Math.cos(k * t) / (M * N); b[k] -= y * Math.sin(k * t) / (M * N); }
    }
    near(c.power, power, 2e-9);
    for (const k of [0, 1, 7, 24, 30, 48, 60]) { near(c.re[k], a[k], 2e-8); near(c.im[k], b[k], 2e-8); }
  }
});

test('Parseval tail equals directly integrated projection residual, including a signal with no power', () => {
  for (const ys of [new Array(48).fill(0), Array.from({ length: 48 }, (_, j) => j < 24 ? -1 : 1), Array.from({ length: 48 }, (_, j) => Math.sin(tau * j / 48) + .3)]) {
    const c = linearPeriodicSpectrum(ys, 30), n = 48000, ts = Array.from({ length: n }, (_, i) => -Math.PI + tau * (i + .5) / n);
    for (const K of [0, 3, 30]) {
      const projected = partial(c, K, ts); let residual = 0;
      for (let i = 0; i < n; i++) { const u = (i + .5) / n * ys.length, j = Math.floor(u), f = u - j, y = ys[j] * (1 - f) + ys[(j + 1) % ys.length] * f; residual += (y - projected[i]) ** 2 / n; }
      let collected = c.re[0] ** 2;
      for (let k = 1; k <= K; k++) collected += 2 * (c.re[k] ** 2 + c.im[k] ** 2);
      near(residual, c.power - collected, 3e-8);
      assert.ok(collected <= c.power + 1e-12);
    }
  }
});

test('weighted divergence blocks are Fejer averages of a bounded sawtooth; exact spectral cut yields the unbounded subsequence', () => {
  for (const n of [2, 5, 40, 600]) {
    const m = 2 * n, coefficients = new Map();
    for (let k = 1; k <= n; k++) { const a = (1 - k / (n + 1)) / k; coefficients.set(m - k, a); coefficients.set(m + k, -a); }
    const kept = [...coefficients].filter(([k]) => k <= m).reduce((sum, [, a]) => sum + a, 0);
    near(kept, divergenceBlockPeak(n)); near([...coefficients.values()].reduce((sum, x) => sum + x, 0), 0);
    for (let i = 0; i < 300; i++) { const t = tau * i / 300, value = [...coefficients].reduce((sum, [k, a]) => sum + a * Math.cos(k * t), 0); assert.ok(Math.abs(value) <= Math.PI + 1e-10); }
  }
  // The first two full blocks contain only 518 frequencies; test the actual assembled spectral cutoff.
  const all = new Map();
  for (const j of [1, 2]) { const n = 2 ** (j ** 3), m = 2 * n; for (let k = 1; k <= n; k++) { const a = (1 - k / (n + 1)) / k / j ** 2; all.set(m - k, a); all.set(m + k, -a); } }
  for (const j of [1, 2]) { const m = 2 ** (j ** 3 + 1); near([...all].filter(([k]) => k <= m).reduce((sum, [, a]) => sum + a, 0), divergenceAssemblyPeak(j)); }
  near(divergenceBound, Math.PI * Math.PI ** 2 / 6);
  assert.ok(divergenceAssemblyPeak(8) > divergenceBound);
  for (let j = 2; j <= 20; j++) { assert.ok(j ** 3 - (j - 1) ** 3 > Math.log2(3)); assert.ok(divergenceAssemblyPeak(j) > divergenceAssemblyPeak(j - 1)); }
  near(harmonic(3e6), Math.log(3e6) + .5772156649015329 + 1 / 6e6, 1e-12);
});
