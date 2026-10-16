// Partial Differential Equations — Chapter 3 shared helpers (the diffusion equation). Plain named exports, imported by
// ch03.js, ch03-b.js and ch03-c.js. Re-exports the chapter-2 helpers (gaussSum, fold, extend, thomas, ...).
export * from './ch02.shared.js';
import { thomas } from './ch02.shared.js';

/** Error function to about 1e-15 (Taylor series for |x| < 3, continued fraction for erfc beyond). */
export function erf(x) {
  const a = Math.abs(x);
  if (a < 3) {
    let term = a, sum = a;
    for (let n = 1; n < 80; n++) { term *= -(a * a) / n; const d = term / (2 * n + 1); sum += d; if (Math.abs(d) < 1e-17 * Math.abs(sum)) break; }
    return Math.sign(x) * (2 / Math.sqrt(Math.PI)) * sum;
  }
  return Math.sign(x) * (1 - erfcPos(a));
}

/** erfc(z) for z >= 3 by Lentz's continued fraction (relative accuracy ~1e-15, no underflow until z ~ 26). */
function erfcPos(z) {
  let f = 0;
  for (let n = 60; n >= 1; n--) f = (n / 2) / (z + f);
  return Math.exp(-z * z) / (Math.sqrt(Math.PI) * (z + f));
}

/** log of erfc(z) for any real z, valid far beyond double underflow (z up to 1e6). */
export function logErfc(z) {
  if (z < 3) return Math.log(Math.max(1e-300, 1 - erf(z)));
  if (z < 26) return Math.log(erfcPos(z));
  // asymptotic series: erfc z = e^{-z²} / (z√π) · (1 − 1/(2z²) + 3/(4z⁴) − 15/(8z⁶))
  const z2 = z * z;
  return -z2 - Math.log(z * Math.sqrt(Math.PI)) + Math.log(1 - 1 / (2 * z2) + 3 / (4 * z2 * z2) - 15 / (8 * z2 * z2 * z2));
}

/** The heat kernel G(x, t) = (4πkt)^{-1/2} exp(-x²/(4kt)). */
export function G(x, t, k = 1) { return Math.exp(-(x * x) / (4 * k * t)) / Math.sqrt(4 * Math.PI * k * t); }

/** log10 of u(x,t) = ½[erf((x+a)/(2√kt)) − erf((x−a)/(2√kt))]: the solution from the indicator of [−a, a], valid down to 10^{-10^5}. */
export function log10Box(x, t, a, k = 1) {
  const s = 2 * Math.sqrt(k * t), x0 = Math.abs(x);
  const z1 = (x0 - a) / s, z2 = (x0 + a) / s;       // u = ½[erfc(z1) − erfc(z2)], z1 < z2
  if (z1 < 2) return Math.log10(Math.max(1e-300, 0.5 * (erf(z2) - erf(z1))));
  const l1 = logErfc(z1), l2 = logErfc(z2);          // erfc(z2) ≪ erfc(z1)
  return (l1 + Math.log(1 - Math.exp(l2 - l1)) - Math.LN2) / Math.LN10;
}

/** Exact solution on the line for piecewise-constant data f_j on cells [x_j − h/2, x_j + h/2]: u(x,t) = Σ f_j ½[erf((x−a_j)/(2√kt)) − erf((x−b_j)/(2√kt))]. */
export function convolveCells(f, xs, x, t, k = 1) {
  const n = xs.length, h = xs[1] - xs[0], s = 2 * Math.sqrt(k * t);
  let sum = 0, prev = erf((x - (xs[0] - h / 2)) / s);
  for (let j = 0; j < n; j++) {
    const cur = erf((x - (xs[j] + h / 2)) / s);
    sum += f[j] * 0.5 * (prev - cur); prev = cur;
  }
  return sum;
}

/** Same but with the data interpolated linearly between samples (midpoint quadrature of G * f on a refined grid). */
export function convolveQuad(fun, a, b, x, t, k = 1, n = 600) {
  const h = (b - a) / n; let s = 0;
  for (let j = 0; j < n; j++) { const y = a + (j + 0.5) * h; s += G(x - y, t, k) * fun(y); }
  return s * h;
}

/**
 * Finite-difference heat solver for u_t = k u_xx + F(x, t) on [x0, x1] with N cells. Each end is 'D' (u = gl(t) / gr(t)) or
 * 'N' (u_x = 0, by a ghost node). theta = 1 is backward Euler (unconditionally monotone), theta = 1/2 Crank–Nicolson.
 */
