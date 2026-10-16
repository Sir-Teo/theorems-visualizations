// Numerical Linear Algebra — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
//
// LU factorization with or without partial pivoting in simulated p-bit arithmetic (with a step record for the step-through
// players), the Wilkinson growth matrix, random SPD matrices, symbolic Cholesky / minimum degree on sparsity patterns, a
// Bunch–Kaufman LDLᵀ and a small "spy plot" drawing helper.
export * from './ch03.shared.js';
import { arith, fl, flM, flV, flForward, flBack, mm, tp, eye, dot, mv, withSingular, randQ } from './ch03.shared.js';

/**
 * LU factorization PA = LU in p-bit arithmetic (p ≥ 53 = plain doubles). pivot: true = partial pivoting, false = none.
 * A is a list of rows. Returns {L (unit lower), U, perm (row i of PA is row perm[i] of A), rho (growth factor
 * max|u_ij| / max|a_ij|), ok (false on a zero pivot), mult (largest |l_ij|), steps (snapshots of the working matrix with
 * the multipliers stored below the diagonal, one per elimination step, for the step-through players), flops}.
 */
export function luFactor(A0, { pivot = true, p = 53, record = false } = {}) {
  const F = arith(p), n = A0.length, A = flM(A0, p), perm = Array.from({ length: n }, (_, i) => i), steps = [];
  const a0 = Math.max(...A.flat().map(Math.abs)) || 1;
  let ok = true, flops = 0;
  if (record) steps.push({ k: -1, W: A.map((r) => r.slice()), perm: perm.slice(), piv: null, swap: null, kind: 'start' });
  for (let k = 0; k < n - 1; k++) {
    let piv = k;
    if (pivot) for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[piv][k])) piv = i;
    if (record) steps.push({ k, W: A.map((r) => r.slice()), perm: perm.slice(), piv, swap: null, kind: 'pivot' });
    if (piv !== k) { [A[k], A[piv]] = [A[piv], A[k]]; [perm[k], perm[piv]] = [perm[piv], perm[k]]; }
    if (record && piv !== k) steps.push({ k, W: A.map((r) => r.slice()), perm: perm.slice(), piv, swap: [k, piv], kind: 'swap' });
    if (A[k][k] === 0) { ok = false; continue; }
    for (let i = k + 1; i < n; i++) {
      const m = F.div(A[i][k], A[k][k]);
      flops++;
      for (let j = k + 1; j < n; j++) { A[i][j] = F.sub(A[i][j], F.mul(m, A[k][j])); flops += 2; }
      A[i][k] = m;
    }
    if (record) steps.push({ k, W: A.map((r) => r.slice()), perm: perm.slice(), piv, swap: null, kind: 'elim' });
  }
  if (A[n - 1][n - 1] === 0) ok = false;
  const L = A.map((r, i) => r.map((x, j) => (j < i ? x : i === j ? 1 : 0)));
  const U = A.map((r, i) => r.map((x, j) => (j >= i ? x : 0)));
  let mult = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) mult = Math.max(mult, Math.abs(L[i][j]));
  const rho = Math.max(...U.flat().map(Math.abs)) / a0;
  return { L, U, perm, rho, ok, mult, steps, flops };
}
/** Solve Ax = b from a luFactor result in p-bit arithmetic. */
export function luSolveFl(f, b, p) {
  const bp = flV(f.perm.map((i) => b[i]), p);
  return flBack(f.U, flForward(f.L, bp, p), p);
}
/** Residual-based backward error ‖b − Ax‖_∞ / (‖A‖_∞ ‖x‖_∞ ) computed in double precision. */
export function backErr(A, x, b) {
  const r = b.map((bi, i) => bi - dot(A[i], x));
  const nA = Math.max(...A.map((row) => row.reduce((s, t) => s + Math.abs(t), 0)));
  return Math.max(...r.map(Math.abs)) / (nA * Math.max(...x.map(Math.abs)));
}
/** The classic matrix with exponential growth under partial pivoting: 1 on the diagonal and in the last column, −1 below the diagonal. */
export const wilkinsonGrowth = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j === i || j === n - 1 ? 1 : j < i ? -1 : 0)));
/** Random matrix with standard normal entries. */
export const gaussMat = (r, n) => Array.from({ length: n }, () => Array.from({ length: n }, () => r.normal()));
/** Random SPD matrix with eigenvalues spread geometrically between 1 and 1/κ. */
export function randSPD(M, r, n, kappa) {
  const Q = randQ(M, r, n, n), s = Array.from({ length: n }, (_, i) => kappa ** (-(n === 1 ? 0 : i / (n - 1))));
  const A = mm(Q.map((row) => row.map((x, j) => x * s[j])), tp(Q));
  return A.map((row, i) => row.map((x, j) => (x + A[j][i]) / 2));
}
/** Number of significant digits of agreement, as a log10 of relative error (floored). */
export const dig = (e) => Math.max(1e-17, e);

