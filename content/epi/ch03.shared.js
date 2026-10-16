// Epidemiology & Evidence — Chapter 3 shared helpers (imported by ch03.js and ch03-b.js).
export * from './ch02.shared.js';
import { int, sig3 } from './ch02.shared.js';

/** Odds p/(1−p). */
export const odds = (p) => p / (1 - p);
/** "1 in 25" for a probability (plain text); "1 in 120 000" above 100. */
export function oneIn(p) { if (!(p > 0)) return 'never'; const n = 1 / p; return `1 in ${n >= 99.5 ? int(n) : sig3(n)}`; }
/** Tick set "1 in 10", "1 in 100", … for a log axis of risk. */
export const ONE_IN_TICKS = [[0.3, '1 in 3'], [0.1, '1 in 10'], [0.01, '1 in 100'], [0.001, '1 in 1k'], [1e-4, '1 in 10k'], [1e-5, '1 in 100k']];
/** Log ratio ticks 1/16 … 16. */
export const RATIO_TICKS = [[1 / 16, '1/16'], [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 2, '1/2'], [1, '1'], [2, '2'], [4, '4'], [8, '8'], [16, '16']];

/** Style of icon j (0 … 999) in a block of 1000 people when the first b of them are one kind of case and the next e − b
 *  another: a whole dot per whole person, a faint dot for the fractional person at a boundary (a risk of 1 in 100 000 is
 *  0.01 of a person among 1 000). Returns undefined for a person without the outcome. */
export function riskDot(j, b, e, cBase = 'blue', cExtra = 'red', preferExtra = false) {
  const wB = Math.max(0, Math.min(1, b - j)), wE = Math.max(0, Math.min(1, e - j)) - wB;
  if (wB <= 1e-12 && wE <= 1e-12) return undefined;
  const useE = preferExtra ? wE > 1e-12 : wE > wB;
  const w = useE ? wE : wB;
  return { color: useE ? cExtra : cBase, alpha: Math.min(1, 0.3 + 0.7 * w) };
}

/** A 3×3 exposure × outcome table; returns T with T.fill(cells, opts). */
export function table22(v, s, region, rowLabels, colLabels) {
  return v.table(s, { rows: 3, cols: 3, square: false, cellAspect: 1.55, maxCell: 50, size: 15, labelSize: 12.5, region, rowLabels, colLabels, colLabelColor: (j) => ['red', 'blue', 'ink'][j], rowLabelColor: () => 'ink' });
}
/** Cells [[a, b, a+b], [c, d, c+d], [a+c, b+d, n]] of a 2×2 table. */
export const cells22 = (a, b, c, d) => [[a, b, a + b], [c, d, c + d], [a + c, b + d, a + b + c + d]];
