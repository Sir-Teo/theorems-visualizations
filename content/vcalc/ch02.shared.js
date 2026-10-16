// Vector Calculus — Chapter 2: helpers shared by ch02.js and ch02-b.js
export * from './ch01.shared.js';

// ---------- landscapes in "world" coordinates (|x|,|y| <= 1.3, |z| <= ~1) ----------
const G = (x, y, cx, cy, w) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / w);
/** Two hills and a pit: the default landscape (peaks near (.45,.3) and (-.6,-.4); a saddle between them). */
export const hills = (x, y) => 0.95 * G(x, y, 0.45, 0.3, 0.35) + 0.65 * G(x, y, -0.6, -0.4, 0.3) - 0.4 * G(x, y, -0.2, 0.75, 0.25);

// ---------- numerical derivatives (4th-order stencils) ----------
const d1 = (g, t, h) => (-g(t + 2 * h) + 8 * g(t + h) - 8 * g(t - h) + g(t - 2 * h)) / (12 * h);
const d2 = (g, t, h) => (-g(t + 2 * h) + 16 * g(t + h) - 30 * g(t) + 16 * g(t - h) - g(t - 2 * h)) / (12 * h * h);
/** Gradient of f at (x, y). */
export const grad2 = (f, x, y, h = 0.01) => [d1((s) => f(s, y), x, h), d1((s) => f(x, s), y, h)];
/** Hessian [[fxx, fxy], [fxy, fyy]] of f at (x, y). */
export function hess2(f, x, y, h = 0.02) {
  const fxx = d2((s) => f(s, y), x, h), fyy = d2((s) => f(x, s), y, h);
  const fxy = d1((t) => d1((s) => f(s, t), x, h), y, h);
  return [[fxx, fxy], [fxy, fyy]];
}
/** Eigen-decomposition of a symmetric 2x2: {l1 >= l2, e1, e2 (unit)}. */
export function eig2(H) {
  const a = H[0][0], b = H[0][1], c = H[1][1], m = (a + c) / 2, r = Math.hypot((a - c) / 2, b);
  const l1 = m + r, l2 = m - r;
  const th = 0.5 * Math.atan2(2 * b, a - c);
  return { l1, l2, e1: [Math.cos(th), Math.sin(th)], e2: [-Math.sin(th), Math.cos(th)] };
}

// ---------- 3D surface z = f(x, y) in a scene3 ----------
/**
 * Shaded graph of f over [x0,x1]x[y0,y1] in an n x n mesh. st: {fill (name), colorFn(x,y,z)→name, a0, a1 (alpha range),
 * wire (alpha of mesh lines, 0 = none), zmax (clamp), lift}.
 */
export function surf3(sc, f, [x0, x1], [y0, y1], n, st = {}) {
  const zm = st.zmax ?? 1.6, Z = (x, y) => Math.max(-zm, Math.min(zm, f(x, y))) + (st.lift || 0);
  const X = [], Y = [], V = [];
  for (let i = 0; i <= n; i++) { X.push(x0 + ((x1 - x0) * i) / n); Y.push(y0 + ((y1 - y0) * i) / n); }
  for (let i = 0; i <= n; i++) { V.push([]); for (let j = 0; j <= n; j++) { const z = Z(X[i], Y[j]); V[i].push(isFinite(z) ? z : NaN); } }
  const dx = (x1 - x0) / n, dy = (y1 - y0) / n, a0 = st.a0 ?? 0.07, a1 = st.a1 ?? 0.32;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const z00 = V[i][j], z10 = V[i + 1][j], z01 = V[i][j + 1], z11 = V[i + 1][j + 1];
    if (!(isFinite(z00) && isFinite(z10) && isFinite(z01) && isFinite(z11))) continue;
    const fx = (z10 + z11 - z00 - z01) / (2 * dx), fy = (z01 + z11 - z00 - z10) / (2 * dy);
    const nn = Math.hypot(fx, fy, 1), lam = Math.max(0, (0.35 * fx + 0.45 * fy + 0.8) / nn / 1.0);
    const xc = (X[i] + X[i + 1]) / 2, yc = (Y[j] + Y[j + 1]) / 2, zc = (z00 + z11) / 2;
    sc.poly([[X[i], Y[j], z00], [X[i + 1], Y[j], z10], [X[i + 1], Y[j + 1], z11], [X[i], Y[j + 1], z01]],
      { fill: st.colorFn ? st.colorFn(xc, yc, zc) : st.fill || 'accent', fillAlpha: a0 + a1 * Math.min(1, lam), edge: false, bias: st.bias });
  }
  const wa = st.wire ?? 0.28;
  if (wa > 0) {
    const col = st.wireColor || st.fill || 'accent', step = st.wireEvery || Math.max(1, Math.round(n / 14));
    for (let i = 0; i <= n; i += step) for (let j = 0; j < n; j++) {
      if (isFinite(V[i][j]) && isFinite(V[i][j + 1])) sc.line([X[i], Y[j], V[i][j]], [X[i], Y[j + 1], V[i][j + 1]], { color: col, width: 0.8, alpha: wa, bias: st.bias }, 1);
      if (isFinite(V[j][i]) && isFinite(V[j + 1][i])) sc.line([X[j], Y[i], V[j][i]], [X[j + 1], Y[i], V[j + 1][i]], { color: col, width: 0.8, alpha: wa, bias: st.bias }, 1);
    }
  }
}
/** Curve over a list of planar points lying on the graph of f (slightly lifted so that it stays visible). */
export function onSurf(sc, f, pts, st = {}) {
  sc.path(pts.map(([x, y]) => [x, y, f(x, y) + (st.lift ?? 0.012)]), { width: 2.2, ...st, n: 1 });
}
/** Planar polyline samples (x(t), y(t)) for t in [t0, t1]. */
export const trail = (c, t0, t1, n = 60) => Array.from({ length: n + 1 }, (_, i) => c(t0 + ((t1 - t0) * i) / n));