// ---------- sparsity patterns ----------
/** Symbolic Cholesky: boolean pattern of A (n×n, symmetric) under the ordering ord (list: ord[k] = original index of new index k); returns {Lpat (lower triangle incl. diagonal), Apat (permuted pattern), nnzL}. */
export function symbolicChol(pat, ord) {
  const n = ord.length, A = ord.map((i) => ord.map((j) => !!pat[i][j])), Lp = A.map((r) => r.slice());
  for (let k = 0; k < n; k++) {
    const nb = []; for (let i = k + 1; i < n; i++) if (Lp[i][k]) nb.push(i);
    for (const i of nb) for (const j of nb) if (j <= i) Lp[i][j] = true;
  }
  let nnz = 0; const L = Lp.map((r, i) => r.map((x, j) => { const keep = j <= i && x; if (keep) nnz++; return keep; }));
  return { Lpat: L, Apat: A, nnzL: nnz };
}
/** Greedy minimum-degree ordering of a symmetric pattern (ties: lowest index). */
export function minDegree(pat) {
  const n = pat.length, adj = pat.map((r, i) => new Set(r.map((x, j) => (x && j !== i ? j : -1)).filter((j) => j >= 0))), alive = new Set(Array.from({ length: n }, (_, i) => i)), ord = [];
  while (alive.size) {
    let best = -1, bd = 1e9;
    for (const i of alive) if (adj[i].size < bd) { bd = adj[i].size; best = i; }
    const nb = [...adj[best]];
    for (const a of nb) { adj[a].delete(best); for (const b of nb) if (a !== b) adj[a].add(b); }
    alive.delete(best); ord.push(best);
  }
  return ord;
}
/** Pattern of the 5-point Laplacian on a g×g grid (row-major numbering). */
export function gridPattern(g) {
  const n = g * g, P = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let a = 0; a < g; a++) for (let b = 0; b < g; b++) {
    const i = a * g + b; P[i][i] = true;
    for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = a + da, d = b + db; if (c >= 0 && c < g && d >= 0 && d < g) P[i][c * g + d] = true; }
  }
  return P;
}
/** Arrow matrix pattern: dense first row and column plus the diagonal. */
export const arrowPattern = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j || i === 0 || j === 0));
/** Draw a boolean (or value) pattern as filled squares on an equal-aspect stage with window [0,n]×[0,n]; cell (i,j) is row i from the top. */
export function spy(S, P, colorOf, { frame = 'muted' } = {}) {
  const n = P.length, m = P[0].length;
  S.rect(0, 0, m, n, { color: frame, width: 1, stroke: true });
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const c = colorOf(i, j);
    if (c) S.rect(j + 0.08, n - i - 1 + 0.08, j + 0.92, n - i - 0.08, { fill: c, color: c, width: 0.5, fillAlpha: 0.9 });
  }
}

// ---------- Bunch–Kaufman LDLᵀ ----------
/**
 * Symmetric indefinite factorization with the Bunch–Kaufman partial pivoting strategy: P A Pᵀ = L D Lᵀ, D block diagonal with 1×1 and
 * 2×2 blocks. Returns {L, blocks: [{k, size, E}], perm, twoByTwo, breakdown}. With pivoting = false only 1×1 pivots on the diagonal
 * are tried (breakdown = the first step where the pivot is (numerically) zero).
 */
