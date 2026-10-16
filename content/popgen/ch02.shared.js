// Population Genetics & Evolution — Chapter 2 (Genetic drift): shared helpers (plain named exports).

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

// log n! table (extended on demand) — exact binomial pmf values without calling lgamma in the hot loop.
const LF = [0, 0];
export function lfact(n) {
  for (let i = LF.length; i <= n; i++) LF.push(LF[i - 1] + Math.log(i));
  return LF[n];
}
/** Binomial pmf C(n,k) p^k (1−p)^(n−k). */
export function binomPmf(n, k, p) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(lfact(n) - lfact(k) - lfact(n - k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}

/** Exact binomial(n, p) draw by inversion, walking outward from the mode (cost ≈ the standard deviation). */
export function binom(r, n, p) {
  if (p <= 0 || n <= 0) return 0;
  if (p >= 1) return n;
  const q = 1 - p, m = Math.min(n, Math.floor((n + 1) * p));
  const pm = binomPmf(n, m, p);
  let u = r() - pm;
  if (u < 0) return m;
  const ratio = p / q;
  let lo = m, hi = m, plo = pm, phi = pm;
  for (;;) {
    if (lo > 0) { plo *= (lo / (n - lo + 1)) / ratio; lo--; u -= plo; if (u < 0) return lo; }
    if (hi < n) { phi *= ((n - hi) / (hi + 1)) * ratio; hi++; u -= phi; if (u < 0) return hi; }
    if (lo === 0 && hi === n) return m;
  }
}

/** Gamma(shape, 1) draw (Marsaglia–Tsang), r.normal() must exist. */
export function gammaDraw(r, shape) {
  if (shape < 1) return gammaDraw(r, shape + 1) * Math.pow(r() || 1e-12, 1 / shape);
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, t;
    do { x = r.normal(); t = 1 + c * x; } while (t <= 0);
    t = t * t * t;
    const u = r();
    if (Math.log(u || 1e-300) < 0.5 * x * x + d - d * t + d * Math.log(t)) return d * t;
  }
}

/** One Wright–Fisher generation on n gene copies with selection on A (relative fitness 1+s) and recurrent mutation. */
export function wfNext(r, n, k, s = 0, u = 0, v = 0) {
  let p = k / n;
  if (s) p = (p * (1 + s)) / (1 + p * s);
  if (u || v) p = p * (1 - u) + (1 - p) * v;
  return binom(r, n, p);
}

/** One neutral WF path: counts of A among n copies for t = 0..T (absorbed paths stay flat). */
export function wfPath(r, n, k0, T, s = 0) {
  const out = new Int32Array(T + 1); out[0] = k0;
  let k = k0;
  for (let t = 1; t <= T; t++) { if (k > 0 && k < n) k = wfNext(r, n, k, s); out[t] = k; }
  return out;
}

/** Run a WF population (n copies, k0 of A) until loss/fixation; returns {t, fixed}. */
export function wfAbsorb(r, n, k0, s = 0, cap = 1e6) {
  let k = k0, t = 0;
  while (k > 0 && k < n && t < cap) { k = wfNext(r, n, k, s); t++; }
  return { t, fixed: k === n };
}

/** Superscript digits for tick labels. */
export function sup(n) { return String(n).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]); }

/** Least-squares slope and intercept of y on x. */
export function lsq(xs, ys) {
  const n = xs.length; let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
  const d = n * sxx - sx * sx;
  const slope = d ? (n * sxy - sx * sy) / d : 0;
  return { slope, intercept: (sy - slope * sx) / n };
}

/** Exact binomial transition matrix of the neutral WF chain on n copies: P[k][j] = Bin(n, k/n)(j). */
export function wfMatrix(n) {
  const P = [];
  for (let k = 0; k <= n; k++) { const row = new Float64Array(n + 1); for (let j = 0; j <= n; j++) row[j] = binomPmf(n, j, k / n); P.push(row); }
  return P;
}
/** One step of a distribution vector through the matrix. */
export function evolve(P, d) {
  const n = d.length, out = new Float64Array(n);
  for (let k = 0; k < n; k++) { const w = d[k]; if (w < 1e-18) continue; const row = P[k]; for (let j = 0; j < n; j++) out[j] += w * row[j]; }
  return out;
}

