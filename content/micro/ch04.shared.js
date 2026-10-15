// Microeconomics — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
// House style of the consumer diagrams (same as the curves kit): budget line and set in `accent`, indifference curves in
// `purple`, best bundles in `green`, test bundles in `gold`; good 1 on the horizontal axis, good 2 on the vertical one.

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? (0).toFixed(d) : x.toFixed(d)).replace('-', '−');
export const sgn = (x, d = 2) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;

/** Root of f on [a, b] by bisection; null when f does not change sign (or is not finite at the ends). */
export function bisect(f, a, b, it = 60) {
  let fa = f(a); const fb = f(b);
  if (!(isFinite(fa) && isFinite(fb))) return null;
  if (fa === 0) return a; if (fb === 0) return b;
  if (fa * fb > 0) return null;
  for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}

/**
 * Preference families. Each returns {u(x, y), grad(x, y) → [MU1, MU2], ray, kinks?, tex}:
 *   ray = true when u strictly increases along every ray from the origin, so a level set meets each ray once
 *   (indifference curves can then be traced exactly by bisection along rays); kinks = ray angles of corners.
 */
export function prefs(kind, P = {}) {
  switch (kind) {
    case 'cd': { const a = P.a ?? 0.5; const u = (x, y) => (x <= 0 || y <= 0 ? 0 : x ** a * y ** (1 - a));
      return { u, grad: (x, y) => { const w = u(x, y); return [(a * w) / x, ((1 - a) * w) / y]; }, ray: true }; }
    case 'prod': return { u: (x, y) => Math.max(x, 0) * Math.max(y, 0), grad: (x, y) => [y, x], ray: true };
    case 'subs': { const a = P.a ?? 1, b = P.b ?? 1; return { u: (x, y) => a * x + b * y, grad: () => [a, b], ray: true }; }
    case 'comp': { const a = P.a ?? 1, b = P.b ?? 1;
      return { u: (x, y) => Math.min(a * x, b * y), grad: (x, y) => (a * x < b * y - 1e-12 ? [a, 0] : a * x > b * y + 1e-12 ? [0, b] : [NaN, NaN]), ray: true, kinks: [Math.atan2(a, b)] }; }
    case 'ql': { const a = P.a ?? 2; return { u: (x, y) => a * Math.log(Math.max(x, 1e-12)) + y, grad: (x) => [a / x, 1], ray: true }; }
    case 'ces': { const a = P.a ?? 0.5, r = P.r ?? -1;
      if (Math.abs(r) < 1e-3) return prefs('cd', { a });
      const u = (x, y) => (r < 0 && (x <= 0 || y <= 0) ? 0 : (a * Math.max(x, 0) ** r + (1 - a) * Math.max(y, 0) ** r) ** (1 / r));
      return { u, grad: (x, y) => { const w = u(x, y), k = w ** (1 - r); return [a * k * x ** (r - 1), (1 - a) * k * y ** (r - 1)]; }, ray: true }; }
    case 'concave': return { u: (x, y) => Math.hypot(Math.max(x, 0), Math.max(y, 0)), grad: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; }, ray: true };
    case 'sat': { const bx = P.bx ?? 6, by = P.by ?? 5; return { u: (x, y) => -((x - bx) ** 2 + (y - by) ** 2), grad: (x, y) => [-2 * (x - bx), -2 * (y - by)], ray: false, bliss: [bx, by] }; }
    case 'bad': { const c = P.c ?? 0.1; return { u: (x, y) => x - c * y * y, grad: (x, y) => [1, -2 * c * y], ray: false }; }
    default: throw new Error('unknown preference family ' + kind);
  }
}
/** Numerical gradient (central differences) for a utility without a formula. */
export function numGrad(u, x, y, h = 1e-5) { return [(u(x + h, y) - u(x - h, y)) / (2 * h), (u(x, y + h) - u(x, y - h)) / (2 * h)]; }

