// Signals & Systems — Chapter 4 shared helpers: a library of 2π-periodic waveforms with exact (or numerically integrated)
// complex Fourier coefficients, partial sums and Fejér means by a rotation recurrence, and drawing helpers. Re-exports the
// chapter-3 helpers (which re-export chapter 2's).
export * from './ch03.shared.js';
import { TAU } from './ch03.shared.js';

export const PI = Math.PI;
/** t wrapped into [−π, π). */
export const wrap = (t) => { t = (t + PI) % TAU; if (t < 0) t += TAU; return t - PI; };
/** n + 1 evenly spaced points from a to b. */
export const grid = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

// ================================================================ coefficients
/** c_k = (1/2π)∫ f(t) e^{−ikt} dt, k = 0 … K, by the midpoint rule with M cells (exact for trigonometric polynomials of degree < M). */
export function fcoef(f, K, M = 4096) {
  const re = new Float64Array(K + 1), im = new Float64Array(K + 1), C = new Float64Array(2 * M), S = new Float64Array(2 * M), y = new Float64Array(M);
  for (let i = 0; i < 2 * M; i++) { C[i] = Math.cos((i * PI) / M); S[i] = Math.sin((i * PI) / M); }
  for (let j = 0; j < M; j++) y[j] = f(-PI + ((j + 0.5) * TAU) / M);
  for (let k = 0; k <= K; k++) {
    let a = 0, b = 0;
    for (let j = 0; j < M; j++) { const idx = (k * (2 * j + 1)) % (2 * M); a += y[j] * C[idx]; b -= y[j] * S[idx]; }
    // e^{−ikt_j} = (−1)^k e^{−ik(2j+1)π/M}
    const sg = k % 2 ? -1 : 1;
    re[k] = (sg * a) / M; im[k] = (sg * b) / M;
  }
  return { re, im, K };
}

/** The classic waveforms (period 2π), with closed-form coefficients c(k) → [re, im] where known. */
export const WAVES = {
  square: { label: 'square', tex: 'x(t)=\\operatorname{sgn}(\\sin t)', f: (t) => { const u = wrap(t); return u > 0 ? 1 : u < 0 ? -1 : 0; },
    c: (k) => (k === 0 ? [0, 0] : k % 2 ? [0, -2 / (PI * k)] : [0, 0]), jump: 2 },
  saw: { label: 'sawtooth', tex: 'x(t)=t/\\pi\\ (|t|<\\pi)', f: (t) => wrap(t) / PI,
    c: (k) => (k === 0 ? [0, 0] : [0, (k % 2 ? -1 : 1) / (PI * k)]) },
  tri: { label: 'triangle', tex: 'x(t)=1-2|t|/\\pi\\ (|t|\\le\\pi)', f: (t) => 1 - (2 * Math.abs(wrap(t))) / PI,
    c: (k) => (k === 0 ? [0, 0] : k % 2 ? [4 / (PI * PI * k * k), 0] : [0, 0]) },
  pulse: { label: 'pulse train', tex: 'x(t)=\\mathbf 1_{|t|<\\pi/4}', f: (t) => (Math.abs(wrap(t)) < PI / 4 ? 1 : 0),
    c: (k) => (k === 0 ? [0.25, 0] : [Math.sin((k * PI) / 4) / (k * PI), 0]) },
  skew: { label: 'smooth, lopsided', tex: 'x(t)=e^{\\cos t+0.6\\sin 2t}-\\bar x', f: (t) => Math.exp(Math.cos(t) + 0.6 * Math.sin(2 * t)) - 1.55 },
};
for (const [id, W] of Object.entries(WAVES)) W.id = id;
const _cc = new Map();
/** Coefficients c_0 … c_K of a library waveform (cached). */
export function coefsOf(id, K) {
  const key = `${id}|${K}`;
  if (_cc.has(key)) return _cc.get(key);
  const W = WAVES[id];
  let out;
  if (W.c) { const re = new Float64Array(K + 1), im = new Float64Array(K + 1); for (let k = 0; k <= K; k++) { const [a, b] = W.c(k); re[k] = a; im[k] = b; } out = { re, im, K }; }
  else out = fcoef(W.f, K);
  _cc.set(key, out);
  return out;
}
export const waveMenu = (ids) => ids.map((id) => ({ value: id, label: WAVES[id].label }));
/** |c_k|. */
export const mag = (c, k) => Math.hypot(c.re[k], c.im[k]);

// ================================================================ partial sums
/** S_N(t) = c_0 + 2 Σ_{k≤N} Re(c_k e^{ikt}) at each t of ts (Fejér mean: weights 1 − k/(N+1)). Rotation recurrence, no per-term trig. */
export function partial(c, N, ts, fejer = false) {
  const out = new Float64Array(ts.length), n = Math.min(N, c.K);
  for (let i = 0; i < ts.length; i++) {
    const ct = Math.cos(ts[i]), st = Math.sin(ts[i]);
    let cs = 1, sn = 0, s = c.re[0];
    for (let k = 1; k <= n; k++) { const t1 = cs * ct - sn * st; sn = sn * ct + cs * st; cs = t1; s += 2 * (fejer ? 1 - k / (N + 1) : 1) * (c.re[k] * cs - c.im[k] * sn); }
    out[i] = s;
  }
  return out;
}
/** Zip abscissae and values into [[t, y]] for s.path. */
export const zip = (ts, ys) => Array.from(ts, (t, i) => [t, ys[i]]);
/** Mean square error (1/2π)∫|x − S_N|² from the coefficients alone, given the total power P = (1/2π)∫|x|² (Parseval). */
export function tailPower(c, N, P) { let s = 0; for (let k = 1; k <= N; k++) s += 2 * (c.re[k] ** 2 + c.im[k] ** 2); return Math.max(0, P - (c.re[0] ** 2 + s)); }
/** Total power (1/2π)∫ f² by the midpoint rule. */
export function powerOf(f, M = 8192) { let s = 0; for (let j = 0; j < M; j++) { const v = f(-PI + ((j + 0.5) * TAU) / M); s += v * v; } return s / M; }

// ================================================================ drawing
/** Stem plot of c_k magnitudes (or any list) as bars with the index along x. */
export function barsAt(s, vals, x0, st = {}) { s.bars(vals, { x0, dx: 1, color: st.color || 'accent', ...st }); }
/** Axis ticks at multiples of π/2 for a time axis over [−π, π]. */
export const PI_TICKS = [[-PI, '−π'], [-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2'], [PI, 'π']];
export const PI2_TICKS = [[0, '0'], [PI, 'π'], [TAU, '2π']];
