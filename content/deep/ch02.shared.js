// Deep Learning Theory — Chapter 2: helpers shared by ch02.js and ch02-b.js.
// The network engine, least squares and piecewise-linear algebra are chapter 1's (ch01.shared.js), re-exported here so
// that each chapter file still imports from its own shared module only.
export * from './ch01.shared.js';
import { forward, sigm } from './ch01.shared.js';

/** Sparse-table range max/min over an array, for the modulus of continuity ω(δ) = sup_{|x−y|≤δ} |f(x) − f(y)|. */
export function modulus(vals) {
  const n = vals.length, LOG = Math.ceil(Math.log2(n)) + 1, mx = [Float64Array.from(vals)], mn = [Float64Array.from(vals)];
  for (let k = 1; k < LOG; k++) { const a = mx[k - 1], b = mn[k - 1], A = new Float64Array(n), B = new Float64Array(n), h = 1 << (k - 1); for (let i = 0; i + (1 << k) <= n; i++) { A[i] = Math.max(a[i], a[i + h]); B[i] = Math.min(b[i], b[i + h]); } mx.push(A); mn.push(B); }
  const q = (i, j) => { const k = Math.floor(Math.log2(j - i + 1)); return Math.max(mx[k][i], mx[k][j - (1 << k) + 1]) - Math.min(mn[k][i], mn[k][j - (1 << k) + 1]); };
  /** ω for a window of w samples (w ≥ 1). */
  return (w) => { w = Math.max(1, Math.min(n - 1, Math.round(w))); let best = 0; for (let i = 0; i + w < n; i++) best = Math.max(best, q(i, i + w)); return best; };
}
/** Fast numeric hash of a ReLU network's activation pattern at x (two 32-bit FNV streams combined). */
export function patternHash(net, x) {
  forward(net, x); let h1 = 2166136261, h2 = 5381;
  for (let l = 1; l < net.L; l++) { const z = net.ws.z[l]; for (let i = 0; i < z.length; i++) { const b = z[i] > 0 ? 1 : 0; h1 = Math.imul(h1 ^ (b + 2 * i + 7), 16777619); h2 = (Math.imul(h2, 33) + b * 131 + i) | 0; } }
  return (h1 >>> 0) * 4294967296 + (h2 >>> 0);
}
/** The first layer (1-based) whose activation pattern differs between x and y, or 0. */
export function firstDiffLayer(net, x, y) {
  forward(net, x); const zs = []; for (let l = 1; l < net.L; l++) zs.push(Array.from(net.ws.z[l], (u) => u > 0));
  forward(net, y); for (let l = 1; l < net.L; l++) { const z = net.ws.z[l]; for (let i = 0; i < z.length; i++) if ((z[i] > 0) !== zs[l - 1][i]) return l; }
  return 0;
}
/** Asymmetric tent map with apex p: [0,1] → [0,1]; a two-unit ReLU layer. */
export const tent = (x, p = 0.5) => (x <= p ? x / p : (1 - x) / (1 - p));
/** k-fold composition of the tent map. */
export function sawtooth(x, k, p = 0.5) { for (let i = 0; i < k; i++) x = tent(Math.min(1, Math.max(0, x)), p); return x; }
/** Yarotsky's approximation of x² on [0,1]: f_m(x) = x − Σ_{s=1}^m g_s(x)/4^s, with g_s the s-fold symmetric tent. */
export function yarotsky(x, m) { let s = x, g = x; for (let i = 1; i <= m; i++) { g = tent(g); s -= g / 4 ** i; } return s; }
export { sigm };
