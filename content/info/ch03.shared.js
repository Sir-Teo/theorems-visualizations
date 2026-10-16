// Information & Coding Theory — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
// Re-exports the chapter-2 helpers; adds exact log-domain counting (binomials, multinomials, types), a barycentric
// probability-simplex frame for three-letter alphabets, and small finite-Markov-chain tools.

import { clamp, sum, H, h2, KL, d2, fmtB, setProb, hashStr, LET, barEd } from './ch02.shared.js';
export * from './ch02.shared.js';

export const LN2 = Math.LN2;
export const log2 = Math.log2;

// ---- exact counting in the log domain ------------------------------------------------------------------
const LNF = [0];
/** ln(n!) by cached cumulative sums (exact to double precision, fine up to n ~ 10⁵). */
export function lnFact(n) { while (LNF.length <= n) LNF.push(LNF[LNF.length - 1] + Math.log(LNF.length)); return LNF[n]; }
/** log₂ C(n,k). */
export const lbinom = (n, k) => (k < 0 || k > n ? -Infinity : (lnFact(n) - lnFact(k) - lnFact(n - k)) / LN2);
/** log₂ of the multinomial n!/(c₁!…c_m!). */
export function lmult(c) { let n = 0, s = 0; for (const x of c) { n += x; s += lnFact(x); } return (lnFact(n) - s) / LN2; }
/** log₂ Σ 2^{a_i} computed stably. */
export function lse2(a) { let m = -Infinity; for (const x of a) if (x > m) m = x; if (m === -Infinity) return -Infinity; let s = 0; for (const x of a) s += Math.pow(2, x - m); return m + Math.log2(s); }
/** log₂ of the probability that n i.i.d. Bernoulli(p) draws contain exactly k ones. */
export const lbinPmf = (n, k, p) => lbinom(n, k) + (k > 0 ? k * log2(p) : 0) + (n - k > 0 ? (n - k) * log2(1 - p) : 0);
/** log₂ probability of ONE particular binary sequence with k ones. */
export const lseqP = (n, k, p) => (k > 0 ? k * log2(p) : 0) + (n - k > 0 ? (n - k) * log2(1 - p) : 0);
/** Cumulative distribution (array) of Binomial(n,p), by the exact pmf; used for exact inverse-CDF sampling. */
export function binomCdf(n, p) {
  const c = new Float64Array(n + 1); let a = 0;
  for (let k = 0; k <= n; k++) { a += Math.pow(2, lbinPmf(n, k, p)); c[k] = a; }
  return c;
}
/** Smallest k with cdf[k] ≥ u. */
export function cdfPick(cdf, u) { let lo = 0, hi = cdf.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] >= u) hi = m; else lo = m + 1; } return lo; }
/** Round n·P to integer counts summing to n (largest remainders): the type of length n closest to P. */
export function typeRound(P, n) {
  const f = P.map((x) => x * n), c = f.map(Math.floor); let r = n - sum(c);
  const ord = f.map((x, i) => [x - c[i], i]).sort((a, b) => b[0] - a[0]);
  for (let j = 0; r > 0; j++, r--) c[ord[j % ord.length][1]]++;
  return c;
}
/** log₂ Q^n(T) for the type class with counts c: |T|·∏ Q_i^{c_i}. */
export function lQclass(c, Q) { let s = lmult(c); for (let i = 0; i < c.length; i++) if (c[i] > 0) s += c[i] * log2(Q[i]); return s; }

