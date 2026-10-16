// Helpers shared by the parts of Chapter 3 (recurrence, transience and branching).
export * from './ch02.shared.js';
import { hitProb, nextState, cumRows } from './ch02.shared.js';

// ───────────────────────────── a six-state chain with a leak (items 3.1–3.4)
/** States 0,1,2 form a class that leaks into the closed class {3,4} from state 2 with probability L; state 5 is a transient feeder. */
export function leakChain(L) {
  return [
    [0, 0.6, 0.4, 0, 0, 0],
    [0.5, 0, 0.5, 0, 0, 0],
    [(1 - L) * 0.5, (1 - L) * 0.5, 0, L, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0.6, 0.4, 0],
    [0.5, 0, 0, 0, 0, 0.5],
  ];
}
export const LEAK_POS = [[2.2, 3.2], [4.2, 5.2], [4.2, 1.0], [7.4, 1.0], [9.2, 3.2], [1.0, 5.4]];

/** Exact return probability rho_i = P_i(T_i < infinity) for every state (first-step analysis: sum_j p_ij h_j with h = hitting probability of {i}). */
export function returnProbs(P) {
  return P.map((row, i) => {
    const tgt = P.map((_, j) => j === i);
    const h = hitProb(P, tgt);
    return Math.min(1, row.reduce((s, p, j) => s + p * h[j], 0));
  });
}

/** One path of length n from x0 (returns Int16Array of states, including the start). */
export function pathOf(P, R, x0, n) {
  const C = cumRows(P), out = new Int16Array(n + 1); out[0] = x0;
  for (let t = 1; t <= n; t++) out[t] = nextState(C, out[t - 1], R());
  return out;
}

// ───────────────────────────── simple random walk on Z^d (items 3.5, 3.6, 3.8, 3.13)
const lfTab = [0];
function lf(n) { while (lfTab.length <= n) lfTab.push(lfTab[lfTab.length - 1] + Math.log(lfTab.length)); return lfTab[n]; }
const lbin = (n, k) => lf(n) - lf(k) - lf(n - k);
const cacheU = new Map();
/** u[n] = P_0(S_{2n} = 0) for simple random walk on Z^d, n = 0..N (exact, by splitting off one coordinate at a time). */
export function uSeq(d, N) {
  const key = d + ':' + N; if (cacheU.has(key)) return cacheU.get(key);
  const u1 = new Float64Array(N + 1); u1[0] = 1;
  for (let n = 1; n <= N; n++) u1[n] = u1[n - 1] * (2 * n - 1) / (2 * n);
  let u = u1;
  for (let D = 2; D <= d; D++) {
    const w = new Float64Array(N + 1), lp = Math.log(1 / D), lq = Math.log(1 - 1 / D);
    for (let n = 0; n <= N; n++) {
      let s = 0;
      for (let k = 0; k <= n; k++) s += Math.exp(lbin(2 * n, 2 * k) + 2 * k * lp + (2 * n - 2 * k) * lq) * u1[k] * u[n - k];
      w[n] = s;
    }
    u = w;
  }
  cacheU.set(key, u);
  return u;
}
/** Probability that the walk has returned to 0 at some time <= 2n: F[n], n = 0..N, from the renewal equation u = 1 + f * u. */
export function returnedBy(u) {
  const N = u.length - 1, f = new Float64Array(N + 1), F = new Float64Array(N + 1);
  for (let n = 1; n <= N; n++) {
    let s = u[n]; for (let k = 1; k < n; k++) s -= f[k] * u[n - k];
    f[n] = s; F[n] = F[n - 1] + s;
  }
  return { f, F };
}
/** Pólya's return probabilities for d = 1..4 (d = 3: Watson 1939, McCrea–Whipple 1940; table of Montroll 1956 as quoted by MathWorld). */
export const POLYA_P = { 1: 1, 2: 1, 3: 0.340537, 4: 0.193206 };

/** Simulate M walkers on Z^d for T steps. Returns {first: Int32Array of first-return times (0 = none within T), pos: Int16Array [t][w][axis] if keep}. */
export function simWalkersZd(R, d, M, T, keep) {
  const first = new Int32Array(M), x = new Int16Array(M * d);
  const pos = keep ? new Int16Array((T + 1) * M * d) : null;
  for (let t = 1; t <= T; t++) {
    for (let w = 0; w < M; w++) {
      const r = Math.floor(R() * 2 * d), ax = r >> 1, b = w * d;
      x[b + ax] += r & 1 ? 1 : -1;
      if (!first[w]) { let z = true; for (let a = 0; a < d; a++) if (x[b + a]) { z = false; break; } if (z) first[w] = t; }
    }
    if (keep) pos.set(x, t * M * d);
  }
  return { first, pos };
}

