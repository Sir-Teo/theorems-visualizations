// Numerical Linear Algebra — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
//
// Simulated p-bit floating-point arithmetic (round to nearest on a p-bit significand, unbounded exponent), and
// the dense algorithms of the chapter run in it: LU with partial pivoting, Cholesky, back substitution, Householder QR,
// Gram–Schmidt. Also matrices with prescribed singular values, Hilbert matrices (with their exact inverse) and
// a few plotting helpers.
//
// Convention (as in Trefethen–Bau): machine epsilon is the UNIT ROUNDOFF  ε_machine = 2^(−p)  (2^−53 for IEEE double);
// the gap between 1 and the next float is 2ε_machine = 2^(1−p) (what MATLAB's eps and C's DBL_EPSILON report).
export * from './ch02.shared.js';
import { dot, mv, mm, tp, eye, len, fro, TAU } from './ch02.shared.js';

// ---------- p-bit rounding ----------
/** Round x to the nearest number with a p-bit significand (ties to even). p ≥ 53 returns x unchanged. */
export function fl(x, p) {
  if (x === 0 || !isFinite(x) || p >= 53) return x;
  const a = Math.abs(x);
  let e = Math.floor(Math.log2(a));
  if (2 ** e > a) e--; else if (2 ** (e + 1) <= a) e++;
  const q = 2 ** (e - p + 1), t = a / q, f = Math.floor(t), d = t - f;
  const r = d > 0.5 || (d === 0.5 && f % 2 === 1) ? f + 1 : f;
  return Math.sign(x) * r * q;
}
/** Arithmetic in p bits: every operation is the exact one followed by a rounding (for p ≤ 26 the doubles used underneath are exact enough). */
export function arith(p) {
  const f = (x) => fl(x, p);
  return {
    p, u: 2 ** -p, f,
    add: (a, b) => f(a + b), sub: (a, b) => f(a - b), mul: (a, b) => f(a * b), div: (a, b) => f(a / b), sqrt: (a) => f(Math.sqrt(a)),
    dot: (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s = f(s + f(a[i] * b[i])); return s; },
  };
}
/** Round every entry of a vector / matrix. */
export const flV = (a, p) => a.map((x) => fl(x, p));
export const flM = (A, p) => A.map((r) => r.map((x) => fl(x, p)));

// ---------- algorithms in p bits (matrices as lists of rows) ----------
/** Solve Ax = b by Gaussian elimination with partial pivoting; B may be a vector or a matrix (list of rows) of right-hand sides. */
export function flSolve(A0, B0, p) {
  const F = arith(p), n = A0.length, A = flM(A0, p), mat = Array.isArray(B0[0]);
  const B = (mat ? B0 : B0.map((x) => [x])).map((r) => r.map((x) => fl(x, p))), k = B[0].length;
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[piv][c])) piv = i;
    [A[c], A[piv]] = [A[piv], A[c]]; [B[c], B[piv]] = [B[piv], B[c]];
    if (A[c][c] === 0) return null;
    for (let i = c + 1; i < n; i++) {
      const m = F.div(A[i][c], A[c][c]);
      for (let j = c + 1; j < n; j++) A[i][j] = F.sub(A[i][j], F.mul(m, A[c][j]));
      for (let j = 0; j < k; j++) B[i][j] = F.sub(B[i][j], F.mul(m, B[c][j]));
      A[i][c] = 0;
    }
  }
  const X = Array.from({ length: n }, () => new Array(k).fill(0));
  for (let j = 0; j < k; j++) for (let i = n - 1; i >= 0; i--) {
    let s = B[i][j];
    for (let t = i + 1; t < n; t++) s = F.sub(s, F.mul(A[i][t], X[t][j]));
    X[i][j] = F.div(s, A[i][i]);
  }
  return mat ? X : X.map((r) => r[0]);
}
/** Back substitution Rx = b (R upper triangular) in p bits. */
export function flBack(R, b, p) {
  const F = arith(p), n = R.length, x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s = F.sub(s, F.mul(R[i][j], x[j]));
    x[i] = F.div(s, R[i][i]);
  }
  return x;
}
/** Forward substitution Lx = b in p bits. */
export function flForward(L, b, p) {
  const F = arith(p), n = L.length, x = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let j = 0; j < i; j++) s = F.sub(s, F.mul(L[i][j], x[j]));
    x[i] = F.div(s, L[i][i]);
  }
  return x;
}
/** Cholesky A = LLᵀ in p bits; null when a pivot is not positive (A not numerically positive definite). */
export function flChol(A, p) {
  const F = arith(p), n = A.length, L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    let s = fl(A[j][j], p);
    for (let k = 0; k < j; k++) s = F.sub(s, F.mul(L[j][k], L[j][k]));
    if (!(s > 0)) return null;
    L[j][j] = F.sqrt(s);
    for (let i = j + 1; i < n; i++) {
      let t = fl(A[i][j], p);
      for (let k = 0; k < j; k++) t = F.sub(t, F.mul(L[i][k], L[j][k]));
      L[i][j] = F.div(t, L[j][j]);
    }
  }
  return L;
}
/** Least squares by the normal equations AᵀAx = Aᵀb with Cholesky, all in p bits; null on breakdown. */
export function flNormalEq(A0, b0, p) {
  const A = flM(A0, p), b = flV(b0, p), F = arith(p), At = tp(A), n = At.length;
  const G = At.map((r) => At.map((c) => F.dot(r, c))), y = At.map((r) => F.dot(r, b)), L = flChol(G, p);
  if (!L) return null;
  const z = flForward(L, y, p);
  return flBack(tp(L), z, p);
}
/**
 * Householder QR in p bits (A is m×n, m ≥ n). Returns {Q (m×n, explicit, thin), R (n×n)}; Q is accumulated by applying the reflectors
 * to the identity in floating point. R's diagonal carries the sign −sgn(x₁)‖x‖ (as in Trefethen–Bau).
 */
