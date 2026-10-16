// Shared helpers for ODE chapter 4 (series solutions and boundary value problems): plain functions, no imports beyond chapter 3's shared module.
export * from './ch03.shared.js';
import { C } from './ch03.shared.js';

// ───────────────────────────────────────────────────────────── special functions
const LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
/** Gamma function for real z (Lanczos, reflection for z < 1/2). */
export function gammaFn(z) {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
  z -= 1; let x = LANCZOS[0]; const t = z + 7.5;
  for (let i = 1; i < 9; i++) x += LANCZOS[i] / (z + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
/** 1/Γ(z), entire (0 at the poles). */
export function rgamma(z) { return z <= 0 && Math.abs(z - Math.round(z)) < 1e-12 ? 0 : 1 / gammaFn(z); }
/** Bessel function of the first kind J_ν(x), x ≥ 0, by its power series (accurate to ~1e-8 up to x ≈ 25). */
export function besselJ(nu, x) {
  if (x === 0) return nu === 0 ? 1 : 0;
  if (nu < 0 && Math.abs(nu - Math.round(nu)) < 1e-12) return (Math.round(-nu) % 2 ? -1 : 1) * besselJ(-nu, x);
  let t = Math.pow(x / 2, nu) * rgamma(nu + 1), s = t; const q = -(x / 2) * (x / 2);
  for (let k = 1; k < 300; k++) { t *= q / (k * (k + nu)); s += t; if (k > x && Math.abs(t) < 1e-17 * Math.abs(s) + 1e-300) break; }
  return s;
}
/** Bessel function of the second kind Y_ν(x), x > 0. At integer ν the limit is taken from two nearby orders. */
export function besselY(nu, x) {
  const f = (n) => (besselJ(n, x) * Math.cos(n * Math.PI) - besselJ(-n, x)) / Math.sin(n * Math.PI);
  if (Math.abs(nu - Math.round(nu)) > 2e-3) return f(nu);
  const d = 1e-3; return 0.5 * (f(nu + d) + f(nu - d));
}
/** Positive zeros of J_ν in (0, xmax]. */
export function besselZeros(nu, xmax) {
  const out = []; let x0 = Math.max(1e-3, nu * 0.9), f0 = besselJ(nu, x0);
  for (let x1 = x0 + 0.04; x1 <= xmax + 0.04; x1 += 0.04) {
    const f1 = besselJ(nu, x1);
    if (f0 * f1 < 0) { let a = x1 - 0.04, b = x1; for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (besselJ(nu, a) * besselJ(nu, m) <= 0) b = m; else a = m; } const z = (a + b) / 2; if (z <= xmax) out.push(z); }
    f0 = f1;
  }
  return out;
}
/** Legendre polynomial P_n(x) by the three-term recurrence. */
export function legendreP(n, x) {
  if (n === 0) return 1; let a = 1, b = x;
  for (let k = 1; k < n; k++) { const c = ((2 * k + 1) * x * b - k * a) / (k + 1); a = b; b = c; }
  return b;
}
/** Coefficients of the even/odd power series solution of (1−x²)y″ − 2xy′ + ℓ(ℓ+1)y = 0 (a₀ = 1 for even, a₁ = 1 for odd). */
export function legendreSeriesCoef(ell, odd, N) {
  const a = new Array(N + 2).fill(0); a[odd ? 1 : 0] = 1; const L = ell * (ell + 1);
  for (let k = odd ? 1 : 0; k + 2 <= N; k += 2) a[k + 2] = (a[k] * (k * (k + 1) - L)) / ((k + 1) * (k + 2));
  return a;
}
export function polyHorner(a, x) { let s = 0; for (let k = a.length - 1; k >= 0; k--) s = s * x + a[k]; return s; }

// ───────────────────────────────────────────────────────────── Frobenius series (complex exponent allowed)
/**
 * Frobenius solution of t²u″ + t(p0+p1 t+p2 t²)u′ + (q0+q1 t+q2 t²)u = 0, u = t^r Σ c_k t^k, c_0 = 1, r = [re, im].
 * The recurrence F(r+k) c_k = −Σ_j c_{k−j}[p_j (r+k−j) + q_j] with F(s) = s(s−1) + p0 s + q0.
 * A vanishing F(r+k) (a root differing from r by a positive integer) is reported in `.res` and the coefficient is set to 0;
 * `.log` lists those k where the right-hand side is nonzero, i.e. where the series genuinely fails and a logarithm is needed.
 */
export function frobCoef(P, Q, r, N) {
  const c = [[1, 0]], res = [], log = [];
  const F = (s) => C.add(C.add(C.mul(s, C.sub(s, [1, 0])), C.mul([P[0], 0], s)), [Q[0], 0]);
  for (let k = 1; k <= N; k++) {
    let acc = [0, 0];
    for (let j = 1; j <= 2 && j <= k; j++) {
      const s = [r[0] + k - j, r[1]];
      acc = C.add(acc, C.mul(c[k - j], [(P[j] || 0) * s[0] + (Q[j] || 0), (P[j] || 0) * s[1]]));
    }
    const den = F([r[0] + k, r[1]]);
    if (C.abs(den) < 1e-9) { res.push(k); if (C.abs(acc) > 1e-9) log.push(k); c.push([0, 0]); } else c.push(C.div([-acc[0], -acc[1]], den));
  }
  c.res = res; c.log = log; return c;
}
/** Evaluate t^r Σ c_k t^k at real t > 0 → [re, im]. */
export function frobEval(c, r, t) {
  let s = [0, 0]; for (let k = c.length - 1; k >= 0; k--) s = C.add(C.mul(s, [t, 0]), c[k]);
  const lt = Math.log(t); return C.mul(s, C.exp([r[0] * lt, r[1] * lt]));
}
/** Indicial roots of s(s−1) + p0 s + q0 = 0 → [[re, im], [re, im]] (real roots ordered larger first). */
export function indicialRoots(p0, q0) {
  const b = p0 - 1, disc = b * b - 4 * q0;
  if (disc >= 0) { const d = Math.sqrt(disc); return [[(-b + d) / 2, 0], [(-b - d) / 2, 0]]; }
  const d = Math.sqrt(-disc); return [[-b / 2, d / 2], [-b / 2, -d / 2]];
}

// ───────────────────────────────────────────────────────────── Sturm–Liouville machinery:  −(p u′)′ + q u = λ w u  on [0, 1]
/**
 * Tabulates p, q, w at the 2N+1 points x = i/(2N) (nodes and midpoints) so RK4 never calls a user function.
 * Returns null when p or w is not positive and finite somewhere.
 */
export function slProblem(fp, fq, fw, N = 600) {
  const M = 2 * N + 1, P = new Float64Array(M), Q = new Float64Array(M), W = new Float64Array(M);
  let minW = Infinity, minQ = Infinity, S = 0;
  for (let i = 0; i < M; i++) {
    const x = i / (M - 1); P[i] = fp(x); Q[i] = fq(x); W[i] = fw(x);
    if (!(P[i] > 1e-9) || !(W[i] > 1e-9) || !isFinite(Q[i]) || !isFinite(P[i]) || !isFinite(W[i])) return null;
    minW = Math.min(minW, W[i]); minQ = Math.min(minQ, Q[i]);
  }
  // Simpson over the 2N+1 points for S = ∫√(w/p)
  S = 0; for (let i = 0; i < M; i++) S += (i === 0 || i === M - 1 ? 1 : i % 2 ? 4 : 2) * Math.sqrt(W[i] / P[i]);
  S /= 3 * (M - 1);
  const prob = { N, h: 1 / N, P, Q, W, minW, minQ, S, cache: new Map() };
  return prob;
}
/** RK4 for (u, v = p u′):  u′ = v/p,  v′ = (q − λw) u.  dir = +1 from x = 0, −1 from x = 1. Returns {u, v} at the N+1 nodes. */
export function slPath(pr, lam, u0, v0, dir = 1) {
  const { N, P, Q, W } = pr, h = dir / N, U = new Float64Array(N + 1), V = new Float64Array(N + 1);
  let u = u0, v = v0, i0 = dir > 0 ? 0 : N; U[i0] = u; V[i0] = v;
  for (let s = 0; s < N; s++) {
    const i = i0 + dir * s, a = 2 * i, b = 2 * i + dir, c = 2 * i + 2 * dir;
    const f1u = v / P[a], f1v = (Q[a] - lam * W[a]) * u;
    const u2 = u + (h / 2) * f1u, v2 = v + (h / 2) * f1v, f2u = v2 / P[b], f2v = (Q[b] - lam * W[b]) * u2;
    const u3 = u + (h / 2) * f2u, v3 = v + (h / 2) * f2v, f3u = v3 / P[b], f3v = (Q[b] - lam * W[b]) * u3;
    const u4 = u + h * f3u, v4 = v + h * f3v, f4u = v4 / P[c], f4v = (Q[c] - lam * W[c]) * u4;
    u += (h / 6) * (f1u + 2 * f2u + 2 * f3u + f4u); v += (h / 6) * (f1v + 2 * f2v + 2 * f3v + f4v);
    U[i0 + dir * (s + 1)] = u; V[i0 + dir * (s + 1)] = v;
  }
  return { u: U, v: V };
}
/** Boundary data at the left end: 'D' (u = 0) or 'N' (p u′ = 0) → [u0, v0]. */
const START = { D: [0, 1], N: [1, 0] };
/** Shooting function g(λ): the boundary quantity at x = 1 for the solution that satisfies the left boundary condition (bc = 'DD', 'DN', 'ND' or 'NN'). */
export function slShoot(pr, lam, bc) {
  const [u0, v0] = START[bc[0]], { N, P, Q, W } = pr, h = 1 / N;
  let u = u0, v = v0;
  for (let i = 0; i < N; i++) {
    const a = 2 * i, b = a + 1, c = a + 2;
    const f1u = v / P[a], f1v = (Q[a] - lam * W[a]) * u;
    const u2 = u + (h / 2) * f1u, v2 = v + (h / 2) * f1v, f2u = v2 / P[b], f2v = (Q[b] - lam * W[b]) * u2;
    const u3 = u + (h / 2) * f2u, v3 = v + (h / 2) * f2v, f3u = v3 / P[b], f3v = (Q[b] - lam * W[b]) * u3;
    const u4 = u + h * f3u, v4 = v + h * f3v, f4u = v4 / P[c], f4v = (Q[c] - lam * W[c]) * u4;
    u += (h / 6) * (f1u + 2 * f2u + 2 * f3u + f4u); v += (h / 6) * (f1v + 2 * f2v + 2 * f3v + f4v);
  }
  return bc[1] === 'D' ? u : v;
}
/** The first n eigenvalues (increasing), by scanning the shooting function for sign changes and bisecting. */
export function slEigenvalues(pr, bc, n) {
  const key = 'ev' + bc; let have = pr.cache.get(key);
  if (have && have.length >= n) return have.slice(0, n);
  const out = []; let lam = Math.min(0, pr.minQ / pr.minW) - 0.37, g0 = slShoot(pr, lam, bc), it = 0;
  while (out.length < n && it++ < 40000) {
    const step = 0.1 + (0.3 * Math.sqrt(Math.max(lam, 0))) / pr.S, l1 = lam + step, g1 = slShoot(pr, l1, bc);
    if (g0 * g1 < 0 || g1 === 0) {
      let a = lam, b = l1, ga = g0;
      for (let i = 0; i < 48; i++) { const m = (a + b) / 2, gm = slShoot(pr, m, bc); if (ga * gm <= 0) b = m; else { a = m; ga = gm; } }
      out.push((a + b) / 2);
    }
    lam = l1; g0 = g1;
  }
  pr.cache.set(key, out); return out.slice(0, n);
}
/** Eigenfunction for eigenvalue lam, normalised in L²(w) with u′(0) > 0 (D) or u(0) > 0 (N). Returns {x, u, v}. */
export function slEigenfunction(pr, lam, bc) {
  const [u0, v0] = START[bc[0]], { u, v } = slPath(pr, lam, u0, v0, 1), { N, W } = pr;
  let s = 0; for (let i = 0; i <= N; i++) s += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * W[2 * i] * u[i] * u[i];
  const nrm = Math.sqrt((s / (3 * N)) || 1), x = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) { x[i] = i / N; u[i] /= nrm; v[i] /= nrm; }
  return { x, u, v };
}
/** Weighted inner product ∫ w f g dx of two node arrays (Simpson; N even). */
export function slInner(pr, f, g) {
  const { N, W } = pr; let s = 0;
  for (let i = 0; i <= N; i++) s += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * W[2 * i] * f[i] * g[i];
  return s / (3 * N);
}
/** Cached list of the first n normalised eigenfunctions. */
export function slEigenpairs(pr, bc, n) {
  const key = 'ep' + bc; let have = pr.cache.get(key) || [];
  if (have.length < n) { const ev = slEigenvalues(pr, bc, n); for (let k = have.length; k < ev.length; k++) have.push({ lam: ev[k], ...slEigenfunction(pr, ev[k], bc) }); pr.cache.set(key, have); }
  return have.slice(0, n);
}
/** Linear interpolation of a node array at x ∈ [0, 1]. */
export function nodeAt(arr, x) { const N = arr.length - 1, t = Math.min(Math.max(x, 0), 1) * N, i = Math.min(N - 1, Math.floor(t)), w = t - i; return arr[i] * (1 - w) + arr[i + 1] * w; }
/** Node array → [[x, value], …] points for s.path. */
export function nodePts(arr, scale = 1) { const N = arr.length - 1, o = []; for (let i = 0; i <= N; i++) o.push([i / N, arr[i] * scale]); return o; }
/** Zeros (sign changes with linear interpolation) strictly inside (0, 1) of a node array. */
export function nodeZeros(arr, tol = 0) {
  const N = arr.length - 1, z = [];
  for (let i = 0; i < N; i++) { const a = arr[i], b = arr[i + 1]; if ((a < -tol && b > tol) || (a > tol && b < -tol) || (a === 0 && i > 0 && b !== 0)) z.push((i + a / (a - b || 1)) / N); }
  return z.filter((q) => q > 1e-6 && q < 1 - 1e-6);
}

