// Shared helpers for ODE chapter 3 (plain functions, no imports beyond chapter 2's shared module).
export * from './ch02.shared.js';

/** Matrix product of arrays of rows. */
export function mmul(A, B) {
  const n = A.length, m = B[0].length, k = B.length, C = [];
  for (let i = 0; i < n; i++) { C.push(new Array(m).fill(0)); for (let j = 0; j < m; j++) { let s = 0; for (let l = 0; l < k; l++) s += A[i][l] * B[l][j]; C[i][j] = s; } }
  return C;
}
export const madd = (A, B, c = 1) => A.map((r, i) => r.map((x, j) => x + c * B[i][j]));
export const mscale = (A, c) => A.map((r) => r.map((x) => c * x));
export const mvec = (A, x) => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0));
export const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
/** Frobenius norm. */
export const fro = (A) => Math.sqrt(A.reduce((s, r) => s + r.reduce((q, x) => q + x * x, 0), 0));
/** Operator (2-)norm of any real matrix via power iteration on AᵀA (accurate to ~1e-10). */
export function opnorm(A) {
  const n = A[0].length; let x = new Array(n).fill(0).map((_, i) => 1 + 0.37 * i), nr = 0;
  for (let it = 0; it < 200; it++) {
    const y = mvec(A, x), z = new Array(n).fill(0);
    for (let i = 0; i < A.length; i++) for (let j = 0; j < n; j++) z[j] += A[i][j] * y[i];
    const m = Math.hypot(...z); if (m < 1e-300) return 0; x = z.map((q) => q / m);
    const nn = Math.sqrt(m); if (Math.abs(nn - nr) < 1e-13 * nn) { nr = nn; break; } nr = nn;
  }
  return nr;
}
/** exp(tA) for an n×n real matrix: scaling and squaring with a Taylor series. */
export function expm(A, t = 1) {
  const n = A.length; let B = mscale(A, t);
  const nb = Math.max(1e-300, fro(B)); let sq = 0; while (nb / Math.pow(2, sq) > 0.5) sq++;
  B = mscale(B, 1 / Math.pow(2, sq));
  let T = eye(n), S = eye(n);
  for (let k = 1; k <= 18; k++) { T = mscale(mmul(T, B), 1 / k); S = madd(S, T); }
  for (let i = 0; i < sq; i++) S = mmul(S, S);
  return S;
}
/** Partial sum I + tA + … + (tA)^n/n!. */
export function expmPartial(A, t, n) {
  const m = A.length; let T = eye(m), S = eye(m);
  for (let k = 1; k <= n; k++) { T = mscale(mmul(T, mscale(A, t)), 1 / k); S = madd(S, T); }
  return S;
}
/** Eigen-data of a real 2×2 matrix: trace, det, discriminant, eigenvalues as [re, im], real eigenvectors when they exist. */
export function eig2(A) {
  const [[a, b], [c, d]] = A, tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
  let l1, l2, vecs = null;
  if (disc >= 0) {
    const r = Math.sqrt(disc); l1 = [(tr + r) / 2, 0]; l2 = [(tr - r) / 2, 0];
    const vec = (l) => { const u = Math.abs(b) > 1e-12 ? [b, l - a] : Math.abs(c) > 1e-12 ? [l - d, c] : (Math.abs(a - l) < 1e-12 ? [1, 0] : [0, 1]); const m = Math.hypot(u[0], u[1]) || 1; return [u[0] / m, u[1] / m]; };
    vecs = [vec(l1[0]), vec(l2[0])];
  } else { const r = Math.sqrt(-disc) / 2; l1 = [tr / 2, r]; l2 = [tr / 2, -r]; }
  return { tr, det, disc, l1, l2, vecs };
}
/** Name of the planar phase portrait for the trace τ and determinant Δ. */
export function classify2(tr, det, tol = 1e-9) {
  const disc = tr * tr - 4 * det;
  if (det < -tol) return 'saddle';
  if (Math.abs(det) <= tol) return Math.abs(tr) <= tol ? 'all points fixed or shear' : 'line of equilibria';
  if (Math.abs(tr) <= tol) return 'centre';
  if (Math.abs(disc) <= tol) return tr > 0 ? 'unstable degenerate node' : 'stable degenerate node';
  if (disc > 0) return tr > 0 ? 'unstable node' : 'stable node';
  return tr > 0 ? 'unstable spiral' : 'stable spiral';
}
/** Orbit of x' = Ax from x0: [[t, [x, y]], …] for t in [t0, t1] using one matrix exponential and repeated multiplication. */
export function orbitLin(A, x0, t1, n = 200, t0 = 0) {
  const h = (t1 - t0) / n, E = expm(A, h); const out = [[t0, x0]]; let x = x0;
  for (let i = 1; i <= n; i++) { x = mvec(E, x); out.push([t0 + i * h, x]); }
  return out;
}
/** Draggable images of the basis vectors: columns of A. Create once; read A() inside render. */
export function matHandles(s, A0, opts = {}) {
  const R = opts.range || 3, lim = { x: [-R, R], y: [-R, R] };
  const h1 = s.handle(A0[0][0], A0[1][0], { color: 'accent', label: opts.l1 || 'Ae₁', labelPos: 'ne', constrain: lim });
  const h2 = s.handle(A0[0][1], A0[1][1], { color: 'orange', label: opts.l2 || 'Ae₂', labelPos: 'nw', constrain: lim });
  const o = {
    h1, h2,
    A: () => [[h1.x, h2.x], [h1.y, h2.y]],
    set(A) { h1.set(A[0][0], A[1][0]); h2.set(A[0][1], A[1][1]); },
    /** draw the images of the basis vectors and the parallelogram they span */
    draw() {
      if (opts.parallelogram !== false) s.poly([[0, 0], [h1.x, h1.y], [h1.x + h2.x, h1.y + h2.y], [h2.x, h2.y]], { fill: 'accent', fillAlpha: 0.06, stroke: false });
      s.arrow(0, 0, h1.x, h1.y, { color: 'accent', width: 2.2 }); s.arrow(0, 0, h2.x, h2.y, { color: 'orange', width: 2.2 });
    },
  };
  return o;
}
/** Complex arithmetic on [re, im] pairs. */
export const C = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
  div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
  exp: (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; },
  abs: (a) => Math.hypot(a[0], a[1]),
};
/** Polynomial with complex roots → ascending complex coefficients. */
export function polyFromRootsC(roots) {
  let p = [[1, 0]];
  for (const r of roots) { const q = new Array(p.length + 1).fill(0).map(() => [0, 0]); for (let i = 0; i < p.length; i++) { q[i + 1] = C.add(q[i + 1], p[i]); q[i] = C.sub(q[i], C.mul(r, p[i])); } p = q; }
  return p;
}
/** exp-polynomial e^{λt}·Σ c_j t^j with complex λ and coefficients c_j (array of [re, im]). */
export const epoly = {
  value: (E, t) => { let s = [0, 0]; for (let j = E.c.length - 1; j >= 0; j--) s = C.add(C.mul(s, [t, 0]), E.c[j]); return C.mul(s, C.exp([E.l[0] * t, E.l[1] * t])); },
  /** (d/dt) of e^{λt} p(t) = e^{λt} (p' + λ p) */
  deriv: (E) => { const n = E.c.length, c = []; for (let j = 0; j < n; j++) { let q = C.mul(E.l, E.c[j]); if (j + 1 < n) q = C.add(q, [(j + 1) * E.c[j + 1][0], (j + 1) * E.c[j + 1][1]]); c.push(q); } return { l: E.l, c }; },
};
/** Dormand–Prince-free fixed-step RK4 of a matrix ODE Y' = A(t) Y (n×n), returns Y(t1) and optionally all steps [[t, Y], …]. */
export function matFlow(Af, Y0, t0, t1, n = 400, keep = false) {
  const h = (t1 - t0) / n; let Y = Y0; const out = keep ? [[t0, Y0]] : null;
  const f = (t, Z) => mmul(Af(t), Z);
  for (let i = 0; i < n; i++) {
    const t = t0 + i * h, k1 = f(t, Y), k2 = f(t + h / 2, madd(Y, k1, h / 2)), k3 = f(t + h / 2, madd(Y, k2, h / 2)), k4 = f(t + h, madd(Y, k3, h));
    Y = Y.map((r, a) => r.map((x, b) => x + (h / 6) * (k1[a][b] + 2 * k2[a][b] + 2 * k3[a][b] + k4[a][b])));
    if (keep) out.push([t0 + (i + 1) * h, Y]);
  }
  return keep ? out : Y;
}
/** Signed area of a closed polygon (list of [x, y]). */
export function polyArea(P) { let a = 0; for (let i = 0; i < P.length; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % P.length]; a += x1 * y2 - x2 * y1; } return a / 2; }
