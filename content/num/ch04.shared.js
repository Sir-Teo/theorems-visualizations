// Numerical Analysis — Chapter 4 (approximation): helpers shared by ch04*.js.
// Re-exports the earlier chapter's helpers. Everything is ordinary double-precision arithmetic.
export * from './ch03.shared.js';
import { chebPts, baryW, bary, chebCoeffs, T, solveGE } from './ch03.shared.js';

export const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => a * Math.pow(b / a, i / (n - 1)));

/** Max |f - g| over m+1 equispaced points of [-1,1]. */
export function supDiff(f, g, m = 800) { let e = 0; for (let i = 0; i <= m; i++) { const x = -1 + 2 * i / m; e = Math.max(e, Math.abs(f(x) - g(x))); } return e; }

/** Chebyshev-interpolant of f of degree n as a function (barycentric, Chebyshev points). */
export function chebInterp(f, n) { const xs = chebPts(n), w = baryW(xs), ys = xs.map(f); return (x) => bary(xs, w, ys, x); }
/** Chebyshev coefficients a_0..a_n of the degree-n interpolant of f (so |a_k| for k<<n approximates the series coefficients). */
export const chebCoef = (f, n) => chebCoeffs(chebPts(n).map(f));
/** Evaluate sum a_k T_k(x) (Clenshaw). */
export function clenshaw(a, x, K = a.length - 1) {
  let b1 = 0, b2 = 0;
  for (let k = K; k >= 1; k--) { const t = 2 * x * b1 - b2 + a[k]; b2 = b1; b1 = t; }
  return x * b1 - b2 + a[0];
}

/** Gauss–Legendre nodes and weights on [-1,1] (Newton on P_n). */
const glCache = {};
export function gaussLegendre(n) {
  if (glCache[n]) return glCache[n];
  const x = new Array(n), w = new Array(n);
  for (let i = 0; i < n; i++) {
    let z = Math.cos(Math.PI * (i + 0.75) / (n + 0.5)), dp = 1;
    for (let it = 0; it < 60; it++) {
      let p0 = 1, p1 = z;
      for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * z * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; }
      dp = n * (z * p1 - p0) / (z * z - 1);
      const dz = p1 / dp; z -= dz; if (Math.abs(dz) < 1e-15) break;
    }
    x[n - 1 - i] = z; w[n - 1 - i] = 2 / ((1 - z * z) * dp * dp);
  }
  return (glCache[n] = { x, w });
}
/** Legendre polynomials P_0..P_K at x. */
export function legendreAll(K, x) { const P = [1, x]; for (let k = 2; k <= K; k++) P.push(((2 * k - 1) * x * P[k - 1] - (k - 1) * P[k - 2]) / k); return P.slice(0, K + 1); }
/** Legendre coefficients c_k = (2k+1)/2 ∫ f P_k, k=0..K, by Gauss–Legendre quadrature with N points. */
export function legendreCoef(f, K, N = 600) {
  const { x, w } = gaussLegendre(N), c = new Array(K + 1).fill(0);
  for (let i = 0; i < N; i++) { const fx = f(x[i]) * w[i], P = legendreAll(K, x[i]); for (let k = 0; k <= K; k++) c[k] += fx * P[k]; }
  return c.map((s, k) => s * (2 * k + 1) / 2);
}
export function legendreEval(c, x, K = c.length - 1) { const P = legendreAll(K, x); let s = 0; for (let k = 0; k <= K; k++) s += c[k] * P[k]; return s; }

/**
 * Remez exchange for the best degree-n polynomial approximation of f on [-1,1].
 * Returns the history of iterations: {refs, h, p (function), emax (max |f-p| on a fine grid), ext (new extrema)}.
 */
