// Helpers shared by the parts of Chapter 4 (stationary distributions and convergence).
export * from './ch03.shared.js';
import { stationary, matMul, solveLin, cumRows, nextState, hitProb, meanHit, rowNormalize } from './ch03.shared.js';

/** Row vector times matrix: mu P. */
export const vecP = (mu, P) => P[0].map((_, j) => mu.reduce((s, m, i) => s + m * P[i][j], 0));
export const l1 = (a, b) => a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0);
export const tv = (a, b) => 0.5 * l1(a, b);
export const unit = (n, i) => Array.from({ length: n }, (_, j) => (j === i ? 1 : 0));

/** Mean return time E_x T_x^+ (exact, first-step analysis). */
export function meanReturn(P, x) {
  const tgt = P.map((_, i) => i === x), h = hitProb(P, tgt), k = meanHit(P, tgt, h);
  return 1 + P[x].reduce((s, p, j) => s + (j === x ? 0 : p * k[j]), 0);
}

/** Simulate `N` excursions from x; returns {mean, expVisits[] (average visits to each state before returning), cap hits}. */
export function simExcursions(P, x, N, R, cap = 5000) {
  const C = cumRows(P), n = P.length, vis = new Array(n).fill(0);
  let tot = 0, done = 0;
  for (let e = 0; e < N; e++) {
    let s = x, t = 0; vis[x]++;
    do { s = nextState(C, s, R()); t++; if (s !== x) vis[s]++; } while (s !== x && t < cap);
    tot += t; if (s === x) done++;
  }
  return { mean: tot / N, vis: vis.map((c) => c / N), done };
}

/** Expected visits nu_y to y during an excursion from x (exact; nu_x = 1): nu = e_x + nu P restricted off x. */
export function excursionMeasure(P, x) {
  const n = P.length, idx = [...Array(n).keys()].filter((i) => i !== x);
  const nu = new Array(n).fill(0); nu[x] = 1;
  if (!idx.length) return nu;
  const A = idx.map((y, a) => idx.map((z, b) => (a === b ? 1 : 0) - P[z][y]));
  const rhs = idx.map((y) => P[x][y]);
  const sol = solveLin(A, rhs);
  if (sol) idx.forEach((y, a) => { nu[y] = sol[a]; });
  return nu;
}

/** A seeded random irreducible chain on n states with some zero entries. */
export function randomChain(n, seed, v, zeroFrac = 0.25) {
  const R = v.rng(seed);
  for (let tries = 0; tries < 50; tries++) {
    const P = rowNormalize(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => { const u = R(); return (i === (j + 1) % n || u > zeroFrac) ? (0.1 + R()) ** 2 : 0; })));
    return P;
  }
}

/** Simplex coordinates for three-state laws: vertices (0,0), (1,0), (1/2, sqrt(3)/2). */
export const SIMP = [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]];
export const simplexXY = (m) => [m[0] * SIMP[0][0] + m[1] * SIMP[1][0] + m[2] * SIMP[2][0], m[0] * SIMP[0][1] + m[1] * SIMP[1][1] + m[2] * SIMP[2][1]];
export function simplexMu(x, y) {
  const m2 = y / SIMP[2][1], m1 = x - 0.5 * m2, m0 = 1 - m1 - m2;
  let m = [m0, m1, m2].map((t) => Math.max(0, t)); const s = m[0] + m[1] + m[2] || 1;
  return m.map((t) => t / s);
}

/** Spanning in-trees (arborescences) towards root r of the digraph with positive entries of P (self-loops ignored): list of parent arrays. */
export function arborescences(P, r) {
  const n = P.length, out = [], par = new Array(n).fill(-1);
  const nonroot = [...Array(n).keys()].filter((i) => i !== r);
  function acyclic() {
    for (const i of nonroot) { let j = i, steps = 0; while (j !== r && steps <= n) { j = par[j]; steps++; } if (j !== r) return false; }
    return true;
  }
  (function rec(k) {
    if (k === nonroot.length) { if (acyclic()) out.push(par.slice()); return; }
    const i = nonroot[k];
    for (let j = 0; j < n; j++) if (j !== i && P[i][j] > 0) { par[i] = j; rec(k + 1); }
    par[i] = -1;
  })(0);
  return out;
}
export const treeWeight = (P, par) => par.reduce((w, j, i) => (j >= 0 ? w * P[i][j] : w), 1);

/** Time-reversed chain Phat(x,y) = pi(y) P(y,x) / pi(x). */
export const reverseChain = (P, pi) => P.map((_, x) => P.map((__, y) => (pi[x] > 0 ? (pi[y] * P[y][x]) / pi[x] : 0)));

/** Distribution at time t from every start: rows of P^t via repeated products (cached list up to T). */
export function powers(P, T) {
  const out = [P.map((r, i) => r.map((_, j) => (i === j ? 1 : 0)))];
  for (let t = 1; t <= T; t++) out.push(matMul(out[t - 1], P));
  return out;
}

/** Random walk on an undirected graph given by adjacency lists: transition matrix. */
export function walkMatrix(adj, lazyP = 0) {
  return adj.map((nb, i) => { const r = new Array(adj.length).fill(0); if (!nb.length) { r[i] = 1; return r; } nb.forEach((j) => { r[j] += (1 - lazyP) / nb.length; }); r[i] += lazyP; return r; });
}

/** Chain presets used in several items. */
export function presetChain(kind, seed, v) {
  if (kind === 'weather') return { names: ['Sun', 'Cloud', 'Rain'], P: [[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.4, 0.4]] };
  if (kind === 'path') return { names: ['0', '1', '2', '3'], P: [[0.5, 0.5, 0, 0], [0.25, 0.5, 0.25, 0], [0, 0.25, 0.5, 0.25], [0, 0, 0.5, 0.5]] };
  if (kind === 'rooms') return { names: ['A', 'B', 'C', 'D'], P: [[0.45, 0.5, 0.05, 0], [0.5, 0.4, 0.1, 0], [0, 0.1, 0.4, 0.5], [0, 0.05, 0.5, 0.45]] };
  if (kind === 'rotor') return { names: ['0', '1', '2'], P: [[0.1, 0.8, 0.1], [0.1, 0.1, 0.8], [0.8, 0.1, 0.1]] };
  const P = randomChain(5, seed, v);
  return { names: ['a', 'b', 'c', 'd', 'e'], P };
}
