// Explicit finite models used by the source-reviewed historical examples.
export const WATSON_BINOMIAL = [243, 405, 270, 90, 15, 1].map(x => x / 1024);
export const WATSON_TERNARY = [1 / 3, 1 / 3, 1 / 3, 0, 0, 0];
export const AUDIT_CYCLES = [[0, 1, 2], [0, 2, 3], [2, 3, 4], [0, 1, 2, 3], [0, 1, 3, 4], [0, 1, 2, 3, 4]];
export function cycleChain(R, theta) {
  const W = Array.from({ length: 5 }, () => Array(5).fill(0));
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) W[i][j] = W[j][i] = .4 + R();
  const twist = (i, j) => [[0, 1], [1, 2], [2, 0]].some(([a, b]) => i === a && j === b) ? 1 : [[1, 0], [2, 1], [0, 2]].some(([a, b]) => i === a && j === b) ? -1 : 0;
  return W.map((r, i) => { const q = r.map((w, j) => w * Math.exp(theta * twist(i, j))), sum = q.reduce((a, b) => a + b); return q.map(x => x / sum); });
}
export const cycleLogRatio = (P, c) => c.reduce((s, a, i) => { const b = c[(i + 1) % c.length]; return s + Math.log(P[a][b]) - Math.log(P[b][a]); }, 0);
export function treeChain(R) {
  const banned = new Set(['0,3', '3,2', '1,0']);
  return Array.from({ length: 4 }, (_, i) => { const w = Array.from({ length: 4 }, (_, j) => i === j || banned.has(i + ',' + j) ? 0 : .2 + R()), sum = w.reduce((a, b) => a + b); return w.map((x, j) => i === j ? .2 : .8 * x / sum); });
}
/** First integer time the mean, started at N, enters N/2 ± sqrt(N). This is not mixing. */
export function ehrenfestBandTime(N) {
  if (N <= 4) return 0;
  return Math.ceil(Math.log(2 / Math.sqrt(N)) / Math.log1p(-2 / N));
}
export function ehrenfestReturns(N, R, count = 150, cap = 1000000) {
  let total = 0, square = 0, censored = 0;
  for (let e = 0; e < count; e++) {
    let k = N, t = 0;
    do { k += R() < k / N ? -1 : 1; t++; } while (k !== N && t < cap);
    if (k !== N) censored++;
    total += t; square += t * t;
  }
  const mean = total / count, se = Math.sqrt(Math.max(0, (square - count * mean * mean) / (count - 1) / count));
  return { mean, se, censored, count, cap };
}
/** Horizontal integer-time CDF, including its jumps (no linear interpolation across jumps). */
export function evenCdfSteps(F) {
  const pts = [[0, F[0]]];
  for (let n = 1; n < F.length; n++) pts.push([2 * n, F[n - 1]], [2 * n, F[n]]);
  return pts;
}
