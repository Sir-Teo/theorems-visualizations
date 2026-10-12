// Numerical helpers shared by every visualization. Exposed to viz code as `v.M`.
// Everything here is pure (no DOM), so content modules stay importable from Node.

export const TAU = 2 * Math.PI;
export const PI = Math.PI;

// ---------- basics ----------
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, x) => (x - a) / (b - a);
export const remap = (x, a, b, c, d) => c + (d - c) * (x - a) / (b - a);
export const smoothstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const ease = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const sign = (x) => (x > 0) - (x < 0);
export const fract = (x) => x - Math.floor(x);
export const mod = (a, n) => ((a % n) + n) % n;
export const range = (n, start = 0) => Array.from({ length: n }, (_, i) => start + i);
export const linspace = (a, b, n) => n <= 1 ? [a] : Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
export const sum = (arr, f = (x) => x) => arr.reduce((s, x, i) => s + f(x, i), 0);
export const mean = (arr) => sum(arr) / arr.length;
export const argmin = (arr, f = (x) => x) => { let bi = -1, bv = Infinity; arr.forEach((x, i) => { const v = f(x, i); if (v < bv) { bv = v; bi = i; } }); return bi; };
export const argmax = (arr, f = (x) => x) => argmin(arr, (x, i) => -f(x, i));
export const hypot = Math.hypot;
export const dist = (p, q) => Math.hypot(...p.map((x, i) => x - q[i]));

/** Format a number compactly: fmt(3.14159, 3) -> "3.14" */
export function fmt(x, digits = 3) {
  if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : 'NaN';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e5 || a < 1e-4) return x.toExponential(Math.max(0, digits - 1)).replace('-', '−');
  const s = Number(x.toPrecision(digits)).toString();
  return s.replace('-', '−');
}
/** TeX-ready number: sci(0.0000123) -> "1.23\\times10^{-5}" (use inside $…$). */
export function sci(x, digits = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : x < 0 ? '-\\infty' : '\\text{NaN}';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(digits)));
  const e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e);
  return `${Number(m.toPrecision(digits))}\\times10^{${e}}`;
}
/** Fixed decimals with a real minus sign. */
export const fix = (x, d = 2) => x.toFixed(d).replace('-', '−');

// ---------- seeded randomness ----------
export function rng(seed = 1) {
  let a = (seed >>> 0) || 1;
  const next = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = () => next();
  r.uniform = (lo = 0, hi = 1) => lo + (hi - lo) * next();
  r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
  r.normal = (mu = 0, sigma = 1) => {
    const u = 1 - next(), v = next();
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  };
  r.pick = (arr) => arr[Math.floor(next() * arr.length)];
  r.shuffle = (arr) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  return r;
}

// ---------- calculus ----------
/** Composite Simpson rule on [a,b] with n (even) panels. */
export function integrate(f, a, b, n = 400) {
  if (a === b) return 0;
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3;
}
/** Riemann sum with tags chosen by rule: 'left' | 'right' | 'mid' | 'lower' | 'upper' (lower/upper sample 16 pts per cell). */
export function riemann(f, partition, rule = 'mid') {
  let s = 0;
  for (let i = 0; i + 1 < partition.length; i++) {
    const a = partition[i], b = partition[i + 1];
    s += cellValue(f, a, b, rule) * (b - a);
  }
  return s;
}
export function cellValue(f, a, b, rule = 'mid') {
  if (rule === 'left') return f(a);
  if (rule === 'right') return f(b);
  if (rule === 'mid') return f((a + b) / 2);
  let m = Infinity, M = -Infinity;
  for (let k = 0; k <= 16; k++) { const y = f(a + (b - a) * k / 16); if (y < m) m = y; if (y > M) M = y; }
  return rule === 'lower' ? m : M;
}
export const deriv = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
export const deriv2 = (f, x, h = 1e-4) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
export function bisect(f, a, b, tol = 1e-10, maxIt = 200) {
  let fa = f(a);
  for (let i = 0; i < maxIt && b - a > tol; i++) {
    const m = (a + b) / 2, fm = f(m);
    if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m;
  }
  return (a + b) / 2;
}
export function newton(f, x0, steps = 30, df) {
  let x = x0;
  for (let i = 0; i < steps; i++) { const d = df ? df(x) : deriv(f, x); if (!d) break; x -= f(x) / d; }
  return x;
}
/** Newton iterates as a list (for visualising the iteration). */
export function newtonPath(f, x0, steps = 6, df) {
  const out = [x0]; let x = x0;
  for (let i = 0; i < steps; i++) { const d = df ? df(x) : deriv(f, x); if (!d) break; x -= f(x) / d; out.push(x); }
  return out;
}
/** Fixed-point iterates x, g(x), g(g(x)), ... */
export function iterate(g, x0, n) { const out = [x0]; let x = x0; for (let i = 0; i < n; i++) { x = g(x); out.push(x); } return out; }
/** Partial sums of a sequence term(k), k = start..start+n-1. */
export function partialSums(term, n, start = 0) { const out = []; let s = 0; for (let k = start; k < start + n; k++) { s += term(k); out.push(s); } return out; }
/** Runge–Kutta 4 solution of y' = F(t, y) (y may be a number or an array). Returns [[t, y], ...]. */
export function rk4(F, t0, y0, t1, n = 200) {
  const h = (t1 - t0) / n, isArr = Array.isArray(y0);
  const add = (a, b, k) => isArr ? a.map((x, i) => x + k * b[i]) : a + k * b;
  let t = t0, y = y0; const out = [[t, y]];
  for (let i = 0; i < n; i++) {
    const k1 = F(t, y), k2 = F(t + h / 2, add(y, k1, h / 2)), k3 = F(t + h / 2, add(y, k2, h / 2)), k4 = F(t + h, add(y, k3, h));
    y = isArr ? y.map((x, j) => x + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])) : y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    t += h; out.push([t, y]);
  }
  return out;
}

