// Helpers shared by the parts of Chapter 1 (Markov chains): plain matrix / graph / sampling utilities.

export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };

export const identity = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));

export function matMul(A, B) {
  const n = A.length, m = B[0].length, k = B.length, C = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++) for (let l = 0; l < k; l++) { const a = A[i][l]; if (a) for (let j = 0; j < m; j++) C[i][j] += a * B[l][j]; }
  return C;
}

export function matPow(P, n) {
  let R = identity(P.length), B = P;
  while (n > 0) { if (n & 1) R = matMul(R, B); n >>= 1; if (n) B = matMul(B, B); }
  return R;
}

/** Cumulative row sums (the "intervals of [0,1]" of the random mapping representation). */
export const cumRows = (P) => P.map((r) => { let s = 0; return r.map((x) => (s += x)); });

/** f(i, u): the next state when the uniform draw is u. */
export function nextState(C, i, u) {
  const r = C[i];
  for (let j = 0; j < r.length; j++) if (u < r[j] - 1e-15) return j;
  return r.length - 1;
}

/** Make every row a probability vector (rows with zero mass become absorbing). */
export function rowNormalize(A) {
  return A.map((r, i) => { const s = r.reduce((a, b) => a + b, 0); return s > 0 ? r.map((x) => x / s) : r.map((_, j) => (i === j ? 1 : 0)); });
}

/** (1 − lam) P + lam I. */
export const lazy = (P, lam) => P.map((r, i) => r.map((x, j) => (1 - lam) * x + (i === j ? lam : 0)));

/** Boolean reachability closure (reflexive) of a 0/1 matrix. */
export function closure(A) {
  const n = A.length, R = A.map((r, i) => r.map((x, j) => !!(x || i === j)));
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (R[i][k]) for (let j = 0; j < n; j++) if (R[k][j]) R[i][j] = true;
  return R;
}

/** Communicating classes of a chain with positive-entry pattern A: {comp[i], count, closed[c], members[c]}. */
export function classes(A) {
  const n = A.length, R = closure(A), comp = new Array(n).fill(-1);
  let count = 0;
  for (let i = 0; i < n; i++) if (comp[i] < 0) { for (let j = 0; j < n; j++) if (R[i][j] && R[j][i]) comp[j] = count; count++; }
  const members = Array.from({ length: count }, () => []);
  comp.forEach((c, i) => members[c].push(i));
  const closed = members.map((m, c) => m.every((i) => A[i].every((x, j) => !x || comp[j] === c)));
  return { comp, count, closed, members };
}

/** Period of state i (gcd of the lengths of closed walks through i), 0 if i is never revisited. */
export function periodOf(A, i) {
  const n = A.length, R = closure(A);
  const inC = (j) => R[i][j] && R[j][i];
  const lvl = new Array(n).fill(-1); lvl[i] = 0;
  const q = [i];
  while (q.length) { const u = q.shift(); for (let w = 0; w < n; w++) if (A[u][w] && inC(w) && lvl[w] < 0) { lvl[w] = lvl[u] + 1; q.push(w); } }
  let d = 0;
  for (let u = 0; u < n; u++) if (lvl[u] >= 0) for (let w = 0; w < n; w++) if (A[u][w] && lvl[w] >= 0) d = gcd(d, lvl[u] + 1 - lvl[w]);
  return d;
}

/** BFS level of every state inside the class of i (for colouring cyclic classes mod the period). */
export function levels(A, i) {
  const n = A.length, R = closure(A), lvl = new Array(n).fill(-1); lvl[i] = 0;
  const q = [i];
  while (q.length) { const u = q.shift(); for (let w = 0; w < n; w++) if (A[u][w] && R[i][w] && R[w][i] && lvl[w] < 0) { lvl[w] = lvl[u] + 1; q.push(w); } }
  return lvl;
}

/** Boolean matrix product. */
export function boolMul(A, B) {
  const n = A.length, C = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = 0; i < n; i++) for (let l = 0; l < n; l++) if (A[i][l]) for (let j = 0; j < n; j++) if (B[l][j]) C[i][j] = true;
  return C;
}

/** Positivity patterns of P^1 … P^N (N boolean matrices). */
export function patterns(A, N) {
  const out = []; let cur = A.map((r) => r.map((x) => !!x));
  for (let n = 1; n <= N; n++) { out.push(cur); cur = boolMul(cur, A.map((r) => r.map((x) => !!x))); }
  return out;
}

/** Stationary distribution by Gaussian elimination (unique for an irreducible chain). */
export function stationary(P) {
  const n = P.length, M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === n - 1 ? 1 : P[j][i] - (i === j ? 1 : 0))));
  const b = new Array(n).fill(0); b[n - 1] = 1;
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-14) return null;
    [M[c], M[p]] = [M[p], M[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; if (f) { for (let k = c; k < n; k++) M[r][k] -= f * M[c][k]; b[r] -= f * b[c]; } }
  }
  return b.map((x, i) => x / M[i][i]);
}

export const tvDist = (p, q) => 0.5 * p.reduce((s, x, i) => s + Math.abs(x - q[i]), 0);

/** Positions of n points on a circle (data units), starting at the top and going clockwise. */
export const ringPos = (n, R = 1, a0 = Math.PI / 2) => Array.from({ length: n }, (_, i) => [R * Math.cos(a0 - (2 * Math.PI * i) / n), R * Math.sin(a0 - (2 * Math.PI * i) / n)]);

/** Fraction formatting for edge labels: 0.5 → "0.5", 1 → "1", 0.333 → "0.33". */
export const pfmt = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));

/** Edges (as graph-kit specs) for the positive entries of P. */
export function edgesOf(P, extra) {
  const E = [];
  P.forEach((r, i) => r.forEach((p, j) => { if (p > 1e-12) E.push({ from: i, to: j, w: p, ...(extra ? extra(i, j, p) : {}) }); }));
  return E;
}

/** A TeX bmatrix-free row vector string, e.g. for readouts. */
export const vecTex = (x, d = 3) => '(' + x.map((t) => t.toFixed(d)).join(',\\ ') + ')';

/** Standard examples used in several items. */
export const WEATHER = { names: ['Sun', 'Cloud', 'Rain'], P: [[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.4, 0.4]] };

/** Fixed-rate event clock for animations: due(t, rate) = number of hops owed since the last frame. */
export function makeClock() {
  let last = 0, acc = 0;
  return {
    restarted: false,
    reset() { acc = 0; last = null; this.restarted = false; },
    due(t, rate) {
      this.restarted = false;
      if (last === null) last = t;
      if (t < last - 1e-9) { this.restarted = true; acc = 0; last = t; }
      const dt = Math.min(t - last, 15); last = t; acc += dt * rate;
      const n = Math.min(Math.floor(acc), 6000); acc -= n; if (acc > 1) acc = 0;
      return n;
    },
  };
}


export const STATE_COL = ['blue', 'orange', 'green', 'purple', 'pink', 'teal', 'gold', 'red'];
