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
  let e = Math.floor(Math.log10(a)), m = Number((x / Math.pow(10, e)).toPrecision(digits));
  if (Math.abs(m) >= 10) { m = Number((m / 10).toPrecision(digits)); e++; }
  return `${m}\\times10^{${e}}`;
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

// ---------- safe expression parser (no eval) ----------
const EXPR_FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, log: Math.log, ln: Math.log, log10: Math.log10, log2: Math.log2, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil, round: Math.round,
  min: Math.min, max: Math.max, pow: Math.pow, atan2: Math.atan2, sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x), sgn: Math.sign };
const EXPR_CONST = { pi: Math.PI, π: Math.PI, e: Math.E, tau: 2 * Math.PI };
/**
 * Compile a formula typed by the reader into a function, without eval: compileExpr('x^2 - 3 sin(t x)', ['t', 'x']).
 * Supports + − * / ^ (right-assoc), unary minus, parentheses, implicit multiplication (2x, 3(x+1), x y), |x|,
 * constants pi e tau, and sin cos tan exp ln log sqrt abs min max pow … → {f: (...vars) => number, error: null} or {f: null, error: 'message'}.
 */
export function compileExpr(src, vars = ['x']) {
  const s = String(src ?? '').replace(/\*\*/g, '^').replace(/[−–]/g, '-').replace(/·|×/g, '*'); let i = 0;
  const err = (m) => { throw new Error(`${m} at position ${i + 1}`); };
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const peek = () => { ws(); return s[i]; };
  const startsAtom = () => { const c = peek(); return c != null && (/[0-9.(|a-zA-Zπ]/.test(c)); };
  let inAbs = 0;
  const atom = () => {
    const c = peek();
    if (c === '(') { i++; const e = expr(); if (peek() !== ')') err('missing )'); i++; return e; }
    if (c === '|') { i++; inAbs++; const e = expr(); inAbs--; if (peek() !== '|') err('missing |'); i++; return (env) => Math.abs(e(env)); }
    if (/[0-9.]/.test(c)) { const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i)); if (!m) err('bad number'); i += m[0].length; const v = +m[0]; return () => v; }
    const m = /^([a-zA-Zπ][a-zA-Z0-9_]*)/.exec(s.slice(i)); if (!m) err(c == null ? 'unexpected end' : `unexpected "${c}"`);
    let name = m[1];
    // longest known prefix: "xsin" → x · sin is not supported, but "pix" → pi · x and "2pi" work via implicit products
    if (!(name in EXPR_FN) && !(name in EXPR_CONST) && !vars.includes(name)) {
      const pre = [...vars, ...Object.keys(EXPR_CONST), ...Object.keys(EXPR_FN)].filter((v) => name.startsWith(v)).sort((a, b) => b.length - a.length)[0];
      if (!pre) err(`unknown name "${name}"`); name = pre;
    }
    i += name.length;
    if (name in EXPR_FN) {
      const fn = EXPR_FN[name];
      if (peek() === '(') { i++; const args = [expr()]; while (peek() === ',') { i++; args.push(expr()); } if (peek() !== ')') err('missing )'); i++; return args.length === 1 ? ((a) => (env) => fn(a(env)))(args[0]) : (env) => fn(...args.map((a) => a(env))); }
      const a = power(); return (env) => fn(a(env)); // sin x
    }
    if (name in EXPR_CONST) { const v = EXPR_CONST[name]; return () => v; }
    const k = vars.indexOf(name); return (env) => env[k];
  };
  const power = () => { const b = atom(); if (peek() === '^') { i++; const ex = unary(); return (env) => Math.pow(b(env), ex(env)); } return b; };
  const unary = () => { const c = peek(); if (c === '-') { i++; const a = unary(); return (env) => -a(env); } if (c === '+') { i++; return unary(); } return power(); };
  const term = () => {
    let a = unary();
    for (;;) {
      const c = peek();
      if (c === '*' || c === '/') { i++; const b = unary(); const l = a; a = c === '*' ? (env) => l(env) * b(env) : (env) => l(env) / b(env); }
      else if (startsAtom() && !(c === '|' && inAbs)) { const b = power(); const l = a; a = (env) => l(env) * b(env); } // implicit product
      else return a;
    }
  };
  const expr = () => { let a = term(); for (;;) { const c = peek(); if (c === '+' || c === '-') { i++; const b = term(); const l = a; a = c === '+' ? (env) => l(env) + b(env) : (env) => l(env) - b(env); } else return a; } };
  try {
    if (!s.trim()) err('empty formula');
    const e = expr(); if (peek() != null) err(`unexpected "${peek()}"`);
    const f = (...a) => e(a); f(...vars.map(() => 0.37)); // smoke-evaluate
    return { f, error: null };
  } catch (x) { return { f: null, error: x.message }; }
}

// ---------- polynomials & approximation ----------
export const polyEval = (coef, x) => coef.reduceRight((acc, c) => acc * x + c, 0); // coef[0] + coef[1] x + ...
/**
 * All complex roots of a polynomial with ascending coefficients (numbers or Cx), by Durand–Kerner
 * (Weierstrass) iteration. `start` (optional array of Cx) warm-starts from previous roots, which keeps
 * roots continuous when coefficients are dragged. Returns an array of Cx (length = degree).
 */
export function polyRoots(coef, { start = null, iters = 500, tol = 1e-12 } = {}) {
  const c = coef.map((a) => (a instanceof Cx ? a : new Cx(+a, 0)));
  while (c.length > 1 && c[c.length - 1].abs() < 1e-14) c.pop();
  const n = c.length - 1; if (n < 1) return [];
  const lead = c[n]; const a = c.map((z) => z.div(lead)); // monic
  const R = 1 + Math.max(...a.slice(0, n).map((z) => z.abs())); // Cauchy bound
  let z = start && start.length === n ? start.map((w) => (w instanceof Cx ? w : new Cx(w.re, w.im))) : Array.from({ length: n }, (_, k) => Cx.polar(R * 0.9, (2 * Math.PI * k) / n + 0.4));
  const P = (x) => { let acc = new Cx(0, 0); for (let k = n; k >= 0; k--) acc = acc.mul(x).add(a[k]); return acc; };
  for (let it = 0; it < iters; it++) {
    let delta = 0;
    z = z.map((zi, i) => { let den = new Cx(1, 0); for (let j = 0; j < n; j++) if (j !== i) den = den.mul(zi.sub(z[j])); if (den.abs() < 1e-300) den = new Cx(1e-12, 1e-12); const step = P(zi).div(den); delta = Math.max(delta, step.abs()); return zi.sub(step); });
    if (delta < tol * R) break;
  }
  return z;
}
/** Ascending coefficients (Cx) of the monic polynomial with the given roots (numbers or Cx). */
export function polyFromRoots(roots) {
  let c = [new Cx(1, 0)];
  for (const r0 of roots) { const r = r0 instanceof Cx ? r0 : new Cx(+r0, 0); const nc = Array.from({ length: c.length + 1 }, () => new Cx(0, 0)); for (let k = 0; k < c.length; k++) { nc[k + 1] = nc[k + 1].add(c[k]); nc[k] = nc[k].sub(c[k].mul(r)); } c = nc; }
  return c;
}
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
/** Solve A x = b; b may be a vector or a matrix (several right-hand sides as columns). null if A is singular. */
export const solve = (A, b) => { const Ai = inverse(A); return !Ai ? null : Array.isArray(b[0]) ? matMul(Ai, b) : matVec(Ai, b); };
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

// ================================================================== FFT
// Convention: forward X_k = Σ_n x_n e^{−2πikn/N} (unnormalised); ifft divides by N.
const isPow2 = (n) => n > 0 && (n & (n - 1)) === 0;
/** Smallest power of two ≥ n. */
export const nextPow2 = (n) => { let p = 1; while (p < n) p *= 2; return p; };
const TWID = new Map();
function twiddles(n) { // cos, sin of 2πk/n for k < n/2, computed directly (no recurrence drift)
  let t = TWID.get(n);
  if (!t) {
    const c = new Float64Array(n / 2), s = new Float64Array(n / 2);
    for (let k = 0; k < n / 2; k++) { c[k] = Math.cos(TAU * k / n); s[k] = Math.sin(TAU * k / n); }
    t = [c, s]; if (TWID.size > 24) TWID.clear(); TWID.set(n, t);
  }
  return t;
}
function fftRadix2(re, im, inv) { // in place, n a power of 2
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { // bit-reversal permutation
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  const [C, S] = twiddles(n), sg = inv ? 1 : -1;
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1, step = n / len;
    for (let i = 0; i < n; i += len) for (let k = 0; k < half; k++) {
      const wr = C[k * step], wi = sg * S[k * step], a = i + k, b = a + half;
      const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
      re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
    }
  }
}
function bluestein(re, im, inv) { // exact DFT of any length via the chirp-z trick (2kn = k² + n² − (k−n)²)
  const n = re.length, m = nextPow2(2 * n - 1), sg = inv ? 1 : -1;
  const wr = new Float64Array(n), wi = new Float64Array(n);
  for (let k = 0; k < n; k++) { const a = Math.PI * ((k * k) % (2 * n)) / n; wr[k] = Math.cos(a); wi[k] = sg * Math.sin(a); }
  const ar = new Float64Array(m), ai = new Float64Array(m), br = new Float64Array(m), bi = new Float64Array(m);
  for (let k = 0; k < n; k++) { ar[k] = re[k] * wr[k] - im[k] * wi[k]; ai[k] = re[k] * wi[k] + im[k] * wr[k]; }
  br[0] = wr[0]; bi[0] = -wi[0];
  for (let k = 1; k < n; k++) { br[k] = br[m - k] = wr[k]; bi[k] = bi[m - k] = -wi[k]; }
  fftRadix2(ar, ai, false); fftRadix2(br, bi, false);
  for (let k = 0; k < m; k++) { const r = ar[k] * br[k] - ai[k] * bi[k]; ai[k] = ar[k] * bi[k] + ai[k] * br[k]; ar[k] = r; }
  fftRadix2(ar, ai, true);
  for (let k = 0; k < n; k++) { const cr = ar[k] / m, ci = ai[k] / m; re[k] = cr * wr[k] - ci * wi[k]; im[k] = cr * wi[k] + ci * wr[k]; }
}
function fftCore(re, im, inv) {
  const n = re.length;
  if (!im || im.length !== n) throw new Error('fft: re and im must have the same length');
  if (n > 1) (isPow2(n) ? fftRadix2 : bluestein)(re, im, inv);
  return [re, im];
}
/**
 * In-place forward FFT of the complex signal (re, im) (plain arrays or typed arrays, same length).
 * Powers of two use iterative radix-2; any other length is still an EXACT DFT (Bluestein chirp-z,
 * O(n log n)) — nothing is zero-padded. Pad yourself (zeroPad) if you want interpolated spectra. Returns [re, im].
 */
export const fft = (re, im) => fftCore(re, im, false);
/** In-place inverse FFT (divides by N). Returns [re, im]. */
export function ifft(re, im) { fftCore(re, im, true); const n = re.length; for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; } return [re, im]; }
/** FFT of a real signal (any length) → {re, im} (plain arrays, all N bins; bin k ↔ frequency k/N cycles per sample). */
export function fftReal(x) { const re = Array.from(x), im = new Array(re.length).fill(0); fftCore(re, im, false); return { re, im }; }
/** Zero-pad (or truncate) x to length n (default: next power of two). */
export const zeroPad = (x, n = nextPow2(x.length)) => Array.from({ length: n }, (_, i) => (i < x.length ? x[i] : 0));
/** Naive O(N²) DFT (reference / tiny sizes). dft(re, im = zeros, inverse = false) → {re, im}; inverse divides by N. */
export function dft(re, im = null, inverse = false) {
  const n = re.length, sg = inverse ? 1 : -1, oR = new Array(n).fill(0), oI = new Array(n).fill(0);
  for (let k = 0; k < n; k++) {
    let sr = 0, si = 0;
    for (let j = 0; j < n; j++) {
      const a = sg * TAU * ((k * j) % n) / n, c = Math.cos(a), s = Math.sin(a), xr = re[j], xi = im ? im[j] : 0;
      sr += xr * c - xi * s; si += xr * s + xi * c;
    }
    oR[k] = inverse ? sr / n : sr; oI[k] = inverse ? si / n : si;
  }
  return { re: oR, im: oI };
}
/** 2D FFT in place on row arrays (rows of equal length; any sizes). Returns [reRows, imRows]. */
export function fft2(reRows, imRows, inverse = false) {
  const R = reRows.length, C = reRows[0].length;
  for (let i = 0; i < R; i++) (inverse ? ifft : fft)(reRows[i], imRows[i]);
  const cr = new Array(R), ci = new Array(R);
  for (let j = 0; j < C; j++) {
    for (let i = 0; i < R; i++) { cr[i] = reRows[i][j]; ci[i] = imRows[i][j]; }
    (inverse ? ifft : fft)(cr, ci);
    for (let i = 0; i < R; i++) { reRows[i][j] = cr[i]; imRows[i][j] = ci[i]; }
  }
  return [reRows, imRows];
}
export const ifft2 = (reRows, imRows) => fft2(reRows, imRows, true);
const shift1 = (x, s) => { const n = x.length, out = new Array(n); for (let i = 0; i < n; i++) out[i] = x[(i + s) % n]; return out; };
/** Move the zero frequency to the centre (new array). Works on 1D arrays and 2D row arrays (shifts both axes). */
export function fftShift(x) {
  if (x.length && typeof x[0] === 'object' && x[0].length != null) return shift1(x.map((r) => fftShift(r)), Math.ceil(x.length / 2));
  return shift1(x, Math.ceil(x.length / 2));
}
/** Inverse of fftShift (differs from it only for odd lengths). */
export function ifftShift(x) {
  if (x.length && typeof x[0] === 'object' && x[0].length != null) return shift1(x.map((r) => ifftShift(r)), Math.floor(x.length / 2));
  return shift1(x, Math.floor(x.length / 2));
}
/** One-sided amplitude spectrum of a real signal sampled at fs: {freq, amp, phase}; a sinusoid A·cos(2πft+φ) on a bin shows amp A. */
export function spectrum(x, fs = 1) {
  const n = x.length, { re, im } = fftReal(x), K = Math.floor(n / 2) + 1, freq = [], amp = [], phase = [];
  for (let k = 0; k < K; k++) {
    const edge = k === 0 || (n % 2 === 0 && k === n / 2);
    freq.push(k * fs / n); amp.push(Math.hypot(re[k], im[k]) * (edge ? 1 : 2) / n); phase.push(Math.atan2(im[k], re[k]));
  }
  return { freq, amp, phase };
}