// ---------- special functions ----------
export function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
export function binom(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function gamma(x) {
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  x -= 1; let a = LG[0]; const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
  return Math.sqrt(TAU) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}
export const gaussian = (x, mu = 0, s = 1) => Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(TAU));
/** Smooth bump supported in (-1,1) (a test function). */
export const bump = (x) => Math.abs(x) < 1 ? Math.exp(-1 / (1 - x * x)) : 0;
/** Cantor function (devil's staircase) on [0,1]. */
export function cantorFn(x, depth = 24) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  let y = 0, scale = 0.5;
  for (let i = 0; i < depth; i++) {
    x *= 3;
    if (x < 1) { /* left third */ }
    else if (x < 2) { return y + scale; }
    else { y += scale; x -= 2; }
    scale /= 2;
  }
  return y;
}
/** Intervals remaining after `level` steps of the middle-thirds construction. */
export function cantorIntervals(level, a = 0, b = 1) {
  let I = [[a, b]];
  for (let k = 0; k < level; k++) I = I.flatMap(([p, q]) => { const d = (q - p) / 3; return [[p, p + d], [q - d, q]]; });
  return I;
}

// ---------- Fourier ----------
export const dirichlet = (N, x) => { const s = Math.sin(x / 2); return Math.abs(s) < 1e-9 ? 2 * N + 1 : Math.sin((N + 0.5) * x) / s; };
export const fejer = (N, x) => { const s = Math.sin(x / 2); return Math.abs(s) < 1e-9 ? N + 1 : (Math.sin((N + 1) * x / 2) / s) ** 2 / (N + 1); };
export const poisson = (r, t) => (1 - r * r) / (1 - 2 * r * Math.cos(t) + r * r);
/** Complex Fourier coefficients c_k, k=-N..N, of a 2π-periodic f via the trapezoid rule. Returns {k: [re, im]} array indexed k+N. */
export function fourierCoeffs(f, N, samples = 1024) {
  const out = [];
  for (let k = -N; k <= N; k++) {
    let re = 0, im = 0;
    for (let j = 0; j < samples; j++) {
      const t = -Math.PI + TAU * j / samples, y = f(t);
      re += y * Math.cos(k * t); im -= y * Math.sin(k * t);
    }
    out.push([re / samples, im / samples]);
  }
  return out;
}
/** Evaluate the N-th partial Fourier sum (or Fejér mean if fejerMean) at t from coefficients of fourierCoeffs. */
export function fourierEval(coeffs, t, fejerMean = false) {
  const N = (coeffs.length - 1) / 2; let s = 0;
  for (let k = -N; k <= N; k++) {
    const [a, b] = coeffs[k + N], w = fejerMean ? 1 - Math.abs(k) / (N + 1) : 1;
    s += w * (a * Math.cos(k * t) - b * Math.sin(k * t));
  }
  return s;
}
/** Real trigonometric coefficients of f on [-π,π]: returns {a: [a0..aN], b: [0,b1..bN]} with f ~ a0/2 + Σ a_k cos kx + b_k sin kx. */
export function trigCoeffs(f, N, samples = 1024) {
  const a = [], b = [];
  for (let k = 0; k <= N; k++) {
    let sa = 0, sb = 0;
    for (let j = 0; j < samples; j++) { const t = -Math.PI + TAU * (j + 0.5) / samples, y = f(t); sa += y * Math.cos(k * t); sb += y * Math.sin(k * t); }
    a.push(2 * sa / samples); b.push(2 * sb / samples);
  }
  return { a, b };
}
export function trigEval({ a, b }, x, N = a.length - 1) { let s = a[0] / 2; for (let k = 1; k <= N; k++) s += a[k] * Math.cos(k * x) + b[k] * Math.sin(k * x); return s; }

