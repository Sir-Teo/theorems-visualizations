// Numerical Analysis — Chapter 3 (polynomial interpolation): helpers shared by ch03.js and ch03-b.js.
// Re-exports the earlier chapter's helpers; everything here is ordinary double-precision arithmetic.
export * from './ch02.shared.js';

export const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
/** n+1 equispaced points on [-1,1] and n+1 Chebyshev points (extrema of T_n) in increasing order. */
export const equiPts = (n) => Array.from({ length: n + 1 }, (_, j) => (n === 0 ? 0 : -1 + 2 * j / n));
export const chebPts = (n) => Array.from({ length: n + 1 }, (_, j) => (n === 0 ? 0 : -Math.cos(j * Math.PI / n)));
/** Zeros of T_{n+1} (n+1 points, "first kind"), increasing. */
export const chebZeros = (n) => Array.from({ length: n + 1 }, (_, j) => -Math.cos((2 * j + 1) * Math.PI / (2 * n + 2)));
export const nodesOf = (kind, n) => (kind === 'cheb' ? chebPts(n) : equiPts(n));

/** Barycentric weights w_j = 1/prod_{k != j}(x_j - x_k), scaled to avoid overflow. */
export function baryW(xs) {
  const n = xs.length; const w = new Array(n);
  for (let j = 0; j < n; j++) { let p = 1; for (let k = 0; k < n; k++) if (k !== j) p *= 2 * (xs[j] - xs[k]); w[j] = 1 / p; }
  return w;
}
/** Chebyshev (second kind) weights, in the order of chebPts (increasing x). */
export const chebW = (n) => Array.from({ length: n + 1 }, (_, j) => ((n - j) % 2 ? -1 : 1) * (j === 0 || j === n ? 0.5 : 1));
/** Barycentric (second form) evaluation of the interpolant of ys at x. */
export function bary(xs, w, ys, x) {
  let num = 0, den = 0;
  for (let j = 0; j < xs.length; j++) { const d = x - xs[j]; if (d === 0) return ys[j]; const t = w[j] / d; num += t * ys[j]; den += t; }
  return num / den;
}
/** Lagrange basis polynomial l_j(x). */
export function lagr(xs, w, j, x) {
  let den = 0; for (let k = 0; k < xs.length; k++) { const d = x - xs[k]; if (d === 0) return k === j ? 1 : 0; den += w[k] / d; }
  return (w[j] / (x - xs[j])) / den;
}
/** Lebesgue function sum_j |l_j(x)|. */
export function lebFn(xs, w, x) {
  // First barycentric form avoids subtracting enormous terms in the denominator
  // when equispaced interpolation is ill-conditioned (already severe at n=60).
  // The weights may have any common scale; recover it from the first node.
  let product = 1, scale = w[0], sum = 0;
  for (let j = 0; j < xs.length; j++) {
    const d = x - xs[j]; if (d === 0) return 1;
    product *= 2 * d; sum += Math.abs(w[j] / d);
    if (j) scale *= 2 * (xs[0] - xs[j]);
  }
  return Math.abs(product / (2 * scale)) * sum;
}
/** Lebesgue constant on [xs[0], xs[n]] with the maximiser (max per subinterval, refined by ternary search). */
export function lebMax(xs, w = baryW(xs)) {
  const n = xs.length - 1; let best = 0, at = xs[0];
  for (let i = 0; i < n; i++) {
    const a = xs[i], b = xs[i + 1]; if (b <= a) continue;
    let bi = 0, bx = a; const K = 24;
    for (let k = 1; k < K; k++) { const x = a + (b - a) * k / K, y = lebFn(xs, w, x); if (y > bi) { bi = y; bx = x; } }
    let lo = Math.max(a, bx - (b - a) / K), hi = Math.min(b, bx + (b - a) / K);
    for (let it = 0; it < 40; it++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (lebFn(xs, w, m1) < lebFn(xs, w, m2)) lo = m1; else hi = m2; }
    const x = (lo + hi) / 2, y = lebFn(xs, w, x); if (y > bi) { bi = y; bx = x; }
    if (bi > best) { best = bi; at = bx; }
  }
  return { L: best, x: at };
}
/** Max of |f - p_n| on [-1,1] over a fine grid, p_n the barycentric interpolant of f in nodes xs. */
export function maxErr(f, xs, w, m = 600) {
  const ys = xs.map(f); let e = 0;
  for (let i = 0; i <= m; i++) { const x = -1 + 2 * i / m; e = Math.max(e, Math.abs(f(x) - bary(xs, w, ys, x))); }
  return e;
}