// ================================================================== dense linear algebra (n×n, arrays of rows)
export const zeros = (m, n = m) => Array.from({ length: m }, () => new Array(n).fill(0));
export const trace = (A) => A.reduce((s, r, i) => s + r[i], 0);
export const outer = (a, b) => a.map((x) => b.map((y) => x * y));
/** Kronecker product A ⊗ B. */
export function kron(A, B) {
  const p = B.length, q = B[0].length;
  return Array.from({ length: A.length * p }, (_, i) => Array.from({ length: A[0].length * q }, (_, j) => A[Math.floor(i / p)][Math.floor(j / q)] * B[i % p][j % q]));
}
/** A^k for integer k (binary powering; k < 0 uses the inverse, null if singular). */
export function matPow(A, k) {
  k = Math.round(k);
  if (k < 0) { const Ai = inverse(A); if (!Ai) return null; A = Ai; k = -k; }
  let R = identity(A.length), P = A.map((r) => r.slice());
  while (k > 0) { if (k % 2) R = matMul(R, P); k = Math.floor(k / 2); if (k) P = matMul(P, P); }
  return R;
}
const maxAbs = (A) => A.reduce((m, r) => r.reduce((mm, x) => Math.max(mm, Math.abs(x)), m), 0);
/** LU with partial pivoting: P·A = L·U → {L, U, P, perm, sign (= det P), singular}. det(A) = sign·ΠU_ii. */
export function lu(A) {
  const n = A.length, U = A.map((r) => r.slice()), L = identity(n), perm = range(n);
  let sign = 1, singular = false;
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(U[r][c]) > Math.abs(U[p][c])) p = r;
    if (p !== c) {
      [U[p], U[c]] = [U[c], U[p]]; [perm[p], perm[c]] = [perm[c], perm[p]];
      for (let k = 0; k < c; k++) [L[p][k], L[c][k]] = [L[c][k], L[p][k]];
      sign = -sign;
    }
    if (U[c][c] === 0) { singular = true; continue; }
    for (let r = c + 1; r < n; r++) {
      const f = U[r][c] / U[c][c]; if (!f) continue;
      L[r][c] = f; U[r][c] = 0; for (let k = c + 1; k < n; k++) U[r][k] -= f * U[c][k];
    }
  }
  return { L, U, P: perm.map((i) => range(n).map((j) => +(j === i))), perm, sign, singular };
}
/** Solve A x = b from lu(A) (or from A itself). b may be a vector or a matrix (n×k rows). null if singular. */
export function luSolve(F, b) {
  if (!F.U) F = lu(F);
  if (Array.isArray(b[0])) { const X = transpose(b).map((col) => luSolve(F, col)); return X.includes(null) ? null : transpose(X); }
  const { L, U, perm } = F, n = U.length, y = perm.map((i) => b[i]);
  for (let i = 0; i < n; i++) for (let k = 0; k < i; k++) y[i] -= L[i][k] * y[k];
  for (let i = n - 1; i >= 0; i--) { for (let k = i + 1; k < n; k++) y[i] -= U[i][k] * y[k]; if (!U[i][i]) return null; y[i] /= U[i][i]; }
  return y;
}
/** Householder QR of an m×n matrix: A = Q R, Q m×m orthogonal, R m×n upper triangular with R_ii ≥ 0. {thin: true} → Q m×k, R k×n (k = min(m,n)). */
export function qr(A, { thin = false } = {}) {
  const m = A.length, n = A[0].length, R = A.map((r) => r.slice()), Q = identity(m), v = new Array(m);
  for (let k = 0; k < Math.min(m - 1, n); k++) {
    let nrm = 0; for (let i = k; i < m; i++) nrm = Math.hypot(nrm, R[i][k]);
    if (nrm === 0) continue;
    const alpha = R[k][k] > 0 ? -nrm : nrm; let vv = 0;
    for (let i = k; i < m; i++) { v[i] = R[i][k] - (i === k ? alpha : 0); vv += v[i] * v[i]; }
    if (vv === 0) continue;
    for (let j = k; j < n; j++) { let s = 0; for (let i = k; i < m; i++) s += v[i] * R[i][j]; s *= 2 / vv; for (let i = k; i < m; i++) R[i][j] -= s * v[i]; }
    for (let i = 0; i < m; i++) { let s = 0; for (let j = k; j < m; j++) s += Q[i][j] * v[j]; s *= 2 / vv; for (let j = k; j < m; j++) Q[i][j] -= s * v[j]; }
    for (let i = k + 1; i < m; i++) R[i][k] = 0;
  }
  for (let i = 0; i < Math.min(m, n); i++) if (R[i][i] < 0) { for (let j = 0; j < n; j++) R[i][j] = -R[i][j]; for (let r = 0; r < m; r++) Q[r][i] = -Q[r][i]; }
  if (!thin) return { Q, R };
  const k = Math.min(m, n); return { Q: Q.map((r) => r.slice(0, k)), R: R.slice(0, k) };
}
const signFix = (v) => { let j = 0; for (let i = 1; i < v.length; i++) if (Math.abs(v[i]) > Math.abs(v[j]) + 1e-12) j = i; return v[j] < 0 ? v.map((x) => -x) : v; };
/**
 * Symmetric eigen-decomposition by cyclic Jacobi rotations.
 * → {values (descending), vectors (n×n matrix whose COLUMNS are eigenvectors: A V = V diag(values)), vecs (vecs[i] = i-th eigenvector)}.
 * Each eigenvector is unit length with its largest component positive.
 */
export function eigSym(A) {
  if (!A.length) return { values: [], vectors: [], vecs: [] };
  const n = A.length, a = A.map((r, i) => r.map((x, j) => (x + A[j][i]) / 2)), V = identity(n);
  let fro = 0; for (const r of a) for (const x of r) fro += x * x;
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
    if (off <= 1e-32 * fro || off === 0) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p][q]; if (Math.abs(apq) < 1e-300) continue;
      const th = (a[q][q] - a[p][p]) / (2 * apq), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = c * x - s * y; a[k][q] = s * x + c * y; }
      for (let k = 0; k < n; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = c * x - s * y; a[q][k] = s * x + c * y; }
      for (let k = 0; k < n; k++) { const x = V[k][p], y = V[k][q]; V[k][p] = c * x - s * y; V[k][q] = s * x + c * y; }
      a[p][q] = a[q][p] = 0;
    }
  }
  const order = range(n).sort((i, j) => a[j][j] - a[i][i]);
  const vecs = order.map((j) => signFix(V.map((r) => r[j])));
  return { values: order.map((j) => a[j][j]), vectors: transpose(vecs), vecs };
}
// --- general real eigenproblem: balance → Hessenberg (elimination) → Francis double-shift QR (after EISPACK hqr) ---
function hqrEig(A) { // returns [wr, wi] (0-indexed); NaN for anything that failed to converge
  const n = A.length, a = [null];
  for (let i = 0; i < n; i++) { const r = new Float64Array(n + 1); for (let j = 0; j < n; j++) r[j + 1] = A[i][j]; a.push(r); }
  // balance (similarity by powers of 2, keeps eigenvalues; improves accuracy for badly scaled matrices)
  for (let done = false, guard = 0; !done && guard < 100; guard++) {
    done = true;
    for (let i = 1; i <= n; i++) {
      let r = 0, c = 0; for (let j = 1; j <= n; j++) if (j !== i) { c += Math.abs(a[j][i]); r += Math.abs(a[i][j]); }
      if (c && r) {
        let g = r / 2, f = 1; const s = c + r;
        while (c < g) { f *= 2; c *= 4; }
        g = r * 2; while (c > g) { f /= 2; c /= 4; }
        if ((c + r) / f < 0.95 * s) { done = false; g = 1 / f; for (let j = 1; j <= n; j++) a[i][j] *= g; for (let j = 1; j <= n; j++) a[j][i] *= f; }
      }
    }
  }
  // reduce to upper Hessenberg by stabilised elimination
  for (let m = 2; m < n; m++) {
    let x = 0, i = m;
    for (let j = m; j <= n; j++) if (Math.abs(a[j][m - 1]) > Math.abs(x)) { x = a[j][m - 1]; i = j; }
    if (i !== m) { for (let j = m - 1; j <= n; j++) { const t = a[i][j]; a[i][j] = a[m][j]; a[m][j] = t; } for (let j = 1; j <= n; j++) { const t = a[j][i]; a[j][i] = a[j][m]; a[j][m] = t; } }
    if (x) for (let i2 = m + 1; i2 <= n; i2++) {
      let y = a[i2][m - 1];
      if (y !== 0) { y /= x; a[i2][m - 1] = y; for (let j = m; j <= n; j++) a[i2][j] -= y * a[m][j]; for (let j = 1; j <= n; j++) a[j][m] += y * a[j][i2]; }
    }
  }
  for (let i = 3; i <= n; i++) for (let j = 1; j <= i - 2; j++) a[i][j] = 0;
  const wr = new Float64Array(n + 1), wi = new Float64Array(n + 1), SIGN = (x, y) => (y >= 0 ? Math.abs(x) : -Math.abs(x));
  let anorm = 0; for (let i = 1; i <= n; i++) for (let j = Math.max(i - 1, 1); j <= n; j++) anorm += Math.abs(a[i][j]);
  let nn = n, t = 0, p = 0, q = 0, r = 0, s = 0, w = 0, x = 0, y = 0, z = 0;
  while (nn >= 1) {
    let its = 0, l;
    do {
      for (l = nn; l >= 2; l--) { s = Math.abs(a[l - 1][l - 1]) + Math.abs(a[l][l]); if (s === 0) s = anorm; if (Math.abs(a[l][l - 1]) + s === s) { a[l][l - 1] = 0; break; } }
      x = a[nn][nn];
      if (l === nn) { wr[nn] = x + t; wi[nn--] = 0; }
      else {
        y = a[nn - 1][nn - 1]; w = a[nn][nn - 1] * a[nn - 1][nn];
        if (l === nn - 1) {
          p = 0.5 * (y - x); q = p * p + w; z = Math.sqrt(Math.abs(q)); x += t;
          if (q >= 0) { z = p + SIGN(z, p); wr[nn - 1] = wr[nn] = x + z; if (z) wr[nn] = x - w / z; wi[nn - 1] = wi[nn] = 0; }
          else { wr[nn - 1] = wr[nn] = x + p; wi[nn - 1] = -(wi[nn] = z); }
          nn -= 2;
        } else {
          if (its === 60) { for (let i = 1; i <= nn; i++) wr[i] = wi[i] = NaN; return [Array.from(wr.slice(1)), Array.from(wi.slice(1))]; }
          if (its === 10 || its === 20 || its === 40) { // exceptional shift
            t += x; for (let i = 1; i <= nn; i++) a[i][i] -= x;
            s = Math.abs(a[nn][nn - 1]) + Math.abs(a[nn - 1][nn - 2]); y = x = 0.75 * s; w = -0.4375 * s * s;
          }
          ++its;
          let m;
          for (m = nn - 2; m >= l; m--) {
            z = a[m][m]; r = x - z; s = y - z;
            p = (r * s - w) / a[m + 1][m] + a[m][m + 1]; q = a[m + 1][m + 1] - z - r - s; r = a[m + 2][m + 1];
            s = Math.abs(p) + Math.abs(q) + Math.abs(r); p /= s; q /= s; r /= s;
            if (m === l) break;
            const u = Math.abs(a[m][m - 1]) * (Math.abs(q) + Math.abs(r)), v = Math.abs(p) * (Math.abs(a[m - 1][m - 1]) + Math.abs(z) + Math.abs(a[m + 1][m + 1]));
            if (u + v === v) break;
          }
          for (let i = m + 2; i <= nn; i++) { a[i][i - 2] = 0; if (i !== m + 2) a[i][i - 3] = 0; }
          for (let k = m; k <= nn - 1; k++) {
            if (k !== m) {
              p = a[k][k - 1]; q = a[k + 1][k - 1]; r = 0; if (k !== nn - 1) r = a[k + 2][k - 1];
              if ((x = Math.abs(p) + Math.abs(q) + Math.abs(r)) !== 0) { p /= x; q /= x; r /= x; }
            }
            if ((s = SIGN(Math.sqrt(p * p + q * q + r * r), p)) !== 0) {
              if (k === m) { if (l !== m) a[k][k - 1] = -a[k][k - 1]; } else a[k][k - 1] = -s * x;
              p += s; x = p / s; y = q / s; z = r / s; q /= p; r /= p;
              for (let j = k; j <= nn; j++) {
                p = a[k][j] + q * a[k + 1][j];
                if (k !== nn - 1) { p += r * a[k + 2][j]; a[k + 2][j] -= p * z; }
                a[k + 1][j] -= p * y; a[k][j] -= p * x;
              }
              const mmin = nn < k + 3 ? nn : k + 3;
              for (let i = l; i <= mmin; i++) {
                p = x * a[i][k] + y * a[i][k + 1];
                if (k !== nn - 1) { p += z * a[i][k + 2]; a[i][k + 2] -= p * r; }
                a[i][k + 1] -= p * q; a[i][k] -= p;
              }
            }
          }
        }
      }
    } while (l < nn - 1);
  }
  return [Array.from(wr.slice(1)), Array.from(wi.slice(1))];
}
// inverse iteration for an eigenvector of A at the (computed) eigenvalue lr + i·li; `against` = vectors to stay orthogonal to
function inverseIteration(A, lr, li, against = []) {
  const n = A.length, cplx = li !== 0, N = cplx ? 2 * n : n;
  const B = zeros(N, N);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const d = A[i][j] - (i === j ? lr : 0); B[i][j] = d;
    if (cplx) { B[i + n][j + n] = d; if (i === j) { B[i][j + n] = li; B[i + n][j] = -li; } }
  }
  const F = lu(B), tiny = (maxAbs(A) + Math.hypot(lr, li)) * 1e-14 || 1e-300;
  for (let i = 0; i < N; i++) if (Math.abs(F.U[i][i]) < tiny) F.U[i][i] = F.U[i][i] < 0 ? -tiny : tiny;
  let x = Array.from({ length: N }, (_, i) => 1 + 0.37 * Math.sin(1.3 * i + 0.4));
  for (let it = 0; it < 4; it++) {
    x = luSolve(F, x);
    for (const e of against) { const c = dot(x, e); x = x.map((xi, i) => xi - c * e[i]); }
    const nx = norm(x); if (!(nx > 0) || !isFinite(nx)) return null; x = x.map((xi) => xi / nx);
  }
  return x;
}
/**
 * Eigenvalues of a general real n×n matrix (balancing + Hessenberg + shifted QR).
 * → {values: [Cx] (sorted by decreasing modulus, then real part; conjugate pairs adjacent, +im first),
 *    vectors: [real unit eigenvector, or null for a complex eigenvalue], cvectors: [{re: [...], im: [...]}] for every eigenvalue}.
 * Eigenvectors come from inverse iteration (largest component made real positive). For a defective eigenvalue the
 * repeated copies get the same (only) eigenvector. {vectors: false} skips them.
 */
