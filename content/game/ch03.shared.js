// Game Theory & Social Choice — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
// Re-exports the Chapter 2 helpers (simplex triangle, mixed-strategy payoffs, preset games).
// Zero-sum conventions: A[i][j] is the payoff to the ROW player (blue, maximiser); the COLUMN player (orange) pays it
// and so minimises. Mixed strategies x (rows) and y (columns) are probability vectors.
import { idx } from './ch02.shared.js';
export * from './ch02.shared.js';

/**
 * Linear programme  max c.x  s.t.  A x <= b, x >= 0   (requires b >= 0, so the slack basis is feasible).
 * Dense tableau, Bland's rule (never cycles). Returns { x, obj, dual, pivots } (dual = shadow prices of the rows).
 */
export function lpMax(c, A, b, maxIt = 20000) {
  const m = A.length, n = c.length, W = n + m + 1;
  const T = A.map((r, i) => [...r, ...idx(m).map((k) => (k === i ? 1 : 0)), b[i]]);
  const z = [...c.map((t) => -t), ...new Array(m).fill(0), 0];
  const basis = idx(m).map((i) => n + i);
  let pivots = 0;
  while (pivots < maxIt) {
    let e = -1;
    for (let j = 0; j < n + m; j++) if (z[j] < -1e-10) { e = j; break; }
    if (e < 0) break;
    let r = -1, best = Infinity;
    for (let i = 0; i < m; i++) if (T[i][e] > 1e-10) {
      const t = T[i][W - 1] / T[i][e];
      if (t < best - 1e-12 || (Math.abs(t - best) <= 1e-12 && basis[i] < basis[r])) { best = t; r = i; }
    }
    if (r < 0) return { unbounded: true, pivots };
    const pv = T[r][e]; for (let k = 0; k < W; k++) T[r][k] /= pv;
    for (let i = 0; i < m; i++) if (i !== r && T[i][e] !== 0) { const f = T[i][e]; for (let k = 0; k < W; k++) T[i][k] -= f * T[r][k]; }
    const f = z[e]; for (let k = 0; k < W; k++) z[k] -= f * T[r][k];
    basis[r] = e; pivots++;
  }
  const x = new Array(n).fill(0);
  basis.forEach((bv, i) => { if (bv < n) x[bv] = T[i][W - 1]; });
  return { x, obj: z[W - 1], dual: idx(m).map((i) => z[n + i]), pivots };
}

/**
 * Value and optimal mixed strategies of the zero-sum matrix game A (row player maximises), by linear programming:
 * shift A to B = A + s >= 1, then  max sum z, B z <= 1  gives y = z / sum z, and its dual gives x. v = 1/sum z - s.
 * Returns { v, x, y, s, z, w, obj, pivots }.
 */
export function solveZS(A) {
  const m = A.length, n = A[0].length;
  const s = 1 - Math.min(...A.flat());
  const B = A.map((r) => r.map((a) => a + s));
  const res = lpMax(new Array(n).fill(1), B, new Array(m).fill(1));
  const tot = res.obj, v = 1 / tot - s;
  const z = res.x, w = res.dual;
  return { v, x: w.map((t) => t / tot), y: z.map((t) => t / tot), s, z, w, obj: tot, pivots: res.pivots };
}

/** Pure-strategy security levels: row minima, column maxima, maxmin, minmax and the saddle points. */
export function zsPure(A) {
  const rowMin = A.map((r) => Math.min(...r)), colMax = A[0].map((_, j) => Math.max(...A.map((r) => r[j])));
  const maxmin = Math.max(...rowMin), minmax = Math.min(...colMax), saddles = [];
  A.forEach((r, i) => r.forEach((a, j) => { if (a === rowMin[i] && a === colMax[j]) saddles.push([i, j]); }));
  return { rowMin, colMax, maxmin, minmax, saddles };
}

/** Row player's guarantee g(x) = min_j (x^T A)_j and column player's ceiling h(y) = max_i (A y)_i. */
export const guarantee = (A, x) => Math.min(...A[0].map((_, j) => x.reduce((s, xi, i) => s + xi * A[i][j], 0)));
export const ceiling = (A, y) => Math.max(...A.map((r) => r.reduce((s, a, j) => s + a * y[j], 0)));

