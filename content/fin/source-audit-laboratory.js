// Authored recurrence: not the original double auction or its excess-bid regression.
export const LAB_DIVIDENDS = [0, 0.08, 0.28, 0.60]; // Original Table I, design 4.
export const LAB_PRESETS = [[0.7, 0.07], [0.4, 0.2], [0.15, 0.45]];
export const labFundamental = period => Math.max(0, 16 - period) * 0.24;
export function labSession(beta, kappa, noiseCents, normal) {
  let previous = 1.9, before = 1.6;
  const prices = [];
  for (let t = 1; t <= 15; t++) {
    const pull = kappa + (1 - kappa) * 0.5 * (t / 15) ** 6;
    const price = Math.max(0.02, previous + beta * (previous - before) + pull * (labFundamental(t) - previous) + noiseCents / 100 * normal());
    prices.push(price); before = previous; previous = price;
  }
  return prices;
}
export function labDeviation(prices) {
  const meanFundamental = Array.from({ length: 15 }, (_, j) => labFundamental(j + 1)).reduce((a, b) => a + b, 0) / 15;
  const differences = prices.map((p, j) => p - labFundamental(j + 1));
  return { meanFundamental, rd: differences.reduce((a, b) => a + b, 0) / (15 * meanFundamental),
    rad: differences.reduce((a, b) => a + Math.abs(b), 0) / (15 * meanFundamental),
    peak: Math.max(...prices), peakPeriod: prices.indexOf(Math.max(...prices)) + 1 };
}
export function labMean(sessions) {
  const mean = Array(15).fill(0), m2 = Array(15).fill(0);
  sessions.forEach((path, i) => path.forEach((x, t) => { const d = x - mean[t]; mean[t] += d / (i + 1); m2[t] += d * (x - mean[t]); }));
  return { mean, se: m2.map(x => Math.sqrt(x / ((sessions.length - 1) * sessions.length))) };
}
