// Authored daily Gaussian spread model; not Shleifer–Vishny's three-date economy.
export function arbitrageGap(m0, kappa, sigma, normal, days = 250) {
  const a = Math.exp(-kappa), path = [m0], prefixMaximum = [m0];
  for (let t = 1; t <= days; t++) {
    const x = a * path[t - 1] + sigma * normal();
    path.push(x); prefixMaximum.push(Math.max(prefixMaximum[t - 1], x));
  }
  return { path, prefixMaximum, a };
}

export function arbitrageOutcome(gap, leverage, margin, includeHistory = true) {
  const path = gap.path, initial = path[0];
  if (!(leverage > 0) || !(margin >= 0)) throw new RangeError('Positive leverage and a nonnegative margin are required.');
  // Strict maintenance rule: an initially binding position is not admitted.
  if (leverage * margin >= 1) return { status: 'inadmissible', exitDay: null, threshold: null, wealth: 1, equity: path.map(() => 1) };
  const threshold = initial + 100 / leverage - 100 * margin;
  let exitDay = null;
  if (gap.prefixMaximum.at(-1) >= threshold) {
    let lo = 0, hi = path.length - 1;
    while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (gap.prefixMaximum[mid] >= threshold) hi = mid; else lo = mid + 1; }
    exitDay = lo;
  }
  const end = exitDay ?? path.length - 1, wealth = 1 + leverage * (initial - path[end]) / 100;
  return { status: exitDay === null ? 'open' : 'liquidated', exitDay, threshold, wealth,
    equity: includeHistory ? path.map((x, t) => t > end ? wealth : 1 + leverage * (initial - x) / 100) : undefined };
}

export function arbitrageSample(gaps, leverage, margin) {
  if (leverage * margin >= 1) return { status: 'inadmissible', count: gaps.length };
  const outcomes = gaps.map(g => arbitrageOutcome(g, leverage, margin, false)), count = outcomes.length;
  const liquidated = outcomes.filter(x => x.status === 'liquidated').length;
  const mean = outcomes.reduce((s, x) => s + x.wealth, 0) / count;
  const se = Math.sqrt(outcomes.reduce((s, x) => s + (x.wealth - mean) ** 2, 0) / (count * (count - 1)));
  return { status: 'admissible', count, liquidated, probability: liquidated / count,
    probabilitySE: Math.sqrt(liquidated / count * (1 - liquidated / count) / count), mean, se,
    min: Math.min(...outcomes.map(x => x.wealth)), max: Math.max(...outcomes.map(x => x.wealth)) };
}