export function remez(f, n, { iters = 12, init = 'cheb', M = 1500 } = {}) {
  let refs = init === 'equi' ? Array.from({ length: n + 2 }, (_, j) => -1 + 2 * j / (n + 1)) : chebPts(n + 1);
  // a tiny asymmetric nudge keeps even/odd functions from starting at a degenerate (h = 0) reference
  refs = refs.map((x, j) => x + 0.012 * (1 - x * x) * Math.sin(1.7 * j + 0.3));
  const grid = Array.from({ length: M + 1 }, (_, i) => -Math.cos(Math.PI * i / M));
  const hist = [];
  for (let it = 0; it < iters; it++) {
    const m = n + 2, w = refs.map((xj, j) => { let p = 1; for (let k = 0; k < m; k++) if (k !== j) p *= 2 * (xj - refs[k]); return 1 / p; });
    let num = 0, den = 0; for (let j = 0; j < m; j++) { num += w[j] * f(refs[j]); den += w[j] * (j % 2 ? -1 : 1); }
    const h = num / den;
    const xs = refs.slice(0, n + 1), ys = xs.map((x, j) => f(x) - (j % 2 ? -1 : 1) * h), wb = baryW(xs);
    const p = (x) => bary(xs, wb, ys, x);
    const e = grid.map((x) => f(x) - p(x));
    let emax = 0; for (const v of e) emax = Math.max(emax, Math.abs(v));
    // local extrema of e (including endpoints), refined by a parabola through three grid points
    const cand = [];
    for (let i = 0; i <= M; i++) {
      const a = Math.abs(e[i]), l = i > 0 ? Math.abs(e[i - 1]) : -1, r = i < M ? Math.abs(e[i + 1]) : -1;
      if (a >= l && a >= r && a > 0) {
        let x = grid[i], v = e[i];
        if (i > 0 && i < M) { const y0 = e[i - 1], y1 = e[i], y2 = e[i + 1], d = y0 - 2 * y1 + y2; if (d !== 0) { const t = 0.5 * (y0 - y2) / d; if (Math.abs(t) < 1) { x = grid[i] + t * (grid[i + 1] - grid[i - 1]) / 2; v = f(x) - p(x); if (Math.abs(v) < Math.abs(e[i])) { x = grid[i]; v = e[i]; } } } }
        cand.push({ x, v });
      }
    }
    // enforce alternating signs, keeping the larger of same-sign neighbours
    const alt = [];
    for (const c of cand) { const L = alt[alt.length - 1]; if (L && Math.sign(L.v) === Math.sign(c.v)) { if (Math.abs(c.v) > Math.abs(L.v)) alt[alt.length - 1] = c; } else alt.push(c); }
    while (alt.length > m) { if (Math.abs(alt[0].v) < Math.abs(alt[alt.length - 1].v)) alt.shift(); else alt.pop(); }
    hist.push({ refs: refs.slice(), h, p, emax, ext: alt.map((c) => c.x), nalt: alt.length });
    if (alt.length < m) break;
    const moved = alt.reduce((s, c, j) => Math.max(s, Math.abs(c.x - refs[j])), 0);
    refs = alt.map((c) => c.x);
    if (moved < 1e-12 || (emax - Math.abs(h)) < 1e-9 * emax) { if (it > 0) { /* converged */ } }
    if (emax - Math.abs(h) < 1e-10 * emax) break;
  }
  return hist;
}
export const bestErr = (f, n, o) => { const H = remez(f, n, o); return H[H.length - 1].emax; };

/** Padé approximant [L/M] from Taylor coefficients c (c.length >= L+M+1): returns {p, q} (ascending coefficients, q[0]=1) or null. */
export function pade(c, L, M) {
  if (M === 0) return { p: c.slice(0, L + 1), q: [1] };
  const A = [], b = [];
  for (let i = 1; i <= M; i++) { const row = []; for (let j = 1; j <= M; j++) { const k = L + i - j; row.push(k >= 0 ? c[k] : 0); } A.push(row); b.push(-c[L + i]); }
  const qs = solveGE(A, b); if (!qs) return null;
  const q = [1, ...qs], p = [];
  for (let i = 0; i <= L; i++) { let s = 0; for (let j = 0; j <= Math.min(i, M); j++) s += q[j] * c[i - j]; p.push(s); }
  return { p, q };
}
export const polyEvalAsc = (a, x) => { let r = 0; for (let i = a.length - 1; i >= 0; i--) r = r * x + a[i]; return r; };