/** Named matrix games (copies are made by the callers). */
export const ZS = {
  saddle: { label: 'saddle point', A: [[1, 2, 6], [4, 3, 5], [7, 1, 0]] },
  twosad: { label: 'several saddles', A: [[2, 2, 5], [2, 2, 4], [0, 1, 3]] },
  pennies: { label: 'Matching Pennies', A: [[1, -1], [-1, 1]] },
  rps: { label: 'Rock–Paper–Scissors', A: [[0, -1, 1], [1, 0, -1], [-1, 1, 0]] },
  wide: { label: '3 × 4 game', A: [[3, -2, 4, -1], [-3, 2, -1, 1], [0, 1, -2, 2]] },
  skew: { label: 'skew 2 × 2', A: [[2, -3], [-1, 4]] },
};
export const copyM = (A) => A.map((r) => r.slice());

// ---------- drawing a matrix game ----------
/** Stage window for an m x n matrix drawn by drawMat (cell (i, j) = x in [j, j+1], y in [m-i-1, m-i]). */
export const matWindow = (m, n) => ({ x: [-1.5, n + 1.9], y: [-1.7, m + 0.7] });
/** Which cell [i, j] the data point (x, y) is in (null outside). */
export function matCell(x, y, m, n) {
  const j = Math.floor(x), i = m - 1 - Math.floor(y);
  return x >= 0 && x < n && y >= 0 && y < m && i >= 0 && i < m && j >= 0 && j < n ? [i, j] : null;
}
const sgnTxt = (a) => (Math.abs(a) < 1e-9 ? '0' : (a < 0 ? '−' : '') + Math.abs(Math.round(a * 100) / 100));
/**
 * Draw the payoff matrix A (payoffs to the row player: blue shades positive, orange negative).
 * o: rowMin / colMax (draw the security levels at the right / bottom), mark(i,j) → colour | null (outline), sel [i,j] (gold),
 *    fillOf(i,j) → [colour, alpha] to override, rowNames / colNames, amax (colour scale).
 */
export function drawMat(s, A, o = {}) {
  const m = A.length, n = A[0].length, amax = o.amax || Math.max(1, ...A.flat().map(Math.abs));
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const a = A[i][j], x0 = j, y0 = m - i - 1;
    const f = o.fillOf ? o.fillOf(i, j) : [a >= 0 ? 'blue' : 'orange', 0.08 + 0.42 * Math.min(1, Math.abs(a) / amax)];
    s.rect(x0, y0, x0 + 1, y0 + 1, { fill: f[0], fillAlpha: f[1], color: 'muted', width: 1 });
    s.text(sgnTxt(a), x0 + 0.5, y0 + 0.5, { align: 'center', baseline: 'middle', size: 15, weight: 700, color: 'ink' });
  }
  if (o.mark) for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    const c = o.mark(i, j); if (c) s.rect(j + 0.04, m - i - 0.96, j + 0.96, m - i - 0.04, { stroke: true, color: c, width: 3.2, fill: false });
  }
  if (o.sel) s.rect(o.sel[1] + 0.02, m - o.sel[0] - 0.98, o.sel[1] + 0.98, m - o.sel[0] - 0.02, { color: 'gold', width: 3, fill: false });
  const rn = o.rowNames || idx(m).map((i) => `row ${i + 1}`), cn = o.colNames || idx(n).map((j) => `col ${j + 1}`);
  rn.forEach((t, i) => s.text(t, -0.12, m - i - 0.5, { align: 'right', baseline: 'middle', size: 12, weight: 700, color: 'blue' }));
  cn.forEach((t, j) => s.text(t, j + 0.5, m + 0.1, { align: 'center', baseline: 'bottom', size: 12, weight: 700, color: 'orange' }));
  if (o.rowMin) o.rowMin.forEach((t, i) => s.text(sgnTxt(t), n + 0.55, m - i - 0.5, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: o.rowMinHi && o.rowMinHi(i) ? 'green' : 'blue' }));
  if (o.rowMin) s.text('row min', n + 0.55, m + 0.1, { align: 'center', baseline: 'bottom', size: 11.5, color: 'blue' });
  if (o.colMax) o.colMax.forEach((t, j) => s.text(sgnTxt(t), j + 0.5, -0.45, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: o.colMaxHi && o.colMaxHi(j) ? 'green' : 'orange' }));
  if (o.colMax) s.text('column max', -0.12, -0.45, { align: 'right', baseline: 'middle', size: 11.5, color: 'orange' });
}
