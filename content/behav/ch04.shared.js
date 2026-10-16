// Behavioural Economics — Chapter 4: helpers shared by ch04.js and ch04-b.js.
// Re-exports the chapter 3 helpers (formatting, choice cards, binomial tails, bars) and the chapter 2 value-function
// and money formatters; adds a Wilson interval, the lognormal "value of the play" fit, and the bundle value of
// repeated favourable bets (Samuelson's colleague).
export * from './ch03.shared.js';
export { vPT, vInv, TK92, usdC, usdR } from './ch02.shared.js';
import { vPT } from './ch02.shared.js';
import { binomPmf } from './ch03.shared.js';

/** Wilson 95% interval for k successes of n. */
export function wilson(k, n, z = 1.96) {
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [(c - h) / d, (c + h) / d];
}

/** Error bar in data units on a stage. */
export function errBar(s, x, lo, hi, { color = 'ink', cap = 0.04, width = 1.6 } = {}) {
  s.line(x, lo, x, hi, { color, width });
  s.line(x - cap, lo, x + cap, lo, { color, width });
  s.line(x - cap, hi, x + cap, hi, { color, width });
}

/** Standard normal cdf and quantile through the runtime's math library (passed in as M). */
export const lognormalFromTwo = (M, p1, q1, p2, q2) => {
  // value V is lognormal; P(V >= p1) = q1 and P(V >= p2) = q2  =>  mu, sigma
  const n = M.dist.normal(0, 1);
  const z1 = n.quantile(1 - q1), z2 = n.quantile(1 - q2);
  const sigma = (Math.log(p2) - Math.log(p1)) / (z2 - z1);
  return { mu: Math.log(p1) - sigma * z1, sigma };
};

/** n independent plays of a 50-50 bet (win `w`, lose `l`): distribution of the number of wins and the net total. */
export function bundle(n, w, l, p = 0.5) {
  const out = [];
  for (let k = 0; k <= n; k++) out.push({ k, total: k * w - (n - k) * l, p: binomPmf(n, k, p) });
  return out;
}
/** Prospect-theory value of the bundle (value function applied to the total, no probability weighting). */
export function bundleValue(n, w, l, a, lam, p = 0.5) {
  let V = 0;
  for (const o of bundle(n, w, l, p)) V += o.p * vPT(o.total, a, lam, a);
  return V;
}
/** Probability that the bundle ends below zero. */
export function bundleLossProb(n, w, l, p = 0.5) {
  let s = 0;
  for (const o of bundle(n, w, l, p)) if (o.total < 0) s += o.p;
  return s;
}