// ---------- level sets ----------
/** Marching squares: segments [[x,y],[x,y]] of {f = c} over the rectangle, in an n x n grid. */
export function levelSegs(f, [x0, x1], [y0, y1], c, n = 70) {
  const dx = (x1 - x0) / n, dy = (y1 - y0) / n, F = [], out = [];
  for (let j = 0; j <= n; j++) { F.push([]); for (let i = 0; i <= n; i++) F[j].push(f(x0 + i * dx, y0 + j * dy) - c); }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = F[j][i], b = F[j][i + 1], d = F[j + 1][i], e = F[j + 1][i + 1];
    if (![a, b, d, e].every(isFinite)) continue;
    const X = x0 + i * dx, Y = y0 + j * dy, pts = [];
    if (a * b < 0) pts.push([X + (dx * a) / (a - b), Y]);
    if (b * e < 0) pts.push([X + dx, Y + (dy * b) / (b - e)]);
    if (d * e < 0) pts.push([X + (dx * d) / (d - e), Y + dy]);
    if (a * d < 0) pts.push([X, Y + (dy * a) / (a - d)]);
    if (pts.length === 2) out.push(pts);
    else if (pts.length === 4) out.push([pts[0], pts[1]], [pts[2], pts[3]]);
  }
  return out;
}
/** Total length of a list of segments. */
export const segLen = (segs) => segs.reduce((s, [p, q]) => s + Math.hypot(q[0] - p[0], q[1] - p[1]), 0);

// ---------- misc ----------
export const DEG = Math.PI / 180, TAU = 2 * Math.PI;
/** Bisection on [a, b] for a sign change of g. */
export function bisect(g, a, b, it = 60) {
  let ga = g(a);
  for (let k = 0; k < it; k++) { const m = (a + b) / 2, gm = g(m); if (gm * ga <= 0) b = m; else { a = m; ga = gm; } }
  return (a + b) / 2;
}
/** Newton iteration for a critical point of f from (x, y); null if it does not converge. */
export function critNewton(f, x, y, it = 40) {
  for (let k = 0; k < it; k++) {
    const g = grad2(f, x, y), H = hess2(f, x, y), det = H[0][0] * H[1][1] - H[0][1] * H[0][1];
    if (Math.abs(det) < 1e-9) return null;
    const dx = (H[1][1] * g[0] - H[0][1] * g[1]) / det, dy = (-H[0][1] * g[0] + H[0][0] * g[1]) / det;
    x -= dx; y -= dy;
    if (Math.hypot(dx, dy) < 1e-11) return [x, y];
    if (Math.abs(x) > 6 || Math.abs(y) > 6) return null;
  }
  return null;
}
/** Hermitian-free name for the type of a critical point from its Hessian. */
export function classify(H, tol = 1e-3) {
  const { l1, l2 } = eig2(H);
  if (l1 > tol && l2 > tol) return 'min';
  if (l1 < -tol && l2 < -tol) return 'max';
  if (l1 > tol && l2 < -tol) return 'saddle';
  return 'degenerate';
}
