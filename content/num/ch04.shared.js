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
/** Best sup error E*_n(f): the smallest max-error seen, accepted only if it is within 0.1% of the level |h| (else NaN). */
export const bestErr = (f, n, o) => { const H = remez(f, n, o); let b = H[0]; for (const s of H) if (s.emax < b.emax) b = s; return (b.emax - Math.abs(b.h)) < 1e-3 * b.emax ? b.emax : NaN; };

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

/** Best type-(n,n) rational approximation to exp(-x) on [0,∞) (Chebyshev/minimax), by a Lawson start and a rational Remez (Newton) polish.
 *  Works on t = (x-c)/(x+c) ∈ [-1,1] with Chebyshev bases. Returns {E, r (function of x), poles (as [re,im] pairs), n}. Reliable for n ≤ 8. */
const _Tm = (k, t) => Math.cos(k * Math.acos(Math.max(-1, Math.min(1, t))));
export function rationalExpBest(n, svd, c = 3, NT = 700) {
  const ts = Array.from({ length: NT + 1 }, (_, i) => -Math.cos(Math.PI * i / NT));
  const F = (t) => (t >= 1 ? 0 : Math.exp(-c * (1 + t) / (1 - t)));
  const f = ts.map(F);
  const B = ts.map((t) => Array.from({ length: n + 1 }, (_, k) => _Tm(k, t)));
  const ev = (co, t) => { let s = 0; for (let k = 0; k < co.length; k++) s += co[k] * _Tm(k, t); return s; };
  let w = ts.map(() => 1 / ts.length), qprev = ts.map(() => 1), sol = null, bestE = Infinity;
  for (let it = 0; it < 40; it++) {
    const A = ts.map((t, i) => { const s = Math.sqrt(w[i]) / Math.abs(qprev[i]); return [...B[i].map((b) => b * s), ...B[i].map((b) => -f[i] * b * s)]; });
    const sv = svd(A), k = sv.S.length - 1, v = sv.V.map((r) => r[k]);
    const pc = v.slice(0, n + 1), qc = v.slice(n + 1);
    const qv = B.map((b) => b.reduce((s, x, j) => s + x * qc[j], 0)), pv = B.map((b) => b.reduce((s, x, j) => s + x * pc[j], 0));
    qprev = qv;
    const r = f.map((fi, i) => fi - pv[i] / qv[i]), emax = Math.max(...r.map(Math.abs));
    if (emax < bestE) { bestE = emax; sol = { pc, qc, r }; }
    let sw = 0; w = w.map((wi, i) => { const x = wi * Math.abs(r[i]); sw += x; return x; }); w = w.map((x) => x / sw);
  }
  let { pc, qc, r: err } = sol; const s0 = qc[0]; pc = pc.map((x) => x / s0); qc = qc.map((x) => x / s0);
  const M2 = 2 * n + 2; let E = bestE;
  for (let ex = 0; ex < 25; ex++) {
    const cand = [];
    for (let i = 0; i <= NT; i++) { const a = Math.abs(err[i]), l = i > 0 ? Math.abs(err[i - 1]) : -1, rr = i < NT ? Math.abs(err[i + 1]) : -1; if (a >= l && a >= rr && a > 0) cand.push(i); }
    const alt = [];
    for (const i of cand) { const L = alt[alt.length - 1]; if (L !== undefined && Math.sign(err[L]) === Math.sign(err[i])) { if (Math.abs(err[i]) > Math.abs(err[L])) alt[alt.length - 1] = i; } else alt.push(i); }
    while (alt.length > M2) { if (Math.abs(err[alt[0]]) < Math.abs(err[alt[alt.length - 1]])) alt.shift(); else alt.pop(); }
    if (alt.length < M2) break;
    const rt = alt.map((i) => ts[i]), rf = rt.map(F), sgn0 = Math.sign(err[alt[0]]), sg = rt.map((_, i) => sgn0 * (i % 2 ? -1 : 1));
    let h = Math.abs(err[alt[0]]);
    for (let nw = 0; nw < 8; nw++) {
      const Fv = [], J = [];
      for (let i = 0; i < M2; i++) {
        const qi = ev(qc, rt[i]), pi = ev(pc, rt[i]), g = rf[i] - sg[i] * h; Fv.push(pi - g * qi);
        const row = []; for (let k = 0; k <= n; k++) row.push(_Tm(k, rt[i])); for (let k = 1; k <= n; k++) row.push(-g * _Tm(k, rt[i])); row.push(sg[i] * qi); J.push(row);
      }
      const d = solveGE(J, Fv.map((x) => -x)); if (!d) break;
      for (let k = 0; k <= n; k++) pc[k] += d[k]; for (let k = 1; k <= n; k++) qc[k] += d[n + k]; h += d[2 * n + 1];
      if (Math.max(...d.map(Math.abs)) < 1e-14 * (1 + Math.abs(h))) break;
    }
    err = ts.map((t, i) => f[i] - ev(pc, t) / ev(qc, t));
    E = Math.max(...err.map(Math.abs));
    if (E - Math.abs(h) < 1e-7 * E) break;
  }
  const r = (x) => { const t = (x - c) / (x + c); return ev(pc, t) / ev(qc, t); };
  return { E, r, n, c, pc, qc };
}