// ---------- polynomials & approximation ----------
export const polyEval = (coef, x) => coef.reduceRight((acc, c) => acc * x + c, 0); // coef[0] + coef[1] x + ...
export function bernstein(f, n, x) { let s = 0; for (let k = 0; k <= n; k++) s += f(k / n) * binom(n, k) * x ** k * (1 - x) ** (n - k); return s; }
/** Landau kernel Q_n(x) = c_n (1-x^2)^n on [-1,1], normalised to integral 1 (used in Rudin's Weierstrass proof). */
export function landau(n) { const c = 1 / integrate((x) => (1 - x * x) ** n, -1, 1, 2000); return (x) => Math.abs(x) <= 1 ? c * (1 - x * x) ** n : 0; }
export function lagrange(xs, ys) { return (x) => { let s = 0; for (let i = 0; i < xs.length; i++) { let p = ys[i]; for (let j = 0; j < xs.length; j++) if (j !== i) p *= (x - xs[j]) / (xs[i] - xs[j]); s += p; } return s; }; }
export const chebyshevT = (n, x) => Math.abs(x) <= 1 ? Math.cos(n * Math.acos(x)) : Math.cosh(n * Math.acosh(Math.abs(x))) * (x < 0 && n % 2 ? -1 : 1);

// ---------- linear algebra (small, dense) ----------
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const vadd = (a, b) => a.map((x, i) => x + b[i]);
export const vsub = (a, b) => a.map((x, i) => x - b[i]);
export const vscale = (a, k) => a.map((x) => x * k);
export const vlerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
export function norm(a, p = 2) {
  if (p === Infinity) return Math.max(...a.map(Math.abs));
  if (p === 1) return a.reduce((s, x) => s + Math.abs(x), 0);
  if (p === 2) return Math.hypot(...a);
  return Math.pow(a.reduce((s, x) => s + Math.abs(x) ** p, 0), 1 / p);
}
export const normalize = (a, p = 2) => { const n = norm(a, p); return n ? a.map((x) => x / n) : a.slice(); };
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const matVec = (A, x) => A.map((row) => dot(row, x));
export const matMul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)));
export const transpose = (A) => A[0].map((_, j) => A.map((row) => row[j]));
export const identity = (n) => range(n).map((i) => range(n).map((j) => +(i === j)));
export function det(A) {
  const n = A.length; const M = A.map((r) => r.slice()); let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (!M[p][c]) return 0; if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; d = -d; }
    d *= M[c][c];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k < n; k++) M[r][k] -= f * M[c][k]; }
  }
  return d;
}
export function inverse(A) {
  const n = A.length; const M = A.map((r, i) => [...r, ...identity(n)[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-14) return null; [M[p], M[c]] = [M[c], M[p]];
    const piv = M[c][c]; for (let k = 0; k < 2 * n; k++) M[c][k] /= piv;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let k = 0; k < 2 * n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r) => r.slice(n));
}
/** Solve A x = b. */
export const solve = (A, b) => { const Ai = inverse(A); return Ai ? matVec(Ai, b) : null; };
/** Eigen-decomposition of a symmetric 2×2 matrix [[a,b],[b,d]] → {values:[l1,l2], vectors:[[x,y],[x,y]]} with l1 ≥ l2. */
export function eigSym2([[a, b], [, d]]) {
  const tr = a + d, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  let v1 = Math.abs(b) > 1e-12 ? [l1 - d, b] : (a >= d ? [1, 0] : [0, 1]);
  v1 = normalize(v1);
  return { values: [l1, l2], vectors: [v1, [-v1[1], v1[0]]] };
}
/** Eigenvalues of a general real 2×2 matrix (possibly complex): returns [[re,im],[re,im]]. */
export function eig2([[a, b], [c, d]]) {
  const tr = a + d, dt = a * d - b * c, disc = tr * tr / 4 - dt;
  if (disc >= 0) { const s = Math.sqrt(disc); return [[tr / 2 + s, 0], [tr / 2 - s, 0]]; }
  const s = Math.sqrt(-disc); return [[tr / 2, s], [tr / 2, -s]];
}
/** Singular values (σ1 ≥ σ2) of a 2×2 matrix. */
export function svd2(A) { const AtA = matMul(transpose(A), A); const { values } = eigSym2(AtA); return values.map((l) => Math.sqrt(Math.max(0, l))); }
/** Gram–Schmidt orthonormalisation of a list of vectors (drops dependent ones). */
export function gramSchmidt(vs, ip = dot) {
  const out = [];
  for (const v of vs) {
    let w = v.slice();
    for (const e of out) { const c = ip(w, e); w = w.map((x, i) => x - c * e[i]); }
    const n = Math.sqrt(ip(w, w)); if (n > 1e-10) out.push(w.map((x) => x / n));
  }
  return out;
}
/** Orthogonal projection of x onto span of orthonormal list es. */
export const project = (x, es, ip = dot) => es.reduce((acc, e) => vadd(acc, vscale(e, ip(x, e))), x.map(() => 0));

