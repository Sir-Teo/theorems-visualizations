// Understanding Machine Learning — Chapter 4: helpers for uniform convergence on a line of thresholds
// (re-exports everything of the earlier chapters).
//
// The world: instances x uniform on [0, 1]; the label is 1 with probability eta(x) (a decreasing S-curve, flattened by the
// noise level nu); the class is the K thresholds h_t(x) = 1[x <= t], t = j/(K-1). True risks are exact up to a 40-point
// midpoint rule per grid cell; empirical risks of all K thresholds cost O(m + K) by a difference array.
import { clamp } from './ch03.shared.js';
export * from './ch03.shared.js';

/** P[y = 1 | x] for noise level nu: a steep decreasing S-curve centred at 1/2, floored at nu and capped at 1 - nu. */
export const etaT = (nu) => (x) => nu + (1 - 2 * nu) / (1 + Math.exp(14 * (x - 0.5)));

/** Exact-enough true risks L_D(h_t) of the K thresholds under eta. */
export function trueRisks(eta, K) {
  const per = 40, N = (K - 1) * per, h = 1 / N, a0 = new Float64Array(K), a1 = new Float64Array(K);
  let c0 = 0, c1 = 0, E1 = 0;
  const e = new Float64Array(N);
  for (let i = 0; i < N; i++) { e[i] = eta((i + 0.5) * h); E1 += e[i] * h; }
  const L = new Float64Array(K);
  for (let j = 0; j < K; j++) {
    L[j] = c0 + (E1 - c1); // errors of 1[x <= t_j]: label 0 inside, label 1 outside
    if (j < K - 1) for (let i = j * per; i < (j + 1) * per; i++) { c0 += (1 - e[i]) * h; c1 += e[i] * h; }
  }
  return L;
}

/** Draw m labelled points: {x, y, m}. */
export function drawT(eta, m, r) {
  const x = new Float64Array(m), y = new Uint8Array(m);
  for (let i = 0; i < m; i++) { x[i] = r(); y[i] = r() < eta(x[i]) ? 1 : 0; }
  return { x, y, m };
}

/** Empirical risks of the K thresholds on the first `upto` points of S. */
export function empRisks(S, K, upto = S.m) {
  const d = new Float64Array(K + 1);
  for (let i = 0; i < upto; i++) {
    const c = Math.min(K - 1, Math.ceil(S.x[i] * (K - 1) - 1e-12)); // smallest j with t_j >= x
    if (S.y[i]) { d[0] += 1; d[c] -= 1; } else { d[c] += 1; d[K] -= 1; }
  }
  const out = new Float64Array(K); let run = 0;
  for (let j = 0; j < K; j++) { run += d[j]; out[j] = run / upto; }
  return out;
}

export function argmin(a) { let b = 0; for (let j = 1; j < a.length; j++) if (a[j] < a[b]) b = j; return b; }
export function supGap(emp, L) { let g = 0; for (let j = 0; j < L.length; j++) g = Math.max(g, Math.abs(emp[j] - L[j])); return g; }

/** Draw L_D (ink), L_S (blue), the band of half-width `half` around L_D (orange) and the points of L_S outside it (red).
 *  Returns the number of violating thresholds. */
export function drawCurves(s, L, emp, half) {
  const K = L.length, up = [], dn = [], pl = [], pe = [], bad = [];
  for (let j = 0; j < K; j++) {
    const x = j / (K - 1);
    up.push([x, clamp(L[j] + half, 0, 1)]); dn.push([x, clamp(L[j] - half, 0, 1)]);
    pl.push([x, L[j]]); pe.push([x, emp[j]]);
    if (Math.abs(emp[j] - L[j]) > half + 1e-12) bad.push([x, emp[j]]);
  }
  s.poly([...up, ...dn.reverse()], { fill: 'orange', fillAlpha: 0.2, stroke: false });
  s.path(pl, { color: 'ink', width: 2.4 });
  s.path(pe, { color: 'accent', width: 1.8 });
  for (const p of bad) s.dot(p[0], p[1], { color: 'red', r: 3.2 });
  return bad.length;
}

export const q2 = (x, d = 2) => x.toFixed(d);
export const geo = (a, b, n) => Array.from({ length: n }, (_, i) => Math.round(a * Math.pow(b / a, i / (n - 1))));
export function quantileSorted(a, q) { return a[Math.min(a.length - 1, Math.floor(q * a.length))]; }

/** Midpoint-cell quantization; beyond52 bits the browser cannot represent every midpoint. */
export function quantizeUnit(x,bits) {
  if (!Number.isInteger(bits) || bits < 1 || bits > 52) throw new RangeError('Drawing precision must be between1 and52 bits');
  const count=2**bits,index=Math.min(count-1,Math.max(0,Math.floor(clamp(x,0,1)*count)));
  return (index+.5)/count;
}