/** Solve A x = b for a complex matrix A (entries number | Cx | [re,im]) and vector b; null if singular. Returns Cx[]. */
export function solveC(A, b) {
  const n = A.length; const M = A.map((r, i) => [...r.map(Cx.of), Cx.of(b[i])]);
  for (let k = 0; k < n; k++) {
    let p = k; for (let i = k + 1; i < n; i++) if (M[i][k].abs() > M[p][k].abs()) p = i;
    if (M[p][k].abs() < 1e-300) return null;
    [M[k], M[p]] = [M[p], M[k]];
    for (let i = k + 1; i < n; i++) { const f = M[i][k].div(M[k][k]); for (let j = k; j <= n; j++) M[i][j] = M[i][j].sub(f.mul(M[k][j])); }
  }
  const x = Array(n);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s = s.sub(M[i][j].mul(x[j])); x[i] = s.div(M[i][i]); }
  return x;
}
/**
 * Durand–Kerner converges slowly on a multiple root and leaves a ring of m roots ~1e-3 apart. For each tight cluster,
 * Newton on the (m−1)-th derivative (which has a simple root there) finds the multiple root; the cluster is replaced
 * by m equal copies only if p, p′, …, p^(m−1) all vanish there to working precision. Distinct close roots are kept.
 */
function polishMultiple(c, roots) {
  const deriv = (a) => a.slice(1).map((z, k) => z.scale(k + 1));
  const ev = (a, z) => a.reduceRight((acc, k) => acc.mul(z).add(k), new Cx(0, 0));
  const mag = (a, z) => a.reduce((s, k, i) => s + k.abs() * z.abs() ** i, 0) || 1;
  const out = roots.slice(), used = new Array(out.length).fill(false);
  for (let i = 0; i < out.length; i++) {
    if (used[i]) continue;
    const grp = [i];
    for (let j = i + 1; j < out.length; j++) if (!used[j] && out[j].sub(out[i]).abs() < 2e-2 * Math.max(1, out[i].abs())) grp.push(j);
    if (grp.length < 2) continue;
    // try the largest multiplicity first, then smaller sub-clusters are left as they are
    const m = grp.length; const ds = [c]; for (let k = 1; k < m; k++) ds.push(deriv(ds[k - 1]));
    let z = grp.reduce((s, k) => s.add(out[k]), new Cx(0, 0)).scale(1 / m);
    const f = ds[m - 1], fp = deriv(f);
    for (let it = 0; it < 60; it++) { const d = ev(fp, z); if (d.abs() < 1e-300) break; const st = ev(f, z).div(d); z = z.sub(st); if (st.abs() < 1e-15 * Math.max(1, z.abs())) break; }
    const okAll = ds.slice(0, m - 1).every((a) => ev(a, z).abs() <= 1e-9 * mag(a, z));
    if (okAll) for (const k of grp) { out[k] = z; used[k] = true; }
  }
  return out;
}
/**
 * Eigenvalues and eigenvectors of a small complex matrix (entries number | Cx | [re,im]).
 * Characteristic polynomial by Faddeev–LeVerrier, roots by polyRoots, eigenvectors by inverse iteration.
 * Returns {values: Cx[], vectors: [{re: [...], im: [...]}]} sorted by |λ| (largest first). Fine for n ≤ 8.
 */
export function eigC(A, { vectors = true } = {}) {
  const n = A.length; if (!n) return { values: [], vectors: [] };
  const Z = A.map((r) => r.map(Cx.of)), O = () => new Cx(0, 0);
  const mm = (X, Y) => X.map((r) => Y[0].map((_, j) => r.reduce((s, x, k) => s.add(x.mul(Y[k][j])), O())));
  const c = Array(n + 1); c[n] = new Cx(1, 0); let Mk = Z.map((r) => r.map(O));
  for (let k = 1; k <= n; k++) {
    Mk = mm(Z, Mk); for (let i = 0; i < n; i++) Mk[i][i] = Mk[i][i].add(c[n - k + 1]);
    const AM = mm(Z, Mk); let tr = O(); for (let i = 0; i < n; i++) tr = tr.add(AM[i][i]);
    c[n - k] = tr.scale(-1 / k);
  }
  const vals = polishMultiple(c, polyRoots(c)).sort((u, v) => (v.abs() - u.abs()) || (v.re - u.re) || (v.im - u.im));
  if (!vectors) return { values: vals };
  const scale = Math.max(1e-12, ...Z.flat().map((z) => z.abs()));
  const vecs = vals.map((lam) => {
    const shift = lam.add(new Cx(scale * 1e-9, scale * 1e-9)); // keep A − σI invertible
    const S = Z.map((r, i) => r.map((z, j) => (i === j ? z.sub(shift) : z)));
    let x = Array.from({ length: n }, (_, i) => new Cx(1 + 0.1 * i, 0.05 * i));
    for (let it = 0; it < 4; it++) {
      const y = solveC(S, x); if (!y) break;
      const nr = Math.sqrt(y.reduce((s, z) => s + z.abs2(), 0)) || 1; x = y.map((z) => z.scale(1 / nr));
    }
    // fix the phase: largest component real and positive
    let m = 0; for (let i = 1; i < n; i++) if (x[i].abs() > x[m].abs()) m = i;
    const ph = x[m].abs() ? x[m].conj().scale(1 / x[m].abs()) : new Cx(1, 0); x = x.map((z) => z.mul(ph));
    return { re: x.map((z) => z.re), im: x.map((z) => z.im) };
  });
  return { values: vals, vectors: vecs };
}
export function eig(A, { vectors = true } = {}) {
  const n = A.length; if (!n) return { values: [], vectors: [], cvectors: [] };
  const [wr, wi] = hqrEig(A);
  const vals = range(n).map((i) => new Cx(wr[i], wi[i]));
  vals.sort((u, v) => (v.abs() - u.abs()) || (v.re - u.re) || (v.im - u.im));
  if (!vectors) return { values: vals };
  const scale = maxAbs(A) + 1, vecs = [], cvecs = [];
  for (let i = 0; i < n; i++) {
    const { re: lr, im: li } = vals[i];
    if (!isFinite(lr) || !isFinite(li)) { vecs.push(null); cvecs.push(null); continue; }
    if (li === 0) {
      const prev = vecs.filter((v, j) => v && vals[j].im === 0 && Math.abs(vals[j].re - lr) <= 1e-6 * scale);
      let v = inverseIteration(A, lr, 0, prev);
      const resid = (u) => u ? norm(vsub(matVec(A, u), vscale(u, lr))) : Infinity;
      if (prev.length && !(resid(v) <= 1e-7 * scale)) v = prev[0].slice(); // defective: no further independent eigenvector
      v = v && signFix(v); vecs.push(v); cvecs.push(v && { re: v.slice(), im: v.map(() => 0) });
    } else if (li < 0 && i > 0 && vals[i - 1].im === -li && vals[i - 1].re === lr && cvecs[i - 1]) {
      const c = cvecs[i - 1]; vecs.push(null); cvecs.push({ re: c.re.slice(), im: c.im.map((x) => -x) });
    } else {
      const x = inverseIteration(A, lr, li);
      if (!x) { vecs.push(null); cvecs.push(null); continue; }
      let re = x.slice(0, n), im = x.slice(n), j = 0;
      for (let k = 1; k < n; k++) if (Math.hypot(re[k], im[k]) > Math.hypot(re[j], im[j]) + 1e-12) j = k;
      const m = Math.hypot(re[j], im[j]), cr = re[j] / m, ci = -im[j] / m; // multiply by conj(z_j)/|z_j|
      const r2 = re.map((a, k) => a * cr - im[k] * ci), i2 = re.map((a, k) => a * ci + im[k] * cr);
      const nz = Math.hypot(...r2, ...i2); re = r2.map((a) => a / nz); im = i2.map((a) => a / nz);
      vecs.push(null); cvecs.push({ re, im });
    }
  }
  return { values: vals, vectors: vecs, cvectors: cvecs };
}
/**
 * Thin SVD by one-sided (Hestenes) Jacobi: A (m×n) = U diag(S) Vᵀ with k = min(m,n),
 * U m×k and V n×k with orthonormal columns, S descending (≥ 0).
 */
export function svd(A) {
  const m = A.length, n = A[0].length;
  if (m < n) { const r = svd(transpose(A)); return { U: r.V, S: r.S, V: r.U }; }
  const U = A.map((r) => r.slice()), V = identity(n);
  for (let sweep = 0; sweep < 60; sweep++) {
    let rotated = false;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      let al = 0, be = 0, ga = 0;
      for (let i = 0; i < m; i++) { const x = U[i][p], y = U[i][q]; al += x * x; be += y * y; ga += x * y; }
      if (ga === 0 || Math.abs(ga) <= 1e-15 * Math.sqrt(al * be)) continue;
      rotated = true;
      const ze = (be - al) / (2 * ga), t = (ze >= 0 ? 1 : -1) / (Math.abs(ze) + Math.sqrt(1 + ze * ze)), c = 1 / Math.sqrt(1 + t * t), s = c * t;
      for (let i = 0; i < m; i++) { const x = U[i][p], y = U[i][q]; U[i][p] = c * x - s * y; U[i][q] = s * x + c * y; }
      for (let i = 0; i < n; i++) { const x = V[i][p], y = V[i][q]; V[i][p] = c * x - s * y; V[i][q] = s * x + c * y; }
    }
    if (!rotated) break;
  }
  const S0 = range(n).map((j) => { let s = 0; for (let i = 0; i < m; i++) s = Math.hypot(s, U[i][j]); return s; });
  const order = range(n).sort((i, j) => S0[j] - S0[i]), S = order.map((j) => S0[j]);
  const cut = (S[0] || 0) * m * 2.2e-16;
  const cols = order.map((j, k) => (S[k] > cut && S[k] > 0 ? U.map((r) => r[j] / S[k]) : null));
  // complete columns belonging to (numerically) zero singular values to an orthonormal set
  for (let k = 0, e = 0; k < n; k++) if (!cols[k]) {
    for (; e < m; e++) {
      let w = range(m).map((i) => +(i === e));
      for (let pass = 0; pass < 2; pass++) for (const c of cols) if (c) { const d = dot(w, c); w = w.map((x, i) => x - d * c[i]); }
      const nw = norm(w); if (nw > 1e-8) { cols[k] = w.map((x) => x / nw); e++; break; }
    }
  }
  return { U: transpose(cols), S, V: V.map((r) => order.map((j) => r[j])) };
}
const svdTol = (A, S) => Math.max(A.length, A[0].length) * 2.2e-16 * (S[0] || 0);
/** Moore–Penrose pseudo-inverse (via SVD; singular values ≤ tol treated as 0). */
export function pinv(A, tol) {
  const { U, S, V } = svd(A), t = tol ?? svdTol(A, S);
  return V.map((vr) => U.map((ur) => S.reduce((s, sk, k) => (sk > t ? s + vr[k] * ur[k] / sk : s), 0)));
}
/** Least-squares solution of A x ≈ b (minimum-norm if rank-deficient), via the SVD. Returns x. */
export const lstsq = (A, b, tol) => matVec(pinv(A, tol), b);
/** Numerical rank: number of singular values > tol (default max(m,n)·ε·σ_max). */
export function rank(A, tol) { const { S } = svd(A); const t = tol ?? svdTol(A, S); return S.filter((s) => s > t).length; }
/** Orthonormal basis of the null space {x : A x = 0}, as a list of vectors (via the SVD). */
export function nullspace(A, tol) {
  const m = A.length, n = A[0].length, B = m < n ? A.concat(zeros(n - m, n)) : A;
  const { S, V } = svd(B), t = tol ?? svdTol(A, S);
  return range(n).filter((k) => !(S[k] > t)).map((k) => signFix(V.map((r) => r[k])));
}
/** Reduced row echelon form by Gauss–Jordan with partial pivoting → {R, pivots} (pivot column indices). Entries below tol become exact 0. */
export function rref(A, tol) {
  const R = A.map((r) => r.slice()), m = R.length, n = R[0].length, pivots = [];
  const t = tol ?? Math.max(m, n) * 2.2e-16 * Math.max(1e-300, ...A.map((r) => r.reduce((s, x) => s + Math.abs(x), 0)));
  let row = 0;
  for (let c = 0; c < n && row < m; c++) {
    let p = row; for (let i = row + 1; i < m; i++) if (Math.abs(R[i][c]) > Math.abs(R[p][c])) p = i;
    if (Math.abs(R[p][c]) <= t) { for (let i = row; i < m; i++) R[i][c] = 0; continue; }
    [R[p], R[row]] = [R[row], R[p]];
    const piv = R[row][c]; for (let k = c; k < n; k++) R[row][k] /= piv;
    for (let i = 0; i < m; i++) if (i !== row) { const f = R[i][c]; if (f) for (let k = c; k < n; k++) R[i][k] -= f * R[row][k]; }
    for (let i = 0; i < m; i++) R[i][c] = i === row ? 1 : 0;
    pivots.push(c); row++;
  }
  for (const r of R) for (let k = 0; k < n; k++) if (Math.abs(r[k]) <= t) r[k] = 0;
  return { R, pivots };
}
/** Matrix exponential e^A: scaling & squaring with a degree-6 Padé approximant (‖A/2^s‖∞ ≤ ½, error ≈ 1e-16). */
export function expm(A) {
  const n = A.length, nrm = Math.max(...A.map((r) => r.reduce((s, x) => s + Math.abs(x), 0)));
  const s = nrm > 0 ? Math.max(0, Math.floor(Math.log2(nrm)) + 2) : 0, k0 = Math.pow(2, -s);
  const As = A.map((r) => r.map((x) => x * k0)), q = 6;
  let c = 0.5, X = As, N = identity(n).map((r, i) => r.map((x, j) => x + c * As[i][j])), D = identity(n).map((r, i) => r.map((x, j) => x - c * As[i][j]));
  for (let k = 2, pos = true; k <= q; k++, pos = !pos) {
    c = c * (q - k + 1) / (k * (2 * q - k + 1)); X = matMul(As, X);
    N = N.map((r, i) => r.map((x, j) => x + c * X[i][j])); D = D.map((r, i) => r.map((x, j) => x + (pos ? c : -c) * X[i][j]));
  }
  let E = luSolve(lu(D), N);
  for (let i = 0; i < s; i++) E = matMul(E, E);
  return E;
}
/** Characteristic polynomial det(λI − A) by Faddeev–LeVerrier → ascending coefficients [c0, c1, …, cn = 1] (use with polyEval). */
export function charPoly(A) {
  const n = A.length, c = new Array(n + 1).fill(0); c[n] = 1;
  let Mk = zeros(n, n);
  for (let k = 1; k <= n; k++) {
    Mk = matMul(A, Mk); for (let i = 0; i < n; i++) Mk[i][i] += c[n - k + 1];
    c[n - k] = -trace(matMul(A, Mk)) / k;
  }
  return c;
}

