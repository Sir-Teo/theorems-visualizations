// Causal Inference — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
//
// House style (as in chapter 1): populations are simulated, so the table with BOTH potential outcomes exists; the finite
// population is held FIXED and only the assignment is random ("re-randomization", Neyman's and Fisher's sampling frame).
export * from './ch01.shared.js';
import { rng, mean, logistic, binDensity, barsH } from './ch01.shared.js';

/** Sample variance (n − 1). */
export function svar(a) { const n = a.length; if (n < 2) return 0; let m = 0; for (let i = 0; i < n; i++) m += a[i]; m /= n; let s = 0; for (let i = 0; i < n; i++) s += (a[i] - m) ** 2; return s / (n - 1); }

/** Fill A (Uint8Array) with exactly m ones, uniformly at random (partial Fisher–Yates on the scratch array idx). */
export function randAssign(r, n, m, A, idx) {
  for (let i = 0; i < n; i++) idx[i] = i;
  A.fill(0);
  for (let i = 0; i < m; i++) { const j = i + Math.floor(r() * (n - i)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; A[idx[i]] = 1; }
  return A;
}
/** Arm sizes, means and variances of y under assignment A. */
export function armStats(y, A) {
  let n1 = 0, n0 = 0, s1 = 0, s0 = 0;
  for (let i = 0; i < y.length; i++) { if (A[i]) { n1++; s1 += y[i]; } else { n0++; s0 += y[i]; } }
  const m1 = n1 ? s1 / n1 : NaN, m0 = n0 ? s0 / n0 : NaN;
  let q1 = 0, q0 = 0;
  for (let i = 0; i < y.length; i++) { if (A[i]) q1 += (y[i] - m1) ** 2; else q0 += (y[i] - m0) ** 2; }
  return { n1, n0, m1, m0, v1: n1 > 1 ? q1 / (n1 - 1) : NaN, v0: n0 > 1 ? q0 / (n0 - 1) : NaN };
}
/** Difference in means of the observed outcome y under A. */
export function diffMeans(y, A) { const a = armStats(y, A); return a.m1 - a.m0; }

/**
 * A finite population with both potential outcomes fixed: Y0 = 50 + 8·g (g standardized normal draws),
 * individual effect τ_i = tau + h·z_i (z standardized, independent of Y0), Y1 = Y0 + τ_i.
 * h = 0 is a constant effect. Also returns the finite-population variances S1², S0², Sτ² (denominator N − 1).
 */
export function finitePop(n, seed, h, tau = 5, o = {}) {
  const { base = 50, sd = 8 } = o;
  const r = rng(seed * 977 + 5), g = [], z = [];
  for (let i = 0; i < n; i++) { g.push(r.normal()); z.push(r.normal()); }
  const std = (a) => { const m = mean(a), s = Math.sqrt(svar(a)) || 1; return a.map((q) => (q - m) / s); };
  const G = std(g), Z = std(z);
  const y0 = new Float64Array(n), y1 = new Float64Array(n), t = new Float64Array(n);
  for (let i = 0; i < n; i++) { y0[i] = base + sd * G[i]; t[i] = tau + h * Z[i]; y1[i] = y0[i] + t[i]; }
  return { n, y0, y1, t, ate: mean(t), S0: svar(y0), S1: svar(y1), St: svar(t) };
}
/** Exact variance of the difference in means under complete randomization of m of n units (Neyman 1923). */
export const exactVar = (P, m) => P.S1 / m + P.S0 / (P.n - m) - P.St / P.n;

/** Run fn(A) over every assignment of exactly m of n ≤ 20 units (A is reused). Returns the number of assignments. */
export function forEachAssign(n, m, fn) {
  const A = new Uint8Array(n); let c = 0;
  for (let mask = 0; mask < (1 << n); mask++) {
    let pc = 0, q = mask; while (q) { pc += q & 1; q >>= 1; }
    if (pc !== m) continue;
    for (let i = 0; i < n; i++) A[i] = (mask >> i) & 1;
    fn(A); c++;
  }
  return c;
}
export function choose(n, k) { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return Math.round(c); }

/** Histogram panel: draws one or several series of proportions on a common grid and fits the view. */
export function histPanel(s, series, lo, hi, nb = 40) {
  const hs = series.map((q) => binDensity(q.vals, lo, hi, nb));
  let mx = 0; for (const h of hs) for (const c of h.counts) if (c > mx) mx = c;
  s.setView([lo, hi], [0, (mx || 1) * 1.2]);
  hs.forEach((h, i) => barsH(s, h, { color: series[i].color, fillAlpha: series[i].fillAlpha ?? 0.28, width: series[i].width ?? 1.6 }));
  return hs;
}

/**
 * Binary confounder L, binary treatment A, binary potential outcomes (coupled through one uniform draw per person, so
 * Y^1 ≥ Y^0 when rr ≥ 1 and Y^1 ≤ Y^0 when rr ≤ 1). P(L=1) = pL; P(A=1 | L=l) = logistic(c·(2l − 1));
 * baseline risks p0 = [0.10, 0.50]; Y^1 risk = min(0.97, p0·rr).
 */
export function confPop(n, seed, { pL = 0.3, c = 1.5, rr = 0.7 } = {}) {
  const r = rng(seed * 6007 + 11), L = new Uint8Array(n), A = new Uint8Array(n), Y0 = new Uint8Array(n), Y1 = new Uint8Array(n), Y = new Uint8Array(n);
  const p0 = [0.10, 0.50], p1 = [Math.min(0.97, p0[0] * rr), Math.min(0.97, p0[1] * rr)];
  for (let i = 0; i < n; i++) {
    L[i] = r() < pL ? 1 : 0; A[i] = r() < logistic(c * (2 * L[i] - 1)) ? 1 : 0;
    const u = r(); Y0[i] = u < p0[L[i]] ? 1 : 0; Y1[i] = u < p1[L[i]] ? 1 : 0; Y[i] = A[i] ? Y1[i] : Y0[i];
  }
  const cnt = [[0, 0], [0, 0]], ev = [[0, 0], [0, 0]]; // [l][a]
  let t1 = 0, t0 = 0;
  for (let i = 0; i < n; i++) { cnt[L[i]][A[i]]++; ev[L[i]][A[i]] += Y[i]; t1 += Y1[i]; t0 += Y0[i]; }
  return { n, L, A, Y0, Y1, Y, cnt, ev, truth1: t1 / n, truth0: t0 / n };
}

/** Solve the small dense system M x = b (Gaussian elimination, partial pivoting). */
export function solveSmall(M, b) {
  const n = b.length, a = M.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    [a[c], a[p]] = [a[p], a[c]];
    for (let r = c + 1; r < n; r++) { const f = a[r][c] / a[c][c]; for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = a[i][n]; for (let k = i + 1; k < n; k++) s -= a[i][k] * x[k]; x[i] = s / a[i][i]; }
  return x;
}
/** Least squares of y on the columns of X (rows of regressors). Returns the coefficient vector. */
export function ols(X, y) {
  const p = X[0].length, XtX = Array.from({ length: p }, () => new Array(p).fill(0)), Xty = new Array(p).fill(0);
  for (let i = 0; i < X.length; i++) for (let a = 0; a < p; a++) { Xty[a] += X[i][a] * y[i]; for (let b = 0; b < p; b++) XtX[a][b] += X[i][a] * X[i][b]; }
  return solveSmall(XtX, Xty);
}
/** Logistic regression of a on (1, l) by Newton's method; returns [b0, b1]. */
export function fitLogit(l, a) {
  let b0 = 0, b1 = 0;
  for (let it = 0; it < 30; it++) {
    let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
    for (let i = 0; i < l.length; i++) { const p = logistic(b0 + b1 * l[i]), w = p * (1 - p), e = a[i] - p; g0 += e; g1 += e * l[i]; h00 += w; h01 += w * l[i]; h11 += w * l[i] * l[i]; }
    const det = h00 * h11 - h01 * h01; if (Math.abs(det) < 1e-12) break;
    const d0 = (h11 * g0 - h01 * g1) / det, d1 = (-h01 * g0 + h00 * g1) / det;
    b0 += d0; b1 += d1; if (Math.abs(d0) + Math.abs(d1) < 1e-10) break;
  }
  return [b0, b1];
}
export const normalPdf = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
