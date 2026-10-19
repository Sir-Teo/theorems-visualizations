// Probability: Theory and Examples (Durrett) — Chapter 5, part A (§§5.1–5.3): helpers shared by ch05-a.js and ch05-a2.js.
//
// Finite Markov chains: seeded simulation, communicating classes, exact hitting/absorption probabilities, a node-link drawing
// of a transition matrix, and a small preset library.

export * from './ch03.shared.js';
import { fr } from './ch03.shared.js';

/** Durrett 5.1.5: waiting customers at service entry, excluding the one in service. */
export const serviceEntryQueueStep = (waiting, arrivals) => Math.max(0, waiting + arrivals - 1);
export const serviceEntryQueueMean = (rho, serviceCV2) => rho < 1 ? rho * rho * (1 + serviceCV2) / (2 * (1 - rho)) : Infinity;

// ------------------------------------------------------------------ simulation
/** Cumulative rows of a stochastic matrix. */
export const cumRows = (P) => P.map((row) => { let c = 0; return row.map((p) => (c += p)); });
/** x ↦ next state, sampling with the seeded generator r. */
export function stepper(r, P) {
  const C = cumRows(P), last = P.map((row) => { let k = row.length - 1; while (k > 0 && !(row[k] > 0)) k--; return k; });
  return (x) => { const u = r(), c = C[x]; for (let j = 0; j < c.length; j++) if (u < c[j]) return j; return last[x]; };
}
/** Path X_0..X_n as an Int16Array. */
export function runChain(r, P, x0, n) {
  const st = stepper(r, P), a = new Int16Array(n + 1); a[0] = x0;
  for (let i = 0; i < n; i++) a[i + 1] = st(a[i]);
  return a;
}
/** Draw from a finite distribution given as an array of masses. */
export function drawFrom(r, p) { const u = r(); let c = 0; for (let j = 0; j < p.length; j++) { c += p[j]; if (u < c) return j; } return p.length - 1; }

// ------------------------------------------------------------------ linear algebra and structure
/** Gaussian elimination with partial pivoting: solves A x = b (A square, small). */
export function solveLin(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c]; if (Math.abs(d) < 1e-14) continue;
    for (let i = 0; i < n; i++) if (i !== c) { const f = M[i][c] / d; if (f) for (let j = c; j <= n; j++) M[i][j] -= f * M[c][j]; }
  }
  return M.map((row, i) => (Math.abs(row[i]) < 1e-14 ? 0 : row[n] / row[i]));
}
/** Reachability in ≥ 0 steps (R[i][i] = true) through edges with p > 0. */
export function reach(P) {
  const n = P.length, R = P.map((row, i) => row.map((p, j) => i === j || p > 1e-12));
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (R[i][k]) for (let j = 0; j < n; j++) if (R[k][j]) R[i][j] = true;
  return R;
}
/** Communicating classes: {cls: class index of each state, list: [[states]], closed: [bool], leak: [prob. of leaving] }. */
export function classes(P) {
  const n = P.length, R = reach(P), cls = Array(n).fill(-1), list = [];
  for (let i = 0; i < n; i++) if (cls[i] < 0) { const c = list.length, mem = []; for (let j = 0; j < n; j++) if (R[i][j] && R[j][i]) { cls[j] = c; mem.push(j); } list.push(mem); }
  const closed = list.map((mem) => mem.every((i) => P[i].every((p, j) => p < 1e-12 || cls[j] === cls[i])));
  return { cls, list, closed };
}
/** h[x] = P_x(X_n = y for some n ≥ 0) for a finite chain. */
export function hitProb(P, y) {
  const n = P.length, R = reach(P), U = []; for (let x = 0; x < n; x++) if (x !== y && R[x][y]) U.push(x);
  const h = Array(n).fill(0); h[y] = 1;
  if (U.length) {
    const A = U.map((x, a) => U.map((z, b) => (a === b ? 1 : 0) - P[x][z])), rhs = U.map((x) => P[x][y]);
    solveLin(A, rhs).forEach((v, a) => { h[U[a]] = v; });
  }
  return h;
}
/** ρ_xy = P_x(T_y < ∞), T_y = min{n ≥ 1 : X_n = y}, for all x (the diagonal entry is the return probability). */
export function rhoTo(P, y) {
  const h = hitProb(P, y), rho = h.slice();
  rho[y] = P[y].reduce((s, p, z) => s + p * h[z], 0);
  return rho;
}
/** Probability of ever entering the set Rset from each state (transient part solved exactly). */
export function absorbProb(P, Rset) {
  const n = P.length, isR = Array(n).fill(false); Rset.forEach((i) => { isR[i] = true; });
  const R = reach(P), U = []; for (let x = 0; x < n; x++) if (!isR[x] && Rset.some((r) => R[x][r])) U.push(x);
  const h = Array(n).fill(0); Rset.forEach((i) => { h[i] = 1; });
  if (U.length) {
    const A = U.map((x, a) => U.map((z, b) => (a === b ? 1 : 0) - P[x][z])), rhs = U.map((x) => Rset.reduce((s, r) => s + P[x][r], 0));
    solveLin(A, rhs).forEach((v, a) => { h[U[a]] = v; });
  }
  return h;
}
export const matVecRow = (mu, P) => P[0].map((_, j) => mu.reduce((s, m, i) => s + m * P[i][j], 0));
export function matMulSm(A, B) { return A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0))); }
export function matPowSm(P, k) { let R = P.map((row, i) => row.map((_, j) => (i === j ? 1 : 0))), B = P; while (k > 0) { if (k & 1) R = matMulSm(R, B); B = matMulSm(B, B); k >>= 1; } return R; }
export const normRows = (W) => W.map((row) => { const s = row.reduce((a, b) => a + b, 0) || 1; return row.map((x) => x / s); });