/** Characteristic polynomial det(λI − A) of a complex matrix (entries number | Cx | [re,im]) → ascending Cx coefficients (Faddeev–LeVerrier). */
export function charPolyC(A) {
  const n = A.length, Z = A.map((r) => r.map(Cx.of)), O = () => new Cx(0, 0);
  const mm = (X, Y) => X.map((r) => Y[0].map((_, j) => r.reduce((s, x, k) => s.add(x.mul(Y[k][j])), O())));
  const c = Array(n + 1); c[n] = new Cx(1, 0); let Mk = Z.map((r) => r.map(O));
  for (let k = 1; k <= n; k++) {
    Mk = mm(Z, Mk); for (let i = 0; i < n; i++) Mk[i][i] = Mk[i][i].add(c[n - k + 1]);
    const AM = mm(Z, Mk); let tr = O(); for (let i = 0; i < n; i++) tr = tr.add(AM[i][i]);
    c[n - k] = tr.scale(-1 / k);
  }
  return c;
}
/** Reduced row echelon form of a complex matrix → {R: Cx[][], pivots}. Entries with |z| ≤ tol (default relative to the matrix size) become exact 0. */
export function rrefC(A, tol) {
  const R = A.map((r) => r.map(Cx.of)), m = R.length, n = m ? R[0].length : 0, pivots = [];
  const t = tol ?? Math.max(m, n) * 1e-12 * Math.max(1e-300, ...R.map((r) => r.reduce((s, z) => s + z.abs(), 0)));
  let row = 0;
  for (let c = 0; c < n && row < m; c++) {
    let p = row; for (let i = row + 1; i < m; i++) if (R[i][c].abs() > R[p][c].abs()) p = i;
    if (R[p][c].abs() <= t) { for (let i = row; i < m; i++) R[i][c] = new Cx(0, 0); continue; }
    [R[p], R[row]] = [R[row], R[p]];
    const piv = R[row][c]; for (let k = c; k < n; k++) R[row][k] = R[row][k].div(piv);
    for (let i = 0; i < m; i++) if (i !== row) { const f = R[i][c]; if (f.abs()) for (let k = c; k < n; k++) R[i][k] = R[i][k].sub(f.mul(R[row][k])); }
    pivots.push(c); row++;
  }
  for (const r of R) for (let k = 0; k < n; k++) if (r[k].abs() <= t) r[k] = new Cx(0, 0);
  return { R, pivots };
}
/** Numerical rank of a complex matrix (Gauss–Jordan; tol as in rrefC). For real matrices prefer rank (SVD-based). */
export const rankC = (A, tol) => rrefC(A, tol).pivots.length;
/** Basis of the null space {x : A x = 0} of a complex matrix, one vector per free column → [{re: [...], im: [...]}] (not orthonormalized). */
export function nullspaceC(A, tol) {
  const { R, pivots } = rrefC(A, tol), n = A[0].length, free = range(n).filter((j) => !pivots.includes(j));
  return free.map((f) => {
    const x = Array.from({ length: n }, () => new Cx(0, 0)); x[f] = new Cx(1, 0);
    pivots.forEach((pc, i) => { x[pc] = R[i][f].scale(-1); });
    return { re: x.map((z) => z.re), im: x.map((z) => z.im) };
  });
}
/**
 * Group nearly equal complex roots → [{value: Cx (cluster mean), mult}], largest multiplicity first.
 * A defective eigenvalue of multiplicity m comes back from eigC/polyRoots as a ring of radius ≈ (1e-16)^(1/m)
 * (1e-8 for m = 2, 5e-6 for m = 3, 1e-4 for m = 4); the mean of the ring is accurate. tol is relative to max(1, |z|).
 */
export function clusterRoots(roots, tol = 3e-4) {
  const zs = roots.map(Cx.of), parent = zs.map((_, i) => i), find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < zs.length; i++) for (let j = i + 1; j < zs.length; j++) if (zs[i].sub(zs[j]).abs() <= tol * Math.max(1, zs[i].abs(), zs[j].abs())) parent[find(i)] = find(j);
  const groups = new Map(); zs.forEach((z, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(z); });
  return [...groups.values()].map((g) => ({ value: g.reduce((s, z) => s.add(z), new Cx(0, 0)).scale(1 / g.length), mult: g.length }))
    .sort((a, b) => b.mult - a.mult || b.value.abs() - a.value.abs());
}

// ================================================================== special functions for probability
const LOGFACT = [0]; for (let k = 1; k <= 170; k++) LOGFACT.push(LOGFACT[k - 1] + Math.log(k));
/** log Γ(x) (Lanczos; exact log-factorials for integers ≤ 171; reflection for x < ½ gives log|Γ(x)|). */
export function lgamma(x) {
  if (Number.isInteger(x) && x >= 1 && x <= 171) return LOGFACT[x - 1];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1; let a = LG[0]; const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
  return 0.5 * Math.log(TAU) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
/** log B(a, b). */
export const lbeta = (a, b) => lgamma(a) + lgamma(b) - lgamma(a + b);
function gser(a, x, lga) { // P(a,x) by the power series (x < a+1)
  let ap = a, del = 1 / a, s = del;
  for (let n = 0; n < 100000; n++) { ap += 1; del *= x / ap; s += del; if (Math.abs(del) < Math.abs(s) * 2.2e-16) break; }
  return s * Math.exp(-x + a * Math.log(x) - lga);
}
function gcf(a, x, lga) { // Q(a,x) by Lentz's continued fraction (x ≥ a+1)
  const TINY = 1e-300; let b = x + 1 - a, c = 1 / TINY, d = 1 / b, h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 2.2e-16) break;
  }
  return Math.exp(-x + a * Math.log(x) - lga) * h;
}
/** Regularised lower incomplete gamma P(a, x) = γ(a,x)/Γ(a). */
export function gammaP(a, x) { if (!(x > 0)) return 0; if (x === Infinity) return 1; const l = lgamma(a); return x < a + 1 ? gser(a, x, l) : 1 - gcf(a, x, l); }
/** Regularised upper incomplete gamma Q(a, x) = 1 − P(a, x) (accurate in the far tail). */
export function gammaQ(a, x) { if (!(x > 0)) return 1; if (x === Infinity) return 0; const l = lgamma(a); return x < a + 1 ? 1 - gser(a, x, l) : gcf(a, x, l); }
const LG_HALF = 0.5723649429247001; // log Γ(½) = log √π
/** Error function (via the incomplete gamma, ~1e-16 accurate). */
export function erf(x) { if (x === 0 || isNaN(x)) return x; const z = x * x, p = z < 1.5 ? gser(0.5, z, LG_HALF) : 1 - gcf(0.5, z, LG_HALF); return x < 0 ? -p : p; }
/** Complementary error function 1 − erf(x), accurate (relative) for large x. */
export function erfc(x) {
  if (isNaN(x)) return x; if (x === 0) return 1;
  const z = x * x, q = z < 1.5 ? 1 - gser(0.5, z, LG_HALF) : gcf(0.5, z, LG_HALF);
  return x > 0 ? q : 2 - q;
}
function betacf(a, b, x) { // continued fraction for I_x(a,b) (Lentz)
  const TINY = 1e-300, qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < TINY) d = TINY; d = 1 / d; let h = d;
  for (let m = 1; m < 100000; m++) {
    const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY; c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY; c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < 2.2e-16) break;
  }
  return h;
}
/** Regularised incomplete beta I_x(a, b) — note the argument order betaI(a, b, x). */
export function betaI(a, b, x) {
  if (!(x > 0)) return 0; if (x >= 1) return 1;
  const lbt = a * Math.log(x) + b * Math.log1p(-x) - lbeta(a, b);
  return x < (a + 1) / (a + b + 2) ? Math.exp(lbt) * betacf(a, b, x) / a : 1 - Math.exp(lbt) * betacf(b, a, 1 - x) / b;
}