export function flHouseholder(A0, p) {
  const F = arith(p), m = A0.length, n = A0[0].length, A = flM(A0, p), W = [];
  for (let k = 0; k < n; k++) {
    const x = []; for (let i = k; i < m; i++) x.push(A[i][k]);
    let s = 0; for (const t of x) s = F.add(s, F.mul(t, t));
    const nx = F.sqrt(s);
    if (nx === 0) { W.push(null); continue; }
    const v = x.slice(); v[0] = F.add(v[0], x[0] >= 0 ? nx : -nx);
    let vv = 0; for (const t of v) vv = F.add(vv, F.mul(t, t));
    W.push({ v, vv });
    for (let j = k; j < n; j++) {
      let d = 0; for (let i = k; i < m; i++) d = F.add(d, F.mul(v[i - k], A[i][j]));
      const c = F.div(F.mul(2, d), vv);
      for (let i = k; i < m; i++) A[i][j] = F.sub(A[i][j], F.mul(c, v[i - k]));
    }
  }
  const Q = Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
  for (let k = n - 1; k >= 0; k--) {
    const w = W[k]; if (!w) continue;
    for (let j = 0; j < n; j++) {
      let d = 0; for (let i = k; i < m; i++) d = F.add(d, F.mul(w.v[i - k], Q[i][j]));
      const c = F.div(F.mul(2, d), w.vv);
      for (let i = k; i < m; i++) Q[i][j] = F.sub(Q[i][j], F.mul(c, w.v[i - k]));
    }
  }
  const R = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j >= i ? A[i][j] : 0)));
  return { Q, R };
}
/** Least squares by Householder QR in p bits: x = R⁻¹Q̃ᵀb. */
export function flQRSolve(A, b, p) {
  const { Q, R } = flHouseholder(A, p), F = arith(p), qb = tp(Q).map((q) => F.dot(q, flV(b, p)));
  return flBack(R, qb, p);
}
/** Gram–Schmidt QR in p bits ('classical' or 'modified'); A is m×n. Returns {Q (m×n), R (n×n)}. */
export function flGS(A0, mode, p) {
  const F = arith(p), m = A0.length, n = A0[0].length, A = flM(A0, p), q = [], R = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    const a = A.map((r) => r[j]);
    let v = a.slice();
    for (let i = 0; i < j; i++) {
      const r = mode === 'modified' ? F.dot(q[i], v) : F.dot(q[i], a);
      R[i][j] = r;
      v = v.map((x, t) => F.sub(x, F.mul(r, q[i][t])));
    }
    const nv = F.sqrt(F.dot(v, v));
    R[j][j] = nv;
    q.push(nv > 0 ? v.map((x) => F.div(x, nv)) : v);
  }
  return { Q: tp(q), R };
}
/** Least squares by Gram–Schmidt QR in p bits (modified: x = R⁻¹Q̃ᵀb). */
export function flGSSolve(A, b, p, mode = 'modified') {
  const { Q, R } = flGS(A, mode, p), F = arith(p);
  return flBack(R, tp(Q).map((q) => F.dot(q, flV(b, p))), p);
}
/** Matrix product in p bits. */
export const flMM = (A, B, p) => { const F = arith(p), Bt = tp(B); return A.map((r) => Bt.map((c) => F.dot(r, c))); };

