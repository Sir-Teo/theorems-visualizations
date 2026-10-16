// Statistical Inference — Chapter 8: helpers shared by ch08.js and ch08-b.js (plain named exports).
//
// Everything from chapter 7 is re-exported (normal, t and χ² machinery, the repeated-sampling engine, strips, legends).
// New here: the three classical binomial intervals (Wald, Wilson, Clopper–Pearson) with their exact coverage, a beta
// quantile, the Student-t interval pieces, and colours for the interval pictures (covering intervals green, misses red).
export * from './ch07.shared.js';
import { dbinom, qnorm, ibeta, qt, mean } from './ch07.shared.js';

/** Colours: intervals that cover the truth green, misses red, the truth ink, simulated aggregates gold. */
export const CC = { cover: 'green', miss: 'red', truth: 'ink', sim: 'gold', wald: 'orange', wilson: 'accent', exact: 'purple', ci: 'accent', pi: 'teal', nominal: 'muted' };

/** Two-sided normal critical value for confidence level `level`. */
export const zOf = (level) => qnorm(1 - (1 - level) / 2);

/** Quantile of Beta(a, b) by bisection on the regularized incomplete beta. */
export function qbeta(p, a, b) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 70; i++) { const m = 0.5 * (lo + hi); if (ibeta(a, b, m) < p) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}

/** Wald interval for a binomial proportion, x successes in n trials (not clipped to [0,1]). */
export function waldBin(x, n, z) { const p = x / n, h = z * Math.sqrt((p * (1 - p)) / n); return [p - h, p + h]; }
/** Wilson score interval: the set of p with |p̂ − p| ≤ z √(p(1−p)/n). */
export function wilsonBin(x, n, z) {
  const p = x / n, z2 = z * z, d = 1 + z2 / n, c = (p + z2 / (2 * n)) / d, h = (z / d) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return [c - h, c + h];
}
/** Clopper–Pearson exact interval at confidence level `level` (beta quantiles). */
export function cpBin(x, n, level) {
  const a = 1 - level;
  return [x === 0 ? 0 : qbeta(a / 2, x, n - x + 1), x === n ? 1 : qbeta(1 - a / 2, x + 1, n - x)];
}

const cacheInt = new Map();
/** Intervals for x = 0..n for a method in {wald, wilson, cp} (memoised across calls). */
export function binIntervals(method, n, level) {
  const key = `${method}|${n}|${level}`;
  let r = cacheInt.get(key);
  if (!r) {
    const z = zOf(level);
    r = Array.from({ length: n + 1 }, (_, x) => (method === 'wald' ? waldBin(x, n, z) : method === 'wilson' ? wilsonBin(x, n, z) : cpBin(x, n, level)));
    if (cacheInt.size > 400) cacheInt.clear();
    cacheInt.set(key, r);
  }
  return r;
}
/** Exact coverage probability at p: sum of binomial probabilities of the x whose interval contains p. */
export function binCover(method, n, level, p) {
  const I = binIntervals(method, n, level); let c = 0;
  for (let x = 0; x <= n; x++) if (I[x][0] <= p && p <= I[x][1]) c += dbinom(x, n, p);
  return c;
}
/** Expected length of the interval at p (clipped to [0,1]). */
export function binLength(method, n, level, p) {
  const I = binIntervals(method, n, level); let c = 0;
  for (let x = 0; x <= n; x++) c += dbinom(x, n, p) * (Math.min(1, I[x][1]) - Math.max(0, I[x][0]));
  return c;
}
/** Coverage curve on a grid of p in (0,1): array of [p, coverage]. */
export function coverCurve(method, n, level, m = 1200) {
  const out = [];
  for (let i = 0; i <= m; i++) { const p = Math.min(1 - 1e-6, Math.max(1e-6, i / m)); out.push([i / m, binCover(method, n, level, p)]); }
  return out;
}

/** Sample mean and standard deviation (divisor n−1) of an array. */
export function meanSd(a) {
  const n = a.length, m = mean(a); let q = 0; for (let i = 0; i < n; i++) q += (a[i] - m) ** 2;
  return [m, Math.sqrt(q / (n - 1))];
}
/** t-interval half-width multiplier, memoised by (df, level). */
const tq = new Map();
export function tCrit(df, level) {
  const k = df + '|' + level; let c = tq.get(k);
  if (c === undefined) { c = qt(1 - (1 - level) / 2, df); tq.set(k, c); }
  return c;
}

/** Populations with mean 0 and SD 1 and their kurtosis (E X⁴), for the interval-robustness pictures. */
export const POP8 = {
  normal: { label: 'normal', draw: (r) => r.normal(), kurt: 3, skew: 0 },
  expo: { label: 'exponential (skewed)', draw: (r) => -Math.log(1 - r()) - 1, kurt: 9, skew: 2 },
  laplace: { label: 'Laplace', draw: (r) => { const u = r() - 0.5; return (-Math.sign(u) * Math.log(1 - 2 * Math.abs(u))) / Math.SQRT2; }, kurt: 6, skew: 0 },
  unif: { label: 'uniform', draw: (r) => (r() - 0.5) * Math.sqrt(12), kurt: 1.8, skew: 0 },
  t5: { label: '$t_5$', draw: (r) => { let c = 0; for (let i = 0; i < 5; i++) { const z = r.normal(); c += z * z; } return (r.normal() / Math.sqrt(c / 5)) / Math.sqrt(5 / 3); }, kurt: 9, skew: 0 },
};
