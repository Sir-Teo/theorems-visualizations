// Probability: Theory and Examples (Durrett) — Chapter 4, sections 4.6-4.9: helpers shared by ch04-z1.js … ch04-z4.js.
//
// Recurring pictures: dyadic martingales E(Y | F_n) of a function Y on [0,1] (tables of cell means), simple random
// walks (paths, exact killed-walk laws), Polya urns, Beta samplers, and tail curves for uniform integrability.

export { clampN, cornerIn, simpson, linEdges, densityOn, logInts, PHI, PhiN } from './ch03.shared.js';
export { fr, sciT, logFact, logChoose, binomPmf } from './ch03.shared.js';
import { logChoose } from './ch03.shared.js';

/** u_{2n} = P(S_{2n} = 0) = C(2n, n) / 4^n for simple random walk. */
export const u2n = (n) => Math.exp(logChoose(2 * n, n) - 2 * n * Math.LN2);

// ------------------------------------------------------------------ functions on [0,1] and their dyadic martingales
export const DFUN = {
  smooth: { label: 'smooth', f: (x) => Math.sin(2 * Math.PI * x) + 0.6 * x },
  jump: { label: 'jumps', f: (x) => (x < 1 / 3 ? 1 : x < 0.7 ? -0.5 : 2) },
  rough: { label: 'rough', f: (x) => { let s = 0; for (let k = 0; k < 7; k++) s += Math.cos(2 * Math.PI * 3 ** k * x) / 2 ** k; return s; } },
  blow: { label: '$x^{-1/2}$', f: (x) => 1 / Math.sqrt(x), F: (x) => 2 * Math.sqrt(x) },
};
export const dfunOpts = (keys = Object.keys(DFUN)) => keys.map((k) => ({ value: k, label: DFUN[k].label }));
export const DL = 12; // finest dyadic level of the tables
/** Table of cell means: tab[n][i] = 2^n ∫_{i/2^n}^{(i+1)/2^n} f, for n = 0..DL (cached on the function object). */
export function dyadicTable(key) {
  const fun = DFUN[key];
  if (fun._tab) return fun._tab;
  const m = 1 << DL, top = new Float64Array(m);
  for (let i = 0; i < m; i++) {
    if (fun.F) top[i] = (fun.F((i + 1) / m) - fun.F(i / m)) * m;
    else { let s = 0; for (let j = 0; j < 8; j++) s += fun.f((i + (j + 0.5) / 8) / m); top[i] = s / 8; }
  }
  const tab = new Array(DL + 1); tab[DL] = top;
  for (let n = DL - 1; n >= 0; n--) { const a = new Float64Array(1 << n); for (let i = 0; i < a.length; i++) a[i] = (tab[n + 1][2 * i] + tab[n + 1][2 * i + 1]) / 2; tab[n] = a; }
  fun._tab = tab; return tab;
}
/** Value of the level-n dyadic average at u in [0,1). */
export const dyadAt = (tab, n, u) => tab[n][Math.min((1 << n) - 1, Math.floor(u * (1 << n)))];
/** E(|g|; |g| > M) for g given by equal-weight values. */
export function tailExp(vals, M) { let s = 0; for (let i = 0; i < vals.length; i++) { const a = Math.abs(vals[i]); if (a > M) s += a; } return s / vals.length; }
/** Weighted version: values vals[i] on cells of mass w[i]. */
export function tailExpW(vals, w, M) { let s = 0; for (let i = 0; i < vals.length; i++) { const a = Math.abs(vals[i]); if (a > M) s += a * w[i]; } return s; }

// ------------------------------------------------------------------ simple random walk
/** S_0..S_n of the simple random walk with up-probability p. */
export function srw(r, n, p = 0.5) { const S = new Int32Array(n + 1); for (let i = 1; i <= n; i++) S[i] = S[i - 1] + (r() < p ? 1 : -1); return S; }
/** Exact law of the walk killed on first reaching a (≤ start) or b (≥ start) — p up-probability; returns for each time the arrays. */
export function ruinDP(a, b, x, p, T) {
  const W = b - a + 1; let cur = new Float64Array(W); cur[x - a] = 1; const out = [];
  for (let t = 0; t <= T; t++) {
    let alive = 0; for (let i = 1; i < W - 1; i++) alive += cur[i];
    out.push({ t, alive, pa: cur[0], pb: cur[W - 1], cur: Float64Array.from(cur) });
    const nx = new Float64Array(W); nx[0] = cur[0]; nx[W - 1] = cur[W - 1];
    for (let i = 1; i < W - 1; i++) { nx[i + 1] += cur[i] * p; nx[i - 1] += cur[i] * (1 - p); }
    cur = nx;
  }
  return out;
}

// ------------------------------------------------------------------ gamma / beta / Polya urn
/** Gamma(k, 1) by Marsaglia–Tsang (k > 0), r = v.rng(seed). */
export function sampleGamma(r, k) {
  if (k < 1) return sampleGamma(r, k + 1) * Math.pow(r(), 1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (let it = 0; it < 200; it++) {
    let x, vv; do { x = r.normal(); vv = 1 + c * x; } while (vv <= 0);
    vv = vv * vv * vv; const u = r();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - vv + Math.log(vv))) return d * vv;
  }
  return d;
}
export const sampleBeta = (r, a, b) => { const x = sampleGamma(r, a), y = sampleGamma(r, b); return x / (x + y); };
/** Moment E θ^k of Beta(a, b). */
export function betaMoment(a, b, k) { let m = 1; for (let j = 0; j < k; j++) m *= (a + j) / (a + b + j); return m; }
/** Beta(a, b) density. */
export function betaPdf(a, b, x) { if (x <= 0 || x >= 1) return 0; return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - (logGammaSimple(a) + logGammaSimple(b) - logGammaSimple(a + b))); }
function logGammaSimple(z) {
  // Lanczos approximation
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGammaSimple(1 - z);
  z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
/** Polya urn: start with a red, b blue; draw, return with one more of the drawn colour. Returns Uint8Array of n draws (1 = red). */
export function polyaDraws(r, a, b, n) { const out = new Uint8Array(n); let R = a, B = b; for (let i = 0; i < n; i++) { const red = r() < R / (R + B); out[i] = red ? 1 : 0; if (red) R++; else B++; } return out; }
/** Probability that the first n draws of the urn are a given sequence with k reds: a^(k) b^(n-k) / (a+b)^(n) (rising factorials). */
export function polyaSeqProb(a, b, k, n) { let p = 1; for (let j = 0; j < k; j++) p *= a + j; for (let j = 0; j < n - k; j++) p *= b + j; for (let j = 0; j < n; j++) p /= a + b + j; return p; }