/** Kimura's eigenfunctions g_i(p) = F(1−i, i+2; 2; p), i ≥ 1, via the Gegenbauer recurrence (stable for large i). */
export function kimuraG(imax, p) {
  const y = 1 - 2 * p, g = new Float64Array(imax + 1);
  let c0 = 1, c1 = 3 * y; // C_0, C_1 of Gegenbauer(3/2)
  g[1] = 1; if (imax >= 2) g[2] = (2 * c1) / 6;
  for (let i = 3; i <= imax; i++) {
    const n = i - 2; // we hold C_{n}, C_{n+1}
    const c2 = ((2 * n + 3) * y * c1 - (n + 2) * c0) / (n + 1);
    c0 = c1; c1 = c2; g[i] = (2 * c1) / (i * (i + 1));
  }
  return g;
}
/** Kimura's solution of the pure-drift forward equation, interior density at frequency p, time t (generations), population N (diploid). */
export function kimuraDensity(N, p0, p, t, terms) {
  const g0 = kimuraG(terms, p0), g = kimuraG(terms, p);
  let s = 0;
  for (let i = 1; i <= terms; i++) s += i * (i + 1) * (2 * i + 1) * p0 * (1 - p0) * g0[i] * g[i] * Math.exp((-i * (i + 1) * t) / (4 * N));
  return s;
}
/** Boundary masses of the pure-drift diffusion: {lost, fixed, inner} from the eigen-series (numerical integrals on a grid). */
export function kimuraMasses(N, p0, t, terms, grid = 400) {
  let inner = 0, mean = 0; const h = 1 / grid;
  for (let j = 0; j < grid; j++) { const p = (j + 0.5) * h, f = kimuraDensity(N, p0, p, t, terms); inner += f * h; mean += p * f * h; }
  return { inner, fixed: p0 - mean, lost: 1 - p0 - (inner - mean) };
}

/** Tridiagonal solve (Thomas algorithm): a sub, b diag, c super, d rhs. */
export function thomas(a, b, c, d) {
  const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

/** Diffusion (Fokker–Planck) forward equation ∂φ/∂t = ½ ∂²[V φ]/∂p², V = p(1−p)/(2N), absorbing ends, by implicit Euler.
 *  Returns density samples φ_i on the grid p_i = i/M (i = 1..M−1) and the masses absorbed at 0 and 1. */
export function fokkerPlanck(N, p0, t, M = 200, dt = 0.1) {
  const h = 1 / M, n = M - 1, V = (i) => (i * h * (1 - i * h)) / (2 * N);
  const phi = new Float64Array(n);
  const i0 = Math.min(n, Math.max(1, Math.round(p0 / h)));
  phi[i0 - 1] = 1 / h;
  let lost = 0, fixed = 0;
  const steps = Math.max(1, Math.round(t / dt)), d = t / steps;
  const a = new Float64Array(n), b = new Float64Array(n), c = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const i = j + 1, k = d / (2 * h * h);
    a[j] = -k * V(i - 1); c[j] = -k * V(i + 1); b[j] = 1 + k * 2 * V(i);
  }
  let cur = phi;
  for (let s = 0; s < steps; s++) cur = thomas(a, b, c, cur);
  let inner = 0; for (let j = 0; j < n; j++) inner += cur[j] * h;
  // masses at the ends from conservation of probability and of the mean
  let mean = 0; for (let j = 0; j < n; j++) mean += (j + 1) * h * cur[j] * h;
  fixed = p0 - mean; lost = 1 - p0 - (inner - mean);
  return { phi: cur, h, inner, lost, fixed };
}

/** Histogram of allele counts ks (out of n copies) as fraction of runs: 20 interior bins plus separate bars for loss (0) and fixation (n)
 *  placed just outside [0,1]. Returns {lost, fixed, mean, ymax}. Call from inside render. */
export function freqBars(s, ks, n, o = {}) {
  const nb = o.bins || 20, cnt = new Float64Array(nb); let lost = 0, fixed = 0, sum = 0; const R = ks.length;
  for (let i = 0; i < R; i++) {
    const k = ks[i]; sum += k / n;
    if (k <= 0) lost++; else if (k >= n) fixed++; else cnt[Math.min(nb - 1, Math.floor((k / n) * nb))]++;
  }
  const col = o.color || 'accent', endCol = o.endColor || 'red', w = 1 / nb;
  for (let b = 0; b < nb; b++) if (cnt[b]) s.rect(b * w, 0, (b + 1) * w, cnt[b] / R, { fill: col, fillAlpha: 0.35, color: col, width: 1 });
  if (lost) s.rect(-0.075, 0, -0.015, lost / R, { fill: endCol, fillAlpha: 0.4, color: endCol, width: 1 });
  if (fixed) s.rect(1.015, 0, 1.075, fixed / R, { fill: endCol, fillAlpha: 0.4, color: endCol, width: 1 });
  let ymax = Math.max(lost, fixed, ...cnt) / R;
  return { lost: lost / R, fixed: fixed / R, mean: sum / R, ymax };
}