// ---------- geometry ----------
/** Convex hull (monotone chain) of 2D points. */
export function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
export function pointInPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function polyArea(poly) { let a = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]; return a / 2; }
/** Closest point to p on segment ab. */
export function closestOnSegment(p, a, b) {
  const ab = vsub(b, a), t = clamp(dot(vsub(p, a), ab) / (dot(ab, ab) || 1), 0, 1);
  return vadd(a, vscale(ab, t));
}
/** Closest point to p on a closed convex polygon (p itself if inside). */
export function closestOnConvexPoly(p, poly) {
  if (pointInPoly(p, poly)) return p.slice();
  let best = null, bd = Infinity;
  for (let i = 0; i < poly.length; i++) { const q = closestOnSegment(p, poly[i], poly[(i + 1) % poly.length]); const d = dist(p, q); if (d < bd) { bd = d; best = q; } }
  return best;
}
/** Points of the unit sphere of the ℓ^p norm in the plane (p may be Infinity). */
export function unitBall(p = 2, n = 256) {
  return range(n).map((i) => {
    const t = TAU * i / n, c = Math.cos(t), s = Math.sin(t);
    const r = 1 / norm([c, s], p); return [r * c, r * s];
  });
}
/** Smooth closed random blob (radius function with a few Fourier modes). Useful for "a set E". */
export function blob(cx, cy, r, seed = 1, wobble = 0.25, n = 160) {
  const R = rng(seed); const modes = range(5).map((k) => [R.uniform(-1, 1) * wobble / (k + 1), R.uniform(0, TAU)]);
  return range(n).map((i) => {
    const t = TAU * i / n; let rr = 1;
    modes.forEach(([a, ph], k) => { rr += a * Math.cos((k + 2) * t + ph); });
    return [cx + r * rr * Math.cos(t), cy + r * rr * Math.sin(t)];
  });
}

