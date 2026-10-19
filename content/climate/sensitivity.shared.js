import { Phi, PhiInv } from './ch03.shared.js';
/** Gaussian feedback, conditioned on the stable branch f<1. The conditioning
 * must be shared by densities, quantiles, tail probabilities and histograms.
 */
export function sensitivityDistribution(mu, sigma, noFeedback) {
  const stable = Phi((1 - mu) / sigma), runaway = 1 - stable;
  const pdf = s => s > 0 ? noFeedback * Math.exp(-.5 * ((1 - noFeedback / s - mu) / sigma) ** 2) / (s * s * sigma * Math.sqrt(2 * Math.PI) * stable) : 0;
  const cdf = s => s > 0 ? Math.max(0, Math.min(1, Phi((1 - noFeedback / s - mu) / sigma) / stable)) : 0;
  const quantile = p => p <= 0 ? 0 : p >= 1 ? Infinity : noFeedback / (1 - mu - sigma * PhiInv(p * stable));
  return { stable, runaway, pdf, cdf, tail: s => 1 - cdf(s), quantile, mean: Infinity };
}
/** Finite-window bars retain the normalization of ALL finite-branch draws. */
export function sensitivityHistogram(samples, upper = 12, bins = 48) {
  const width = upper / bins, edges = Array.from({ length: bins + 1 }, (_, i) => i * width), counts = Array(bins).fill(0);
  for (const s of samples) if (s >= 0 && s < upper) counts[Math.floor(s / width)]++;
  return { edges, counts, density: counts.map(n => samples.length ? n / (samples.length * width) : 0), outside: samples.length - counts.reduce((a, b) => a + b, 0) };
}
