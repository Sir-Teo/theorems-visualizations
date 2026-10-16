// Statistical Inference — Chapter 6: helpers shared by ch06.js and ch06-b.js (plain named exports).
//
// House style (as in chapters 1–5): every claim about a test is checked twice, once by an exact computation (an
// area under a density, a sum of binomial or hypergeometric probabilities, a numerical integral) and once by
// simulating many datasets from a population the reader controls, seeded by the settings. Colours are fixed across
// the chapter: the null in blue, the alternative in purple, type I error in red, type II error in orange, power in
// green, simulated values in gold.
import {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler, repeater,
  lfact, lgammaF, mnus, strip, mulberry, rpois, rcauchy, dpois, Phi, qnorm, dchisq1, pchisq1Upper, golden, simpson,
  skew, rlaplace, rt,
} from './ch05.shared.js';
import { lchoose, dbinom } from './ch04.shared.js';

export {
  phi, clamp, commas, pct, hashStr, memo, mean, moments, qSorted, sortNum, binned, legender, titler, repeater,
  lfact, lgammaF, mnus, strip, mulberry, rpois, rcauchy, dpois, Phi, qnorm, dchisq1, pchisq1Upper, golden, simpson,
  skew, rlaplace, rt, lchoose, dbinom,
};

/** Chapter colours. */
export const TC = { h0: 'accent', h1: 'purple', alpha: 'red', beta: 'orange', power: 'green', sim: 'gold' };

/** Upper tail of the standard normal, accurate far out (uses erfc through Phi(−z)). */
export const Q = (z) => Phi(-z);