/** Chebyshev series coefficients of f (cached by key), from the degree-N interpolant: reliable for k well below N. */
const _coefCache = new Map();
export function seriesCoef(key, f, N = 1000) { if (!_coefCache.has(key)) _coefCache.set(key, chebCoef(f, N)); return _coefCache.get(key); }

/**
 * Carathéodory–Fejér near-best approximation of degree n (Gutknecht–Trefethen construction): takes the dominant eigenpair (λ, u) of the
 * Hankel matrix [a_{n+1+i+j}], builds the CF error curve λ cos((n+1)θ + 2 arg u(e^{iθ})), and keeps the degree-≤n Chebyshev
 * coefficients of f minus that curve. `eigSym` is v.M.eigSym. Returns {lam, p (function), coef}.
 */
export function cfApprox(a, n, eigSym, K = 50) {
  const H = []; for (let i = 0; i < K; i++) { H.push([]); for (let j = 0; j < K; j++) { const k = n + 1 + i + j; H[i].push(k < a.length ? a[k] : 0); } }
  const e = eigSym(H); let bi = 0; e.values.forEach((x, i) => { if (Math.abs(x) > Math.abs(e.values[bi])) bi = i; });
  const lam = e.values[bi], u = e.vectors.map((r) => r[bi]), N = 512, ev = [];
  for (let j = 0; j <= N; j++) {
    const th = Math.PI * j / N; let re = 0, im = 0; for (let k = 0; k < K; k++) { re += u[k] * Math.cos(k * th); im += u[k] * Math.sin(k * th); }
    ev.push(lam * Math.cos((n + 1) * th + 2 * Math.atan2(im, re)));
  }
  const ec = chebCoeffs(ev.slice().reverse());
  const coef = a.slice(0, n + 1).map((x, k) => x - ec[k]);
  return { lam, coef, p: (x) => clenshaw(coef, x), err: (x) => { const th = Math.acos(Math.max(-1, Math.min(1, x))); let re = 0, im = 0; for (let k = 0; k < K; k++) { re += u[k] * Math.cos(k * th); im += u[k] * Math.sin(k * th); } return lam * Math.cos((n + 1) * th + 2 * Math.atan2(im, re)); } };
}

/** Newman's rational approximation to |x| of type (n,n): r(x) = x (p(x) - p(-x)) / (p(x) + p(-x)), p(x) = prod_{k<n} (x + a^k), a = exp(-1/sqrt n). */
export function newmanAbs(n) {
  const a = Math.exp(-1 / Math.sqrt(n)), P = (x) => { let p = 1; for (let k = 0; k < n; k++) p *= x + Math.pow(a, k); return p; };
  return (x) => { const p1 = P(x), p2 = P(-x); return x * (p1 - p2) / (p1 + p2); };
}