export function ldlt(A0, { pivoting = true } = {}) {
  const n = A0.length, W = A0.map((r) => r.slice()), L = Array.from({ length: n }, () => new Array(n).fill(0)), perm = Array.from({ length: n }, (_, i) => i), blocks = [];
  const alpha = (1 + Math.sqrt(17)) / 8, swap = (a, b) => {
    if (a === b) return;
    [W[a], W[b]] = [W[b], W[a]]; for (const r of W) [r[a], r[b]] = [r[b], r[a]];
    [L[a], L[b]] = [L[b], L[a]]; [perm[a], perm[b]] = [perm[b], perm[a]];
  };
  let k = 0, breakdown = -1;
  while (k < n) {
    let size = 1;
    if (pivoting && k < n - 1) {
      let lam = 0, r = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(W[i][k]) > lam) { lam = Math.abs(W[i][k]); r = i; }
      if (lam > 0 && Math.abs(W[k][k]) < alpha * lam) {
        let sigma = 0; for (let i = k; i < n; i++) if (i !== r) sigma = Math.max(sigma, Math.abs(W[i][r]));
        if (Math.abs(W[k][k]) * sigma >= alpha * lam * lam) size = 1;
        else if (Math.abs(W[r][r]) >= alpha * sigma) { swap(k, r); size = 1; }
        else { swap(k + 1, r); size = 2; }
      }
    }
    if (size === 1) {
      const d = W[k][k];
      if (Math.abs(d) < 1e-13) { if (!pivoting && breakdown < 0) breakdown = k; if (!pivoting) { return { L, blocks, perm, twoByTwo: 0, breakdown, n }; } }
      blocks.push({ k, size: 1, E: [[d]] }); L[k][k] = 1;
      for (let i = k + 1; i < n; i++) L[i][k] = d === 0 ? 0 : W[i][k] / d;
      for (let i = k + 1; i < n; i++) for (let j = k + 1; j < n; j++) W[i][j] -= L[i][k] * d * L[j][k];
    } else {
      const E = [[W[k][k], W[k + 1][k]], [W[k + 1][k], W[k + 1][k + 1]]], det = E[0][0] * E[1][1] - E[0][1] * E[1][0], Ei = [[E[1][1] / det, -E[0][1] / det], [-E[1][0] / det, E[0][0] / det]];
      blocks.push({ k, size: 2, E }); L[k][k] = 1; L[k + 1][k + 1] = 1;
      for (let i = k + 2; i < n; i++) {
        const a = W[i][k], b = W[i][k + 1];
        L[i][k] = a * Ei[0][0] + b * Ei[1][0]; L[i][k + 1] = a * Ei[0][1] + b * Ei[1][1];
      }
      for (let i = k + 2; i < n; i++) for (let j = k + 2; j < n; j++) {
        const li = [L[i][k], L[i][k + 1]], lj = [L[j][k], L[j][k + 1]];
        W[i][j] -= li[0] * (E[0][0] * lj[0] + E[0][1] * lj[1]) + li[1] * (E[1][0] * lj[0] + E[1][1] * lj[1]);
      }
    }
    k += size;
  }
  return { L, blocks, perm, twoByTwo: blocks.filter((b) => b.size === 2).length, breakdown, n };
}
/** D as a full matrix from the blocks. */
export function ldltD(f) {
  const D = Array.from({ length: f.n }, () => new Array(f.n).fill(0));
  for (const b of f.blocks) for (let i = 0; i < b.size; i++) for (let j = 0; j < b.size; j++) D[b.k + i][b.k + j] = b.E[i][j];
  return D;
}
/** Inertia (positive, negative, zero eigenvalue counts) read off the blocks of D. */
export function inertiaOf(f) {
  let pos = 0, neg = 0, zero = 0;
  for (const b of f.blocks) {
    if (b.size === 1) { const d = b.E[0][0]; if (Math.abs(d) < 1e-10) zero++; else if (d > 0) pos++; else neg++; }
    else { const [[a, c], [, d]] = b.E, det = a * d - c * c; if (det < 0) { pos++; neg++; } else if (a + d > 0) pos += 2; else neg += 2; }
  }
  return { pos, neg, zero };
}
