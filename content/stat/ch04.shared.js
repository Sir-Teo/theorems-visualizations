// Statistical Inference — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
//
// House style (as in chapters 1–3): every claim is tested by repeated sampling from a population the reader
// controls, seeded by the settings, with the exact formula drawn beside the simulation. The generic helpers come
// from ch03.shared.js; this file adds one-parameter families with their scores and informations, and samplers.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler, repeater,
  ellipsePts, gammaMLE, trigamma, digamma, lfact, lgammaF, mnus, CYCLE,
} from './ch03.shared.js';

export {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler, repeater,
  ellipsePts, gammaMLE, trigamma, digamma, lfact, lgammaF, mnus, CYCLE,
};

/** Poisson by multiplying uniforms (fine for means up to ~30). */
export const rpois = (r, lam) => { const L = Math.exp(-lam); let k = 0, t = r(); while (t > L) { k++; t *= r(); } return k; };
/** Standard Cauchy. */
export const rcauchy = (r) => Math.tan(Math.PI * (r() - 0.5));
/** Poisson pmf without overflow. */
export const dpois = (k, lam) => (k < 0 ? 0 : Math.exp(k * Math.log(lam) - lam - lfact(k)));
/** log C(n, k) and binomial pmf. */
export const lchoose = (n, k) => (k < 0 || k > n ? -Infinity : lfact(n) - lfact(k) - lfact(n - k));
export const dbinom = (k, n, p) => (k < 0 || k > n ? 0 : Math.exp(lchoose(n, k) + (k ? k * Math.log(p) : 0) + (n - k ? (n - k) * Math.log(1 - p) : 0)));

/**
 * One-parameter families used across the chapter. Each has
 *   sample(r, θ), ll(x, θ) (log density, −∞ off the support), s(x, θ) (score of one observation),
 *   j(x, θ) (minus the second derivative of ll), I(θ) (E s² for one observation), EJ(θ) (E j at the truth),
 *   Es(θ₀, θ) (exact mean of the score at θ when the data come from θ₀), lo/hi/def (parameter range), regular.
 */