// ================================================================== probability distributions
const U01 = (r) => 1 - r(); // in (0, 1]: safe for log
const stdNormal = (r) => Math.sqrt(-2 * Math.log(U01(r))) * Math.cos(TAU * r());
function sampleGamma(k, r) { // Marsaglia–Tsang (shape k, scale 1)
  if (k < 1) return sampleGamma(k + 1, r) * Math.pow(U01(r), 1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v; do { x = stdNormal(r); v = 1 + c * x; } while (v <= 0);
    v = v * v * v; const u = U01(r);
    if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
// Standard normal quantile: Acklam's rational approximation polished by two Halley steps (full double precision).
function normInv(p) {
  if (!(p > 0)) return p === 0 ? -Infinity : NaN; if (!(p < 1)) return p === 1 ? Infinity : NaN;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  let x;
  if (p < 0.02425 || p > 0.97575) {
    const q = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    if (p > 0.5) x = -x;
  } else {
    const q = p - 0.5, r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  for (let i = 0; i < 2; i++) {
    const e = x < 0 ? 0.5 * erfc(-x / Math.SQRT2) - p : (1 - p) - 0.5 * erfc(x / Math.SQRT2); // Φ(x) − p, tail-accurate
    const u = e * Math.sqrt(TAU) * Math.exp(x * x / 2); x -= u / (1 + x * u / 2);
  }
  return x;
}
// Invert a continuous cdf on a bracket [lo, hi] (cdf(lo) ≤ q ≤ cdf(hi)) by safeguarded Newton.
function invertCdf(cdf, pdf, q, lo, hi, x0) {
  let x = x0 != null && x0 > lo && x0 < hi ? x0 : (isFinite(lo) && isFinite(hi) ? (lo + hi) / 2 : 0);
  for (let i = 0; i < 200; i++) {
    const F = cdf(x) - q;
    if (F === 0) return x;
    if (F < 0) lo = x; else hi = x;
    const f = pdf(x); let xn = x - F / f;
    if (!(f > 0) || !(xn > lo && xn < hi)) xn = (lo + hi) / 2;
    if (Math.abs(xn - x) <= 1e-15 * Math.max(1, Math.abs(x)) || hi - lo <= 1e-15 * Math.max(1, Math.abs(x))) return xn;
    x = xn;
  }
  return x;
}
function bracketUp(cdf, q, hi) { let k = 0; while (cdf(hi) < q && k++ < 2000) hi *= 2; return hi; }
// Discrete quantile: smallest integer k in [lo, hi] with cdf(k) ≥ q.
function discreteQuantile(cdf, q, lo, hi) { while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (cdf(m) >= q) hi = m; else lo = m + 1; } return lo; }
function mkDist(o) {
  o.stdev = Math.sqrt(o.variance);
  o.sample = (r = Math.random, n) => { if (n == null) return o._draw(r); const out = new Array(n); for (let i = 0; i < n; i++) out[i] = o._draw(r); return out; };
  /** [quantile(p), quantile(1−p)]: a sensible plotting window. */
  o.span = (p = 1e-3) => [o.quantile(p), o.quantile(1 - p)];
  return o;
}
const normalD = (mu = 0, sigma = 1) => mkDist({
  name: 'normal', discrete: false, support: [-Infinity, Infinity], mean: mu, variance: sigma * sigma,
  pdf: (x) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(TAU)),
  cdf: (x) => 0.5 * erfc(-(x - mu) / (sigma * Math.SQRT2)),
  quantile: (q) => mu + sigma * normInv(q),
  _draw: (r) => mu + sigma * stdNormal(r),
});
/**
 * Exact inversion sampling for a unimodal discrete law, walking outward from the mode m with pmf ratios
 * up(k) = f(k+1)/f(k): one cdf call, then about one step per standard deviation. Returns the smallest k with F(k) ≥ u.
 */
function invertFromMode(u, m, pmf, cdf, up, lo, hi) {
  const key = m; let c = invertFromMode.cache.get(cdf); if (!c || c.m !== key) invertFromMode.cache.set(cdf, (c = { m: key, f: pmf(m), F: cdf(m) }));
  let k = m, fk = c.f, Fk = c.F;
  if (u <= Fk) { while (k > lo) { const Fp = Fk - fk; if (Fp < u) break; fk /= up(k - 1); Fk = Fp; k--; } return k; }
  while (k < hi && Fk < u) { fk *= up(k); k++; Fk += fk; if (fk === 0 && Fk < u) break; }
  return k;
}
invertFromMode.cache = new WeakMap();
function binomialD(n, p) {
  const lp = Math.log(p), lq = Math.log1p(-p);
  const pmf = (k) => {
    if (!Number.isInteger(k) || k < 0 || k > n) return 0;
    if (p === 0) return +(k === 0); if (p === 1) return +(k === n);
    return Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * lp + (n - k) * lq);
  };
  const cdf = (k) => { k = Math.floor(k); return k < 0 ? 0 : k >= n ? 1 : betaI(n - k, k + 1, 1 - p); };
  const quantile = (q) => (q <= 0 ? 0 : discreteQuantile(cdf, Math.min(q, 1), 0, n));
  return mkDist({
    name: 'binomial', discrete: true, support: [0, n], mean: n * p, variance: n * p * (1 - p), pmf, pdf: pmf, cdf, quantile,
    _draw: (r) => { if (n <= 40) { let s = 0; for (let i = 0; i < n; i++) if (r() < p) s++; return s; } return p === 0 ? 0 : p === 1 ? n : invertFromMode(r(), Math.floor((n + 1) * p), pmf, cdf, (k) => ((n - k) / (k + 1)) * (p / (1 - p)), 0, n); },
  });
}
/** Negative binomial: number of failures before the r-th success (success probability p; r may be fractional). Gamma–Poisson mixture sampler. */
function negbinomD(r, p) {
  const lr = lgamma(r), lp = Math.log(p), lq = Math.log1p(-p);
  const pmf = (k) => (!Number.isInteger(k) || k < 0 ? 0 : Math.exp(lgamma(k + r) - lgamma(k + 1) - lr + r * lp + k * lq));
  const cdf = (k) => { k = Math.floor(k); return k < 0 ? 0 : betaI(r, k + 1, p); };
  const mean = (r * (1 - p)) / p, variance = mean / p;
  const quantile = (q) => { if (q <= 0) return 0; let hi = Math.ceil(mean + 10 * Math.sqrt(variance) + 10); while (cdf(hi) < q && hi < 1e15) hi *= 2; return discreteQuantile(cdf, Math.min(q, 1), 0, hi); };
  return mkDist({
    name: 'negbinom', discrete: true, support: [0, Infinity], mean, variance, pmf, pdf: pmf, cdf, quantile,
    _draw: (rng) => poissonD(sampleGamma(r, rng) * (1 - p) / p)._draw(rng),
  });
}
/** Digamma ψ(x) = Γ′(x)/Γ(x) (recurrence up to x ≥ 12, then the asymptotic series; reflection for x < 0). */
export function digamma(x) {
  if (x <= 0 && Number.isInteger(x)) return NaN;
  if (x < 0) return digamma(1 - x) - Math.PI / Math.tan(Math.PI * x);
  let r = 0; while (x < 12) { r -= 1 / x; x += 1; }
  const f = 1 / (x * x);
  return r + Math.log(x) - 0.5 / x - f * (1 / 12 - f * (1 / 120 - f * (1 / 252 - f * (1 / 240 - f / 132))));
}
/** Trigamma ψ′(x) (recurrence up to x ≥ 12, then the asymptotic series; reflection for x < 0). */
export function trigamma(x) {
  if (x <= 0 && Number.isInteger(x)) return NaN;
  if (x < 0) { const s = Math.PI / Math.sin(Math.PI * x); return -trigamma(1 - x) + s * s; }
  let r = 0; while (x < 12) { r += 1 / (x * x); x += 1; }
  const f = 1 / (x * x);
  return r + 1 / x + f / 2 + (f / x) * (1 / 6 - f * (1 / 30 - f * (1 / 42 - f / 30)));
}
function poissonD(lam) {
  const pmf = (k) => (!Number.isInteger(k) || k < 0 ? 0 : lam === 0 ? +(k === 0) : Math.exp(k * Math.log(lam) - lam - lgamma(k + 1)));
  const cdf = (k) => { k = Math.floor(k); return k < 0 ? 0 : gammaQ(k + 1, lam); };
  const quantile = (q) => { if (q <= 0) return 0; let hi = Math.ceil(lam + 10 * Math.sqrt(lam) + 10); while (cdf(hi) < q && hi < 1e15) hi *= 2; return discreteQuantile(cdf, Math.min(q, 1), 0, hi); };
  return mkDist({
    name: 'poisson', discrete: true, support: [0, Infinity], mean: lam, variance: lam, pmf, pdf: pmf, cdf, quantile,
    _draw: (r) => { if (lam < 30) { const L = Math.exp(-lam); let k = 0, t = r(); while (t > L) { k++; t *= r(); } return k; } return invertFromMode(r(), Math.floor(lam), pmf, cdf, (k) => lam / (k + 1), 0, Infinity); },
  });
}
const exponentialD = (rate = 1) => mkDist({
  name: 'exponential', discrete: false, support: [0, Infinity], mean: 1 / rate, variance: 1 / (rate * rate),
  pdf: (x) => (x < 0 ? 0 : rate * Math.exp(-rate * x)), cdf: (x) => (x <= 0 ? 0 : -Math.expm1(-rate * x)),
  quantile: (q) => -Math.log1p(-q) / rate, _draw: (r) => -Math.log(U01(r)) / rate,
});
const uniformD = (a = 0, b = 1) => mkDist({
  name: 'uniform', discrete: false, support: [a, b], mean: (a + b) / 2, variance: (b - a) ** 2 / 12,
  pdf: (x) => (x >= a && x <= b ? 1 / (b - a) : 0), cdf: (x) => clamp((x - a) / (b - a), 0, 1),
  quantile: (q) => a + (b - a) * q, _draw: (r) => a + (b - a) * r(),
});
function gammaD(k, theta = 1) {
  const lnorm = lgamma(k) + k * Math.log(theta);
  const pdf = (x) => (x < 0 ? 0 : x === 0 ? (k === 1 ? 1 / theta : k < 1 ? Infinity : 0) : Math.exp((k - 1) * Math.log(x) - x / theta - lnorm));
  const cdf = (x) => gammaP(k, x / theta);
  const quantile = (q) => {
    if (q <= 0) return 0; if (q >= 1) return Infinity;
    const z = normInv(q), wh = k * Math.pow(Math.max(0.01, 1 - 1 / (9 * k) + z / (3 * Math.sqrt(k))), 3) * theta; // Wilson–Hilferty start
    return invertCdf(cdf, pdf, q, 0, bracketUp(cdf, q, Math.max(wh, k * theta, theta) * 2), wh);
  };
  return mkDist({ name: 'gamma', discrete: false, support: [0, Infinity], mean: k * theta, variance: k * theta * theta, pdf, cdf, quantile, _draw: (r) => theta * sampleGamma(k, r) });
}
function betaD(a, b) {
  const lb = lbeta(a, b);
  const pdf = (x) => {
    if (x < 0 || x > 1) return 0;
    if (x === 0) return a === 1 ? b : a < 1 ? Infinity : 0;
    if (x === 1) return b === 1 ? a : b < 1 ? Infinity : 0;
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log1p(-x) - lb);
  };
  const cdf = (x) => betaI(a, b, x);
  return mkDist({
    name: 'beta', discrete: false, support: [0, 1], mean: a / (a + b), variance: a * b / ((a + b) ** 2 * (a + b + 1)), pdf, cdf,
    quantile: (q) => (q <= 0 ? 0 : q >= 1 ? 1 : invertCdf(cdf, pdf, q, 0, 1, a / (a + b))),
    _draw: (r) => { const x = sampleGamma(a, r), y = sampleGamma(b, r); return x / (x + y); },
  });
}
const chi2D = (k) => Object.assign(gammaD(k / 2, 2), { name: 'chi2' });
function studentTD(nu) {
  const lc = lgamma((nu + 1) / 2) - lgamma(nu / 2) - 0.5 * Math.log(nu * Math.PI);
  const pdf = (t) => Math.exp(lc - (nu + 1) / 2 * Math.log1p(t * t / nu));
  const cdf = (t) => { const tail = 0.5 * betaI(nu / 2, 0.5, nu / (nu + t * t)); return t > 0 ? 1 - tail : tail; };
  const quantile = (q) => {
    if (q <= 0) return -Infinity; if (q >= 1) return Infinity; if (q === 0.5) return 0;
    if (q < 0.5) return -quantile(1 - q);
    let hi = Math.max(2, 2 * normInv(q)); for (let i = 0; cdf(hi) < q && i < 2000; i++) hi *= 2;
    return invertCdf(cdf, pdf, q, 0, hi, normInv(q));
  };
  return mkDist({
    name: 'studentT', discrete: false, support: [-Infinity, Infinity], mean: nu > 1 ? 0 : NaN, variance: nu > 2 ? nu / (nu - 2) : nu > 1 ? Infinity : NaN,
    pdf, cdf, quantile, _draw: (r) => stdNormal(r) / Math.sqrt(2 * sampleGamma(nu / 2, r) / nu),
  });
}
function geometricD(p) { // number of trials up to and including the first success: k = 1, 2, …
  const pmf = (k) => (!Number.isInteger(k) || k < 1 ? 0 : p * Math.pow(1 - p, k - 1));
  const cdf = (k) => { k = Math.floor(k); return k < 1 ? 0 : -Math.expm1(k * Math.log1p(-p)); };
  const quantile = (q) => {
    if (q <= 0) return 1; if (q >= 1) return p === 1 ? 1 : Infinity; if (p === 1) return 1;
    let k = Math.max(1, Math.ceil(Math.log1p(-q) / Math.log1p(-p)));
    while (k > 1 && cdf(k - 1) >= q) k--; while (cdf(k) < q) k++;
    return k;
  };
  return mkDist({
    name: 'geometric', discrete: true, support: [1, Infinity], mean: 1 / p, variance: (1 - p) / (p * p), pmf, pdf: pmf, cdf, quantile,
    _draw: (r) => (p === 1 ? 1 : Math.max(1, Math.ceil(Math.log(U01(r)) / Math.log1p(-p)))),
  });
}
const cauchyD = (x0 = 0, g = 1) => mkDist({
  name: 'cauchy', discrete: false, support: [-Infinity, Infinity], mean: NaN, variance: NaN,
  pdf: (x) => 1 / (Math.PI * g * (1 + ((x - x0) / g) ** 2)), cdf: (x) => 0.5 + Math.atan((x - x0) / g) / Math.PI,
  quantile: (q) => x0 + g * Math.tan(Math.PI * (q - 0.5)), _draw: (r) => x0 + g * Math.tan(Math.PI * (U01(r) - 0.5)),
});
function lognormalD(mu = 0, sigma = 1) {
  const N = normalD(mu, sigma);
  return mkDist({
    name: 'lognormal', discrete: false, support: [0, Infinity], mean: Math.exp(mu + sigma * sigma / 2), variance: Math.expm1(sigma * sigma) * Math.exp(2 * mu + sigma * sigma),
    pdf: (x) => (x <= 0 ? 0 : N.pdf(Math.log(x)) / x), cdf: (x) => (x <= 0 ? 0 : N.cdf(Math.log(x))),
    quantile: (q) => Math.exp(N.quantile(q)), _draw: (r) => Math.exp(mu + sigma * stdNormal(r)),
  });
}
/** Fisher–Snedecor F(d1, d2). */
function fD(d1, d2) {
  const lb = lbeta(d1 / 2, d2 / 2);
  const pdf = (x) => (x <= 0 ? (x === 0 && d1 < 2 ? Infinity : 0) : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - lb));
  const cdf = (x) => (x <= 0 ? 0 : betaI(d1 / 2, d2 / 2, d1 * x / (d1 * x + d2)));
  return mkDist({
    name: 'F', discrete: false, support: [0, Infinity], mean: d2 > 2 ? d2 / (d2 - 2) : NaN,
    variance: d2 > 4 ? 2 * d2 * d2 * (d1 + d2 - 2) / (d1 * (d2 - 2) ** 2 * (d2 - 4)) : NaN, pdf, cdf,
    quantile: (q) => (q <= 0 ? 0 : q >= 1 ? Infinity : invertCdf(cdf, pdf, q, 0, bracketUp(cdf, q, 4), 1)),
    _draw: (r) => (2 * sampleGamma(d1 / 2, r) / d1) / (2 * sampleGamma(d2 / 2, r) / d2),
  });
}
/** Finite mixture: comps = [[dist, weight], …] (weights normalised). */
function mixtureD(comps) {
  const tot = comps.reduce((s, [, w]) => s + w, 0), cs = comps.map(([d, w]) => [d, w / tot]);
  const mean = cs.reduce((s, [d, w]) => s + w * d.mean, 0), m2 = cs.reduce((s, [d, w]) => s + w * (d.variance + d.mean ** 2), 0);
  const pdf = (x) => cs.reduce((s, [d, w]) => s + w * d.pdf(x), 0), cdf = (x) => cs.reduce((s, [d, w]) => s + w * d.cdf(x), 0);
  const lo = Math.min(...cs.map(([d]) => d.quantile(1e-9))), hi = Math.max(...cs.map(([d]) => d.quantile(1 - 1e-9)));
  return mkDist({
    name: 'mixture', discrete: cs.every(([d]) => d.discrete), support: [Math.min(...cs.map(([d]) => d.support[0])), Math.max(...cs.map(([d]) => d.support[1]))],
    mean, variance: m2 - mean * mean, pdf, cdf, quantile: (q) => (q <= 0 ? lo : q >= 1 ? hi : invertCdf(cdf, pdf, q, lo, hi, mean)),
    _draw: (r) => { let u = r(); for (const [d, w] of cs) { if ((u -= w) <= 0) return d._draw(r); } return cs[cs.length - 1][0]._draw(r); },
  });
}
/** Kolmogorov distribution: the limit law of √n·sup|Fₙ − F| (cdf 1 − 2Σ(−1)^{k−1}e^{−2k²x²}). */
function kolmogorovD() {
  const cdf = (x) => {
    if (x <= 0) return 0;
    if (x < 1) { const t = Math.PI * Math.PI / (8 * x * x); let s = 0; for (let k = 1; k <= 7; k++) s += Math.exp(-((2 * k - 1) ** 2) * t); return Math.sqrt(2 * Math.PI) / x * s; } // small-x series
    let s = 0; for (let k = 1; k <= 100; k++) { const term = Math.exp(-2 * k * k * x * x); s += (k % 2 ? 1 : -1) * term; if (term < 1e-17) break; } return 1 - 2 * s;
  };
  const pdf = (x) => { const h = 1e-5 * Math.max(1, x); return Math.max(0, (cdf(x + h) - cdf(x - h)) / (2 * h)); };
  const quantile = (q) => (q <= 0 ? 0 : q >= 1 ? Infinity : invertCdf(cdf, pdf, q, 0, 5, 0.87));
  return mkDist({ name: 'kolmogorov', discrete: false, support: [0, Infinity], mean: Math.sqrt(Math.PI / 2) * Math.LN2, variance: Math.PI * Math.PI / 12 - Math.PI / 2 * Math.LN2 ** 2, pdf, cdf, quantile, _draw: (r) => quantile(U01(r)) });
}
// The distributions hang off `dist` (which stays the Euclidean distance function dist(p, q)).
Object.assign(dist, { normal: normalD, binomial: binomialD, negbinom: negbinomD, poisson: poissonD, exponential: exponentialD, uniform: uniformD, gamma: gammaD, beta: betaD, chi2: chi2D, studentT: studentTD, geometric: geometricD, cauchy: cauchyD, lognormal: lognormalD, F: fD, mixture: mixtureD, kolmogorov: kolmogorovD });

