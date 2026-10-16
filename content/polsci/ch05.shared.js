// Political Science & Social Choice — Chapter 5: helpers shared by ch05.js and ch05-b.js (plain named exports).
//
// Chapter 5 is about probabilities of votes: how likely one vote is to be decisive, how likely a majority of noisy
// voters is to be right, and how strategic voters change that. The exact binomial machinery lives here.
// The helpers of chapters 1-4 are re-exported.
export * from './ch04.shared.js';

/** ln Gamma(x) for x > 0 (Stirling series after shifting x above 10). */
export function lgam(x) {
  let s = 0;
  while (x < 10) { s -= Math.log(x); x += 1; }
  return s + (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x) - 1 / (360 * x ** 3) + 1 / (1260 * x ** 5);
}
export const logBinom = (n, k) => lgam(n + 1) - lgam(k + 1) - lgam(n - k + 1);
/** P(Bin(n, p) = k), computed through logarithms so that n may be large. */
export function binomPmf(n, k, p) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(logBinom(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}
/** P(Bin(n, p) >= k). */
export function binomTail(n, k, p) { let s = 0; for (let j = Math.max(0, k); j <= n; j++) s += binomPmf(n, j, p); return Math.min(1, s); }
/** Probability that a strict majority of n independent voters, each right with probability p, is right (a tie counts one half). */
export function majProb(n, p) {
  if (n % 2) return binomTail(n, (n + 1) / 2, p);
  return binomTail(n, n / 2 + 1, p) + 0.5 * binomPmf(n, n / 2, p);
}
/** Probability of an exact tie among n (even) voters who each vote for A with probability q. */
export function tieProb(n, q) {
  if (q <= 0 || q >= 1) return 0;
  return Math.exp(lgam(n + 1) - 2 * lgam(n / 2 + 1) + (n / 2) * (Math.log(q) + Math.log1p(-q)));
}
/** Hoeffding lower bound 1 - exp(-2 n (p - 1/2)^2) on the probability that the majority is right (p > 1/2). */
export const hoeffding = (n, p) => (p > 0.5 ? 1 - Math.exp(-2 * n * (p - 0.5) ** 2) : 0);
/** Log-spaced list of numbers from a to b. */
export const logspace = (a, b, m) => Array.from({ length: m }, (_, i) => a * (b / a) ** (i / (m - 1)));