// ---------- matrices with prescribed singular values ----------
/** Orthonormal columns (m×k) from a seeded Gaussian matrix, via double-precision Householder. */
export function randQ(M, r, m, k) {
  const G = Array.from({ length: m }, () => Array.from({ length: k }, () => r.normal()));
  return M.qr(G).Q.map((row) => row.slice(0, k));
}
/** A = U diag(s) Vᵀ with random orthonormal U (m×n) and V (n×n); s a list of n singular values. */
export function withSingular(M, r, m, n, s) {
  const U = randQ(M, r, m, n), V = randQ(M, r, n, n);
  return mm(U.map((row) => row.map((x, j) => x * s[j])), tp(V));
}
/** n geometrically spaced singular values from 1 down to 1/κ. */
export const geomSigma = (n, kappa) => Array.from({ length: n }, (_, i) => kappa ** (-(n === 1 ? 0 : i / (n - 1))));

// ---------- norms ----------
export const norm2m = (M, A) => (A.length && A[0].length ? M.svd(A).S[0] : 0);
export const normV = (a) => Math.hypot(...a);
export const relErr = (x, xt) => normV(x.map((t, i) => t - xt[i])) / normV(xt);

// ---------- Hilbert matrices ----------
export const hilbert = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => 1 / (i + j + 1)));
const binom = (n, k) => { let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = (r * (BigInt(n) - BigInt(k) + i)) / i; return r; };
/** The exact inverse of the n×n Hilbert matrix (integer entries), as doubles. */
export function hilbertInv(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const row = [];
    for (let j = 1; j <= n; j++) {
      const c = binom(i + j - 2, i - 1);
      let t = BigInt(i + j - 1) * binom(n + i - 1, n - j) * binom(n + j - 1, n - i) * c * c;
      if ((i + j) % 2) t = -t;
      row.push(Number(t));
    }
    out.push(row);
  }
  return out;
}
/** 2-norm condition number of the n×n Hilbert matrix, from H and its exact inverse. */
export const hilbertKappa = (M, n) => M.svd(hilbert(n)).S[0] * M.svd(hilbertInv(n)).S[0];

// ---------- small utilities ----------
/** Scientific notation as TeX with a carry fix (9.96 → 1.0×10^1), 2 significant digits by default. */
export function sciT(x, d = 1) {
  if (!isFinite(x)) return '\\infty';
  if (Math.abs(x) < 1e-300) return '0';
  let e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
  if (Number(Math.abs(m).toFixed(d)) >= 10) { e += 1; m = x / 10 ** e; }
  return `${m.toFixed(d)}\\times10^{${e}}`;
}
export const log10 = (x) => Math.log10(x);
/** Floor a value for a log axis. */
export const lg = (x, floor = 1e-17) => Math.max(floor, x);
/** All floats of a p-bit toy system in [lo, hi] (positive). */
export function toyFloats(p, lo, hi) {
  const out = [];
  let e = Math.floor(Math.log2(lo));
  for (; 2 ** e <= hi; e++) for (let k = 0; k < 2 ** (p - 1); k++) {
    const x = (1 + k / 2 ** (p - 1)) * 2 ** e;
    if (x >= lo && x <= hi) out.push(x);
  }
  return out;
}
