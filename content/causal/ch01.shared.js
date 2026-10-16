// Causal Inference — Chapter 1: helpers shared by ch01.js and ch01-b.js (plain named exports).
//
// House style: every population is simulated, so the "god's-eye table" with BOTH potential outcomes of every unit exists
// and can be compared with what a study could see (one outcome per unit). Randomness is seeded (mulberry32), so each
// setting of the controls has its own reproducible stream; "break it" toggles switch the identifying assumptions off.

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const logistic = (z) => 1 / (1 + Math.exp(-z));
export const logit = (p) => Math.log(p / (1 - p));
export const pct = (x, d = 1) => (100 * x).toFixed(d) + '%';
export const mnus = (s) => String(s).replace(/-/g, '−');
/** Signed number with a real minus sign and an explicit plus. */
export const sg = (x, d = 1) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d);
export const fx = (x, d = 1) => mnus(x.toFixed(d));
export const mean = (a, idx) => { let s = 0, n = 0; if (idx) { for (const i of idx) { s += a[i]; n++; } } else { for (let i = 0; i < a.length; i++) { s += a[i]; n++; } } return n ? s / n : NaN; };
export const sdev = (a) => { const m = mean(a); let s = 0; for (const x of a) s += (x - m) ** 2; return Math.sqrt(s / Math.max(1, a.length - 1)); };
/** FNV-1a seed from a string. */
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** One-slot cache. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/** Seeded generator: r() uniform on (0,1), r.normal(). */
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let spare = null;
  r.normal = () => { if (spare !== null) { const z = spare; spare = null; return z; } let u = 0; while (u === 0) u = r(); const v = r(), m = Math.sqrt(-2 * Math.log(u)); spare = m * Math.sin(2 * Math.PI * v); return m * Math.cos(2 * Math.PI * v); };
  return r;
}

/**
 * A continuous-outcome population with BOTH potential outcomes: severity x ~ N(0,1);
 * Y0 = base − sx·x + sd·e (a health score, higher is better); individual effect τ = tau + hx·x + het·η; Y1 = Y0 + τ.
 */
export function makePop(n, seed, o = {}) {
  const { tau = 6, het = 4, hx = 0, base = 60, sx = 8, sd = 5 } = o;
  const r = rng(seed * 7919 + 13);
  const x = new Float64Array(n), y0 = new Float64Array(n), y1 = new Float64Array(n), t = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = r.normal(); y0[i] = base - sx * x[i] + sd * r.normal();
    t[i] = tau + hx * x[i] + het * r.normal(); y1[i] = y0[i] + t[i];
  }
  return { n, x, y0, y1, t };
}
/** Treatment indicators. Self-selection: P(A=1) = logistic(a + k·x + g·τ/sd(τ)) (k: sicker seek treatment; g: self-selection on gain). */
export function selectAssign(P, seed, k, g = 0, a = 0) {
  const r = rng(seed * 104729 + 7), A = new Uint8Array(P.n), st = Math.max(1e-9, sdev(P.t)), mt = mean(P.t);
  for (let i = 0; i < P.n; i++) A[i] = r() < logistic(a + k * P.x[i] + g * (P.t[i] - mt) / st) ? 1 : 0;
  return A;
}
/** Complete randomization: exactly m of n treated. */
export function completeAssign(n, m, seed) {
  const r = rng(seed * 15485863 + 3), idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const q = idx[i]; idx[i] = idx[j]; idx[j] = q; }
  const A = new Uint8Array(n); for (let i = 0; i < m; i++) A[idx[i]] = 1; return A;
}
/** Observed outcome Y = A·Y1 + (1 − A)·Y0 (consistency). */
export const observed = (P, A) => { const y = new Float64Array(P.n); for (let i = 0; i < P.n; i++) y[i] = A[i] ? P.y1[i] : P.y0[i]; return y; };
/** Group means. */
export function arms(P, A, y = observed(P, A)) {
  let n1 = 0, n0 = 0, s1 = 0, s0 = 0, t1 = 0, t0 = 0, b1 = 0, b0 = 0;
  for (let i = 0; i < P.n; i++) { if (A[i]) { n1++; s1 += y[i]; t1 += P.t[i]; b1 += P.y0[i]; } else { n0++; s0 += y[i]; t0 += P.t[i]; b0 += P.y0[i]; } }
  return { n1, n0, m1: n1 ? s1 / n1 : NaN, m0: n0 ? s0 / n0 : NaN, att: n1 ? t1 / n1 : NaN, atu: n0 ? t0 / n0 : NaN, y0t: n1 ? b1 / n1 : NaN, y0u: n0 ? b0 / n0 : NaN,
    naive: n1 && n0 ? s1 / n1 - s0 / n0 : NaN, ate: mean(P.t) };
}

/** Histogram counts on a fixed grid (returns {edges, counts}). */
export function binCounts(vals, lo, hi, nb) {
  const counts = new Array(nb).fill(0), w = (hi - lo) / nb;
  for (const v of vals) { const k = Math.floor((v - lo) / w); if (k >= 0 && k < nb) counts[k]++; }
  return { edges: Array.from({ length: nb + 1 }, (_, i) => lo + i * w), counts };
}
/** Same grid, as proportions of the sample (so two groups of different size are comparable). */
export function binDensity(vals, lo, hi, nb) {
  const h = binCounts(vals, lo, hi, nb), n = Math.max(1, vals.length);
  return { edges: h.edges, counts: h.counts.map((c) => c / n) };
}
/** Largest gap between two empirical CDFs. */
export function ksGap(a, b) {
  if (!a.length || !b.length) return NaN;
  const A = Float64Array.from(a).sort(), B = Float64Array.from(b).sort(); let i = 0, j = 0, d = 0;
  while (i < A.length && j < B.length) { const x = Math.min(A[i], B[j]); while (i < A.length && A[i] <= x) i++; while (j < B.length && B[j] <= x) j++; d = Math.max(d, Math.abs(i / A.length - j / B.length)); }
  return d;
}
/** Sorted quantile. */
export const quant = (arr, q) => { const s = Float64Array.from(arr).sort(); return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]; };

/** Population summary line used in several readouts. */
export const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * A step-histogram drawn from precomputed proportions, in the stage's own coordinates (bars + outline).
 * `h` = {edges, counts}; style = {color, fillAlpha, width}.
 */
export function barsH(s, h, st = {}) {
  const { color = 'accent', fillAlpha = 0.28, width = 1.6, dash } = st;
  for (let i = 0; i < h.counts.length; i++) if (h.counts[i] > 0 && fillAlpha > 0) s.rect(h.edges[i], 0, h.edges[i + 1], h.counts[i], { fill: color, fillAlpha, stroke: false });
  const pts = [[h.edges[0], 0]];
  for (let i = 0; i < h.counts.length; i++) { pts.push([h.edges[i], h.counts[i]], [h.edges[i + 1], h.counts[i]]); }
  pts.push([h.edges[h.edges.length - 1], 0]);
  s.path(pts, { color, width, dash });
}

/** Stage with a text label placed with a halo plate. */
export const lab = (s, str, x, y, o = {}) => s.text(str, x, y, { size: 11.5, weight: 700, plate: true, ...o });