// ================================================================== descriptive statistics
const finiteSorted = (arr) => Array.from(arr).filter((x) => isFinite(x)).sort((a, b) => a - b);
/** Sample quantile with linear interpolation (numpy's default, "type 7"); q may be a number or an array. */
export function quantile(arr, q) {
  const s = finiteSorted(arr), n = s.length;
  const one = (p) => { if (!n) return NaN; const h = (n - 1) * clamp(p, 0, 1), lo = Math.floor(h); return lo + 1 < n ? s[lo] + (h - lo) * (s[lo + 1] - s[lo]) : s[lo]; };
  return Array.isArray(q) ? q.map(one) : one(q);
}
export const median = (arr) => quantile(arr, 0.5);
/** Variance by Welford's algorithm; ddof = 1 (default) gives the sample variance s², ddof = 0 the population variance. */
export function variance(arr, ddof = 1) {
  let n = 0, m = 0, s = 0;
  for (const x of arr) { n++; const d = x - m; m += d / n; s += d * (x - m); }
  return n - ddof > 0 ? s / (n - ddof) : NaN;
}
export const stdev = (arr, ddof = 1) => Math.sqrt(variance(arr, ddof));
export function cumsum(arr) { const out = new Array(arr.length); let s = 0; for (let i = 0; i < arr.length; i++) { s += arr[i]; out[i] = s; } return out; }
/**
 * Histogram → {edges, counts, density, centers, total}. opts.bins: a count, or an array of edges
 * (default: numpy's 'auto' = max(Sturges, Freedman–Diaconis), at most 200); opts.range = [lo, hi] (default: data range).
 * Bins are [e_i, e_{i+1}) except the last, which includes its right edge; values outside the range are ignored.
 * density integrates to 1 over the range.
 */
export function histogram(values, { bins, range: rg } = {}) {
  const xs = Array.from(values).filter((x) => isFinite(x));
  let edges;
  if (Array.isArray(bins)) edges = bins.slice();
  else {
    let lo = rg ? rg[0] : Infinity, hi = rg ? rg[1] : -Infinity;
    if (!rg) for (const x of xs) { if (x < lo) lo = x; if (x > hi) hi = x; }
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    if (!(hi > lo)) { lo -= 0.5; hi += 0.5; }
    let nb = bins;
    if (!nb) {
      const inR = xs.filter((x) => x >= lo && x <= hi), n = inR.length;
      nb = n > 1 ? Math.ceil(Math.log2(n)) + 1 : 1;
      const [q1, q3] = quantile(inR, [0.25, 0.75]), w = 2 * (q3 - q1) / Math.cbrt(n || 1);
      if (w > 0) nb = Math.max(nb, Math.ceil((hi - lo) / w));
      nb = Math.min(nb, 200);
    }
    edges = linspace(lo, hi, nb + 1); edges[nb] = hi; // exact right edge (linspace may round)
  }
  const nb = edges.length - 1, counts = new Array(nb).fill(0), uniform = !Array.isArray(bins), e0 = edges[0], eN = edges[nb];
  let total = 0;
  for (const x of xs) {
    if (x < e0 || x > eN) continue;
    let i;
    if (uniform) { i = Math.min(nb - 1, Math.floor((x - e0) / (eN - e0) * nb)); if (x < edges[i]) i--; else if (i < nb - 1 && x >= edges[i + 1]) i++; }
    else { let a = 0, b = nb - 1; while (a < b) { const m = (a + b + 1) >> 1; if (edges[m] <= x) a = m; else b = m - 1; } i = a; }
    counts[i]++; total++;
  }
  return {
    edges, counts, total,
    density: counts.map((c, i) => (total ? c / (total * (edges[i + 1] - edges[i])) : 0)),
    centers: counts.map((_, i) => (edges[i] + edges[i + 1]) / 2),
  };
}
/**
 * Ordinary least-squares line y ≈ slope·x + intercept → {slope, intercept, r, r2, n, predict(x), seSlope, seIntercept, sigma (residual s.d.)}.
 */
export function linreg(xs, ys) {
  const n = xs.length, mx = mean(xs), my = mean(ys);
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
  const slope = sxy / sxx, intercept = my - slope * mx, r = sxy / Math.sqrt(sxx * syy);
  const sse = Math.max(0, syy - slope * sxy), sigma = n > 2 ? Math.sqrt(sse / (n - 2)) : NaN;
  return { slope, intercept, r, r2: r * r, n, sigma, seSlope: sigma / Math.sqrt(sxx), seIntercept: sigma * Math.sqrt(1 / n + mx * mx / sxx), predict: (x) => intercept + slope * x };
}

// ================================================================== ODE integrators
// Scalars or arrays are accepted for states; outputs mirror the input type.
const wrapF = (F, sc) => (sc ? (t, y) => [F(t, y[0])] : F);
const unwrap = (y, sc) => (sc ? y[0] : y.slice());
// Second-order (mechanics) integrators for x'' = accel(x, t): (accel, x0, v0, dt, n, t0 = 0) → {t, x, v} with n+1 samples.
function mech(stepper) {
  return (accel, x0, v0, dt, n, t0 = 0) => {
    const sc = !Array.isArray(x0), A = sc ? (x, t) => [accel(x[0], t)] : accel;
    let x = sc ? [x0] : x0.slice(), v = sc ? [v0] : v0.slice();
    const out = { t: [t0], x: [unwrap(x, sc)], v: [unwrap(v, sc)] }, st = { a: null };
    for (let i = 0; i < n; i++) {
      [x, v] = stepper(A, x, v, dt, t0 + i * dt, st);
      out.t.push(t0 + (i + 1) * dt); out.x.push(unwrap(x, sc)); out.v.push(unwrap(v, sc));
    }
    return out;
  };
}
/** Velocity Verlet (symplectic, 2nd order, one force evaluation per step). accel(x, t) → acceleration. → {t, x, v}. */
export const verlet = mech((A, x, v, dt, t, st) => {
  const a = st.a || A(x, t), x1 = x.map((xi, i) => xi + v[i] * dt + 0.5 * a[i] * dt * dt), a1 = A(x1, t + dt);
  st.a = a1; return [x1, v.map((vi, i) => vi + 0.5 * (a[i] + a1[i]) * dt)];
});
/** Leapfrog in drift–kick–drift form (position Verlet; symplectic, 2nd order), synchronised output {t, x, v}. */
export const leapfrog = mech((A, x, v, dt, t) => {
  const xh = x.map((xi, i) => xi + 0.5 * dt * v[i]), a = A(xh, t + dt / 2), v1 = v.map((vi, i) => vi + dt * a[i]);
  return [xh.map((xi, i) => xi + 0.5 * dt * v1[i]), v1];
});
/** Semi-implicit (symplectic) Euler: kick v += a(x)·dt, then drift x += v·dt. 1st order but energy-bounded. → {t, x, v}. */
export const symplecticEuler = mech((A, x, v, dt, t) => {
  const a = A(x, t), v1 = v.map((vi, i) => vi + dt * a[i]);
  return [x.map((xi, i) => xi + dt * v1[i]), v1];
});
/** Explicit Euler for y' = F(t, y), n steps → {t, y} (for comparisons; not symplectic, not stable for stiff problems). */
export function euler(F, t0, y0, t1, n = 100) {
  const sc = !Array.isArray(y0), f = wrapF(F, sc), h = (t1 - t0) / n; let y = sc ? [y0] : y0.slice();
  const out = { t: [t0], y: [unwrap(y, sc)] };
  for (let i = 0; i < n; i++) { const d = f(t0 + i * h, y); y = y.map((yi, j) => yi + h * d[j]); out.t.push(t0 + (i + 1) * h); out.y.push(unwrap(y, sc)); }
  return out;
}
/**
 * Adaptive Dormand–Prince 5(4) for y' = F(t, y) from t0 to t1 (either direction).
 * opts: {tol = 1e-6 (or rtol/atol separately), hmax, h0, maxSteps = 1e5}. → {t: [...], y: [...], ok}
 * (accepted steps only; ok = false if maxSteps was hit or the step size underflowed).
 */
export function rk45(F, t0, y0, t1, opts = {}) {
  const sc = !Array.isArray(y0), f = wrapF(F, sc), n = sc ? 1 : y0.length;
  const rtol = opts.rtol ?? opts.tol ?? 1e-6, atol = opts.atol ?? opts.tol ?? 1e-6, maxSteps = opts.maxSteps ?? 100000;
  const dir = t1 >= t0 ? 1 : -1, span = Math.abs(t1 - t0), hmax = Math.min(opts.hmax ?? Infinity, span);
  let t = t0, y = sc ? [y0] : y0.slice(), k1 = f(t, y);
  const out = { t: [t], y: [unwrap(y, sc)], ok: true };
  if (span === 0) return out;
  const rms = (v, ref) => Math.sqrt(v.reduce((s, x, i) => s + (x / (atol + rtol * Math.abs(ref[i]))) ** 2, 0) / n);
  let h = opts.h0;
  if (!h) { // Hairer's starting-step heuristic
    const d0 = rms(y, y), d1 = rms(k1, y), h0 = d0 < 1e-5 || d1 < 1e-5 ? 1e-6 : 0.01 * d0 / d1;
    const k2 = f(t + dir * h0, y.map((yi, i) => yi + dir * h0 * k1[i])), d2 = rms(k2.map((x, i) => x - k1[i]), y) / h0;
    h = Math.min(100 * h0, Math.max(d1, d2) <= 1e-15 ? Math.max(1e-6, h0 * 1e-3) : Math.pow(0.01 / Math.max(d1, d2), 0.2));
  }
  h = Math.min(h, hmax);
  const A = [[], [1 / 5], [3 / 40, 9 / 40], [44 / 45, -56 / 15, 32 / 9], [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656], [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]];
  const Cc = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1], E = [71 / 57600, 0, -71 / 16695, 71 / 1920, -17253 / 339200, 22 / 525, -1 / 40];
  let rejected = false;
  for (let step = 0; step < maxSteps; step++) {
    const rem = span - Math.abs(t - t0); if (rem <= 1e-14 * span) return out;
    if (h >= rem) h = rem;
    if (h < 1e-14 * Math.max(1, Math.abs(t))) { out.ok = false; return out; }
    const hs = dir * h, K = [k1];
    for (let s = 1; s < 7; s++) {
      const ys = y.map((yi, i) => { let acc = yi; for (let j = 0; j < s; j++) if (A[s][j]) acc += hs * A[s][j] * K[j][i]; return acc; });
      if (s === 6) K.ynew = ys;
      K.push(f(t + Cc[s] * hs, ys));
    }
    const ynew = K.ynew, err = y.map((_, i) => { let e = 0; for (let j = 0; j < 7; j++) e += E[j] * K[j][i]; return hs * e; });
    const en = Math.sqrt(err.reduce((s, e, i) => s + (e / (atol + rtol * Math.max(Math.abs(y[i]), Math.abs(ynew[i])))) ** 2, 0) / n);
    if (en <= 1) {
      t = Math.abs(rem - h) <= 1e-14 * span ? t1 : t + hs; y = ynew; k1 = K[6];
      out.t.push(t); out.y.push(unwrap(y, sc));
      h = Math.min(hmax, h * Math.min(rejected ? 1 : 5, Math.max(0.2, 0.9 * Math.pow(en || 1e-10, -0.2)))); rejected = false;
    } else { h *= Math.max(0.2, 0.9 * Math.pow(isFinite(en) ? en : 1e10, -0.2)); rejected = true; }
  }
  out.ok = false; return out;
}
function numJac(f, t, y, f0) { // forward-difference Jacobian
  const n = y.length, J = zeros(n, n);
  for (let j = 0; j < n; j++) {
    const d = 1.49e-8 * Math.max(1, Math.abs(y[j])), yp = y.slice(); yp[j] += d;
    const fp = f(t, yp); for (let i = 0; i < n; i++) J[i][j] = (fp[i] - f0[i]) / d;
  }
  return J;
}
/**
 * Backward (implicit) Euler for stiff y' = F(t, y): n steps from t0 to t1, each solved by Newton's method.
 * J(t, y) → Jacobian matrix (a number for scalar y) is optional — pass null or omit it (implicitEuler(F, t0, y0, t1, n))
 * to use a finite-difference Jacobian. → {t, y}.
 */
export function implicitEuler(F, J, t0, y0, t1, n) {
  if (typeof J === 'number') { n = t1; t1 = y0; y0 = t0; t0 = J; J = null; }
  n = n ?? 100;
  const sc = !Array.isArray(y0), f = wrapF(F, sc), h = (t1 - t0) / n;
  const jac = J ? (sc ? (t, y) => { const v = J(t, y[0]); return Array.isArray(v) ? v : [[v]]; } : J) : null;
  // one backward-Euler step t → t+dt; if Newton fails to converge, take two half steps instead (recursively)
  const step = (t, y, dt, depth) => {
    const tn = t + dt, Y = y.slice(), m = y.length;
    for (let it = 0; it < 30; it++) {
      const fY = f(tn, Y), G = Y.map((Yi, k) => Yi - y[k] - dt * fY[k]);
      const Jm = jac ? jac(tn, Y) : numJac(f, tn, Y, fY);
      const dY = luSolve(lu(Jm.map((r, a) => r.map((x, b) => (a === b ? 1 : 0) - dt * x))), G.map((g) => -g));
      if (!dY) break;
      let nd = 0, ny = 0; for (let k = 0; k < m; k++) { Y[k] += dY[k]; nd = Math.max(nd, Math.abs(dY[k])); ny = Math.max(ny, Math.abs(Y[k])); }
      if (!isFinite(nd)) break;
      if (nd <= 1e-10 * (1 + ny)) return Y;
    }
    if (depth >= 14) return Y.every(isFinite) ? Y : y.slice();
    return step(t + dt / 2, step(t, y, dt / 2, depth + 1), dt / 2, depth + 1);
  };
  let y = sc ? [y0] : y0.slice();
  const out = { t: [t0], y: [unwrap(y, sc)] };
  for (let i = 0; i < n; i++) { y = step(t0 + i * h, y, h, 0); out.t.push(t0 + (i + 1) * h); out.y.push(unwrap(y, sc)); }
  return out;
}
/**
 * Gillespie's stochastic simulation algorithm (exact SSA).
 * rates: x → [a_1..a_m] propensities, or an array of functions x → a_j; stoich: m state-change vectors; x0: initial counts
 * (a number for one species); r: rng (default Math.random); opts.maxEvents (1e5).
 * → {t, x, reactions}: state after each event (t[0] = 0, x[0] = x0); a final entry repeats the last state at tMax
 * (so the path can be drawn as steps); reactions[i] = index of the reaction fired at t[i+1].
 */
