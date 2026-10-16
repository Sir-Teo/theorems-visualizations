// Optimization — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports, pure functions).
//
// House style: every "optimal" point in a picture is computed, never drawn: 2-D linear programs by clipping a polygon
// and scanning its vertices, small LPs of any dimension by enumerating vertices, convex quadratics over polygons by
// scanning edges, and everything else by a fine grid search that is then compared with the closed form or the theory.
export * from './ch03.shared.js';
import { polyhedron, boxPoly, inPoly, clamp } from './ch03.shared.js';

export const polyArea = (P) => {
  let a = 0;
  for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
};

/**
 * Minimize c·x over {x : nx_i x + ny_i y ≤ c_i} ∩ [-R, R]². Returns {status: 'optimal' | 'unbounded' | 'infeasible',
 * poly, x, f, tied (all optimal vertices), active (indices of constraints active at x)}.
 */
export function lp2(c, hs, R = 9) {
  const poly = polyhedron(hs, boxPoly(-R, -R, R, R));
  if (poly.length < 1 || Math.abs(polyArea(poly)) < 1e-9 && poly.length < 2) return { status: 'infeasible', poly: [], tied: [], active: [] };
  let best = Infinity;
  for (const p of poly) best = Math.min(best, c[0] * p[0] + c[1] * p[1]);
  const tied = poly.filter((p) => c[0] * p[0] + c[1] * p[1] <= best + 1e-9 * (1 + Math.abs(best)));
  const x = [tied.reduce((s, p) => s + p[0], 0) / tied.length, tied.reduce((s, p) => s + p[1], 0) / tied.length];
  const unb = tied.some((p) => Math.abs(p[0]) > R - 1e-7 || Math.abs(p[1]) > R - 1e-7);
  const active = [];
  hs.forEach((h, i) => { if (tied.some((p) => Math.abs(h.nx * p[0] + h.ny * p[1] - h.c) < 1e-6)) active.push(i); });
  return { status: unb ? 'unbounded' : 'optimal', poly, x, f: best, tied, active };
}

/** Gaussian elimination with partial pivoting; null when singular. */
export function solveSmall(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) < 1e-12) return null;
    [M[k], M[p]] = [M[p], M[k]];
    for (let i = k + 1; i < n; i++) { const t = M[i][k] / M[k][k]; for (let j = k; j <= n; j++) M[i][j] -= t * M[k][j]; }
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}

/** Small LP  min c·z  s.t. A z ≤ b  by enumerating vertices (all n-subsets of rows). Returns {z, f, rows} or null. */
export function lpVertex(c, A, b, tol = 1e-8) {
  const n = c.length, m = A.length;
  let best = null;
  const idx = [];
  const rec = (start) => {
    if (idx.length === n) {
      const z = solveSmall(idx.map((i) => A[i]), idx.map((i) => b[i]));
      if (!z) return;
      for (let i = 0; i < m; i++) { let s = 0; for (let j = 0; j < n; j++) s += A[i][j] * z[j]; if (s > b[i] + tol) return; }
      const f = c.reduce((s, cj, j) => s + cj * z[j], 0);
      if (!best || f < best.f - 1e-12) best = { z, f, rows: [...idx] };
      return;
    }
    for (let i = start; i < m; i++) { idx.push(i); rec(i + 1); idx.pop(); }
  };
  rec(0);
  return best;
}

/**
 * Minimize ½(x−m)ᵀQ(x−m) over a polygon P (interior stationary point, else the best point on the boundary).
 * Q = [[a, b], [b, d]]. Returns {x, kind: 'interior' | 'edge' | 'vertex', edge, f}.
 */
export function qp2(Q, m, P) {
  const val = (x) => { const u = x[0] - m[0], w = x[1] - m[1]; return 0.5 * (Q[0][0] * u * u + 2 * Q[0][1] * u * w + Q[1][1] * w * w); };
  if (inPoly(m[0], m[1], P)) return { x: [...m], kind: 'interior', edge: -1, f: 0 };
  let best = null;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], d = [b[0] - a[0], b[1] - a[1]], r = [a[0] - m[0], a[1] - m[1]];
    const Qd = [Q[0][0] * d[0] + Q[0][1] * d[1], Q[0][1] * d[0] + Q[1][1] * d[1]];
    const den = d[0] * Qd[0] + d[1] * Qd[1];
    const num = Qd[0] * r[0] + Qd[1] * r[1];
    const t = den < 1e-15 ? 0 : clamp(-num / den, 0, 1);
    const x = [a[0] + t * d[0], a[1] + t * d[1]], f = val(x);
    if (!best || f < best.f - 1e-12) best = { x, f, edge: i, kind: t > 1e-7 && t < 1 - 1e-7 ? 'edge' : 'vertex' };
  }
  return best;
}

/** Fraction-free formatting helper for readouts. */
export const f3 = (v, x, d = 3) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);

/** Regular polygon approximating a disc (CCW). */
export const discPoly = (cx, cy, r, n = 90) => Array.from({ length: n }, (_, k) => [cx + r * Math.cos((2 * Math.PI * k) / n), cy + r * Math.sin((2 * Math.PI * k) / n)]);