// ------------------------------------------------------------------ presets
/** Five states: {0,1,2} communicate and leak through 2 into the closed class {3,4} with total rate e (e = 0: {0,1,2} closed). */
export function chain5(e = 0.3) {
  return [
    [0.2, 0.5, 0.3, 0, 0],
    [0.4, 0.1, 0.5, 0, 0],
    [0.25 * (1 - e), 0.35 * (1 - e), 0.4 * (1 - e), e * 0.5, e * 0.5],
    [0, 0, 0, 0.5, 0.5],
    [0, 0, 0, 0.6, 0.4],
  ];
}
/** Seven states: transient {0,1,2}, closed classes {3,4} and {5,6}. */
export const CHAIN7 = [
  [0.2, 0.3, 0.2, 0.2, 0, 0.1, 0],
  [0.3, 0.1, 0.3, 0, 0.1, 0, 0.2],
  [0, 0.4, 0.2, 0, 0.2, 0.2, 0],
  [0, 0, 0, 0.3, 0.7, 0, 0],
  [0, 0, 0, 0.6, 0.4, 0, 0],
  [0, 0, 0, 0, 0, 0.5, 0.5],
  [0, 0, 0, 0, 0, 0.8, 0.2],
];
/** Class colours (palette names), indexed by class number. */
export const CLS_COL = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'blue'];

// ------------------------------------------------------------------ drawing a chain
/** Positions of n states on a circle of radius R (first state at the top). */
export const ringPos = (n, R = 1) => Array.from({ length: n }, (_, i) => { const a = Math.PI / 2 - (2 * Math.PI * i) / n; return [R * Math.cos(a), R * Math.sin(a)]; });
/**
 * Node-link picture of a transition matrix on a stage with equal: true, x,y ∈ ±1.5.
 * opts: {pos, fills[i] colour name, rings[i] bool (thick outline), labels (probabilities), cur (highlighted state), minP}
 */
export function drawChain(S, P, o = {}) {
  const n = P.length, pos = o.pos || ringPos(n, 1.05), rN = 0.2, minP = o.minP ?? 0.004;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const p = P[i][j]; if (p < minP) continue;
    const w = 0.8 + 4.2 * Math.sqrt(p), col = o.edgeCol ? o.edgeCol(i, j) : 'muted';
    if (i === j) {
      const [x, y] = pos[i], d = Math.hypot(x, y) || 1, cx = x + (x / d) * (rN + 0.06), cy = y + (y / d) * (rN + 0.06);
      S.circle(cx, cy, 0.11, { color: col, width: w, alpha: 0.85 });
      if (o.labels && p >= 0.05 && (o.labelRow == null || o.labelRow === i)) S.text(fr(p, 2), cx + (x / d) * 0.24, cy + (y / d) * 0.24, { size: 10, color: 'muted', align: 'center', baseline: 'middle' });
      continue;
    }
    const [x1, y1] = pos[i], [x2, y2] = pos[j], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * 0.07, ny = ux * 0.07;
    S.arrow(x1 + ux * rN + nx, y1 + uy * rN + ny, x2 - ux * (rN + 0.02) + nx, y2 - uy * (rN + 0.02) + ny, { color: col, width: w, alpha: 0.85, head: 8 });
    if (o.labels && p >= 0.05 && (o.labelRow == null || o.labelRow === i)) S.text(fr(p, 2), (x1 + x2) / 2 + nx * 2.6, (y1 + y2) / 2 + ny * 2.6, { size: 10, color: 'muted', align: 'center', baseline: 'middle' });
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pos[i], c = o.fills ? o.fills[i] : 'accent';
    S.circle(x, y, rN, { fill: c, fillAlpha: o.cur === i ? 0.7 : 0.28, color: c, width: o.rings && o.rings[i] ? 4 : 1.6 });
    S.text(String(o.names ? o.names[i] : i), x, y, { size: 14, color: 'ink', align: 'center', baseline: 'middle' });
  }
}
/** Nearest state to a click, or -1. */
export function nodeAt(pos, x, y, rad = 0.3) { let b = -1, bd = rad; pos.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; b = i; } }); return b; }
/** Matrix heat-grid on a stage whose window is [0, ncols] × [0, nrows] (row 0 on top). */
export function drawMatrix(v, S, A, o = {}) {
  const m = A.length, n = A[0].length, ox = o.x0 || 0, oy = o.y0 || 0, hi = o.hi ?? 1;
  A.forEach((row, i) => row.forEach((a, j) => {
    const x = ox + j, y = oy + m - 1 - i;
    const hl = o.hl && o.hl(i, j);
    S.rect(x + 0.04, y + 0.04, x + 0.96, y + 0.96, { fill: v.ramp(Math.min(1, a / hi), o.color || 'accent'), fillAlpha: 1, color: hl ? 'gold' : 'faint', width: hl ? 3 : 0.8 });
    S.text(fr(a, o.d ?? 2), x + 0.5, y + 0.5, { size: o.size || 11, color: 'ink', align: 'center', baseline: 'middle' });
  }));
}