/** Newton divided-difference coefficients c_k = f[x_0..x_k] and the table (rows by order). */
export function divdiff(xs, ys) {
  const n = xs.length, T = [ys.slice()];
  for (let k = 1; k < n; k++) { const prev = T[k - 1], row = []; for (let i = 0; i < n - k; i++) row.push((prev[i + 1] - prev[i]) / (xs[i + k] - xs[i])); T.push(row); }
  return { c: T.map((r) => r[0]), T };
}
export function newtonEval(xs, c, x, k = c.length) {
  let r = c[k - 1]; for (let i = k - 2; i >= 0; i--) r = r * (x - xs[i]) + c[i]; return r;
}
/** Node polynomial omega(x) = prod (x - x_j). */
export const omega = (xs, x) => { let p = 1; for (const t of xs) p *= x - t; return p; };

/** Solve a dense linear system by Gaussian elimination with partial pivoting (A is copied). */
export function solveGE(A0, b0) {
  const n = b0.length, A = A0.map((r) => r.slice()), b = b0.slice();
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    if (A[i][i] === 0) return null;
    for (let r = i + 1; r < n; r++) { const m = A[r][i] / A[i][i]; if (m === 0) continue; for (let c = i; c < n; c++) A[r][c] -= m * A[i][c]; b[r] -= m * b[i]; }
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c]; x[i] = s / A[i][i]; }
  return x;
}
/** Chebyshev polynomial T_n(x) by the three-term recurrence (valid for all real x). */
export function T(n, x) { let a = 1, b = x; if (n === 0) return a; for (let k = 1; k < n; k++) { const c = 2 * x * b - a; a = b; b = c; } return b; }

/** Chebyshev coefficients a_0..a_n of the interpolant through chebPts-ordered values (index j <-> x = -cos(j pi/n)). */
export function chebCoeffs(vals) {
  const n = vals.length - 1, a = new Array(n + 1).fill(0);
  for (let k = 0; k <= n; k++) {
    let s = 0;
    for (let j = 0; j <= n; j++) { const wj = (j === 0 || j === n) ? 0.5 : 1; s += wj * vals[j] * Math.cos(k * (n - j) * Math.PI / n); }
    a[k] = (2 / n) * s * ((k === 0 || k === n) ? 0.5 : 1);
  }
  return a;
}

// ---------------------------------------------------------------- complex numbers as [re, im]
export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const cabs = (a) => Math.hypot(a[0], a[1]);

/** Logarithmic potential U(z) = int log|z - t| dmu(t) of the equispaced (uniform) and Chebyshev (arcsine) measures on [-1,1]. */
export function potEqui(x, y) {
  // U = -1 + Re[ (z+1)log(z+1) - (z-1)log(z-1) ] / 2   (the limit 0·log 0 = 0 at z = ±1)
  const t = (a) => { const r = Math.hypot(a, y); if (r === 0) return 0; return a * Math.log(r) - y * Math.atan2(y, a); };
  return -1 + 0.5 * (t(x + 1) - t(x - 1));
}
export function potCheb(x, y) {
  // U = log |(z + sqrt(z^2-1))/2|, choosing the root with |.| >= 1
  const re = x * x - y * y - 1, im = 2 * x * y, r = Math.hypot(re, im), sr = Math.sqrt((r + re) / 2), si = (im < 0 ? -1 : 1) * Math.sqrt(Math.max(0, (r - re) / 2));
  const a = Math.hypot(x + sr, y + si), b = Math.hypot(x - sr, y - si);
  return Math.log(Math.max(a, b) / 2);
}
export const potOf = (kind) => (kind === 'cheb' ? potCheb : potEqui);