// ---------- complex numbers ----------
export class Cx {
  constructor(re = 0, im = 0) { this.re = re; this.im = im; }
  static of(z) { return z instanceof Cx ? z : typeof z === 'number' ? new Cx(z, 0) : Array.isArray(z) ? new Cx(z[0], z[1]) : new Cx(z.re, z.im); }
  static polar(r, t) { return new Cx(r * Math.cos(t), r * Math.sin(t)); }
  get x() { return this.re; } get y() { return this.im; }
  add(w) { w = Cx.of(w); return new Cx(this.re + w.re, this.im + w.im); }
  sub(w) { w = Cx.of(w); return new Cx(this.re - w.re, this.im - w.im); }
  mul(w) { w = Cx.of(w); return new Cx(this.re * w.re - this.im * w.im, this.re * w.im + this.im * w.re); }
  div(w) { w = Cx.of(w); const d = w.re * w.re + w.im * w.im; return new Cx((this.re * w.re + this.im * w.im) / d, (this.im * w.re - this.re * w.im) / d); }
  scale(k) { return new Cx(this.re * k, this.im * k); }
  neg() { return new Cx(-this.re, -this.im); }
  conj() { return new Cx(this.re, -this.im); }
  inv() { return new Cx(1, 0).div(this); }
  abs() { return Math.hypot(this.re, this.im); }
  abs2() { return this.re * this.re + this.im * this.im; }
  arg() { return Math.atan2(this.im, this.re); }
  exp() { const e = Math.exp(this.re); return new Cx(e * Math.cos(this.im), e * Math.sin(this.im)); }
  log() { return new Cx(Math.log(this.abs()), this.arg()); }
  pow(w) { if (typeof w === 'number' && Number.isInteger(w) && w >= 0) { let r = new Cx(1, 0); for (let i = 0; i < w; i++) r = r.mul(this); return r; } if (this.re === 0 && this.im === 0) return new Cx(0, 0); return this.log().mul(w).exp(); }
  sqrt() { const r = Math.sqrt(this.abs()), t = this.arg() / 2; return new Cx(r * Math.cos(t), r * Math.sin(t)); }
  sin() { return new Cx(Math.sin(this.re) * Math.cosh(this.im), Math.cos(this.re) * Math.sinh(this.im)); }
  cos() { return new Cx(Math.cos(this.re) * Math.cosh(this.im), -Math.sin(this.re) * Math.sinh(this.im)); }
  eq(w, eps = 1e-12) { w = Cx.of(w); return Math.abs(this.re - w.re) < eps && Math.abs(this.im - w.im) < eps; }
  toArray() { return [this.re, this.im]; }
  toString(d = 3) { return `${fmt(this.re, d)} ${this.im < 0 ? '−' : '+'} ${fmt(Math.abs(this.im), d)}i`; }
}
export const cx = (re = 0, im = 0) => new Cx(re, im);
export const I = new Cx(0, 1);
/** Möbius transform (az+b)/(cz+d). */
export const mobius = (a, b, c, d) => (z) => Cx.of(a).mul(z).add(b).div(Cx.of(c).mul(z).add(d));
/** Disc automorphism φ_a(z) = (z − a)/(1 − ā z). */
export const discAuto = (a) => (z) => { a = Cx.of(a); z = Cx.of(z); return z.sub(a).div(new Cx(1, 0).sub(a.conj().mul(z))); };
/** Numerical contour integral ∮ f(z) dz over parametrised path g: [0,1] → C. */
export function contourIntegral(f, g, n = 800) {
  let s = new Cx(0, 0);
  for (let i = 0; i < n; i++) {
    const z0 = Cx.of(g(i / n)), z1 = Cx.of(g((i + 1) / n)), zm = Cx.of(g((i + 0.5) / n));
    s = s.add(Cx.of(f(zm)).mul(z1.sub(z0)));
  }
  return s;
}
/** Winding number of closed path g:[0,1]→C about a. */
export function winding(g, a, n = 800) {
  a = Cx.of(a); let tot = 0, prev = Cx.of(g(0)).sub(a).arg();
  for (let i = 1; i <= n; i++) { const t = Cx.of(g(i / n)).sub(a).arg(); let d = t - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; tot += d; prev = t; }
  return Math.round(tot / TAU);
}

// ---------- colour helpers (pure) ----------
export function hsl2rgb(h, s, l) {
  h = fract(h); const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}
const VIRIDIS = [[68, 1, 84], [72, 40, 120], [62, 74, 137], [49, 104, 142], [38, 130, 142], [31, 158, 137], [53, 183, 121], [109, 205, 89], [180, 222, 44], [253, 231, 37]];
const MAGMA = [[0, 0, 4], [28, 16, 68], [79, 18, 123], [129, 37, 129], [181, 54, 122], [229, 80, 100], [251, 135, 97], [254, 194, 135], [252, 253, 191]];
const DIVERGE = [[40, 90, 200], [120, 160, 230], [235, 235, 235], [235, 140, 110], [200, 50, 50]];
function ramp(stops, t) { t = clamp(t, 0, 1) * (stops.length - 1); const i = Math.min(stops.length - 2, Math.floor(t)), f = t - i; return stops[i].map((c, j) => c + (stops[i + 1][j] - c) * f); }
/** Colormap → [r,g,b] in 0..255. names: viridis, magma, diverging. */
export function cmap(t, name = 'viridis') { return ramp(name === 'magma' ? MAGMA : name === 'diverging' ? DIVERGE : VIRIDIS, t); }
