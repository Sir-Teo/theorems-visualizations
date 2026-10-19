// Modern illustrative models; these are not fitted historical data.
const nodes = Array.from({ length: 161 }, (_, i) => -8 + i / 10);
const weights = nodes.map(z => Math.exp(-z * z / 2));
const weightSum = weights.reduce((a, b) => a + b, 0);

/** Gaussian quadrature on [-8,8] standard deviations, with exact degenerate cases. */
export function lotteryInvasionRate(mean, sigma, delta, correlation) {
  if (delta === 1) return mean;
  const sd = sigma * Math.sqrt(2 * (1 - correlation));
  const logGrowth = x => Math.log1p(delta * Math.expm1(x));
  if (sd === 0) return logGrowth(mean);
  return nodes.reduce((s, z, i) => s + weights[i] * logGrowth(mean + sd * z), 0) / weightSum;
}

/** Equal-K branch avoids cancellation as two symmetric trait means coincide. */
export function traitCompetitionAbundances(K1, K2, overlap) {
  if (K1 === K2) return [K1 / (1 + overlap), K2 / (1 + overlap)];
  const det = (1 - overlap) * (1 + overlap);
  return [(K1 - overlap * K2) / det, (K2 - overlap * K1) / det];
}

export function colonizationEquilibrium(c1, c2, mortality, destruction) {
  const p1 = Math.max(0, 1 - destruction - mortality / c1);
  const p2 = p1 > 0 ? Math.max(0, mortality / c1 - c1 / c2 * (1 - destruction))
    : Math.max(0, 1 - destruction - mortality / c2);
  return [p1, p2];
}
