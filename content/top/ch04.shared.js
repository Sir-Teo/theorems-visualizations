// Topology — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js (plain named exports).
//
//  1. Re-exports of chapter 3's helpers (and through them chapters 1 and 2).
//  2. Open intervals on the line: seeded random covers and the greedy "finite subcover" extractor used by
//     several items (it is exact: for open intervals covering a closed interval, always taking the interval that
//     reaches farthest from the current point gives a minimal subcover).
//  3. Small drawing helpers for stacks of intervals.
export * from './ch03.shared.js';

/** n+1 open intervals (c − r, c + r) centred at k/n of [lo, hi], with r seeded in [rmin, rmax]. Covers when rmin > (hi − lo)/(2n). */
export function randIntervals(rng, n, rmin, rmax, lo = 0, hi = 1) {
  const out = [];
  for (let k = 0; k <= n; k++) { const c = lo + ((hi - lo) * k) / n, r = rmin + (rmax - rmin) * rng(); out.push([c - r, c + r]); }
  return out;
}
/**
 * Greedy subcover of the closed interval [lo, hi] by open intervals [a, b]: from the current point p take the interval
 * containing p that reaches farthest right. Returns {ok, chosen: indices, reach: points p_0=lo, p_1, …, stuck}.
 * When ok is false, `stuck` is the first point that no interval contains.
 */
export function greedyCover(ints, lo, hi) {
  const chosen = [], reach = [lo]; let p = lo;
  for (let guard = 0; guard < ints.length + 2; guard++) {
    let best = -1;
    for (let i = 0; i < ints.length; i++) { const [a, b] = ints[i]; if (a < p && p < b && (best < 0 || b > ints[best][1])) best = i; }
    if (best < 0) return { ok: false, chosen, reach, stuck: p };
    chosen.push(best); p = ints[best][1]; reach.push(p);
    if (p > hi) return { ok: true, chosen, reach };
  }
  return { ok: false, chosen, reach, stuck: p };
}
/** Is the point x in some open interval of the list? */
export const coveredBy = (ints, x) => ints.some(([a, b]) => a < x && x < b);
/** Draw open intervals as thin bars at heights y0 + k·dy (k = row). `rows` maps interval index → row; colours by `col(i)`. */
export function drawBars(s, ints, rowOf, y0, dy, col, { width = 3, alpha = 1, r = 2.6, clip } = {}) {
  ints.forEach(([a, b], i) => {
    const y = y0 + dy * rowOf(i), c = col(i);
    if (c == null) return;
    const A = clip ? Math.max(a, clip[0]) : a, B = clip ? Math.min(b, clip[1]) : b;
    s.line(A, y, B, y, { color: c, width, alpha, cap: 'butt' });
    if (!clip || a >= clip[0]) s.dot(a, y, { r, hollow: true, color: c, width: 1.3, alpha });
    if (!clip || b <= clip[1]) s.dot(b, y, { r, hollow: true, color: c, width: 1.3, alpha });
  });
}
export const CYC = ['blue', 'orange', 'green', 'pink', 'purple', 'teal'];
export const mn = (s) => s.replace(/-/g, '−');