// ───────────────────────────── branching processes (items 3.9–3.12)
/** Offspring laws with mean m: Poisson, binary (0 or 2 children), geometric on {0,1,2,...}. Returned as a probability vector. */
export function offspring(kind, m, K = 30) {
  let p = new Array(K + 1).fill(0);
  if (kind === 'poisson') { p[0] = Math.exp(-m); for (let k = 1; k <= K; k++) p[k] = p[k - 1] * m / k; }
  else if (kind === 'binary') { const q = Math.min(1, m / 2); p[0] = 1 - q; p[2] = q; }
  else { const q = m / (1 + m); p[0] = 1 - q; for (let k = 1; k <= K; k++) p[k] = p[k - 1] * q; }
  const s = p.reduce((a, b) => a + b, 0);
  return p.map((x) => x / s);
}
export const meanOf = (p) => p.reduce((s, x, k) => s + k * x, 0);
export const pgf = (p, s) => { let r = 0; for (let k = p.length - 1; k >= 0; k--) r = r * s + p[k]; return r; };
/** Smallest fixed point of the pgf in [0,1] (monotone iteration from 0). */
export function extinction(p) {
  if (meanOf(p) <= 1 + 1e-12) return 1;
  let s = 0;
  for (let i = 0; i < 400000; i++) { const t = pgf(p, s); if (Math.abs(t - s) < 1e-15) { s = t; break; } s = t; }
  return s;
}
export const cumOf = (p) => { let s = 0; return p.map((x) => (s += x)); };
export function draw(C, u) { for (let k = 0; k < C.length; k++) if (u < C[k]) return k; return C.length - 1; }

/** Grow a Galton–Watson tree breadth-first: nodes {gen, parent, kids:[]}, stopped at maxGen generations or maxNodes nodes. */
export function growTree(p, R, maxGen, maxNodes) {
  const C = cumOf(p), nodes = [{ gen: 0, parent: -1, kids: [], open: false }];
  let frontier = [0];
  for (let g = 0; g < maxGen && frontier.length; g++) {
    const next = [];
    for (const i of frontier) {
      if (nodes.length >= maxNodes) { nodes[i].open = true; continue; }
      const k = draw(C, R());
      for (let c = 0; c < k && nodes.length < maxNodes; c++) { nodes.push({ gen: g + 1, parent: i, kids: [], open: false }); nodes[i].kids.push(nodes.length - 1); next.push(nodes.length - 1); }
    }
    frontier = next;
  }
  for (const i of frontier) nodes[i].open = true; // alive at the cut-off
  return nodes;
}
/** Tidy tree layout: leaves get consecutive x, a parent sits above the mean of its children. Writes node.x, node.y = -gen. */
export function layoutTree(nodes) {
  let leaf = 0;
  const go = (i) => {
    const n = nodes[i];
    if (!n.kids.length) { n.x = leaf++; } else { n.kids.forEach(go); n.x = (nodes[n.kids[0]].x + nodes[n.kids[n.kids.length - 1]].x) / 2; }
    n.y = -n.gen;
  };
  go(0);
  return leaf;
}
/** Preorder (depth-first) visit order of a tree stored with kids lists. */
export function preorder(nodes) {
  const out = [], st = [0];
  while (st.length) { const i = st.pop(); out.push(i); for (let k = nodes[i].kids.length - 1; k >= 0; k--) st.push(nodes[i].kids[k]); }
  return out;
}
/** Simulate generation sizes Z_0..Z_G, stopping once Z exceeds cap (the rest is set to NaN so it can be drawn as "escaped"). */
export function simGen(C, R, G, cap) {
  const z = [1];
  for (let g = 0; g < G; g++) {
    const prev = z[g];
    if (!(prev <= cap) || prev === 0) { z.push(prev === 0 ? 0 : NaN); continue; }
    let s = 0; for (let i = 0; i < prev; i++) s += draw(C, R());
    z.push(s);
  }
  return z;
}
/** P(total progeny = n) = (1/n) P(xi_1+...+xi_n = n-1) for n = 1..N (Otter–Dwass / hitting-time theorem), by repeated convolution. */
export function progenyLaw(p, N) {
  const out = new Array(N + 1).fill(0);
  let cur = new Array(N + 1).fill(0); cur[0] = 1;
  for (let n = 1; n <= N; n++) {
    const nx = new Array(N + 1).fill(0);
    for (let a = 0; a <= N; a++) if (cur[a]) for (let k = 0; k < p.length && a + k <= N; k++) nx[a + k] += cur[a] * p[k];
    cur = nx; out[n] = cur[n - 1] / n;
  }
  return out;
}
/** Distribution of Z_r exactly (coefficients up to degree D) by composing the pgf r times as a polynomial. */
export function genDist(p, r, D) {
  let cur = [0, 1]; // Z_0 = 1: polynomial s
  const trunc = (a) => a.slice(0, D + 1);
  for (let g = 0; g < r; g++) {
    // new = f(cur) = sum_k p_k cur^k, Horner
    let res = [p[p.length - 1]];
    for (let k = p.length - 2; k >= 0; k--) {
      const prod = new Array(Math.min(D, res.length + cur.length - 2) + 1).fill(0);
      for (let i = 0; i < res.length; i++) if (res[i]) for (let j = 0; j < cur.length && i + j <= D; j++) prod[i + j] += res[i] * cur[j];
      prod[0] += p[k]; res = prod;
    }
    cur = trunc(res);
  }
  return cur;
}
