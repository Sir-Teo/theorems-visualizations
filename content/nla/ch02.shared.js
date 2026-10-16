// Numerical Linear Algebra — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
//
// Orthogonalization (classical / modified Gram–Schmidt with a step record), Householder QR with and without
// column pivoting, back-substitution, normal equations, and a few 3D / 2D drawing helpers.
export * from './ch01.shared.js';
import { dot, add, sub, scl, len, unit, mv, tp, mm, eye } from './ch01.shared.js';

/** Column j of a matrix as a list. */
export const cols = (A) => A[0].map((_, j) => A.map((r) => r[j]));
/** Matrix from a list of columns. */
export const fromCols = (C) => C[0].map((_, i) => C.map((c) => c[i]));
/** Cross product of two 3-vectors. */
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** Spectral norm of a matrix (largest singular value). */
export const norm2 = (M, A) => (A.length && A[0].length ? M.svd(A).S[0] : 0);
/** ‖QᵀQ − I‖₂. */
export const orthErr = (M, Q) => {
  const G = mm(tp(Q), Q), n = G.length;
  return norm2(M, G.map((r, i) => r.map((x, j) => x - (i === j ? 1 : 0))));
};

/**
 * Gram–Schmidt on the columns of A (list of columns). mode 'classical' computes every coefficient from the original
 * column, 'modified' from the partially reduced one. Returns {Q (columns), R (n×n rows), steps} where steps[j] lists
 * {i, r, from (vector the coefficient was taken against), sub (the vector removed)} and `v` (the residual before normalising).
 * A column whose residual norm is below tol is left as a zero vector (rank deficiency).
 */
export function gramSchmidt(A, mode = 'classical', tol = 1e-12) {
  const n = A.length, Q = [], R = Array.from({ length: n }, () => new Array(n).fill(0)), steps = [];
  for (let j = 0; j < n; j++) {
    let v = A[j].slice();
    const st = { j, parts: [], v: null, rjj: 0 };
    for (let i = 0; i < j; i++) {
      if (!Q[i]) continue;
      const src = mode === 'classical' ? A[j] : v, r = dot(Q[i], src);
      R[i][j] = r;
      v = sub(v, scl(Q[i], r));
      st.parts.push({ i, r, src: src.slice(), term: scl(Q[i], r), after: v.slice() });
    }
    const nv = len(v);
    st.v = v.slice(); st.rjj = nv;
    R[j][j] = nv;
    Q.push(nv > tol * Math.max(1, len(A[j])) ? scl(v, 1 / nv) : null);
    steps.push(st);
  }
  return { Q, R, steps };
}

/** Back-substitution for upper-triangular R (n×n) x = c; returns x (NaN entries where a pivot is 0). */
export function backSub(R, c) {
  const n = R.length, x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = c[i];
    for (let j = i + 1; j < n; j++) s -= R[i][j] * x[j];
    x[i] = s / R[i][i];
  }
  return x;
}

/** Cholesky-based normal-equations solve of min‖Ax − b‖ (A is m×n rows); returns null if AᵀA is not numerically SPD. */
export function normalEq(M, A, b) {
  const At = tp(A), G = mm(At, A), L = M.cholesky(G);
  if (!L) return null;
  const y = mv(At, b), n = G.length, z = new Array(n).fill(0), x = new Array(n).fill(0);
  for (let i = 0; i < n; i++) { let s = y[i]; for (let k = 0; k < i; k++) s -= L[i][k] * z[k]; z[i] = s / L[i][i]; }
  for (let i = n - 1; i >= 0; i--) { let s = z[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; }
  return x;
}

/**
 * Householder QR with optional column pivoting (Businger–Golub): A (m×n rows). Returns {R (m×n), perm, Q (m×m)}.
 * With pivot = false the columns stay in order (R may have negative diagonal entries: the sign is chosen to avoid cancellation).
 */
export function householderQR(A, { pivot = false } = {}) {
  const m = A.length, n = A[0].length, R = A.map((r) => r.slice()), perm = Array.from({ length: n }, (_, j) => j);
  let Q = eye(m);
  for (let k = 0; k < Math.min(m - 1, n); k++) {
    if (pivot) {
      let p = k;
      let best = -1;
      for (let j = k; j < n; j++) { let s = 0; for (let i = k; i < m; i++) s += R[i][j] ** 2; if (s > best) { best = s; p = j; } }
      if (p !== k) { for (let i = 0; i < m; i++) { const t = R[i][k]; R[i][k] = R[i][p]; R[i][p] = t; } [perm[k], perm[p]] = [perm[p], perm[k]]; }
    }
    let nrm = 0;
    for (let i = k; i < m; i++) nrm = Math.hypot(nrm, R[i][k]);
    if (nrm === 0) continue;
    const alpha = R[k][k] >= 0 ? -nrm : nrm, w = new Array(m).fill(0);
    let ww = 0;
    for (let i = k; i < m; i++) { w[i] = R[i][k] - (i === k ? alpha : 0); ww += w[i] * w[i]; }
    if (ww === 0) continue;
    for (let j = 0; j < n; j++) { let s = 0; for (let i = k; i < m; i++) s += w[i] * R[i][j]; s *= 2 / ww; for (let i = k; i < m; i++) R[i][j] -= s * w[i]; }
    for (let i = 0; i < m; i++) { let s = 0; for (let j = k; j < m; j++) s += Q[i][j] * w[j]; s *= 2 / ww; for (let j = k; j < m; j++) Q[i][j] -= s * w[j]; }
    for (let i = k + 1; i < m; i++) R[i][k] = 0;
  }
  return { R, perm, Q };
}

/** Is the 3-vector close to zero? */
export const tiny = (a, e = 1e-9) => len(a) < e;

/** An orthonormal basis (a, b) of the plane spanned by the 3-vectors p, q (null if they are dependent). */
export function planeBasis(p, q) {
  const a = unit(p), t = sub(q, scl(a, dot(q, a)));
  if (len(t) < 1e-9 * Math.max(1, len(q))) return null;
  return [a, unit(t)];
}

/** Closed polyline for the unit-radius circle in the plane of orthonormal a, b at centre c. */
export const circ3 = (a, b, r = 1, c = [0, 0, 0], n = 64) => Array.from({ length: n + 1 }, (_, k) => {
  const t = (2 * Math.PI * k) / n;
  return add(c, add(scl(a, r * Math.cos(t)), scl(b, r * Math.sin(t))));
});

/** Small right-angle marker at the foot point f between directions d1 and d2 (unit vectors), size s. */
export const rightAngle3 = (f, d1, d2, s = 0.12) => [add(f, scl(d1, s)), add(add(f, scl(d1, s)), scl(d2, s)), add(f, scl(d2, s))];
