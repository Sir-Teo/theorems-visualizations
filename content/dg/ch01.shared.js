// Differential Geometry — Chapter 1: helpers shared by ch01.js and ch01-b.js.

export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** Simpson's rule for f on [a, b] with n (even) panels. */
export function simpson(f, a, b, n = 200) {
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/**
 * Local differential geometry of a parametrized plane curve r(t) → [x, y], by central differences:
 * {p, d1, d2, speed, T, N (= T rotated +90°), kappa (signed, = (x′y″ − y′x″)/|r′|³)}.
 */
export function frame(r, t, h = 1e-3) {
  const p = r(t), a = r(t + h), b = r(t - h);
  const d1 = [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)];
  const d2 = [(a[0] - 2 * p[0] + b[0]) / (h * h), (a[1] - 2 * p[1] + b[1]) / (h * h)];
  const speed = Math.hypot(d1[0], d1[1]) || 1e-300;
  const T = [d1[0] / speed, d1[1] / speed];
  return { p, d1, d2, speed, T, N: [-T[1], T[0]], kappa: (d1[0] * d2[1] - d1[1] * d2[0]) / (speed * speed * speed) };
}

/** Table of a curve: parameters, points and cumulative chord length (n panels). */
export function arcTable(r, t0, t1, n = 2000) {
  const t = [], pts = [], s = [0];
  for (let i = 0; i <= n; i++) { const ti = t0 + ((t1 - t0) * i) / n; t.push(ti); pts.push(r(ti)); }
  for (let i = 1; i <= n; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { t, pts, s, L: s[n], n };
}
/** Parameter at arc length s (linear interpolation in the table; clamped). */
export function tOfS(tab, s) {
  if (s <= 0) return tab.t[0];
  if (s >= tab.L) return tab.t[tab.n];
  let lo = 0, hi = tab.n;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab.s[m] <= s) lo = m; else hi = m; }
  const w = (s - tab.s[lo]) / (tab.s[hi] - tab.s[lo] || 1);
  return tab.t[lo] + w * (tab.t[hi] - tab.t[lo]);
}
/** Arc length at parameter t (linear interpolation in the table). */
export function sOfT(tab, t) {
  const u = ((t - tab.t[0]) / (tab.t[tab.n] - tab.t[0])) * tab.n;
  const i = clamp(Math.floor(u), 0, tab.n - 1), w = u - i;
  return tab.s[i] + w * (tab.s[i + 1] - tab.s[i]);
}
/** Parameter of the sample of `tab` nearest to (x, y), refined by a local golden search on r. */
export function nearestT(tab, r, x, y) {
  let best = 0, bd = Infinity;
  for (let i = 0; i <= tab.n; i++) { const d = (tab.pts[i][0] - x) ** 2 + (tab.pts[i][1] - y) ** 2; if (d < bd) { bd = d; best = i; } }
  let a = tab.t[Math.max(0, best - 1)], b = tab.t[Math.min(tab.n, best + 1)];
  const g = (t) => { const q = r(t); return (q[0] - x) ** 2 + (q[1] - y) ** 2; };
  for (let k = 0; k < 40; k++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (g(m1) < g(m2)) b = m2; else a = m1; }
  return (a + b) / 2;
}

/** Circle through three points: {c: [x, y], R} (null when they are collinear). */
export function circum(p, q, r) {
  const ax = p[0], ay = p[1], bx = q[0], by = q[1], cx = r[0], cy = r[1];
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-14) return null;
  const a2 = ax * ax + ay * ay, b2 = bx * bx + by * by, c2 = cx * cx + cy * cy;
  const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d, uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d;
  return { c: [ux, uy], R: Math.hypot(ax - ux, ay - uy) };
}

/** Points of a circular arc (centre, radius, angles in radians). */
export function arcPts(cx, cy, r, a0, a1, n = 48) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = a0 + ((a1 - a0) * i) / n; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
  return out;
}

/** The ellipse (a cos t, b sin t): point, signed curvature and centre of curvature (exact formulas). */
export const ell = {
  p: (a, b, t) => [a * Math.cos(t), b * Math.sin(t)],
  kappa: (a, b, t) => (a * b) / Math.pow(a * a * Math.sin(t) ** 2 + b * b * Math.cos(t) ** 2, 1.5),
  // inward unit normal (the left normal of the counter-clockwise tangent)
  N: (a, b, t) => { const nx = -b * Math.cos(t), ny = -a * Math.sin(t), m = Math.hypot(nx, ny); return [nx / m, ny / m]; },
  centre: (a, b, t) => [((a * a - b * b) / a) * Math.cos(t) ** 3, -((a * a - b * b) / b) * Math.sin(t) ** 3],
};

/** Euler-spiral (Fresnel-type) integrals ∫₀ˢ cos(a u²/2) du and ∫₀ˢ sin(a u²/2) du. */
export function clothoid(a, s) {
  const n = Math.max(40, 2 * Math.ceil(Math.abs(s) * 14 * Math.sqrt(1 + Math.abs(a)))) ;
  return [simpson((u) => Math.cos((a * u * u) / 2), 0, s, n), simpson((u) => Math.sin((a * u * u) / 2), 0, s, n)];
}

/** Fixed-step RK4 for dY/dt = F(t, Y) with Y an array; returns the list of states at t0, t0+h, …. */
export function rk4(F, t0, y0, h, n) {
  const out = [y0.slice()]; let y = y0.slice(), t = t0;
  const add = (a, b, k) => a.map((v, i) => v + k * b[i]);
  for (let i = 0; i < n; i++) {
    const k1 = F(t, y), k2 = F(t + h / 2, add(y, k1, h / 2)), k3 = F(t + h / 2, add(y, k2, h / 2)), k4 = F(t + h, add(y, k3, h));
    y = y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); t += h; out.push(y.slice());
  }
  return out;
}

/** Catmull–Rom interpolation through (xs[i], ys[i]) evaluated at x (clamped to the end values). */
export function catmull(xs, ys, x) {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
  const p0 = ys[Math.max(0, i - 1)], p1 = ys[i], p2 = ys[i + 1], p3 = ys[Math.min(n - 1, i + 2)];
  const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h;
  const m1 = ((p2 - p0) / (xs[i + 1] - xs[Math.max(0, i - 1)] || 1)) * h;
  const m2 = ((p3 - p1) / (xs[Math.min(n - 1, i + 2)] - xs[i] || 1)) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
}

/** Zero crossings of a sampled function (linear interpolation): list of x. */
export function zeros(xs, ys) {
  const out = [];
  for (let i = 1; i < xs.length; i++) if (ys[i - 1] * ys[i] < 0) out.push(xs[i - 1] + (xs[i] - xs[i - 1]) * (ys[i - 1] / (ys[i - 1] - ys[i])));
  return out;
}
