// Mathematical Biology, chapter 3 — helpers shared by ch03.js … ch03-d.js (plain functions only).
export * from './ch02.shared.js';

/** Classical RK4 for a planar or n-dimensional system y' = F(t, y); returns {ts, ys} with n+1 samples (ys[i] = state array). */
export function rk4sys(F, y0, T, n, floor = null) {
  const h = T / n, ts = [0], ys = [y0.slice()];
  let y = y0.slice();
  const add = (a, b, c) => a.map((v, i) => v + c * b[i]);
  for (let i = 0; i < n; i++) {
    const t = i * h;
    const k1 = F(t, y), k2 = F(t + h / 2, add(y, k1, h / 2)), k3 = F(t + h / 2, add(y, k2, h / 2)), k4 = F(t + h, add(y, k3, h));
    y = y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    if (floor != null) y = y.map((v) => Math.max(v, floor));
    if (!y.every(isFinite)) break;
    ts.push((i + 1) * h); ys.push(y);
  }
  return { ts, ys };
}

/** Times (linearly interpolated) at which the sampled series vs crosses `level` upward (dir = 1) or downward (dir = -1). */
export function crossings(ts, vs, level, dir = 1) {
  const out = [];
  for (let i = 1; i < vs.length; i++) {
    const a = vs[i - 1] - level, b = vs[i] - level;
    if ((dir > 0 && a < 0 && b >= 0) || (dir < 0 && a > 0 && b <= 0)) out.push(ts[i - 1] + (ts[i] - ts[i - 1]) * a / (a - b));
  }
  return out;
}

/** Running time average (1/t)∫_0^t v dt of a sampled series (trapezoid rule); returns [[t, mean], …]. */
export function runMean(ts, vs) {
  const out = [[ts[0], vs[0]]]; let I = 0;
  for (let i = 1; i < ts.length; i++) { I += 0.5 * (vs[i] + vs[i - 1]) * (ts[i] - ts[i - 1]); out.push([ts[i], I / ts[i]]); }
  return out;
}

/** Times of local maxima of a sampled series (parabolic refinement). */
export function peakTimes(ts, vs) {
  const out = [];
  for (let i = 1; i < vs.length - 1; i++) if (vs[i] > vs[i - 1] && vs[i] >= vs[i + 1]) {
    const a = vs[i - 1], b = vs[i], c = vs[i + 1], d = a - 2 * b + c;
    out.push(ts[i] + (d !== 0 ? 0.5 * (a - c) / d : 0) * (ts[1] - ts[0]));
  }
  return out;
}

/** Scaled Lotka–Volterra field x' = x(a - y), y' = y(x - g)  (beta = delta = 1; equilibrium (g, a)). */
export const lvField = (a, g) => (t, s) => [s[0] * (a - s[1]), s[1] * (s[0] - g)];

/** Conserved quantity of the scaled Lotka–Volterra system. */
export const lvV = (a, g, x, y) => x - g * Math.log(x) + y - a * Math.log(y);

/** Rosenzweig–MacArthur field in scaled form: x' = x(1-x/K) - x y/(1+x),  y' = y(x/(1+x) - m);  m = xs/(1+xs) puts the coexistence point at x* = xs. */
export const rmField = (K, xs) => { const m = xs / (1 + xs); return (t, s) => [s[0] * (1 - s[0] / K) - s[0] * s[1] / (1 + s[0]), s[1] * (s[0] / (1 + s[0]) - m)]; };
export const rmEq = (K, xs) => [xs, (1 - xs / K) * (1 + xs)];

/** Min and max of component k of a long simulation after a transient (limit-cycle envelope). */
export function envelope(F, y0, Ttrans, Tmeas, dt, k = 0, floor = 1e-12) {
  let s = rk4sys(F, y0, Ttrans, Math.round(Ttrans / dt), floor);
  const last = s.ys[s.ys.length - 1];
  s = rk4sys(F, last, Tmeas, Math.round(Tmeas / dt), floor);
  let lo = Infinity, hi = -Infinity;
  for (const y of s.ys) { lo = Math.min(lo, y[k]); hi = Math.max(hi, y[k]); }
  return [lo, hi];
}

/** Eigenvalues of a real 2x2 matrix [[a,b],[c,d]] as [{re, im}, {re, im}]. */
export function eig2x2(a, b, c, d) {
  const tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
  return disc >= 0 ? [{ re: tr / 2 + Math.sqrt(disc), im: 0 }, { re: tr / 2 - Math.sqrt(disc), im: 0 }] : [{ re: tr / 2, im: Math.sqrt(-disc) }, { re: tr / 2, im: -Math.sqrt(-disc) }];
}

/** Mean of the series vs over the whole cycles lying between the first and last upward crossing of xs through `level`. */
export function cycleMean(ts, vs, xs, level) {
  const c = crossings(ts, xs, level, 1);
  if (c.length < 2) return null;
  const t0 = c[0], t1 = c[c.length - 1];
  const val = (i, t) => vs[i - 1] + (vs[i] - vs[i - 1]) * (t - ts[i - 1]) / (ts[i] - ts[i - 1]);
  let I = 0;
  for (let i = 1; i < ts.length; i++) {
    const a = Math.max(ts[i - 1], t0), b = Math.min(ts[i], t1);
    if (b > a) I += 0.5 * (val(i, a) + val(i, b)) * (b - a);
  }
  return { mean: I / (t1 - t0), period: (t1 - t0) / (c.length - 1), t0, t1 };
}

/** Period of the scaled Lotka–Volterra orbit through (g + s, a) (x' = x(a - y), y' = y(x - g)); NaN if not found within Tmax. */
export function lvOrbitPeriod(a, g, s, Tmax = 400, dt = 0.01) {
  const sol = rk4sys(lvField(a, g), [g + s, a], Tmax, Math.round(Tmax / dt), 1e-12);
  const c = crossings(sol.ts, sol.ys.map((p) => p[1]), a, 1);
  return c.length ? c[0] : NaN;
}

/** Positive offset s on y=a with the same invariant as an arbitrary positive LV state. */
export function lvSectionOffset(a, g, x, y) {
  const excess = lvV(a, g, x, y) - lvV(a, g, g, a);
  if (excess <= 1e-13) return 0;
  // At (g+s,a), V-Vmin = s-g*log(1+s/g), strictly increasing for s>0.
  const energy = (s) => s - g * Math.log1p(s / g);
  let hi = Math.max(g, excess); while (energy(hi) < excess) hi *= 2;
  let lo = 0; for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (energy(m) < excess) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
