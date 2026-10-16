// Finance — Chapter 3: helpers and data shared by ch03.js and ch03-b.js (plain functions, no runtime access).
//
// DATA. The "real" pictures of this chapter use the monthly returns of the ten industry portfolios (and the market and the
// one-month T-bill rate) from Kenneth R. French's Data Library, 1963-07 … 2026-08, stored in ch04.shared.js. Means and
// covariances are in-sample estimates: monthly values times 12 (means) and 12 (covariances), i.e. annualised arithmetic means
// and variances, in decimals (0.12 = 12% a year).
export { clamp, pct, fx, sg, bp, money, usd, dl, pctTicks } from './ch02.shared.js';
export { data, mean, sdev, ols, excess, solveLin, invert, matVec, dot, frontierConsts, frontierSd, frontierWeights, tangency, covRho, quad, rng, fanLabels, IND_NAMES, IND_LONG, monthLabel, idxOf, ymOf } from './ch04.shared.js';
import { data, mean, solveLin, matVec, dot, quad, frontierConsts, IND_NAMES } from './ch04.shared.js';

/** Total market return series (Mkt−RF + RF), monthly decimals. */
export function marketTotal() { const d = data(); return d.mkt.map((x, i) => x + d.rf[i]); }
/** Sample covariance matrix (monthly) of series (array of arrays) over [i0, i1). */
export function covOf(series, i0 = 0, i1 = series[0].length) {
  const n = series.length, m = series.map((s) => mean(s, i0, i1)), T = i1 - i0;
  const C = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let a = 0; a < n; a++) for (let b = a; b < n; b++) { let s = 0; for (let i = i0; i < i1; i++) s += (series[a][i] - m[a]) * (series[b][i] - m[b]); C[a][b] = C[b][a] = s / (T - 1); }
  return C;
}
/** Annualised inputs of industry subset `names` (indices into IND_NAMES) over months [i0, i1): {names, mu, S, sd}. */
export function universe(idx, i0 = 0, i1 = data().n) {
  const d = data(), ser = idx.map((k) => d.ind[k]);
  const mu = ser.map((s) => 12 * mean(s, i0, i1)), S = covOf(ser, i0, i1).map((r) => r.map((x) => 12 * x));
  return { names: idx.map((k) => IND_NAMES[k]), idx, mu, S, sd: S.map((r, i) => Math.sqrt(r[i])) };
}

/** All non-empty-or-size≥2 subsets of 0..n−1 as index arrays. */
function subsets(n) { const out = []; for (let m = 1; m < 1 << n; m++) { const a = []; for (let i = 0; i < n; i++) if (m & (1 << i)) a.push(i); out.push(a); } return out; }
const SUBS = {};
/**
 * Minimum-variance portfolio with mean E and weights ≥ 0 summing to 1, by enumerating active sets (n ≤ ~8).
 * → weights array or null if E is outside [min μ, max μ].
 */
export function minVarLong(E, mu, S) {
  const n = mu.length; if (!SUBS[n]) SUBS[n] = subsets(n);
  let best = null, bv = Infinity;
  for (const A of SUBS[n]) {
    if (A.length === 1) { if (Math.abs(mu[A[0]] - E) < 1e-9) { const w = new Array(n).fill(0); w[A[0]] = 1; const v = S[A[0]][A[0]]; if (v < bv) { bv = v; best = w; } } continue; }
    const k = A.length, K = Array.from({ length: k + 2 }, () => new Array(k + 2).fill(0)), r = new Array(k + 2).fill(0);
    for (let a = 0; a < k; a++) { for (let b = 0; b < k; b++) K[a][b] = 2 * S[A[a]][A[b]]; K[a][k] = 1; K[a][k + 1] = mu[A[a]]; K[k][a] = 1; K[k + 1][a] = mu[A[a]]; }
    r[k] = 1; r[k + 1] = E;
    const z = solveLin(K, r); if (!z) continue;
    if (z.slice(0, k).some((x) => x < -1e-9)) continue;
    const w = new Array(n).fill(0); A.forEach((j, a) => { w[j] = Math.max(0, z[a]); });
    const v = quad(w, S); if (v < bv - 1e-15) { bv = v; best = w; }
  }
  return best;
}
/** Long-only efficient frontier: points {E, w, sd} for E from the minimum-variance portfolio up to max μ. */
export function longFrontier(mu, S, n = 90) {
  const lo = Math.min(...mu), hi = Math.max(...mu); let e0 = lo, bv = Infinity;
  for (let k = 0; k <= 160; k++) { const E = lo + ((hi - lo) * k) / 160, w = minVarLong(E, mu, S); if (w) { const v = quad(w, S); if (v < bv) { bv = v; e0 = E; } } }
  const out = [];
  for (let k = 0; k <= n; k++) { const E = e0 + ((hi - e0) * k) / n, w = minVarLong(E, mu, S); if (w) out.push({ E, w, sd: Math.sqrt(quad(w, S)) }); }
  return out;
}
/** Unconstrained frontier points {E, w, sd} for E in [eLo, eHi] (weights sum to 1, shorting allowed). */
export function freeFrontier(mu, S, eLo, eHi, n = 120) {
  const F = frontierConsts(mu, S); if (!F) return { F: null, pts: [] };
  const D = F.a * F.c - F.b * F.b, pts = [];
  for (let k = 0; k <= n; k++) {
    const E = eLo + ((eHi - eLo) * k) / n, l = (F.c - F.b * E) / D, g = (F.a * E - F.b) / D;
    const w = F.S1.map((x, i) => l * x + g * F.Sm[i]);
    pts.push({ E, w, sd: Math.sqrt(Math.max(0, quad(w, S))) });
  }
  return { F, pts };
}
/** Weights of the unconstrained minimum-variance portfolio: Σ⁻¹1 / 1'Σ⁻¹1. */
export function gmv(S) { const z = solveLin(S, S.map(() => 1)); if (!z) return null; const t = z.reduce((a, b) => a + b, 0); return z.map((x) => x / t); }
/** Euclidean projection of x onto the simplex {w ≥ 0, Σw = 1}. */
export function projSimplex(x) {
  const u = [...x].sort((a, b) => b - a); let css = 0, rho = 0, th = 0;
  for (let i = 0; i < u.length; i++) { css += u[i]; const t = (css - 1) / (i + 1); if (u[i] - t > 0) { rho = i; th = t; } }
  return x.map((z) => Math.max(0, z - th));
}
/** Long-only mean–variance weights: maximise w'μ − (γ/2) w'Σw over the simplex (projected gradient). */
export function mvLong(mu, S, gamma, iters = 250) {
  const n = mu.length; let w = new Array(n).fill(1 / n);
  const L = gamma * Math.max(...S.map((r, i) => r.reduce((s, x) => s + Math.abs(x), 0))), step = 1 / L;
  for (let it = 0; it < iters; it++) { const g = matVec(S, w); w = projSimplex(w.map((x, i) => x + step * (mu[i] - gamma * g[i]))); }
  return w;
}
