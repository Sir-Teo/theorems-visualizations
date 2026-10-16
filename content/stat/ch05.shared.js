// Statistical Inference — Chapter 5: helpers shared by ch05.js and ch05-b.js (plain named exports).
//
// House style (as in chapters 1–4): every limit theorem is tested by repeated sampling from a population the reader
// controls, seeded by the settings, with the exact limit drawn beside the simulation. Generic helpers and the
// one-parameter family table come from ch04.shared.js; this file adds the normal CDF and quantile, maximum-likelihood
// solvers that need iteration (Cauchy location, logistic slope), heavy-tailed samplers, and the robust-statistics
// toolkit (ψ-functions, Huber's location estimate, exact asymptotic variances under normal scale mixtures).
import {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler, repeater,
  ellipsePts, trigamma, digamma, lfact, lgammaF, mnus, CYCLE, family, sumOver, logSlope, decadeTicks, strip, mulberry,
  varN, rpois, rcauchy, dpois,
} from './ch04.shared.js';
import { medianOf, kth } from './ch03.shared.js';

export {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler, repeater,
  ellipsePts, trigamma, digamma, lfact, lgammaF, mnus, CYCLE, family, sumOver, logSlope, decadeTicks, strip, mulberry,
  varN, rpois, rcauchy, dpois, medianOf, kth,
};

const LS = Math.log(2 * Math.PI) / 2;