export function gillespie(rates, stoich, x0, tMax, r = Math.random, { maxEvents = 100000 } = {}) {
  const sc = !Array.isArray(x0), S = stoich.map((s) => (Array.isArray(s) ? s : [s]));
  let x = sc ? [x0] : x0.slice();
  const prop = typeof rates === 'function' ? (x) => rates(sc ? x[0] : x) : (x) => rates.map((g) => g(sc ? x[0] : x));
  const out = { t: [0], x: [unwrap(x, sc)], reactions: [] };
  let t = 0, ended = true;
  for (let ev = 0; ; ev++) {
    if (ev >= maxEvents) { ended = false; break; }
    const a = prop(x); let a0 = 0; for (const ai of a) if (ai > 0) a0 += ai;
    if (!(a0 > 0)) break;
    const tau = -Math.log(U01(r)) / a0; if (t + tau > tMax) break;
    t += tau;
    const target = r() * a0; let acc = 0, j = -1;
    for (let i = 0; i < a.length; i++) { if (!(a[i] > 0)) continue; j = i; acc += a[i]; if (target < acc) break; }
    x = x.map((xi, k) => xi + S[j][k]);
    out.t.push(t); out.x.push(unwrap(x, sc)); out.reactions.push(j);
  }
  if (ended && t < tMax) { out.t.push(tMax); out.x.push(unwrap(x, sc)); }
  return out;
}

// ================================================================== physical constants (SI, CODATA 2018 unless noted)
export const CONST = Object.freeze({
  c: 299792458,                 // speed of light in vacuum, m/s (exact)
  h: 6.62607015e-34,            // Planck constant, J·s (exact)
  hbar: 1.054571817e-34,        // reduced Planck constant h/2π, J·s
  kB: 1.380649e-23,             // Boltzmann constant, J/K (exact)
  NA: 6.02214076e23,            // Avogadro constant, 1/mol (exact)
  e: 1.602176634e-19,           // elementary charge, C (exact)
  me: 9.1093837015e-31,         // electron mass, kg
  mp: 1.67262192369e-27,        // proton mass, kg
  mn: 1.67492749804e-27,        // neutron mass, kg
  u: 1.6605390666e-27,          // atomic mass unit (dalton), kg
  G: 6.6743e-11,                // Newtonian constant of gravitation, m³/(kg·s²)
  eps0: 8.8541878128e-12,       // vacuum permittivity, F/m
  mu0: 1.25663706212e-6,        // vacuum permeability, N/A²
  ke: 8.9875517923e9,           // Coulomb constant 1/(4π ε0), N·m²/C²
  R: 8.314462618,               // molar gas constant, J/(mol·K)
  F: 96485.33212,               // Faraday constant, C/mol
  sigma: 5.670374419e-8,        // Stefan–Boltzmann constant, W/(m²·K⁴)
  b: 2.897771955e-3,            // Wien displacement constant, m·K
  alpha: 7.2973525693e-3,       // fine-structure constant (dimensionless)
  Ry: 10973731.56816,           // Rydberg constant, 1/m
  a0: 5.29177210903e-11,        // Bohr radius, m
  muB: 9.2740100783e-24,        // Bohr magneton, J/T
  eV: 1.602176634e-19,          // electronvolt, J (exact)
  g0: 9.80665,                  // standard gravity, m/s² (exact, by definition)
  atm: 101325,                  // standard atmosphere, Pa (exact)
  T0: 273.15,                   // 0 °C in kelvin (exact)
  au: 149597870700,             // astronomical unit, m (exact, IAU 2012)
  ly: 9460730472580800,         // light-year (Julian year × c), m (exact)
  pc: 3.0856775814913673e16,    // parsec, m
  yr: 31557600,                 // Julian year, s (exact)
  Msun: 1.98841e30,             // solar mass, kg (IAU 2015 nominal GM☉ / CODATA 2018 G)
  Rsun: 6.957e8,                // nominal solar radius, m (IAU 2015)
  Lsun: 3.828e26,               // nominal solar luminosity, W (IAU 2015)
  Mearth: 5.9722e24,            // Earth mass, kg (IAU 2015 nominal GM⊕ / G)
  Rearth: 6.3781e6,             // nominal equatorial Earth radius, m (IAU 2015)
});
/** Unit string for each CONST entry (plain text). */
export const CONST_UNITS = Object.freeze({
  c: 'm/s', h: 'J·s', hbar: 'J·s', kB: 'J/K', NA: '1/mol', e: 'C', me: 'kg', mp: 'kg', mn: 'kg', u: 'kg', G: 'm³/(kg·s²)', eps0: 'F/m',
  mu0: 'N/A²', ke: 'N·m²/C²', R: 'J/(mol·K)', F: 'C/mol', sigma: 'W/(m²·K⁴)', b: 'm·K', alpha: '', Ry: '1/m', a0: 'm', muB: 'J/T', eV: 'J',
  g0: 'm/s²', atm: 'Pa', T0: 'K', au: 'm', ly: 'm', pc: 'm', yr: 's', Msun: 'kg', Rsun: 'm', Lsun: 'W', Mearth: 'kg', Rearth: 'm',
});
const SI_PREFIX = ['q', 'r', 'y', 'z', 'a', 'f', 'p', 'n', 'µ', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'R', 'Q']; // 10^−30 … 10^30
/** Format with an SI prefix and real minus sign: si(0.00234, 'A') → "2.34 mA", si(1.5e9, 'Hz', 2) → "1.5 GHz". */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** Plain-text power of ten with superscripts: pow10Text(-3) → "10⁻³". */
export const pow10Text = (k) => '10' + String(k).split('').map((ch) => SUP[ch]).join('');
/** Format with an SI prefix and real minus sign: si(0.00234, 'A') → "2.34 mA", si(1.5e9, 'Hz', 2) → "1.5 GHz" (outside 10^±30: "1.00×10⁻⁴⁰ m"). */
export function si(x, unit = '', digits = 3) {
  const tail = (p) => (p + unit ? ' ' + p + unit : '');
  if (!isFinite(x)) return (isNaN(x) ? 'NaN' : x > 0 ? '∞' : '−∞') + tail('');
  if (x === 0) return '0' + tail('');
  const a = Math.abs(x);
  if (a < 0.9995e-30 || a >= 999.5e30) {
    let e = Math.floor(Math.log10(a)), m = (x / Math.pow(10, e)).toPrecision(digits);
    if (Math.abs(Number(m)) >= 10) { e++; m = (x / Math.pow(10, e)).toPrecision(digits); }
    return m.replace('-', '−') + '×' + pow10Text(e) + tail('');
  }
  let e3 = clamp(Math.floor(Math.log10(a) / 3), -10, 10);
  const scaled = (k) => (k < 0 ? x * Math.pow(10, -3 * k) : x / Math.pow(10, 3 * k));
  let s = scaled(e3).toPrecision(digits);
  if (Math.abs(Number(s)) >= 1000 && e3 < 10) { e3++; s = scaled(e3).toPrecision(digits); }
  if (s.includes('e')) s = String(Number(s));
  return s.replace('-', '−') + tail(SI_PREFIX[e3 + 10]);
}

// ================================================================== number theory (Number or BigInt)
const isBig = (x) => typeof x === 'bigint';
const absBig = (x) => (x < 0n ? -x : x);
/** Greatest common divisor (≥ 0); BigInt if either argument is. */
export function gcd(a, b) {
  if (isBig(a) || isBig(b)) { a = absBig(BigInt(a)); b = absBig(BigInt(b)); while (b) { const t = a % b; a = b; b = t; } return a; }
  a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a;
}
export const lcm = (a, b) => (isBig(a) || isBig(b) ? (BigInt(a) === 0n ? 0n : absBig(BigInt(a) / gcd(a, b) * BigInt(b))) : (a === 0 ? 0 : Math.abs(a / gcd(a, b) * b)));
/** Extended Euclid: {g, x, y} with a·x + b·y = g = gcd(a, b) ≥ 0. */
export function egcd(a, b) {
  const big = isBig(a) || isBig(b), Z = big ? 0n : 0, O = big ? 1n : 1;
  if (big) { a = BigInt(a); b = BigInt(b); }
  let r0 = a, r1 = b, s0 = O, s1 = Z, t0 = Z, t1 = O;
  while (r1 !== Z) {
    const q = big ? r0 / r1 : Math.trunc(r0 / r1);
    [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; [t0, t1] = [t1, t0 - q * t1];
  }
  return r0 < Z ? { g: -r0, x: -s0, y: -t0 } : { g: r0, x: s0, y: t0 };
}
/** Inverse of a modulo m, or null if gcd(a, m) ≠ 1. */
export function modinv(a, m) {
  const big = isBig(a) || isBig(m);
  if (big) { a = BigInt(a); m = BigInt(m); const { g, x } = egcd(((a % m) + m) % m, m); return g === 1n ? ((x % m) + m) % m : null; }
  const { g, x } = egcd(mod(a, m), m); return g === 1 ? mod(x, m) : null;
}
/** b^e mod m, exact for any size (uses BigInt internally when products could exceed 2^53). Negative e uses modinv. */
export function modpow(b, e, m) {
  const big = isBig(b) || isBig(e) || isBig(m);
  if (e < 0) { const inv = modinv(b, m); if (inv == null) return null; return modpow(inv, big ? -BigInt(e) : -e, m); }
  if (!big && m <= 94906265 && e <= Number.MAX_SAFE_INTEGER) { // b², r·b < 2^53: plain doubles are exact
    b = mod(b, m); let r = 1 % m;
    while (e > 0) { if (e % 2) r = (r * b) % m; e = Math.floor(e / 2); if (e) b = (b * b) % m; }
    return r;
  }
  let B = BigInt(b), E = BigInt(e); const Mb = BigInt(m);
  B = ((B % Mb) + Mb) % Mb; let r = 1n % Mb;
  while (E > 0n) { if (E & 1n) r = (r * B) % Mb; E >>= 1n; if (E) B = (B * B) % Mb; }
  return big ? r : Number(r);
}
const SMALL_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41];
function millerRabin(n, bases) { // n odd > 41 (Number ≤ 2^53 or BigInt)
  const big = isBig(n), one = big ? 1n : 1, nm1 = n - one;
  let d = nm1, s = 0;
  if (big) while ((d & 1n) === 0n) { d >>= 1n; s++; } else while (d % 2 === 0) { d /= 2; s++; }
  outer: for (const a0 of bases) {
    const a = big ? BigInt(a0) : a0;
    let x = modpow(a, d, n);
    if (x === one || x === nm1) continue;
    for (let i = 1; i < s; i++) { x = big ? (x * x) % n : modpow(x, 2, n); if (x === nm1) continue outer; if (x === one) return false; }
    return false;
  }
  return true;
}
/**
 * Primality test: deterministic Miller–Rabin (bases 2…41 — exact for all n < 3.3·10^24, so for every 64-bit n).
 * Accepts Numbers (safe integers) and BigInts; beyond 3.3·10^24 it is a strong probable-prime test.
 */
export function isPrime(n) {
  if (isBig(n)) { if (n <= BigInt(Number.MAX_SAFE_INTEGER)) return isPrime(Number(n)); }
  else if (!Number.isInteger(n) || n < 2) return false;
  else if (n > Number.MAX_SAFE_INTEGER) return isPrime(BigInt(n));
  const big = isBig(n);
  for (const p of SMALL_PRIMES) { const P = big ? BigInt(p) : p; if (n === P) return true; if (n % P === (big ? 0n : 0)) return false; }
  if (!big && n < 1681) return true; // 41²
  return millerRabin(n, !big && n < 3215031751 ? [2, 3, 5, 7] : SMALL_PRIMES);
}
/** All primes ≤ n (sieve of Eratosthenes). */
export function sieve(n) {
  n = Math.floor(n); if (n < 2) return [];
  const comp = new Uint8Array(n + 1), out = [];
  for (let i = 2; i <= n; i++) { if (comp[i]) continue; out.push(i); for (let j = i * i; j <= n; j += i) comp[j] = 1; }
  return out;
}
function pollardBrent(n) { // a nontrivial factor of the odd composite BigInt n
  for (let c = 1n; ; c++) {
    const f = (v) => (v * v + c) % n;
    let y = 2n, x = 2n, ys = 2n, g = 1n, q = 1n, r = 1;
    const m = 64;
    do {
      x = y; for (let i = 0; i < r; i++) y = f(y);
      for (let k = 0; k < r && g === 1n; k += m) {
        ys = y; const lim = Math.min(m, r - k);
        for (let i = 0; i < lim; i++) { y = f(y); q = (q * absBig(x - y)) % n; }
        g = gcd(q, n);
      }
      r *= 2;
    } while (g === 1n && r < 1 << 26);
    if (g === n || g === 0n) { g = 1n; for (let i = 0; i < 1 << 22 && g === 1n; i++) { ys = f(ys); g = gcd(absBig(x - ys), n); } }
    if (g !== n && g !== 1n && g !== 0n) return g;
  }
}
/** Prime factorisation → [[p, e], …] sorted by p (trial division, then Pollard–Brent rho). Number in → Numbers out; BigInt in → BigInts. */
export function factor(n) {
  const big = isBig(n); let N = absBig(BigInt(n));
  const fs = new Map(), add = (p, e = 1) => fs.set(p, (fs.get(p) || 0n) + BigInt(e));
  if (N >= 2n) {
    if (N <= BigInt(Number.MAX_SAFE_INTEGER)) { // fast trial division in doubles
      let m = Number(N);
      for (const p of [2, 3, 5]) while (m % p === 0) { add(BigInt(p)); m /= p; }
      for (let p = 7, i = 0, inc = [4, 2, 4, 2, 4, 6, 2, 6]; p <= 50000 && p * p <= m; p += inc[i++ & 7]) while (m % p === 0) { add(BigInt(p)); m /= p; }
      N = BigInt(m);
    } else for (const p of [2n, 3n, 5n, 7n, 11n, 13n]) while (N % p === 0n) { add(p); N /= p; }
    const split = (k) => {
      if (k === 1n) return;
      if (isPrime(k)) { add(k); return; }
      const sq = bigSqrt(k); if (sq * sq === k) { split(sq); split(sq); return; }
      const d = pollardBrent(k); split(d); split(k / d);
    };
    split(N);
  }
  return [...fs.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([p, e]) => (big ? [p, Number(e)] : [Number(p), Number(e)]));
}
function bigSqrt(n) { // floor(√n) for BigInt n ≥ 0 (Newton from above)
  if (n < 2n) return n;
  const f = Math.sqrt(Number(n));
  let x = isFinite(f) ? BigInt(Math.ceil(f * (1 + 1e-10))) + 1n : 1n << BigInt(Math.ceil(n.toString(2).length / 2) + 1);
  for (;;) { const y = (x + n / x) >> 1n; if (y >= x) break; x = y; }
  while (x * x > n) x--;
  return x;
}
/** Prime factors with multiplicity, ascending: primeFactors(360) → [2, 2, 2, 3, 3, 5]. */
export const primeFactors = (n) => factor(n).flatMap(([p, e]) => Array(e).fill(p));
/** Euler's totient φ(n). */
export function totient(n) {
  if (isBig(n)) { let r = absBig(n); if (r === 0n) return 0n; for (const [p] of factor(n)) r = r / p * (p - 1n); return r; }
  if (n === 0) return 0; let r = Math.abs(n); for (const [p] of factor(n)) r = r / p * (p - 1); return r;
}
const floorDivBig = (a, b) => { const q = a / b; return (a % b !== 0n && (a < 0n) !== (b < 0n)) ? q - 1n : q; };
/**
 * Continued fraction [a0; a1, a2, …] (at most n terms). x may be a number — expanded EXACTLY from its binary value and
 * stopped as soon as a convergent reproduces x — or a rational [p, q] (integers or BigInts; full expansion).
 */
