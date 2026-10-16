// Control Theory — Chapter 3: helpers shared by the items of ch03.js
// (re-exports the chapter-2 toolbox; adds planar flows, portraits, quadratic forms and the Lyapunov equation)
export * from './ch02.shared.js';

/** One RK4 step of a planar field f(x, y) → [dx, dy]; returns [x, y]. */
export function rk2(f, x, y, h) {
  const a = f(x, y), b = f(x + (h / 2) * a[0], y + (h / 2) * a[1]), c = f(x + (h / 2) * b[0], y + (h / 2) * b[1]), d = f(x + h * c[0], y + h * c[1]);
  return [x + (h / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]), y + (h / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1])];
}
/** Trajectory of a planar field from (x0, y0) on t = 0 … T (negative T runs backwards), stopping once |x|, |y| exceed R. Returns points. */
export function flow2(f, x0, y0, T, h = 0.02, R = 1e3) {
  const n = Math.max(1, Math.round(Math.abs(T) / h)), dt = T / n, pts = [[x0, y0]];
  let x = x0, y = y0;
  for (let i = 0; i < n; i++) {
    [x, y] = rk2(f, x, y, dt);
    if (!isFinite(x) || !isFinite(y) || Math.abs(x) > R || Math.abs(y) > R) break;
    pts.push([x, y]);
  }
  return pts;
}
/** n points on a circle of radius r (centre cx, cy), starting at angle a0. */
export const ring = (n, r, a0 = 0, cx = 0, cy = 0) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(a0 + (2 * Math.PI * i) / n), cy + r * Math.sin(a0 + (2 * Math.PI * i) / n)]);
/** Linear planar field from a 2×2 matrix. */
export const linField = (A) => (x, y) => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
/** Numerical Jacobian of a planar field at (x, y). */
export function jac2(f, x, y, e = 1e-6) {
  const a = f(x + e, y), b = f(x - e, y), c = f(x, y + e), d = f(x, y - e);
  return [[(a[0] - b[0]) / (2 * e), (c[0] - d[0]) / (2 * e)], [(a[1] - b[1]) / (2 * e), (c[1] - d[1]) / (2 * e)]];
}
/** Quadratic form value x' P y for a 2×2 P at the point (x, y). */
export const quad = (P, x, y) => P[0][0] * x * x + (P[0][1] + P[1][0]) * x * y + P[1][1] * y * y;
/** Symmetric positive definite P = R(θ) diag(1, r) R(θ)ᵀ. */
export function shapeP(theta, r) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return [[c * c + r * s * s, (1 - r) * c * s], [(1 - r) * c * s, s * s + r * c * c]];
}
/** Solve AᵀP + PA = −Q for a 2×2 (Kronecker form). Returns P or null when the operator is singular. M = v.M. */
export function lyap2(M, A, Q) {
  const n = 2, K = Array.from({ length: 4 }, () => new Array(4).fill(0)), rhs = [];
  // vec index (i, j) → 2 i + j ;  (AᵀP + PA)_{ij} = Σ_k A_{ki} P_{kj} + P_{ik} A_{kj}
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const r = 2 * i + j; rhs.push(-Q[i][j]);
    for (let k = 0; k < n; k++) { K[r][2 * k + j] += A[k][i]; K[r][2 * i + k] += A[k][j]; }
  }
  const det = M.det(K);
  if (Math.abs(det) < 1e-9) return null;
  const p = M.solve(K, rhs.map((x) => [x])).map((r) => r[0]);
  return [[p[0], p[1]], [p[2], p[3]]];
}
/** Draw a set of phase-plane trajectories (point lists) with a small arrowhead at the middle of each. */
export function drawOrbits(s, orbits, st = {}) {
  for (const pts of orbits) {
    if (pts.length < 2) continue;
    s.path(pts, { color: st.color || 'accent', width: st.width ?? 1.6, alpha: st.alpha ?? 0.9 });
    if (st.arrows !== false) {
      const k = Math.floor(pts.length * (st.at ?? 0.5)), a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
      if (a && b && Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-9) s.arrow(a[0], a[1], b[0], b[1], { color: st.color || 'accent', width: st.width ?? 1.6, head: 7 });
    }
  }
}