/** Presets (Teschl's form: −(pu′)′ + qu = λwu). */
export const SL_PRESETS = [
  { value: 'string', label: 'uniform string', p: '1', q: '0', w: '1' },
  { value: 'heavy', label: 'heavy right end', p: '1', q: '0', w: '1+4x' },
  { value: 'stiff', label: 'stiff middle', p: '1+3 sin(pi x)^2', q: '0', w: '1' },
  { value: 'pot', label: 'potential bump', p: '1', q: '60 x (1-x)', w: '1' },
];
/**
 * Editable Sturm–Liouville problem for a viz: a preset selector, text fields for p, q, w and (optionally) the boundary-condition choice.
 * `.prob()` is the tabulated problem (cached; previous valid one when the fields are being edited), `.bc`, `.note` (an error message, or '').
 */
export function slControls(v, o = {}) {
  const presets = o.presets || SL_PRESETS;
  const bcSel = o.bc === false ? { value: o.bcFixed || 'DD' } : v.select('ends', [{ value: 'DD', label: 'Dirichlet–Dirichlet' }, { value: 'NN', label: 'Neumann–Neumann' }, { value: 'DN', label: 'Dirichlet–Neumann' }], o.bcInit || 'DD');
  const sel = v.select('problem', presets.map((p) => ({ value: p.value, label: p.label })), o.init || presets[0].value, {
    onChange(val) { const pr = presets.find((p) => p.value === val); P.set(pr.p); Q.set(pr.q); Wi.set(pr.w); },
  });
  const first = presets.find((p) => p.value === (o.init || presets[0].value));
  const P = v.input('$p(x)=$', first.p, { vars: ['x'], width: 150 }), Q = v.input('$q(x)=$', first.q, { vars: ['x'], width: 150 }), Wi = v.input('$w(x)=$', first.w, { vars: ['x'], width: 150 });
  if (o.edit === false) { P.el.hidden = Q.el.hidden = Wi.el.hidden = true; }
  let key = null, pr = null, note = '';
  return {
    sel, bcSel, P, Q, W: Wi,
    get bc() { return bcSel.value; },
    get note() { return note; },
    prob() {
      if (P.error || Q.error || Wi.error || !P.fn || !Q.fn || !Wi.fn) { note = 'Fix the formula: ' + (P.error || Q.error || Wi.error || 'syntax'); return pr; }
      const k = P.value + '|' + Q.value + '|' + Wi.value;
      if (k !== key) { const np = slProblem(P.fn, Q.fn, Wi.fn, o.N || 600); if (!np) { note = 'Need $p>0$ and $w>0$ on $[0,1]$: showing the previous problem.'; return pr; } pr = np; key = k; }
      note = ''; return pr;
    },
  };
}

// ───────────────────────────────────────────────────────────── small numerical tools
/** Solve a tridiagonal system (a: sub, b: diag, c: super, d: rhs), all arrays of equal length. */
export function thomas(a, b, c, d) {
  const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
  cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
  x[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}
/** Catmull–Rom spline through points (xs increasing) → function of x (C¹). */
export function catmull(xs, ys) {
  const n = xs.length;
  const m = ys.map((_, i) => (i === 0 ? (ys[1] - ys[0]) / (xs[1] - xs[0]) : i === n - 1 ? (ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2]) : (ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1])));
  return (x) => {
    let j = 0; while (j < n - 2 && x > xs[j + 1]) j++;
    const h = xs[j + 1] - xs[j], t = (x - xs[j]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[j] + (t3 - 2 * t2 + t) * h * m[j] + (-2 * t3 + 3 * t2) * ys[j + 1] + (t3 - t2) * h * m[j + 1];
  };
}
/** Simpson rule for samples on a uniform grid with an even number of intervals. */
export function simpson(vals, h) { const n = vals.length - 1; let s = 0; for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * vals[i]; return (s * h) / 3; }