export function family(key) {
  const LS = Math.log(2 * Math.PI) / 2;
  if (key === 'normal' || key === 'normalP' || key === 'normalF') {
    const sg = key === 'normalP' ? 0.5 : key === 'normalF' ? 2 : 1, v2 = sg * sg;
    return {
      key, sg, name: `normal mean (σ = ${sg})`, ptex: '\\mu', lo: -2, hi: 2, def: 0, half: 1.6, regular: true, discrete: false,
      sample: (r, t) => t + sg * r.normal(),
      ll: (x, t) => -((x - t) ** 2) / (2 * v2) - Math.log(sg) - LS,
      s: (x, t) => (x - t) / v2, j: () => 1 / v2, I: () => 1 / v2, EJ: () => 1 / v2, Es: (t0, t) => (t0 - t) / v2,
    };
  }
  if (key === 'poisson') return {
    key, name: 'Poisson mean', ptex: '\\lambda', lo: 0.3, hi: 8, def: 2, half: null, regular: true, discrete: true,
    sample: (r, t) => rpois(r, t),
    ll: (x, t) => x * Math.log(t) - t - lfact(x),
    s: (x, t) => x / t - 1, j: (x, t) => x / (t * t), I: (t) => 1 / t, EJ: (t) => 1 / t, Es: (t0, t) => t0 / t - 1,
  };
  if (key === 'bernoulli') return {
    key, name: 'Bernoulli probability', ptex: 'p', lo: 0.04, hi: 0.96, def: 0.3, half: null, regular: true, discrete: true,
    sample: (r, t) => (r() < t ? 1 : 0),
    ll: (x, t) => (x ? Math.log(t) : Math.log(1 - t)),
    s: (x, t) => (x ? 1 / t : -1 / (1 - t)), j: (x, t) => (x ? 1 / (t * t) : 1 / ((1 - t) * (1 - t))),
    I: (t) => 1 / (t * (1 - t)), EJ: (t) => 1 / (t * (1 - t)), Es: (t0, t) => t0 / t - (1 - t0) / (1 - t),
  };
  if (key === 'expo') return {
    key, name: 'exponential rate', ptex: '\\theta', lo: 0.3, hi: 4, def: 1, half: null, regular: true, discrete: false,
    sample: (r, t) => -Math.log(1 - r()) / t,
    ll: (x, t) => Math.log(t) - t * x,
    s: (x, t) => 1 / t - x, j: (x, t) => 1 / (t * t), I: (t) => 1 / (t * t), EJ: (t) => 1 / (t * t), Es: (t0, t) => 1 / t - 1 / t0,
  };
  if (key === 'cauchy') return {
    key, name: 'Cauchy location', ptex: '\\theta', lo: -2, hi: 2, def: 0, half: 3, regular: true, discrete: false,
    sample: (r, t) => t + rcauchy(r),
    ll: (x, t) => -Math.log(Math.PI) - Math.log(1 + (x - t) ** 2),
    s: (x, t) => { const u = x - t; return (2 * u) / (1 + u * u); },
    j: (x, t) => { const u2 = (x - t) ** 2; return (2 * (1 - u2)) / ((1 + u2) * (1 + u2)); },
    I: () => 0.5, EJ: () => 0.5,
    // E over X = θ₀ + tan(w), w uniform on (−π/2, π/2): (1/π) ∫ s(θ₀ + tan w, θ) dw (bounded, smooth integrand)
    Es: (t0, t) => { let a = 0; const K = 400; for (let i = 0; i < K; i++) { const w = -Math.PI / 2 + (Math.PI * (i + 0.5)) / K, u = t0 + Math.tan(w) - t; a += (2 * u) / (1 + u * u); } return a / K; },
  };
  if (key === 'uniform') return {
    key, name: 'uniform endpoint', ptex: '\\theta', lo: 0.5, hi: 3, def: 1.5, half: null, regular: false, discrete: false,
    sample: (r, t) => t * r(),
    ll: (x, t) => (x >= 0 && x <= t ? -Math.log(t) : -Infinity),
    s: (x, t) => (x <= t ? -1 / t : NaN), j: (x, t) => (x <= t ? -1 / (t * t) : NaN),
    I: (t) => 1 / (t * t), EJ: (t) => -1 / (t * t), Es: (t0, t) => (t >= t0 ? -1 / t : NaN),
  };
  throw new Error('unknown family ' + key);
}

/** Sum of a per-observation function over a data array. */
export const sumOver = (xs, f, t) => { let a = 0; for (let i = 0; i < xs.length; i++) a += f(xs[i], t); return a; };

/** Least-squares slope of log y on log x (a power law's exponent). */
export function logSlope(pts) {
  let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of pts) if (x > 0 && y > 0) { const u = Math.log(x), w = Math.log(y); n++; sx += u; sy += w; sxx += u * u; sxy += u * w; }
  return n > 1 ? (n * sxy - sx * sy) / (n * sxx - sx * sx) : NaN;
}

/** Nice ticks for a log axis in actual units: [[t, label], …] inside [lo, hi]. */
export function decadeTicks(lo, hi, mults = [1, 2, 5]) {
  const out = [];
  for (let e = -6; e <= 6; e++) for (const m of mults) { const t = m * 10 ** e; if (t >= lo * 0.999 && t <= hi * 1.001) out.push([t, t >= 1e4 ? `${m}e${e}` : String(Number(t.toPrecision(2)))]); }
  return out;
}

/** A row of dots ("1-D dartboard") for repeated estimates, jittered vertically inside [y − h, y + h], seeded. */
export function strip(s, vals, y, h, o = {}) {
  const r = mulberry(o.seed ?? 7), pts = [];
  const m = Math.min(vals.length, o.max ?? 1200);
  for (let i = 0; i < m; i++) pts.push([vals[i], y + (r() * 2 - 1) * h]);
  s.dots(pts, { r: o.r ?? 1.8, color: o.color ?? 'gold', alpha: o.alpha ?? 0.45 });
}
/** Tiny deterministic PRNG for jitter (independent of the simulation streams). */
export function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Variance (divisor n) of an array. */
export function varN(a) { const m = mean(a); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - m) ** 2; return s / a.length; }