/** Radius at which u = L along the ray of angle th (u increasing along rays); null if not reached within rmax. */
export function rayLevel(u, L, th, rmax) {
  const c = Math.cos(th), s = Math.sin(th);
  return bisect((r) => u(r * c, r * s) - L, 1e-9, rmax, 46);
}
/** The point of the level set u = L on the ray through (x, y), or null. */
export function onRay(F, L, x, y, rmax = 60) {
  const th = Math.atan2(Math.max(y, 1e-9), Math.max(x, 1e-9)), r = rayLevel(F.u, L, th, rmax);
  return r == null ? null : [r * Math.cos(th), r * Math.sin(th)];
}
/** Points of the level set u = L in the quadrant, traced ray by ray (kink angles included exactly); null breaks the path. */
export function icurve(F, L, X, Y, n = 220) {
  const R = 4 * Math.hypot(X, Y), ths = [];
  for (let i = 0; i <= n; i++) ths.push((Math.PI / 2) * (i / n));
  if (F.kinks) for (const k of F.kinks) ths.push(k);
  ths.sort((a, b) => a - b);
  const pts = [];
  for (const th of ths) { const r = rayLevel(F.u, L, th, R); pts.push(r == null ? null : [r * Math.cos(th), r * Math.sin(th)]); }
  return pts;
}
/** Draw the indifference curve u = L on stage s (exact ray tracing when possible, marching squares otherwise). */
export function drawLevel(s, F, L, st = {}) {
  const X = s.bounds.x[1], Y = s.bounds.y[1];
  if (F.ray) s.clip(() => s.path(icurve(F, L, X, Y, st.n), st));
  else s.contour(F.u, L, { res: st.res ?? 150, color: st.color, width: st.width, dash: st.dash });
  return s;
}
/** Raster: green where u ≥ L (the weakly preferred set), red where u < L. */
export function shadeSets(v, s, u, L, key, o = {}) {
  const g = v.rgb(o.better || 'green'), r = v.rgb(o.worse || 'red'), ag = 255 * (o.a1 ?? 0.15), ar = 255 * (o.a2 ?? 0.08);
  s.raster((x, y) => (u(x, y) >= L - 1e-12 ? [g[0], g[1], g[2], ag] : ar > 0 ? [r[0], r[1], r[2], ar] : null), { key: `${key}|${L}|${g}|${r}`, res: o.res ?? 2, id: o.id });
}
/** Short tangent segment of slope k (k = ±Infinity for vertical) through (x, y), half-length `px` pixels. */
export function tangent(s, x, y, k, px, st) {
  const sx = s.scale, sy = s.height / (s.bounds.y[1] - s.bounds.y[0]);
  let dx, dy;
  if (!isFinite(k)) { dx = 0; dy = px / sy; } else { const a = Math.atan2(k * sy, sx); dx = (Math.cos(a) * px) / sx; dy = (Math.sin(a) * px) / sy; }
  s.line(x - dx, y - dy, x + dx, y + dy, st);
}
/** Maximise U over a polyline (golden section on each segment; exact for quasi-concave U). */
export function bestOnPath(U, pts) {
  let best = null; const phi = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], P = (t) => [ax + (bx - ax) * t, ay + (by - ay) * t], g = (t) => U(...P(t));
    let a = 0, b = 1, c = b - phi * (b - a), d = a + phi * (b - a), fc = g(c), fd = g(d);
    for (let k = 0; k < 60; k++) { if (fc < fd) { a = c; c = d; fc = fd; d = a + phi * (b - a); fd = g(d); } else { b = d; d = c; fd = fc; c = b - phi * (b - a); fc = g(c); } }
    for (const t of [0, (a + b) / 2, 1]) { const val = g(t); if (!best || val > best.u + 1e-12) best = { u: val, p: P(t), seg: i, t }; }
  }
  return best;
}
/** Bold label with a panel-coloured halo, placed at the first candidate point satisfying ok(x, y). */
export function placeLabel(s, text, cands, ok, st) {
  for (const [x, y] of cands) if (ok(x, y)) { s.text(text, x, y, { weight: 700, align: 'center', size: 12.5, ...st }); return [x, y]; }
  return null;
}
