// Quantum Mechanics — Chapter 4: helpers shared by ch04.js and ch04-b.js.
// Oscillator units throughout: ħ = m = ω = 1, so x is measured in √(ħ/mω), p in √(mħω), energy in ħω,
// H = ½(p² + x²), a = (x + ip)/√2, and ψ_n(x) = (2ⁿ n! √π)^{−1/2} H_n(x) e^{−x²/2} with E_n = n + ½.
// The chapter reuses the wave-function drawing language of chapter 3 (phase colours, level diagrams).
export { TAU, grid, normSq, normalize, interp, phaseLUT, drawPsi, drawReal, phaseWheel, levelDiagram, numerov, countNodes, clockSim, fz, sub, FAMILY } from './ch03.shared.js';
export { moments, toMomentum } from './ch02.shared.js';

const PI14 = Math.PI ** -0.25;

/** The normalized Hermite functions ψ_0 … ψ_{N−1} at one point X (stable three-term recurrence; no factorials). */
export function hermiteAt(X, N, out = new Float64Array(N)) {
  out[0] = PI14 * Math.exp(-0.5 * X * X);
  if (N > 1) out[1] = Math.SQRT2 * X * out[0];
  for (let n = 1; n < N - 1; n++) out[n + 1] = Math.sqrt(2 / (n + 1)) * X * out[n] - Math.sqrt(n / (n + 1)) * out[n - 1];
  return out;
}
/** The Hermite functions ψ_0 … ψ_{N−1} sampled on the array x: an array of N Float64Arrays. */
export function hermiteFns(x, N) {
  const n = x.length, out = Array.from({ length: N }, () => new Float64Array(n)), tmp = new Float64Array(N);
  for (let i = 0; i < n; i++) { hermiteAt(x[i], N, tmp); for (let k = 0; k < N; k++) out[k][i] = tmp[k]; }
  return out;
}
/** Coefficients of H_n(ξ) (physicists'), ascending powers: H_0 = 1, H_1 = 2ξ, H_{n+1} = 2ξH_n − 2nH_{n−1}. */
export function hermitePoly(n) {
  let a = [1], b = [0, 2]; if (n === 0) return a;
  for (let k = 1; k < n; k++) { const c = new Array(k + 2).fill(0); for (let j = 0; j <= k; j++) c[j + 1] += 2 * b[j]; for (let j = 0; j < a.length; j++) c[j] -= 2 * k * a[j]; a = b; b = c; }
  return b;
}
/** TeX for H_n(ξ). */
export function hermiteTeX(n, v = 'x') {
  const c = hermitePoly(n), parts = [];
  for (let j = c.length - 1; j >= 0; j--) {
    if (!c[j]) continue;
    const a = Math.abs(c[j]), sg = c[j] < 0 ? '-' : parts.length ? '+' : '';
    const coef = a === 1 && j > 0 ? '' : String(a), pw = j === 0 ? '' : j === 1 ? v : `${v}^{${j}}`;
    parts.push(`${sg}${coef}${pw}`);
  }
  return parts.join('');
}

/** Coherent-state amplitudes c_n = e^{−|α|²/2} αⁿ/√n! for n < N: {re, im} (α = ar + i·ai). */
export function coherentCoeffs(ar, ai, N) {
  const re = new Float64Array(N), im = new Float64Array(N);
  re[0] = Math.exp(-0.5 * (ar * ar + ai * ai));
  for (let n = 0; n < N - 1; n++) { const s = 1 / Math.sqrt(n + 1); re[n + 1] = (re[n] * ar - im[n] * ai) * s; im[n + 1] = (re[n] * ai + im[n] * ar) * s; }
  return { re, im };
}
/** Coefficients c_n = ∫ψ_n ψ dx of a grid function (re, im) on the Hermite functions phi (sampled on the same grid). */
export function project(phi, re, im, dx) {
  const N = phi.length, cr = new Float64Array(N), ci = new Float64Array(N);
  for (let k = 0; k < N; k++) { const p = phi[k]; let a = 0, b = 0; for (let i = 0; i < p.length; i++) { a += p[i] * re[i]; b += p[i] * (im ? im[i] : 0); } cr[k] = a * dx; ci[k] = b * dx; }
  return { re: cr, im: ci };
}
/** Σ_n c_n e^{−i(n+½)t} ψ_n on the grid (the exact oscillator evolution of a finite expansion): {re, im}. */
export function evolve(phi, cr, ci, t, half = true) {
  const n = phi[0].length, re = new Float64Array(n), im = new Float64Array(n);
  for (let k = 0; k < phi.length; k++) {
    if (!cr[k] && !ci[k]) continue;
    const ph = -(k + (half ? 0.5 : 0)) * t, c = Math.cos(ph), s = Math.sin(ph), a = cr[k] * c - ci[k] * s, b = cr[k] * s + ci[k] * c, p = phi[k];
    for (let i = 0; i < n; i++) { re[i] += a * p[i]; im[i] += b * p[i]; }
  }
  return { re, im };
}
/** Coefficients after time t: c_n e^{−i(n+½)t}. */
export function evolveCoeffs(cr, ci, t) {
  const N = cr.length, re = new Float64Array(N), im = new Float64Array(N);
  for (let k = 0; k < N; k++) { const ph = -(k + 0.5) * t, c = Math.cos(ph), s = Math.sin(ph); re[k] = cr[k] * c - ci[k] * s; im[k] = cr[k] * s + ci[k] * c; }
  return { re, im };
}

