// Representation Theory — Chapter 2: helpers shared by the items of ch02.js (plain named exports).
// Everything of chapter 1 (groups as multiplication tables, matrices, homCheck, …) is re-exported.
export * from './ch01.shared.js';
import { mm, tp, inv, msub, fro, msc, madd, dihedral, permMat, TAU } from './ch01.shared.js';

/** A fixed, visibly non-orthogonal change of basis of the plane (columns are the new basis vectors). */
export const SKEW2 = [[1, 0.65], [0.25, 0.8]];
/** Conjugate every matrix: P A P⁻¹ (the same representation written in the basis given by the columns of P). */
export const conj = (mats, P) => { const Pi = inv(P); return mats.map((A) => mm(P, mm(A, Pi))); };
/** Sum over the group of A_g X A_g⁻¹ divided by |G| (the averaging operator onto the commutant), A_g⁻¹ = mats[inv[g]]. */
export function avgConj(G, mats, X, idx) {
  const n = mats[0].length;
  let S = Array.from({ length: n }, () => Array(n).fill(0));
  const list = idx || [...Array(G.n).keys()];
  for (const g of list) S = madd(S, mm(mats[g], mm(X, mats[G.inv[g]])));
  return msc(S, 1 / list.length);
}
/** Average ρ(g)ᵀ B ρ(g) over the elements `idx` (default: the whole group). */
export function avgForm(G, mats, B, idx) {
  const list = idx || [...Array(G.n).keys()];
  let S = [[0, 0], [0, 0]];
  for (const g of list) S = madd(S, mm(tp(mats[g]), mm(B, mats[g])));
  return msc(S, 1 / list.length);
}
/** Largest deviation of ρ(g)ᵀ B ρ(g) from B (the failure of invariance of the form B). */
export function formDefect(G, mats, B) {
  let m = 0;
  for (let g = 0; g < G.n; g++) m = Math.max(m, fro(msub(mm(tp(mats[g]), mm(B, mats[g])), B)));
  return m;
}
/** Eigen-decomposition of a symmetric 2×2 matrix: {l: [l1 ≥ l2], v: [[unit vector], [unit vector]]}. */
export function eig2(B) {
  const a = B[0][0], b = (B[0][1] + B[1][0]) / 2, d = B[1][1], th = 0.5 * Math.atan2(2 * b, a - d);
  const c = Math.cos(th), s = Math.sin(th);
  return { l: [a * c * c + 2 * b * c * s + d * s * s, a * s * s - 2 * b * c * s + d * c * c], v: [[c, s], [-s, c]] };
}
/** Points of the ellipse {x : xᵀ B x = r²} (B symmetric positive definite). */
export function ellipse(B, r = 1, n = 120) {
  const { l, v } = eig2(B), pts = [];
  for (let k = 0; k <= n; k++) {
    const t = (TAU * k) / n, p = r * Math.cos(t) / Math.sqrt(l[0]), q = r * Math.sin(t) / Math.sqrt(l[1]);
    pts.push([p * v[0][0] + q * v[1][0], p * v[0][1] + q * v[1][1]]);
  }
  return pts;
}
/** Square root of a symmetric positive definite 2×2 matrix and its inverse. */
export function sqrt2(B) {
  const { l, v } = eig2(B), f = (p) => { const L = [[Math.pow(l[0], p), 0], [0, Math.pow(l[1], p)]], V = [[v[0][0], v[1][0]], [v[0][1], v[1][1]]]; return mm(V, mm(L, tp(V))); };
  return { R: f(0.5), Ri: f(-0.5) };
}
/** Quadratic form xᵀ B x. */
export const qf = (B, x) => x[0] * (B[0][0] * x[0] + B[0][1] * x[1]) + x[1] * (B[1][0] * x[0] + B[1][1] * x[1]);
/** Tex of a number that is (almost) zero as "0", else with scientific notation. */
export const zero = (x, v, d = 1) => (Math.abs(x) < 1e-9 ? '0' : v.sci(x, d));
/** The symmetric group S₃ acting on ℝ³ by permutation matrices (as a group record plus matrices). */
export function s3perm() { const G = dihedral(3); return { G, mats: G.perms.map(permMat) }; }
/** Block-diagonal sum of two matrices. */
export function dsum(A, B) {
  const n = A.length, m = B.length, out = Array.from({ length: n + m }, () => Array(n + m).fill(0));
  A.forEach((r, i) => r.forEach((x, j) => { out[i][j] = x; })); B.forEach((r, i) => r.forEach((x, j) => { out[n + i][n + j] = x; }));
  return out;
}
