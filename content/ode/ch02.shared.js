// Shared helpers for ODE chapter 2 (plain functions, no imports).

/** One RK4 step of y' = F(t, y) for a vector state (array). */
export function rk4Step(F, t, y, h) {
  const n = y.length, add = (a, b, c) => a.map((q, i) => q + c * b[i]);
  const k1 = F(t, y), k2 = F(t + h / 2, add(y, k1, h / 2)), k3 = F(t + h / 2, add(y, k2, h / 2)), k4 = F(t + h, add(y, k3, h));
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return out;
}
/** Integrate y' = F(t, y) from t0 to t1 (either direction) with n RK4 steps. → [[t, y], …] */
export function flow(F, t0, y0, t1, n = 200) {
  const h = (t1 - t0) / n, out = [[t0, y0]];
  let y = y0;
  for (let i = 0; i < n; i++) { y = rk4Step(F, t0 + i * h, y, h); out.push([t0 + (i + 1) * h, y]); }
  return out;
}
/** End state only. */
export function flowEnd(F, t0, y0, t1, n = 200) {
  const h = (t1 - t0) / n; let y = y0;
  for (let i = 0; i < n; i++) y = rk4Step(F, t0 + i * h, y, h);
  return y;
}
/** Scalar RK4 solution of x' = f(t, x): returns [[t, x], …]; stops (and sets .escape) if |x| exceeds cap. */
export function scalarFlow(f, t0, x0, t1, n = 400, cap = 1e6) {
  const h = (t1 - t0) / n, out = [[t0, x0]];
  let t = t0, x = x0;
  for (let i = 0; i < n; i++) {
    const k1 = f(t, x), k2 = f(t + h / 2, x + (h / 2) * k1), k3 = f(t + h / 2, x + (h / 2) * k2), k4 = f(t + h, x + h * k3);
    const xn = x + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if (!isFinite(xn) || Math.abs(xn) > cap) { out.escape = t + h; break; }
    t += h; x = xn; out.push([t, x]);
  }
  return out;
}
/** Cumulative trapezoid integral of the samples g[i] on a uniform grid with spacing h, starting from c0. */
export function cumInt(g, h, c0 = 0) {
  const out = new Array(g.length); out[0] = c0;
  for (let i = 1; i < g.length; i++) out[i] = out[i - 1] + (h / 2) * (g[i] + g[i - 1]);
  return out;
}
/** Natural cubic spline through (xs[i], ys[i]) (xs increasing) → function. */
export function spline(xs, ys) {
  const n = xs.length - 1, h = [], al = [], l = [1], mu = [0], z = [0], c = new Array(n + 1).fill(0), b = [], d = [];
  for (let i = 0; i < n; i++) h[i] = xs[i + 1] - xs[i];
  for (let i = 1; i < n; i++) al[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
  for (let i = 1; i < n; i++) { l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (al[i] - h[i - 1] * z[i - 1]) / l[i]; }
  for (let j = n - 1; j >= 0; j--) { c[j] = z[j] - mu[j] * c[j + 1]; b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3; d[j] = (c[j + 1] - c[j]) / (3 * h[j]); }
  return (x) => {
    let j = n - 1; for (let i = 0; i < n; i++) if (x < xs[i + 1]) { j = i; break; }
    const u = x - xs[j]; return ys[j] + u * (b[j] + u * (c[j] + u * d[j]));
  };
}
/** a + i·(b−a)/(n−1), i = 0..n−1 */
export function grid(a, b, n) { const o = []; for (let i = 0; i < n; i++) o.push(a + ((b - a) * i) / (n - 1)); return o; }
/** Linear interpolation in a trajectory [[t, …], …] on its first coordinate; returns the state interpolated (array or number). */
export function sampleAt(pts, t) {
  const n = pts.length; let a = 0, b = n - 1;
  const inc = pts[n - 1][0] >= pts[0][0];
  while (b - a > 1) { const m = (a + b) >> 1; if ((pts[m][0] - t) * (inc ? 1 : -1) <= 0) a = m; else b = m; }
  const [ta, ya] = pts[a], [tb, yb] = pts[b], w = tb === ta ? 0 : (t - ta) / (tb - ta);
  return Array.isArray(ya) ? ya.map((q, i) => q + w * (yb[i] - q)) : ya + w * (yb - ya);
}
/** Planar test systems with analytic Jacobians. F(t, [x, y]) → [x', y']; J(x, y) → [[a, b], [c, d]]. */
export const PLANAR = {
  pend: {
    label: 'damped pendulum', F: (t, [x, y]) => [y, -Math.sin(x) - 0.25 * y], J: (x, y) => [[0, 1], [-Math.cos(x), -0.25]],
    view: [[-4.2, 4.2], [-3.2, 3.2]], start: [1.2, 0.4], tex: String.raw`\dot\theta=\omega,\ \dot\omega=-\sin\theta-0.25\,\omega`,
  },
  vdp: {
    label: 'Van der Pol', F: (t, [x, y]) => [y, 1.0 * (1 - x * x) * y - x], J: (x, y) => [[0, 1], [-2 * x * y - 1, 1 - x * x]],
    view: [[-3.4, 3.4], [-4, 4]], start: [0.6, 0.3], tex: String.raw`\ddot x=(1-x^2)\dot x-x`,
  },
  lv: {
    label: 'Lotka–Volterra', F: (t, [x, y]) => [x * (1 - y), y * (x - 1)], J: (x, y) => [[1 - y, -x], [y, x - 1]],
    view: [[-0.2, 3.6], [-0.2, 3.6]], start: [1.6, 1.0], tex: String.raw`\dot x=x(1-y),\ \dot y=y(x-1)`,
  },
};
/** Operator (spectral) norm of a 2×2 matrix. */
export function norm2(A) {
  const [[a, b], [c, d]] = A, s = a * a + b * b + c * c + d * d, det = a * d - b * c;
  const disc = Math.sqrt(Math.max(0, s * s - 4 * det * det));
  return Math.sqrt((s + disc) / 2);
}
