// Deep Learning Theory — Chapter 4: helpers shared by ch04.js and ch04-b.js.
// The network engine, data sets and drawing helpers of chapters 1–3 are re-exported from ch03.shared.js. New here:
// flat parameter vectors, a Hessian-vector product by central differences of the gradient, power iteration for the
// largest Hessian eigenvalue ("sharpness"), and a few helpers for quadratic test problems.
export * from './ch03.shared.js';
import { lossGrad, zeroGrad } from './ch03.shared.js';

/** All parameters of a net as one Float64Array (W₁, b₁, W₂, b₂, …). */
export function getParams(net) {
  let n = 0; for (let l = 0; l < net.L; l++) n += net.W[l].length + net.b[l].length;
  const p = new Float64Array(n); let k = 0;
  for (let l = 0; l < net.L; l++) { p.set(net.W[l], k); k += net.W[l].length; p.set(net.b[l], k); k += net.b[l].length; }
  return p;
}
/** Write a flat parameter vector back into a net. */
export function setParams(net, p) {
  let k = 0;
  for (let l = 0; l < net.L; l++) { net.W[l].set(p.subarray(k, k + net.W[l].length)); k += net.W[l].length; net.b[l].set(p.subarray(k, k + net.b[l].length)); k += net.b[l].length; }
}
/** Loss and flat gradient (into out) at the net's current parameters. */
export function lossGradFlat(net, data, head, g, out) {
  const L = lossGrad(net, data.X, data.Y, head, g); let k = 0;
  for (let l = 0; l < net.L; l++) { out.set(g.W[l], k); k += g.W[l].length; out.set(g.b[l], k); k += g.b[l].length; }
  return L;
}
/**
 * Largest-magnitude Hessian eigenvalue of the training loss at the net's parameters, by power iteration with
 * Hessian-vector products H u ≈ (∇L(θ+hu) − ∇L(θ−hu)) / 2h. `st` carries the iterate between calls (warm start).
 * Returns the Rayleigh quotient uᵀHu (the net's parameters are restored).
 */
export function sharpness(net, data, head, st, iters = 8, h = 1e-4) {
  const p0 = getParams(net), N = p0.length, g = st.g || (st.g = zeroGrad(net));
  if (!st.v) { st.v = new Float64Array(N); let s = 12345; for (let i = 0; i < N; i++) { s = (Math.imul(s, 1103515245) + 12345) | 0; st.v[i] = ((s >>> 8) / 8388608) - 1; } }
  if (!st.gp) { st.gp = new Float64Array(N); st.gm = new Float64Array(N); st.q = new Float64Array(N); }
  const { v, gp, gm, q } = st; let lam = 0;
  for (let it = 0; it < iters; it++) {
    let nn = 0; for (let i = 0; i < N; i++) nn += v[i] * v[i]; nn = Math.sqrt(nn) || 1;
    for (let i = 0; i < N; i++) v[i] /= nn;
    for (let i = 0; i < N; i++) q[i] = p0[i] + h * v[i]; setParams(net, q); lossGradFlat(net, data, head, g, gp);
    for (let i = 0; i < N; i++) q[i] = p0[i] - h * v[i]; setParams(net, q); lossGradFlat(net, data, head, g, gm);
    lam = 0; for (let i = 0; i < N; i++) { const hv = (gp[i] - gm[i]) / (2 * h); lam += v[i] * hv; v[i] = hv; }
  }
  let nn = 0; for (let i = 0; i < N; i++) nn += v[i] * v[i]; nn = Math.sqrt(nn) || 1; for (let i = 0; i < N; i++) v[i] /= nn;
  setParams(net, p0);
  return lam;
}
/** Plain-text log10 axis ticks 10^k for k in a range (Unicode superscripts), as [position, label] pairs. */
export function log10Ticks(lo, hi, step = 1) {
  const sup = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const out = []; for (let k = Math.ceil(lo); k <= hi; k += step) out.push([k, k === 0 ? '1' : '10' + String(k).split('').map((c) => sup[c]).join('')]);
  return out;
}
/** Clamp a value into a plottable log10 (floor at lo). */
export const lg = (x, lo = -17) => Math.max(lo, Math.log10(Math.max(x, 1e-300)));