// ---- the probability simplex of a three-letter alphabet (equilateral triangle) -----------------------
const R3 = Math.sqrt(3) / 2;
/** Barycentric (p₁,p₂,p₃) → plane point; vertex 1 bottom-left, 2 bottom-right, 3 top. */
export const simXY = (P) => [P[1] + 0.5 * P[2], R3 * P[2]];
export function simP(x, y) { const p3 = y / R3, p2 = x - 0.5 * p3; return [1 - p2 - p3, p2, p3]; }
/** Constrain a pointer position to the triangle with every coordinate ≥ m. */
export function simClamp(x, y, m = 0.03) {
  let P = simP(x, y).map((t) => Math.max(m, t)); const s = sum(P); P = P.map((t) => t / s);
  // renormalising may push below m again slightly; one more pass
  P = P.map((t) => Math.max(m, t)); const s2 = sum(P); P = P.map((t) => t / s2);
  return simXY(P);
}
/** A stage for the simplex: no axes, 1:1, view fitted to the triangle. */
export function simStage(v, o = {}) { return v.stage({ x: [-0.12, 1.12], y: [-0.1, 0.98], equal: true, axes: false, height: 300, ...o }); }
/** Draw the triangle, a faint grid at multiples of 1/k, and vertex labels. */
export function drawSimplex(s, { k = 4, names = ['a', 'b', 'c'], color = 'muted' } = {}) {
  const V = [[0, 0], [1, 0], [0.5, R3]];
  s.poly(V, { color, width: 1.6, fill: 'panel', fillAlpha: 0.0 });
  for (let i = 1; i < k; i++) {
    const t = i / k;
    s.line(t, 0, 0.5 + t / 2, R3 * (1 - t), { color: 'grid', width: 1, alpha: 0.6 });
    s.line(1 - t, 0, 0.5 - t / 2, R3 * (1 - t), { color: 'grid', width: 1, alpha: 0.6 });
    s.line(0.5 * t, R3 * t, 1 - 0.5 * t, R3 * t, { color: 'grid', width: 1, alpha: 0.6 });
  }
  s.text(names[0], -0.045, -0.045, { align: 'center', size: 13, weight: 700, color: 'muted' });
  s.text(names[1], 1.045, -0.045, { align: 'center', size: 13, weight: 700, color: 'muted' });
  s.text(names[2], 0.5, R3 + 0.05, { align: 'center', size: 13, weight: 700, color: 'muted' });
}
/** Build a handle on the simplex at the distribution P0; `get()` returns its current barycentric coordinates. */
export function simHandle(s, P0, opts = {}) {
  const [x, y] = simXY(P0);
  const h = s.handle(x, y, { constrain: (px, py) => simClamp(px, py, opts.min ?? 0.03), ...opts });
  h.P = () => simP(h.x, h.y);
  h.setP = (P) => { const [a, b] = simXY(P); h.set(a, b); };
  return h;
}

// ---- finite Markov chains -----------------------------------------------------------------------------
/** Stationary distribution of a row-stochastic matrix by solving πP = π, Σπ = 1 (Gaussian elimination, partial pivoting). */
export function stationary(P) {
  const n = P.length, A = [];
  for (let j = 0; j < n; j++) { const row = []; for (let i = 0; i < n; i++) row.push(P[i][j] - (i === j ? 1 : 0)); A.push(row); }
  A[n - 1] = new Array(n).fill(1);
  const b = new Array(n).fill(0); b[n - 1] = 1;
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]]; [b[c], b[piv]] = [b[piv], b[c]];
    if (Math.abs(A[c][c]) < 1e-14) continue;
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; if (f) { for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; } }
  }
  return b.map((x, i) => (Math.abs(A[i][i]) > 1e-14 ? Math.max(0, x / A[i][i]) : 0));
}
/** Entropy rate Σ π_i H(P_i·) in bits. */
export const markovRate = (P, pi) => sum(P.map((row, i) => pi[i] * H(row)));
/** μ ↦ μP. */
export const stepDist = (mu, P) => P[0].map((_, j) => sum(mu.map((m, i) => m * P[i][j])));
/** Sample an index from a pmf given u ∈ [0,1). */
export function pick(p, u) { let a = 0; for (let i = 0; i < p.length; i++) { a += p[i]; if (u < a) return i; } return p.length - 1; }