/** ψ' by fourth-order central differences (one-sided second order at the ends). */
export function deriv(y, dx) {
  const n = y.length, d = new Float64Array(n);
  for (let i = 2; i < n - 2; i++) d[i] = (y[i - 2] - 8 * y[i - 1] + 8 * y[i + 1] - y[i + 2]) / (12 * dx);
  d[1] = (y[2] - y[0]) / (2 * dx); d[n - 2] = (y[n - 1] - y[n - 3]) / (2 * dx);
  d[0] = (y[1] - y[0]) / dx; d[n - 1] = (y[n - 1] - y[n - 2]) / dx;
  return d;
}
/** The ladder operators applied numerically to a real grid function: a₊y = (xy − y')/√2 (raise = true), a₋y = (xy + y')/√2. */
export function ladder(x, y, raise) {
  const n = y.length, d = deriv(y, x[1] - x[0]), out = new Float64Array(n), s = raise ? -1 : 1;
  for (let i = 0; i < n; i++) out[i] = (x[i] * y[i] + s * d[i]) / Math.SQRT2;
  return out;
}

/**
 * Wigner function W(x, p) = (1/π)∫ψ̄(x+y)ψ(x−y)e^{2ipy}dy (ħ = 1) of a grid function, by direct quadrature on the grid
 * (y = j·dx, so x ± y stay on grid points). Rows every `step` grid points; ps = momentum samples.
 * Returns {W (Float64Array, row-major [row][k]), xs, ps, nx, np, min, max} — ∫∫W dx dp = 1.
 */
export function wigner(x, re, im, ps, step = 2) {
  const n = x.length, dx = x[1] - x[0], np = ps.length;
  let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, re[i] * re[i] + im[i] * im[i]);
  let lo = 0, hi = n - 1; while (lo < hi && re[lo] ** 2 + im[lo] ** 2 < 1e-9 * mx) lo++; while (hi > lo && re[hi] ** 2 + im[hi] ** 2 < 1e-9 * mx) hi--;
  const J = Math.ceil((hi - lo) / 2) + 2, C = new Float64Array(np * J), S = new Float64Array(np * J);
  for (let k = 0; k < np; k++) for (let j = 0; j < J; j++) { const a = 2 * ps[k] * j * dx; C[k * J + j] = Math.cos(a); S[k * J + j] = Math.sin(a); }
  const rows = []; for (let i = 0; i < n; i += step) rows.push(i);
  const nx = rows.length, W = new Float64Array(nx * np), gr = new Float64Array(J), gi = new Float64Array(J);
  let wmin = 0, wmax = 0;
  for (let r = 0; r < nx; r++) {
    const i = rows[r], jm = Math.min(i - lo, hi - i, J - 1);
    if (jm < 0) continue;
    for (let j = 0; j <= jm; j++) { const a = re[i + j], b = im[i + j], c = re[i - j], d = im[i - j]; gr[j] = a * c + b * d; gi[j] = a * d - b * c; }
    for (let k = 0; k < np; k++) {
      let s = gr[0]; const o = k * J;
      for (let j = 1; j <= jm; j++) s += 2 * (gr[j] * C[o + j] - gi[j] * S[o + j]);
      const w = (s * dx) / Math.PI; W[r * np + k] = w; if (w < wmin) wmin = w; if (w > wmax) wmax = w;
    }
  }
  return { W, xs: rows.map((i) => x[i]), ps, nx, np, min: wmin, max: wmax };
}
/** Husimi Q(x, p) = |⟨β|ψ⟩|²/π with β = (x + ip)/√2, from Fock amplitudes c_n: e^{−|β|²}/π · |Σ c_n β̄ⁿ/√n!|². */
export function husimi(cr, ci, X, P) {
  const br = X / Math.SQRT2, bi = -P / Math.SQRT2; // β̄
  let tr = 1, ti = 0, sr = 0, si = 0;
  for (let n = 0; n < cr.length; n++) {
    sr += cr[n] * tr - ci[n] * ti; si += cr[n] * ti + ci[n] * tr;
    const f = 1 / Math.sqrt(n + 1), a = (tr * br - ti * bi) * f; ti = (tr * bi + ti * br) * f; tr = a;
  }
  return (Math.exp(-0.5 * (X * X + P * P)) * (sr * sr + si * si)) / Math.PI;
}
/**
 * Paint a phase-space quasi-probability on stage s: positive values in `pos`, negative in `neg`, scaled by `top`
 * (default 1/π, the largest value any Wigner function can take). f(X, P) → value; o: {key, res, top, gamma}.
 */
