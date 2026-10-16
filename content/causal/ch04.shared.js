// Causal Inference — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports). Re-exports chapter 3's (which re-export 2's and 1's).
//
// House style: every model is simulated, so the TRUE interventional distribution is available beside what an observer could estimate.
// Two families of models: (1) small binary models whose joint table is computed exactly (binModel / jointP, with an exact
// do-operation that deletes a node's factor), (2) linear-Gaussian structural models whose regression coefficients are exact
// functions of the covariance matrix (popReg). Randomness is seeded.
export * from './ch03.shared.js';
import { logistic, rng, hashStr, parentsOf, solveSmall } from './ch03.shared.js';

/**
 * A binary structural model on nodes 0..n-1 (bit i of a cell index is node i). P(V_i = 1 | pa) = logistic(b_i + Σ w_{p→i}·(2·x_p − 1)).
 * Weights and biases are fixed per edge / node by hashing, so adding an arrow never changes the other mechanisms;
 * `W` ('a>b' → weight) and `B` (node → bias) override them, `scale` multiplies the hashed weights.
 */
export function binModel(n, edges, { seed = 1, scale = 1, W = {}, B = {} } = {}) {
  const pa = parentsOf(n, edges);
  const bias = [], wt = [];
  for (let i = 0; i < n; i++) {
    bias.push(B[i] ?? (rng(hashStr(`b${seed}:${i}`))() - 0.5) * 1.2);
    wt.push(pa[i].map((p) => { const k = `${p}>${i}`; if (W[k] !== undefined) return W[k]; const r = rng(hashStr(`w${seed}:${k}`)); return (r() < 0.5 ? -1 : 1) * (0.9 + r()) * scale; }));
  }
  return { n, edges, pa, bias, wt };
}
/** P(V_i = 1) given the parents' values in cell c. */
export function condP1(m, i, c) { let z = m.bias[i]; m.pa[i].forEach((p, t) => { z += m.wt[i][t] * (2 * ((c >> p) & 1) - 1); }); return logistic(z); }
/** Joint table (2^n cells) of the model; `doMap` ({node: 0|1}) replaces those nodes' mechanisms by constants (truncated factorization). */
export function jointP(m, doMap = {}) {
  const N = 1 << m.n, P = new Float64Array(N);
  for (let c = 0; c < N; c++) {
    let pr = 1;
    for (let i = 0; i < m.n; i++) {
      const bit = (c >> i) & 1;
      if (doMap[i] !== undefined) { if (bit !== doMap[i]) { pr = 0; break; } continue; }
      const q = condP1(m, i, c); pr *= bit ? q : 1 - q;
    }
    P[c] = pr;
  }
  return P;
}
/** Probability that the given nodes take the given values: `fix` = {node: value}. */
export function probOf(P, n, fix) { let s = 0; const ks = Object.keys(fix).map(Number); for (let c = 0; c < P.length; c++) if (ks.every((k) => ((c >> k) & 1) === fix[k])) s += P[c]; return s; }
/** P(target = 1 | given) from a table (NaN if the event has probability 0). */
export function condProb(P, n, target, given) { const d = probOf(P, n, given); return d > 0 ? probOf(P, n, { ...given, [target]: 1 }) / d : NaN; }
/** Draw N cells from a table with a seeded stream and return the empirical table. */
export function sampleTable(P, N, seed) {
  const r = rng(seed * 2654435761 + 99), cum = []; let t = 0; for (let c = 0; c < P.length; c++) { t += P[c]; cum.push(t); }
  const q = new Float64Array(P.length);
  for (let i = 0; i < N; i++) { const u = r() * t; let lo = 0, hi = P.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < u) lo = mid + 1; else hi = mid; } q[lo]++; }
  for (let c = 0; c < q.length; c++) q[c] /= N;
  return q;
}

/** Population regression coefficients of variable y on the list xs (with intercept implicit), from a covariance matrix S. */
export function popReg(S, y, xs) {
  if (!xs.length) return [];
  const A = xs.map((i) => xs.map((j) => S[i][j])), b = xs.map((i) => S[i][y]);
  return solveSmall(A, b);
}
/** Total effect of j on i in the linear SEM with coefficient matrix B (entry [i][j]): ((I − B)^-1)[i][j]. */
export function totalEffect(n, B, i, j) {
  const IB = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, c) => (a === c ? 1 : 0) - B[a][c]));
  const e = new Array(n).fill(0); e[j] = 1;
  return solveSmall(IB, e)[i];
}
/** Sample regression coefficients (with intercept) of y on columns xs, from column arrays X. */
export function sampleReg(X, y, xs) {
  const N = X[0].length, k = xs.length;
  const mx = xs.map((i) => { let s = 0; for (let t = 0; t < N; t++) s += X[i][t]; return s / N; }); let my = 0; for (let t = 0; t < N; t++) my += X[y][t]; my /= N;
  const A = Array.from({ length: k }, () => new Array(k).fill(0)), b = new Array(k).fill(0);
  for (let t = 0; t < N; t++) for (let p = 0; p < k; p++) { const dp = X[xs[p]][t] - mx[p]; b[p] += dp * (X[y][t] - my); for (let q = 0; q < k; q++) A[p][q] += dp * (X[xs[q]][t] - mx[q]); }
  return solveSmall(A, b);
}
/** Names of a set as TeX list. */
export const setTex = (names, Z) => (Z.size ? '\\{' + [...Z].sort((a, b) => a - b).map((i) => names[i]).join(',') + '\\}' : '\\varnothing');
/** Arrow ('a>b') key set of an edge list. */
export const edgeKeySet = (E) => new Set(E.map(([a, b]) => `${a}>${b}`));