export function contFrac(x, n = 24) {
  let p, q, exactStop = false;
  if (Array.isArray(x)) { p = BigInt(x[0]); q = BigInt(x[1]); if (q < 0n) { p = -p; q = -q; } }
  else {
    if (!isFinite(x)) return [];
    let m = x, e = 0n; while (!Number.isInteger(m)) { m *= 2; e++; }
    p = BigInt(m); q = 1n << e; exactStop = true;
  }
  const out = []; let h0 = 0n, h1 = 1n, k0 = 1n, k1 = 0n;
  while (q !== 0n && out.length < n) {
    const a = floorDivBig(p, q); out.push(Number(a));
    [p, q] = [q, p - a * q];
    [h0, h1] = [h1, a * h1 + h0]; [k0, k1] = [k1, a * k1 + k0];
    if (exactStop && Number(h1) / Number(k1) === x) break;
  }
  return out;
}
/** Convergents [[p, q], …] of a continued fraction (array of partial quotients) or of a number x (via contFrac(x, n)). */
export function convergents(a, n = 24) {
  if (!Array.isArray(a)) a = contFrac(a, n);
  const out = []; let h0 = 0, h1 = 1, k0 = 1, k1 = 0;
  for (const ai of a) { [h0, h1] = [h1, ai * h1 + h0]; [k0, k1] = [k1, ai * k1 + k0]; out.push([h1, k1]); }
  return out;
}

// ================================================================== music & audio maths
/** MIDI note number → frequency in Hz (12-TET, A4 = 69 = a4 Hz). */
export const midiToFreq = (m, a4 = 440) => a4 * Math.pow(2, (m - 69) / 12);
/** Frequency → (fractional) MIDI note number. */
export const freqToMidi = (f, a4 = 440) => 69 + 12 * Math.log2(f / a4);
/** Interval from f1 up to f2 in cents (1200 per octave). */
export const centsBetween = (f1, f2) => 1200 * Math.log2(f2 / f1);
const PL_B1 = 3.51, PL_B2 = 5.75, PL_XS = Math.log(PL_B2 / PL_B1) / (PL_B2 - PL_B1), PL_PEAK = Math.exp(-PL_B1 * PL_XS) - Math.exp(-PL_B2 * PL_XS);
/**
 * Plomp–Levelt sensory dissonance of two pure tones, Sethares' parameterisation:
 * d = min(a1,a2)·(e^{−3.51 s Δf} − e^{−5.75 s Δf}) with s = 0.24/(0.0207·f_min + 18.96), scaled so the peak is 1 (for unit amplitudes).
 */
export function plompLevelt(f1, f2, a1 = 1, a2 = 1) {
  const s = 0.24 / (0.0207 * Math.min(f1, f2) + 18.96), x = s * Math.abs(f2 - f1);
  return Math.min(a1, a2) * (Math.exp(-PL_B1 * x) - Math.exp(-PL_B2 * x)) / PL_PEAK;
}
/** Total dissonance of one or more sets of partials [[f, a], …]: Σ over all pairs of plompLevelt. */
export function dissonance(...sets) {
  const P = sets.flat(); let d = 0;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) d += plompLevelt(P[i][0], P[j][0], P[i][1] ?? 1, P[j][1] ?? 1);
  return d;
}
const NOTE_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'], NOTE_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
/** Note name of a (rounded) MIDI number: noteName(61) → "C♯4"; opts {flats, octave = true, ascii (# and b)}. */
export function noteName(m, { flats = false, octave = true, ascii = false } = {}) {
  const k = Math.round(m); let s = (flats ? NOTE_FLAT : NOTE_SHARP)[mod(k, 12)];
  if (ascii) s = s.replace('♯', '#').replace('♭', 'b');
  return octave ? s + (Math.floor(k / 12) - 1) : s;
}

// ================================================================== waves, quanta and light
/** Approximate sRGB colour [r, g, b] (0–255) of monochromatic light of wavelength nm (380–780; black outside). */
export function wavelengthRGB(nm, gamma = 0.8) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else if (nm <= 780) r = 1;
  const f = nm < 380 || nm > 780 ? 0 : nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1; // eye sensitivity falls at the ends
  const c = (v) => Math.round(255 * Math.pow(v * f, gamma));
  return [c(r), c(g), c(b)];
}
/** Number of eigenvalues < x of the symmetric tridiagonal matrix (diagonal d, off-diagonal e) — Sturm count. */
function sturmCount(d, e, x) {
  let q = 1, k = 0; for (let i = 0; i < d.length; i++) { q = d[i] - x - (i ? (e[i - 1] * e[i - 1]) / (q || 1e-300) : 0); if (q < 0) k++; } return k;
}
/** Solve (T − σI) y = b for symmetric tridiagonal T (Thomas algorithm). */
function triSolve(d, e, s, b) {
  const n = d.length, c = new Float64Array(n), y = new Float64Array(n);
  let m = d[0] - s || 1e-300; c[0] = (e[0] ?? 0) / m; y[0] = b[0] / m;
  for (let i = 1; i < n; i++) { m = d[i] - s - e[i - 1] * c[i - 1] || 1e-300; c[i] = i < n - 1 ? e[i] / m : 0; y[i] = (b[i] - e[i - 1] * y[i - 1]) / m; }
  for (let i = n - 2; i >= 0; i--) y[i] -= c[i] * y[i + 1];
  return y;
}
/** Lowest k eigenpairs of a symmetric tridiagonal matrix: Sturm bisection for the values, inverse iteration for the vectors. */
export function tridiagEig(d, e, k = 6) {
  const n = d.length; k = Math.min(k, n);
  let lo = Infinity, hi = -Infinity; for (let i = 0; i < n; i++) { const r = Math.abs(e[i - 1] ?? 0) + Math.abs(e[i] ?? 0); lo = Math.min(lo, d[i] - r); hi = Math.max(hi, d[i] + r); }
  const values = [], vectors = [];
  for (let j = 0; j < k; j++) {
    let a = lo, b = hi; for (let it = 0; it < 200 && b - a > 1e-13 * Math.max(1, Math.abs(a) + Math.abs(b)); it++) { const m = (a + b) / 2; if (sturmCount(d, e, m) > j) b = m; else a = m; }
    const lam = (a + b) / 2; values.push(lam);
    let v = new Float64Array(n).map((_, i) => 1 + 0.01 * Math.sin(i + j));
    for (let it = 0; it < 3; it++) { v = triSolve(d, e, lam + 1e-10 * Math.max(1, Math.abs(lam)), v); let s = 0; for (let i = 0; i < n; i++) s += v[i] * v[i]; s = Math.sqrt(s) || 1; for (let i = 0; i < n; i++) v[i] /= s; }
    vectors.push(v);
  }
  return { values, vectors };
}
/**
 * Bound states of −(ħ²/2m)ψ'' + V(x)ψ = Eψ on [x0, x1] with ψ = 0 at both ends (finite differences, n interior points).
 * Returns {x (n+2 points incl. ends), E: [k lowest], psi: [k arrays on x, ∫|ψ|²dx = 1, positive just right of x0]}.
 */
export function schrodinger1D(V, [x0, x1], { n = 400, k = 6, mass = 1, hbar = 1 } = {}) {
  const h = (x1 - x0) / (n + 1), t = (hbar * hbar) / (2 * mass * h * h);
  const x = Float64Array.from({ length: n + 2 }, (_, i) => x0 + i * h);
  const d = Float64Array.from({ length: n }, (_, i) => 2 * t + V(x[i + 1])), e = new Float64Array(n - 1).fill(-t);
  const { values, vectors } = tridiagEig(d, e, k);
  const psi = vectors.map((v) => {
    const p = new Float64Array(n + 2); for (let i = 0; i < n; i++) p[i + 1] = v[i] / Math.sqrt(h);
    const first = p.find((y) => Math.abs(y) > 1e-6 * Math.max(...p.map(Math.abs))); if (first < 0) for (let i = 0; i < p.length; i++) p[i] = -p[i];
    return p;
  });
  return { x, E: values, psi };
}
/**
 * Split-step Fourier propagator for iħψ_t = −(ħ²/2m)ψ_xx + Vψ on a periodic grid of length n (a power of two):
 * returns step(re, im) advancing (re, im) in place by dt (Strang splitting: ½V, full kinetic in k-space, ½V).
 * opts: {m = 1, hbar = 1, Vi} — Vi (optional array) is an imaginary potential: V − iVi absorbs where Vi > 0.
 * Unitary to rounding when Vi is absent; spectrally accurate in space, second order in dt.
 */
export function splitStep1D(V, dx, dt, { m = 1, hbar = 1, Vi = null } = {}) {
  const n = V.length, kc = new Float64Array(n), ks = new Float64Array(n), vc = new Float64Array(n), vs = new Float64Array(n), va = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const k = (TAU * (j < n / 2 ? j : j - n)) / (n * dx), a = (-hbar * k * k * dt) / (2 * m);
    kc[j] = Math.cos(a); ks[j] = Math.sin(a);
    const b = (-V[j] * dt) / (2 * hbar); vc[j] = Math.cos(b); vs[j] = Math.sin(b);
    va[j] = Vi ? Math.exp((-Vi[j] * dt) / (2 * hbar)) : 1;
  }
  const R = new Float64Array(n), I = new Float64Array(n);
  const half = (re, im) => { for (let j = 0; j < n; j++) { const r = re[j], q = im[j], g = va[j]; re[j] = g * (r * vc[j] - q * vs[j]); im[j] = g * (r * vs[j] + q * vc[j]); } };
  return (re, im) => {
    half(re, im);
    for (let j = 0; j < n; j++) { R[j] = re[j]; I[j] = im[j]; }
    fft(R, I);
    for (let j = 0; j < n; j++) { const r = R[j], q = I[j]; R[j] = r * kc[j] - q * ks[j]; I[j] = r * ks[j] + q * kc[j]; }
    ifft(R, I);
    for (let j = 0; j < n; j++) { re[j] = R[j]; im[j] = I[j]; }
    half(re, im);
  };
}
/** Inverse-CDF sampler for a density tabulated at grid points xs (trapezoid rule, linear interpolation): u ∈ [0,1) ↦ x. Also .cdf(x) and .total. */
export function gridSampler(xs, ps) {
  const n = xs.length, cdf = new Float64Array(n); let s = 0;
  for (let i = 1; i < n; i++) { s += 0.5 * (ps[i] + ps[i - 1]) * (xs[i] - xs[i - 1]); cdf[i] = s; }
  const f = (u) => { const t = u * s; let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cdf[mid] < t) lo = mid; else hi = mid; } const w = (t - cdf[lo]) / (cdf[hi] - cdf[lo] || 1); return xs[lo] + w * (xs[hi] - xs[lo]); };
  f.cdf = (x) => { if (x <= xs[0]) return 0; if (x >= xs[n - 1]) return 1; let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] < x) lo = mid; else hi = mid; } const w = (x - xs[lo]) / (xs[hi] - xs[lo]); return (cdf[lo] + w * (cdf[hi] - cdf[lo])) / s; };
  f.total = s;
  return f;
}
/**
 * One Crank–Nicolson step of iħψ_t = −(ħ²/2m)ψ'' + Vψ on a uniform grid (ψ = 0 at the ends). Unitary: ∫|ψ|² is conserved.
 * re, im: Float64Arrays (updated in place); V: array of potential values on the grid; dx, dt.
 */
export function crankNicolson1D(re, im, V, dx, dt, { mass = 1, hbar = 1 } = {}) {
  const n = re.length, a = (hbar * dt) / (4 * mass * dx * dx), bv = (i) => (dt * V[i]) / (2 * hbar);
  // (1 + iH dt/2ħ) ψ⁺ = (1 − iH dt/2ħ) ψ ; H dt/2ħ has diagonal 2a + bv, off-diagonal −a
  const rr = new Float64Array(n), ri = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const L = i > 0 ? i - 1 : -1, R = i < n - 1 ? i + 1 : -1, dg = 2 * a + bv(i);
    const offR = (L >= 0 ? re[L] : 0) + (R >= 0 ? re[R] : 0), offI = (L >= 0 ? im[L] : 0) + (R >= 0 ? im[R] : 0);
    // (1 − i·H') ψ: real += dg·im − a·offI ; imag += −dg·re + a·offR
    rr[i] = re[i] + dg * im[i] - a * offI; ri[i] = im[i] - dg * re[i] + a * offR;
  }
  // solve (1 + iH') ψ⁺ = r with complex Thomas: diagonal 1 + i·dg, off-diagonal −i·a
  const cr = new Float64Array(n), ci = new Float64Array(n), yr = new Float64Array(n), yi = new Float64Array(n);
  const cdiv = (ar, ai, br, bi) => { const q = br * br + bi * bi; return [(ar * br + ai * bi) / q, (ai * br - ar * bi) / q]; };
  let [mr, mi] = [1, 2 * a + bv(0)];
  [cr[0], ci[0]] = cdiv(0, -a, mr, mi); [yr[0], yi[0]] = cdiv(rr[0], ri[0], mr, mi);
  for (let i = 1; i < n; i++) {
    // m = diag − off·c[i−1], off = −i·a  ⇒ off·c = (a·ci[i−1]) + i(−a·cr[i−1])
    mr = 1 - a * ci[i - 1]; mi = 2 * a + bv(i) + a * cr[i - 1];
    if (i < n - 1) [cr[i], ci[i]] = cdiv(0, -a, mr, mi);
    const tr = rr[i] - a * yi[i - 1], ti = ri[i] + a * yr[i - 1]; // r − off·y[i−1]
    [yr[i], yi[i]] = cdiv(tr, ti, mr, mi);
  }
  for (let i = n - 2; i >= 0; i--) { const pr = cr[i] * yr[i + 1] - ci[i] * yi[i + 1], pi = cr[i] * yi[i + 1] + ci[i] * yr[i + 1]; yr[i] -= pr; yi[i] -= pi; }
  re.set(yr); im.set(yi);
}