/** Regularized incomplete gamma P(a, x) and Q(a, x) (series / continued fraction, Numerical Recipes). */
export function gammaPQ(a, x) {
  if (!(x > 0)) return [0, 1];
  if (x === Infinity) return [1, 0];
  const gl = lgammaF(a);
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 0; n < 500; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
    const p = sum * Math.exp(-x + a * Math.log(x) - gl);
    return [p, 1 - p];
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break;
  }
  const q = Math.exp(-x + a * Math.log(x) - gl) * h;
  return [1 - q, q];
}
/** χ²_k upper tail P(χ²_k > x), accurate to tiny probabilities; density; quantile by bisection. */
export const chiUp = (k, x) => gammaPQ(k / 2, x / 2)[1];
export const chiCdf = (k, x) => gammaPQ(k / 2, x / 2)[0];
export const dchi = (k, x) => (x <= 0 ? (k === 2 ? 0.5 : 0) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lgammaF(k / 2)));
export function qchi(k, p) {
  let lo = 0, hi = Math.max(10, 4 * k + 40);
  for (let i = 0; i < 90; i++) { const m = 0.5 * (lo + hi); if (chiCdf(k, m) < p) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}

/** Student t density, CDF (via the regularized incomplete beta) and quantile. */
export function betacf(a, b, x) {
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m; let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break;
  }
  return h;
}
export function ibeta(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgammaF(a + b) - lgammaF(a) - lgammaF(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
export const dt = (t, nu) => Math.exp(lgammaF((nu + 1) / 2) - lgammaF(nu / 2) - 0.5 * Math.log(nu * Math.PI) - ((nu + 1) / 2) * Math.log1p((t * t) / nu));
/** P(T_ν > t). */
export const tUp = (t, nu) => { const tail = 0.5 * ibeta(nu / 2, 0.5, nu / (nu + t * t)); return t > 0 ? tail : 1 - tail; };
export function qt(p, nu) {
  if (p === 0.5) return 0;
  let lo = -60, hi = 60;
  for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (1 - tUp(m, nu) < p) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}

/**
 * Power of the one-sided t-test (reject when T > c) when T = (Z + δ)/√(V/ν), V ~ χ²_ν: the noncentral t tail,
 * by integrating P(Z > c√(v/ν) − δ) against the χ²_ν density (Simpson in u = √v).
 */
export function nctUp(c, nu, delta) {
  // substitute v = u²: density of u is 2u f_ν(u²)
  const lo = Math.max(0, Math.sqrt(nu) - 9), hi = Math.sqrt(nu) + 9, N = 200, h = (hi - lo) / N;
  let s = 0;
  for (let i = 0; i <= N; i++) {
    const u = lo + i * h, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2;
    const fu = u > 0 ? 2 * u * dchi(nu, u * u) : 0;
    s += w * fu * Q(c * u / Math.sqrt(nu) - delta);
  }
  return (s * h) / 3;
}

/** Hypergeometric pmf: k successes in a draw of n from N items of which K are successes. */
export const dhyper = (k, N, K, n) => (k < Math.max(0, n - (N - K)) || k > Math.min(n, K) ? 0 : Math.exp(lchoose(K, k) + lchoose(N - K, n - k) - lchoose(N, n)));

/** Binomial upper tail P(X ≥ k). */
export function binUp(k, n, p) { let s = 0; for (let j = Math.max(0, Math.ceil(k)); j <= n; j++) s += dbinom(j, n, p); return Math.min(1, s); }

/**
 * Populations with mean 0 and SD 1 for robustness experiments; `shift` adds the effect.
 * skew/kurt for the readouts are the population values.
 */
export const POPS = {
  normal: { label: 'normal', draw: (r) => r.normal(), skew: 0 },
  expo: { label: 'exponential (skewed)', draw: (r) => -Math.log(1 - r()) - 1, skew: 2 },
  lognormal: { label: 'lognormal (very skewed)', draw: (r) => (Math.exp(r.normal()) - Math.exp(0.5)) / Math.sqrt((Math.E - 1) * Math.E), skew: 6.18 },
  t3: { label: '$t_3$ (heavy tails)', draw: (r) => rt(r, 3) / Math.sqrt(3), skew: 0 },
  unif: { label: 'uniform', draw: (r) => (r() - 0.5) * Math.sqrt(12), skew: 0 },
};

/** Two-sample t statistics: pooled (Student) and Welch with Satterthwaite degrees of freedom. */
export function twoSample(a, b) {
  const n1 = a.length, n2 = b.length, m1 = mean(a), m2 = mean(b);
  let s1 = 0, s2 = 0; for (const x of a) s1 += (x - m1) ** 2; for (const x of b) s2 += (x - m2) ** 2;
  const v1 = s1 / (n1 - 1), v2 = s2 / (n2 - 1), sp = (s1 + s2) / (n1 + n2 - 2);
  const tP = (m1 - m2) / Math.sqrt(sp * (1 / n1 + 1 / n2));
  const q1 = v1 / n1, q2 = v2 / n2, tW = (m1 - m2) / Math.sqrt(q1 + q2);
  const nuW = (q1 + q2) ** 2 / ((q1 * q1) / (n1 - 1) + (q2 * q2) / (n2 - 1));
  return { tP, tW, nuW, dfP: n1 + n2 - 2, d: m1 - m2 };
}

/** Shade under a density between a and b (data units), with an outline on top. */
export function area(s, f, a, b, color, alpha = 0.32, n = 160) {
  if (!(b > a)) return;
  s.fn(f, { domain: [a, b], n, color, width: 0.01, fill: color, fillAlpha: alpha });
}
/** A small rounded label with a coloured swatch-free text (plate) at data coordinates. */
export function tag(s, str, x, y, o = {}) { s.text(str, x, y, { size: o.size ?? 11.5, color: o.color ?? 'ink', align: o.align ?? 'center', baseline: o.baseline, dx: o.dx, dy: o.dy, plate: o.plate ?? true, weight: o.weight ?? 600 }); }

/** Monte Carlo standard error of a proportion, as text. */
export const mcse = (p, n) => Math.sqrt(Math.max(p * (1 - p), 0.25 / n) / n);
/** Format a (possibly tiny) probability in TeX-free plain text. */
export function pfmt(p, sig = 3) {
  if (!(p >= 0)) return '—';
  if (p === 0) return '0';
  if (p >= 0.001) return Number(p.toPrecision(sig)).toString();
  const e = Math.floor(Math.log10(p)), m = p / 10 ** e;
  return `${m.toFixed(sig - 1)}×10${String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`;
}