export function paintPhase(v, s, f, o = {}) {
  const top = o.top ?? 1 / Math.PI, g = o.gamma ?? 0.75, pos = o.pos || 'accent', neg = o.neg || 'red';
  s.raster((X, P) => { const w = f(X, P); if (w == null || !Number.isFinite(w)) return null; const u = Math.min(1, Math.abs(w) / top) ** g; return w >= 0 ? v.ramp(u, pos) : v.ramp(u, neg); }, { res: o.res ?? 2, key: o.key });
}
/** Bilinear lookup into a wigner() result. */
export function wignerAt(Wd, X, P) {
  const { xs, ps, nx, np, W } = Wd, fx = ((X - xs[0]) / (xs[nx - 1] - xs[0])) * (nx - 1), fp = ((P - ps[0]) / (ps[np - 1] - ps[0])) * (np - 1);
  if (fx < 0 || fp < 0 || fx > nx - 1 || fp > np - 1) return 0;
  const i = Math.min(nx - 2, Math.floor(fx)), k = Math.min(np - 2, Math.floor(fp)), a = fx - i, b = fp - k;
  return (1 - a) * ((1 - b) * W[i * np + k] + b * W[i * np + k + 1]) + a * ((1 - b) * W[(i + 1) * np + k] + b * W[(i + 1) * np + k + 1]);
}
/** The 1σ ellipse {z : (z − μ)ᵀ Σ⁻¹ (z − μ) = k²} of a 2×2 covariance [[sxx, sxp], [sxp, spp]] around (mx, mp), as a point list. */
export function ellipsePts(mx, mp, sxx, spp, sxp, k = 1, n = 120) {
  const tr = sxx + spp, det = sxx * spp - sxp * sxp, d = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + d, l2 = Math.max(0, tr / 2 - d), th = 0.5 * Math.atan2(2 * sxp, sxx - spp);
  const c = Math.cos(th), s = Math.sin(th), a = k * Math.sqrt(l1), b = k * Math.sqrt(l2), pts = [];
  for (let i = 0; i <= n; i++) { const u = (i / n) * 2 * Math.PI, X = a * Math.cos(u), Y = b * Math.sin(u); pts.push([mx + c * X - s * Y, mp + s * X + c * Y]); }
  return pts;
}
/** Full second moments of ψ on a grid (ħ = 1): {mx, mp, sxx, spp, sxp} with the symmetrized ⟨xp + px⟩/2 − ⟨x⟩⟨p⟩. */
export function covariance(x, re, im) {
  const n = x.length, dx = x[1] - x[0], dr = deriv(re, dx), di = deriv(im, dx);
  let N = 0, m1 = 0, m2 = 0, p1 = 0, p2 = 0, xp = 0;
  for (let i = 0; i < n; i++) {
    const r = re[i] * re[i] + im[i] * im[i]; N += r; m1 += r * x[i]; m2 += r * x[i] * x[i];
    const j = re[i] * di[i] - im[i] * dr[i]; // Im(ψ̄ψ') = local momentum density
    p1 += j; p2 += dr[i] * dr[i] + di[i] * di[i]; xp += x[i] * j;
  }
  const mx = m1 / N, mp = p1 / N;
  return { mx, mp, sxx: m2 / N - mx * mx, spp: p2 / N - mp * mp, sxp: xp / N - mx * mp, N: N * dx };
}
/** Poisson pmf λⁿe^{−λ}/n! (log-space). */
export const poisson = (lam, n) => (lam === 0 ? (n === 0 ? 1 : 0) : Math.exp(n * Math.log(lam) - lam - lgammaInt(n + 1)));
function lgammaInt(m) { let s = 0; for (let k = 2; k < m; k++) s += Math.log(k); return s; }