export function makeHeat(N, x0, x1, k, bc = {}) {
  const h = (x1 - x0) / N, x = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) x[i] = x0 + i * h;
  const L = bc.l || 'D', R = bc.r || 'D', gl = bc.gl || (() => 0), gr = bc.gr || (() => 0), th = bc.theta || 1;
  const H = { N, h, x, u: new Float64Array(N + 1), t: 0, k };
  H.step = (dt, F) => {
    const u = H.u, lo = new Float64Array(N + 1), di = new Float64Array(N + 1), up = new Float64Array(N + 1), rhs = new Float64Array(N + 1);
    const r = (k * dt) / (h * h), t1 = H.t + dt;
    const lap = (i) => {
      const um = i > 0 ? u[i - 1] : u[1], upv = i < N ? u[i + 1] : u[N - 1];
      return um - 2 * u[i] + upv;
    };
    for (let i = 0; i <= N; i++) {
      const f = F ? th * F(x[i], t1) + (1 - th) * F(x[i], H.t) : 0;
      rhs[i] = u[i] + (1 - th) * r * lap(i) + dt * f;
      lo[i] = -th * r; di[i] = 1 + 2 * th * r; up[i] = -th * r;
    }
    if (L === 'D') { di[0] = 1; up[0] = 0; rhs[0] = gl(t1); } else { up[0] = -2 * th * r; }
    if (R === 'D') { di[N] = 1; lo[N] = 0; rhs[N] = gr(t1); } else { lo[N] = -2 * th * r; }
    H.u = thomas(lo, di, up, rhs); H.t = t1;
    return H;
  };
  H.advance = (T, dt, F) => { const n = Math.max(1, Math.ceil((T - H.t) / dt - 1e-9)), d = (T - H.t) / n; for (let i = 0; i < n; i++) H.step(d, F); return H; };
  H.at = (xx) => { const q = (xx - x0) / h, i = Math.max(0, Math.min(N - 1, Math.floor(q))), r = q - i; return H.u[i] * (1 - r) + H.u[i + 1] * r; };
  H.mass = () => { let s = 0; for (let i = 0; i <= N; i++) s += H.u[i] * h * (i === 0 || i === N ? 0.5 : 1); return s; };
  return H;
}

/** Sine coefficients b_n = 2 ∫_0^1 f(x) sin(nπx) dx, n = 1..K (midpoint rule with nq cells). */
export function sineCoeffs(f, K, nq = 1200) {
  const b = new Float64Array(K), h = 1 / nq, fv = new Float64Array(nq);
  for (let j = 0; j < nq; j++) fv[j] = f((j + 0.5) * h);
  for (let n = 1; n <= K; n++) { let s = 0; for (let j = 0; j < nq; j++) s += fv[j] * Math.sin(n * Math.PI * (j + 0.5) * h); b[n - 1] = 2 * s * h; }
  return b;
}

/** Cosine coefficients a_0 = ∫_0^1 f, a_n = 2∫_0^1 f cos(nπx) (n = 1..K); returned as an array indexed from 0. */
export function cosineCoeffs(f, K, nq = 1200) {
  const a = new Float64Array(K + 1), h = 1 / nq, fv = new Float64Array(nq);
  for (let j = 0; j < nq; j++) fv[j] = f((j + 0.5) * h);
  for (let n = 0; n <= K; n++) { let s = 0; for (let j = 0; j < nq; j++) s += fv[j] * Math.cos(n * Math.PI * (j + 0.5) * h); a[n] = (n === 0 ? 1 : 2) * s * h; }
  return a;
}

/** Gauss–Legendre nodes and weights on [−1, 1] (Newton on P_n). */
export function gaussLegendre(n) {
  const xs = new Float64Array(n), ws = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5)), pp = 1;
    for (let it = 0; it < 100; it++) {
      let p1 = 1, p2 = 0;
      for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; }
      pp = (n * (z * p1 - p2)) / (z * z - 1);
      const dz = p1 / pp; z -= dz; if (Math.abs(dz) < 1e-15) break;
    }
    xs[i] = z; ws[i] = 2 / ((1 - z * z) * pp * pp);
  }
  return { xs, ws };
}

/** Piecewise-linear interpolation through (px[i], py[i]) (px increasing), constant beyond the ends. */
export function pwl(px, py) {
  return (x) => {
    if (x <= px[0]) return py[0];
    for (let i = 1; i < px.length; i++) if (x <= px[i]) { const r = (x - px[i - 1]) / (px[i] - px[i - 1]); return py[i - 1] * (1 - r) + py[i] * r; }
    return py[py.length - 1];
  };
}

/** Smooth monotone interpolation through handle values (Catmull–Rom spline, clamped ends) on increasing abscissae. */
export function spline(px, py) {
  const n = px.length;
  return (x) => {
    if (x <= px[0]) return py[0];
    if (x >= px[n - 1]) return py[n - 1];
    let i = 1; while (x > px[i]) i++;
    const x0 = px[i - 1], x1 = px[i], h = x1 - x0, s = (x - x0) / h;
    const m0 = i > 1 ? (py[i] - py[i - 2]) / (px[i] - px[i - 2]) : (py[1] - py[0]) / h;
    const m1 = i < n - 1 ? (py[i + 1] - py[i - 1]) / (px[i + 1] - px[i - 1]) : (py[n - 1] - py[n - 2]) / h;
    const s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * py[i - 1] + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * py[i] + (s3 - s2) * h * m1;
  };
}
