// Explicit authored copying chain and separately compounded French monthly portfolio returns.
export const SPECULATION_N = 100;
export const SPECULATION_SWEEPS = 400;
export const speculationPrice = k => 100 * Math.exp(1.2 * (k / SPECULATION_N - .5));
export const monthOrdinal = ym => Math.floor(ym / 100) * 12 + ym % 100 - 1;
export const ordinalMonth = n => Math.floor(n / 12) * 100 + n % 12 + 1;
export function speculationHistorical(d) {
  const start = monthOrdinal(199301), end = monthOrdinal(200512), offset = start - monthOrdinal(196307);
  const returns = [d.ind[4], d.ind[5], Array.from(d.mkt, (x, i) => x + d.rf[i])];
  const dates = Array.from({ length: end - start + 2 }, (_, i) => ordinalMonth(start + i - 1));
  const wealth = returns.map(r => { const path = [1]; for (let i = 0; i <= end - start; i++) path.push(path.at(-1) * (1 + r[offset + i])); return path; });
  const peak = wealth[0].indexOf(Math.max(...wealth[0])), first = peak - 60, last = peak + 36;
  const series = wealth.map(path => ({ full: path, points: path.slice(first, last + 1).map((x, j) => [monthOrdinal(dates[first + j]) / 12, 100 * x / path[peak]]) }));
  return { dates, wealth, series, peak, peakYm: dates[peak], firstYm: dates[first], lastYm: dates[last],
    rise60: wealth[0][peak] / wealth[0][peak - 60] - 1, change30: wealth[0][peak + 30] / wealth[0][peak] - 1 };
}
export function speculationTransition(k, epsilon, mode, N = SPECULATION_N) {
  const reset = mode === 'ind' ? 1 : epsilon, copy = 1 - reset;
  const up = (N - k) / N * (reset / 2 + copy * k / (N - 1));
  const down = k / N * (reset / 2 + copy * (N - k) / (N - 1));
  return { up, down, stay: 1 - up - down };
}
export function speculationStationary(epsilon, mode, N = SPECULATION_N) {
  const weights = [1];
  for (let k = 0; k < N; k++) weights.push(weights[k] * speculationTransition(k, epsilon, mode, N).up / speculationTransition(k + 1, epsilon, mode, N).down);
  const sum = weights.reduce((a, b) => a + b), mass = weights.map(x => x / sum);
  const mean = mass.reduce((s, p, k) => s + p * k / N, 0), variance = mass.reduce((s, p, k) => s + p * (k / N - mean) ** 2, 0);
  const above = mass.reduce((s, p, k) => s + (100 * Math.exp(1.2 * (k / N - .5)) > 130 ? p : 0), 0);
  return { mass, mean, variance, above, shape: mode === 'ind' ? Infinity : epsilon * (N - 1) / (2 * (1 - epsilon)) };
}
export function speculationHistory(epsilon, mode, random, N = SPECULATION_N, sweeps = SPECULATION_SWEEPS) {
  let k = Math.floor(N / 2); const counts = [k], prices = [100 * Math.exp(1.2 * (k / N - .5))];
  for (let t = 1; t <= sweeps; t++) {
    for (let j = 0; j < N; j++) { const { up, down } = speculationTransition(k, epsilon, mode, N), u = random(); if (u < up) k++; else if (u < up + down) k--; }
    counts.push(k); prices.push(100 * Math.exp(1.2 * (k / N - .5)));
  }
  return { counts, prices, minimum: Math.min(...prices), maximum: Math.max(...prices), above: prices.slice(1).filter(p => p > 130).length / sweeps };
}