/** erfc with fractional error below 1.2e-7 everywhere (Chebyshev fit, Numerical Recipes "erfcc"). */
export function erfc(x) {
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
/** Standard normal CDF and upper tail. */
export const Phi = (z) => 0.5 * erfc(-z / Math.SQRT2);
/** Standard normal quantile (Acklam's rational approximation plus one Halley step). */
export function qnorm(p) {
  if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  let x;
  if (p < 0.02425) { const q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else if (p > 1 - 0.02425) { const q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else { const q = p - 0.5, r = q * q; x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  const e = Phi(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}
/** χ²₁ density. */
export const dchisq1 = (x) => (x > 0 ? Math.exp(-x / 2) / Math.sqrt(2 * Math.PI * x) : 0);
/** P(χ²₁ > x) = 2(1 − Φ(√x)). */
export const pchisq1Upper = (x) => (x > 0 ? 2 * (1 - Phi(Math.sqrt(x))) : 1);

/** Families of chapter 4 plus a non-identifiable one, N(θ², 1), where only |θ| is determined by the data. */
export function fam5(key) {
  if (key === 'sq') return {
    key, name: 'normal with mean θ²', ptex: '\\theta', lo: -2, hi: 2, def: 1, regular: true, discrete: false,
    sample: (r, t) => t * t + r.normal(),
    ll: (x, t) => -((x - t * t) ** 2) / 2 - LS,
  };
  return family(key);
}
/** Exact expected log-likelihood E_θ₀ log f(X | θ) of one observation (= −KL(θ₀‖θ) − entropy(θ₀)). */
export function expLL(F, t0, t) {
  if (F.key === 'normal') return -0.5 * (t - t0) ** 2 - 0.5 - LS;
  if (F.key === 'sq') return -0.5 * (t * t - t0 * t0) ** 2 - 0.5 - LS;
  if (F.key === 'expo') return Math.log(t) - t / t0;
  if (F.key === 'cauchy') return -Math.log(Math.PI) - Math.log(4 + (t - t0) ** 2);
  if (F.key === 'poisson') {
    let el = 0; const K = Math.ceil(t0 + 12 * Math.sqrt(t0) + 25);
    for (let k = 0; k <= K; k++) el += dpois(k, t0) * lfact(k);
    return t0 * Math.log(t) - t - el;
  }
  if (F.key === 'bernoulli') return t0 * Math.log(t) + (1 - t0) * Math.log(1 - t);
  return NaN;
}

/** Cauchy location MLE: Newton from the median with step halving on the log-likelihood (global max for n ≥ 3 in practice). */
export function cauchyMLE(xs, buf) {
  const n = xs.length; let t = medianOf(xs, n, buf);
  const ll = (t) => { let a = 0; for (let i = 0; i < n; i++) a -= Math.log(1 + (xs[i] - t) ** 2); return a; };
  let L = ll(t);
  for (let it = 0; it < 40; it++) {
    let s = 0, j = 0;
    for (let i = 0; i < n; i++) { const u = xs[i] - t, q = 1 + u * u; s += (2 * u) / q; j += (2 * (1 - u * u)) / (q * q); }
    let step = j > 1e-9 ? s / j : s * 0.25;
    if (j <= 1e-9) step = Math.sign(s) * Math.min(Math.abs(step), 1);
    let tn = t + step, Ln = ll(tn), h = 0;
    while (Ln < L - 1e-12 && h < 30) { step /= 2; tn = t + step; Ln = ll(tn); h++; }
    if (Ln < L - 1e-12) break;
    t = tn; L = Ln;
    if (Math.abs(step) < 1e-10) break;
  }
  return t;
}
/** Cauchy observed information −ℓ''(θ) and score ℓ'(θ) for a sample. */
export function cauchyJ(xs, t) { let j = 0; for (const x of xs) { const u = x - t, q = 1 + u * u; j += (2 * (1 - u * u)) / (q * q); } return j; }
export function cauchyS(xs, t) { let s = 0; for (const x of xs) { const u = x - t; s += (2 * u) / (1 + u * u); } return s; }
export function cauchyLL(xs, t) { let a = 0; for (const x of xs) a -= Math.log(Math.PI) + Math.log(1 + (x - t) ** 2); return a; }

/** Logistic regression through the origin, P(Y = 1 | x) = 1/(1 + e^{−βx}): log-likelihood, score, information, MLE. */
export const sigm = (z) => 1 / (1 + Math.exp(-z));
export function logitLL(x, y, b) { let a = 0; for (let i = 0; i < x.length; i++) { const z = b * x[i]; a += y[i] * z - (z > 0 ? z + Math.log1p(Math.exp(-z)) : Math.log1p(Math.exp(z))); } return a; }
export function logitS(x, y, b) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * (y[i] - sigm(b * x[i])); return s; }
export function logitI(x, b) { let j = 0; for (let i = 0; i < x.length; i++) { const p = sigm(b * x[i]); j += x[i] * x[i] * p * (1 - p); } return j; }
/** Newton–Raphson for the slope; NaN when the data are separated (the MLE is infinite). */
export function logitMLE(x, y) {
  let b = 0;
  for (let it = 0; it < 60; it++) {
    const s = logitS(x, y, b), j = logitI(x, b);
    if (!(j > 1e-12)) return NaN;
    const st = s / j; b += Math.max(-3, Math.min(3, st));
    if (Math.abs(b) > 25) return NaN;
    if (Math.abs(st) < 1e-11) return b;
  }
  return Math.abs(b) > 20 ? NaN : b;
}

/** Heavy-tailed samplers: Laplace (b = 1), logistic (s = 1), Student t with integer ν, normal scale mixture. */
export const rlaplace = (r) => { const u = r() - 0.5; return -Math.sign(u) * Math.log(1 - 2 * Math.abs(u)); };
export const rlogis = (r) => { const u = Math.min(1 - 1e-12, Math.max(1e-12, r())); return Math.log(u / (1 - u)); };
export const rt = (r, nu) => { let c = 0; for (let i = 0; i < nu; i++) { const z = r.normal(); c += z * z; } return r.normal() / Math.sqrt(c / nu); };
/** (1 − ε)·N(0, 1) + ε·N(0, τ²): the contaminated normal of Tukey (1960). */
export const rmix = (r, eps, tau) => (r() < eps ? tau : 1) * r.normal();
/** Its density and derivative. */
export const dmix = (x, eps, tau) => (1 - eps) * phi(x) + (eps * phi(x / tau)) / tau;
export const dmixD = (x, eps, tau) => -(1 - eps) * x * phi(x) - (eps * x * phi(x / tau)) / (tau * tau * tau);

/** ψ-functions for location: mean, median (sign), Huber (clipped at ±k), Tukey biweight (redescending, zero beyond c). */
export const psiHuber = (u, k) => (u > k ? k : u < -k ? -k : u);
export const psiBi = (u, c) => (Math.abs(u) >= c ? 0 : u * (1 - (u / c) ** 2) ** 2);
export const psiOf = (kind, k) => (kind === 'mean' ? (u) => u : kind === 'median' ? (u) => (u > 0 ? 1 : u < 0 ? -1 : 0) : kind === 'huber' ? (u) => psiHuber(u, k) : (u) => psiBi(u, k));

/** Huber's location M-estimate with known scale 1: the root of Σ ψ_k(x_i − θ), by Newton steps inside a bisection bracket. */
export function huberLoc(xs, k, buf) {
  const n = xs.length; let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) { if (xs[i] < lo) lo = xs[i]; if (xs[i] > hi) hi = xs[i]; }
  let t = buf ? medianOf(xs, n, buf) : 0.5 * (lo + hi);
  for (let it = 0; it < 100; it++) {
    let s = 0, m = 0;
    for (let i = 0; i < n; i++) { const u = xs[i] - t; if (u > k) s += k; else if (u < -k) s -= k; else { s += u; m++; } }
    if (s > 0) lo = t; else if (s < 0) hi = t; else return t;
    let tn = m ? t + s / m : 0.5 * (lo + hi);
    if (!(tn > lo && tn < hi)) tn = 0.5 * (lo + hi);
    if (Math.abs(tn - t) < 1e-12 * (1 + Math.abs(t))) return tn;
    t = tn;
  }
  return t;
}
/** α-trimmed mean of the first n entries (drops ⌊αn⌋ from each end). */
export function trimMean(xs, a) { const s = Float64Array.from(xs).sort(), n = s.length, g = Math.floor(a * n); let z = 0; for (let i = g; i < n - g; i++) z += s[i]; return z / (n - 2 * g); }

/**
 * Exact asymptotic variances of location estimators when F = Σ w_j N(0, s_j²) (symmetric, so all target 0):
 * mean Σ w s², median 1/(4 f(0)²), Huber E ψ_k² / (E ψ_k′)².
 */
export function mixVars(comps, k) {
  let vm = 0, f0 = 0, Epd = 0, Ep2 = 0;
  for (const [w, s] of comps) {
    vm += w * s * s; f0 += (w * phi(0)) / s;
    const a = k / s, inside = 2 * Phi(a) - 1;
    Epd += w * inside;
    Ep2 += w * (s * s * (inside - 2 * a * phi(a)) + 2 * k * k * (1 - Phi(a)));
  }
  return { mean: vm, median: 1 / (4 * f0 * f0), huber: Ep2 / (Epd * Epd), Ep2, Epd, f0 };
}
export const mixComps = (eps, tau) => (eps > 0 ? [[1 - eps, 1], [eps, tau]] : [[1, 1]]);
/** Huber's minimax tuning constant for ε-contamination of N(0, 1): 2φ(k)/k − 2(1 − Φ(k)) = ε/(1 − ε). */
export function huberK(eps) {
  if (eps <= 0) return Infinity;
  const g = (k) => (2 * phi(k)) / k - 2 * (1 - Phi(k)) - eps / (1 - eps);
  let lo = 1e-4, hi = 10; for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (g(m) > 0) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}
/** Fisher information for location of the contaminated normal, ∫ f′²/f, by Simpson's rule. */
export function mixInfo(eps, tau) {
  const A = 12 * Math.max(1, tau), N = 4000, h = (2 * A) / N; let s = 0;
  for (let i = 0; i <= N; i++) { const x = -A + i * h, f = dmix(x, eps, tau), g = f > 1e-300 ? dmixD(x, eps, tau) ** 2 / f : 0; s += g * (i === 0 || i === N ? 1 : i % 2 ? 4 : 2); }
  return (s * h) / 3;
}

/** Points [z_(i), x_(i)] of a normal Q–Q plot of an ascending array, thinned to at most m points. */
export function qqPoints(sorted, scale = 1, m = 1500) {
  const n = sorted.length, step = Math.max(1, Math.floor(n / m)), pts = [];
  for (let i = 0; i < n; i += step) pts.push([qnorm((i + 0.5) / n), sorted[i] * scale]);
  return pts;
}
/** Kolmogorov distance between an ascending sample and a continuous CDF. */
export function ksDist(sorted, cdf) {
  const n = sorted.length; let d = 0;
  for (let i = 0; i < n; i++) { const F = cdf(sorted[i]); d = Math.max(d, Math.abs(F - i / n), Math.abs((i + 1) / n - F)); }
  return d;
}
/** Sample skewness. */
export function skew(a) { const m = mean(a); let s2 = 0, s3 = 0; for (const x of a) { const d = x - m; s2 += d * d; s3 += d * d * d; } s2 /= a.length; s3 /= a.length; return s2 > 0 ? s3 / s2 ** 1.5 : 0; }
/** Golden-section minimisation of a unimodal f on [a, b]. */
export function golden(f, a, b, it = 80) {
  const g = (Math.sqrt(5) - 1) / 2; let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d);
  for (let i = 0; i < it; i++) { if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); } }
  return 0.5 * (a + b);
}
/** Simpson's rule with N (even) panels. */
export function simpson(f, a, b, N = 400) { const h = (b - a) / N; let s = f(a) + f(b); for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; }
/** Colours of the estimators, kept fixed across the chapter. */
export const EC = { mean: 'accent', median: 'orange', huber: 'purple', trim: 'teal', trim2: 'pink', bi: 'teal', mle: 'accent' };
