// Helpers for the independently audited exchangeability and walk examples.
export function finitePairProbabilities(red, n) {
  return [red * (red - 1), 2 * red * (n - red), (n - red) * (n - red - 1)].map(x => x / (n * (n - 1)));
}
export function coinMixtureSample(r, theta, n, runLength = 8) {
  let total = 0, run = 0;
  for (let i = 0; i < Math.max(n, runLength); i++) {
    const x = r() < theta ? 1 : 0;
    if (i < n) total += x;
    if (i < runLength && run === i && x) run++;
  }
  return {frequency: total / n, run};
}
export function inclusiveHistogram(values, low, high, bins) {
  const counts = new Float64Array(bins), width = (high - low) / bins;
  for (const x of values) if (x >= low && x <= high) counts[Math.min(bins - 1, Math.floor((x - low) / width))]++;
  return {edges: Array.from({length: bins + 1}, (_, i) => low + i * width), counts: Array.from(counts), density: Array.from(counts, c => c / (values.length * width))};
}
export const arcsineCdf = x => 2 / Math.PI * Math.asin(Math.sqrt(Math.min(1, Math.max(0, x))));
export const arcsineBinDensity = bins => Array.from({length: bins}, (_, i) => bins * (arcsineCdf((i + 1) / bins) - arcsineCdf(i / bins)));
export function plotStepCdf(stage, masses, color) {
  let c = 0; const pts = [[0, 0]];
  for (let k = 0; k < masses.length; k++) { const x = k / (masses.length - 1); pts.push([x, c]); c += masses[k]; pts.push([x, c]); }
  stage.path(pts, {color, width: 2});
}
export function exactChoose(n, k) {
  if (!Number.isInteger(k) || k < 0 || k > n) return 0;
  let c = 1; for (let i = 1; i <= Math.min(k, n-k); i++) c = c * (n-i+1) / i;
  return Math.round(c);
}
