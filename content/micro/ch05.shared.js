// Microeconomics — Chapter 5: helpers shared by ch05.js and ch05-b.js (plain named exports).
// House style of the consumer diagrams (as in chapter 4): budget line and set in `accent`, indifference curves in `purple`,
// best bundles in `green`, test bundles in `gold`, gradients in `orange`; good 1 on the horizontal axis, good 2 on the vertical.
// The ray-tracing and drawing helpers are copied from ch04.shared.js (a chapter may import only its own shared file).

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const GUIDE = { color: 'muted', width: 1, dash: [3, 3] };

/** Root of f on [a, b] by bisection; null when f does not change sign (or is not finite at the ends). */
export function bisect(f, a, b, it = 60) {
  let fa = f(a); const fb = f(b);
  if (!(isFinite(fa) && isFinite(fb))) return null;
  if (fa === 0) return a; if (fb === 0) return b;
  if (fa * fb > 0) return null;
  for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}

/** Maximise f on [a, b]: scan n + 1 points, then golden-section search on the bracket of the best one. Endpoints win ties. → {x, f} */
export function argmax(f, a, b, n = 48, it = 56) {
  const h = (b - a) / n; let bi = 0, bv = -Infinity;
  for (let i = 0; i <= n; i++) { const w = f(a + i * h); if (w > bv) { bv = w; bi = i; } }
  let lo = a + Math.max(0, bi - 1) * h, hi = a + Math.min(n, bi + 1) * h;
  const phi = (Math.sqrt(5) - 1) / 2;
  let c = hi - phi * (hi - lo), d = lo + phi * (hi - lo), fc = f(c), fd = f(d);
  for (let k = 0; k < it; k++) { if (fc < fd) { lo = c; c = d; fc = fd; d = lo + phi * (hi - lo); fd = f(d); } else { hi = d; d = c; fd = fc; c = hi - phi * (hi - lo); fc = f(c); } }
  const xm = (lo + hi) / 2, fm = f(xm);
  return fm > bv ? { x: xm, f: fm } : { x: a + bi * h, f: bv };
}

/**
 * Preference families. Each returns {u(x, y), grad(x, y) → [MU1, MU2], ray, kinks?, dem?(p1, p2, m) → [x1, x2]}:
 *   ray = true when u strictly increases along every ray from the origin (level sets are then traced exactly by bisection
 *   along rays); kinks = ray angles of corners; dem = closed-form Marshallian demand when there is one.
 */
export function prefs(kind, P = {}) {
  switch (kind) {
    case 'cd': { const a = P.a ?? 0.5; const u = (x, y) => (x <= 0 || y <= 0 ? 0 : x ** a * y ** (1 - a));
      return { u, grad: (x, y) => { const w = u(x, y); return [(a * w) / x, ((1 - a) * w) / y]; }, ray: true, dem: (p1, p2, m) => [(a * m) / p1, ((1 - a) * m) / p2] }; }
    case 'subs': { const a = P.a ?? 1, b = P.b ?? 1;
      return { u: (x, y) => a * x + b * y, grad: () => [a, b], ray: true,
        dem: (p1, p2, m) => { const d = a / p1 - b / p2; return Math.abs(d) < 1e-12 ? [m / (2 * p1), m / (2 * p2)] : d > 0 ? [m / p1, 0] : [0, m / p2]; } }; }
    case 'comp': { const a = P.a ?? 1, b = P.b ?? 1;
      return { u: (x, y) => Math.min(a * x, b * y), grad: (x, y) => (a * x < b * y - 1e-12 ? [a, 0] : a * x > b * y + 1e-12 ? [0, b] : [NaN, NaN]), ray: true, kinks: [Math.atan2(a, b)],
        dem: (p1, p2, m) => { const x = m / (p1 + (a * p2) / b); return [x, (a * x) / b]; } }; }
    case 'ql': { const a = P.a ?? 2;
      return { u: (x, y) => a * Math.log(Math.max(x, 1e-12)) + y, grad: (x) => [a / x, 1], ray: true,
        dem: (p1, p2, m) => (a * p2 <= m ? [(a * p2) / p1, (m - a * p2) / p2] : [m / p1, 0]) }; }
    case 'ces': { const a = P.a ?? 0.5, r = P.r ?? -1;
      if (Math.abs(r) < 1e-3) return prefs('cd', { a });
      const s = 1 / (1 - r);
      const u = (x, y) => (r < 0 && (x <= 0 || y <= 0) ? 0 : (a * Math.max(x, 0) ** r + (1 - a) * Math.max(y, 0) ** r) ** (1 / r));
      return { u, grad: (x, y) => { const w = u(x, y), k = w ** (1 - r); return [a * k * x ** (r - 1), (1 - a) * k * y ** (r - 1)]; }, ray: true,
        dem: (p1, p2, m) => { const w1 = a ** s * p1 ** (1 - s), w2 = (1 - a) ** s * p2 ** (1 - s), s1 = w1 / (w1 + w2); return [(s1 * m) / p1, ((1 - s1) * m) / p2]; } }; }
    case 'concave': return { u: (x, y) => Math.hypot(Math.max(x, 0), Math.max(y, 0)), grad: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; }, ray: true,
      dem: (p1, p2, m) => (p1 <= p2 ? [m / p1, 0] : [0, m / p2]) };
    case 'sat': { const bx = P.bx ?? 6, by = P.by ?? 5; return { u: (x, y) => -((x - bx) ** 2 + (y - by) ** 2), grad: (x, y) => [-2 * (x - bx), -2 * (y - by)], ray: false, bliss: [bx, by] }; }
    case 'sg': { // Stone–Geary: subsistence quantities g1, g2; −1e6 − distance outside the region keeps u monotone along rays
      const a = P.a ?? 0.5, g1 = P.g1 ?? 2, g2 = P.g2 ?? 1;
      const u = (x, y) => (x > g1 && y > g2 ? a * Math.log(x - g1) + (1 - a) * Math.log(y - g2) : -1e6 + Math.min(x - g1, y - g2));
      return { u, grad: (x, y) => [a / (x - g1), (1 - a) / (y - g2)], ray: true, sub: [g1, g2],
        dem: (p1, p2, m) => { const S = m - p1 * g1 - p2 * g2; return S > 0 ? [g1 + (a * S) / p1, g2 + ((1 - a) * S) / p2] : null; } }; }
    case 'inf': { // good 1 inferior: the indifference curve of level c is x2 = c − K(c) ln(1 + x1), K(c) = A k/(k + c), flatter for larger c
      const A = P.A ?? 5, k = P.k ?? 8;
      const u = (x, y) => { const L = Math.log(1 + Math.max(x, 0)), z = Math.max(y, 0); return (-(k - z) + Math.sqrt((k - z) ** 2 + 4 * k * (z + A * L))) / 2; };
      return { u, ray: true, grad: (x, y) => { const c = u(x, y), K = (A * k) / (k + c), Gc = 1 + (A * k * Math.log(1 + x)) / (k + c) ** 2; return [K / (1 + x) / Gc, 1 / Gc]; } }; }
    default: throw new Error('unknown preference family ' + kind);
  }
}
/** Numerical gradient (central differences) for a utility without a formula. */
export function numGrad(u, x, y) { const hx = 1e-5 * (1 + Math.abs(x)), hy = 1e-5 * (1 + Math.abs(y)); return [(u(x + hx, y) - u(x - hx, y)) / (2 * hx), (u(x, y + hy) - u(x, y - hy)) / (2 * hy)]; }

/** Best bundle on the budget line p1 x1 + p2 x2 = m (closed form when the family has one, else a scan plus golden section). */
export function demand(F, p1, p2, m) {
  if (F.dem) { const d = F.dem(p1, p2, m); if (d) return d; }
  const r = argmax((t) => F.u((t * m) / p1, ((1 - t) * m) / p2), 0, 1, 64);
  return [(r.x * m) / p1, ((1 - r.x) * m) / p2];
}
/** Indirect utility v(p, m) = u(x(p, m)). */
export const indirect = (F, p1, p2, m) => F.u(...demand(F, p1, p2, m));

/** Radius at which u = L along the ray of angle th (u increasing along rays); null if not reached within rmax. */
export function rayLevel(u, L, th, rmax) {
  const c = Math.cos(th), s = Math.sin(th);
  return bisect((r) => u(r * c, r * s) - L, 1e-9, rmax, 50);
}
/** The point of the level set u = L on the ray through (x, y), or null. */
export function onRay(F, L, x, y, rmax = 400) {
  const th = Math.atan2(Math.max(y, 1e-9), Math.max(x, 1e-9)), r = rayLevel(F.u, L, th, rmax);
  return r == null ? null : [r * Math.cos(th), r * Math.sin(th)];
}
/**
 * Expenditure minimisation, solved directly (not through duality): the cheapest point of the level set u = L, found by
 * walking the level set ray by ray. → {x: [h1, h2], e} (Hicksian demand and the expenditure function), or null.
 */
export function hicks(F, p1, p2, L, rmax = 600) {
  const cost = (th) => { const r = rayLevel(F.u, L, th, rmax); return r == null ? Infinity : r * (p1 * Math.cos(th) + p2 * Math.sin(th)); };
  const r = argmax((th) => -cost(th), 0, Math.PI / 2, 90);
  let th = r.x;
  if (F.kinks) for (const k of F.kinks) if (cost(k) <= -r.f + 1e-12) th = k;
  const R = rayLevel(F.u, L, th, rmax); if (R == null) return null;
  return { x: [R * Math.cos(th), R * Math.sin(th)], e: R * (p1 * Math.cos(th) + p2 * Math.sin(th)) };
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
  else s.contour(F.u, L, { res: st.res ?? 150, color: st.color, width: st.width, dash: st.dash, alpha: st.alpha });
  return s;
}
/** Short tangent segment of slope k (k = ±Infinity for vertical) through (x, y), half-length `px` pixels. */
export function tangent(s, x, y, k, px, st) {
  const sx = s.scale, sy = s.height / (s.bounds.y[1] - s.bounds.y[0]);
  let dx, dy;
  if (!isFinite(k)) { dx = 0; dy = px / sy; } else { const a = Math.atan2(k * sy, sx); dx = (Math.cos(a) * px) / sx; dy = (Math.sin(a) * px) / sy; }
  s.line(x - dx, y - dy, x + dx, y + dy, st);
}
/** Arrow between two points, trimmed in pixels at both ends so it clears the dots. */
export function trimArrow(s, a, b, st, t0 = 9, t1 = 10) {
  const X1 = s.X(a[0]), Y1 = s.Y(a[1]), X2 = s.X(b[0]), Y2 = s.Y(b[1]), L = Math.hypot(X2 - X1, Y2 - Y1);
  if (L < t0 + t1 + 4) return false;
  const ux = (X2 - X1) / L, uy = (Y2 - Y1) / L, [x1, y1] = s.inv(X1 + ux * t0, Y1 + uy * t0), [x2, y2] = s.inv(X2 - ux * t1, Y2 - uy * t1);
  s.arrow(x1, y1, x2, y2, st); return true;
}
/** Arrow of a given pixel length from (x, y) in data direction (dx, dy) (pixel-correct on unequal axes). */
export function pxArrow(s, x, y, dx, dy, len, st) {
  const X = s.X(x), Y = s.Y(y), ex = s.X(x + dx) - X, ey = s.Y(y + dy) - Y, L = Math.hypot(ex, ey);
  if (!(L > 0) || !(len > 1)) return null;
  const [x2, y2] = s.inv(X + (ex / L) * len, Y + (ey / L) * len);
  s.arrow(x, y, x2, y2, st); return [x2, y2];
}
/** Budget set (shaded) and budget line p1 x1 + p2 x2 = m. */
export function budget(s, p1, p2, m, st = {}) {
  const X1 = m / p1, X2 = m / p2;
  s.clip(() => {
    if (st.fill !== false) s.poly([[0, 0], [X1, 0], [0, X2]], { fill: st.color || 'accent', fillAlpha: st.fillAlpha ?? 0.1, stroke: false });
    s.line(X1, 0, 0, X2, { color: st.color || 'accent', width: st.width ?? 2.8, dash: st.dash, alpha: st.alpha });
  });
}
/** Closest point of the segment AB to (x, y), measured in pixels (so it works on unequal axes). → [x, y, t] */
export function nearestOnSegment(s, A, B, x, y) {
  const ax = s.X(A[0]), ay = s.Y(A[1]), bx = s.X(B[0]), by = s.Y(B[1]), px = s.X(x), py = s.Y(y);
  const L2 = (bx - ax) ** 2 + (by - ay) ** 2, t = L2 > 0 ? clamp(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / L2, 0, 1) : 0;
  return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, t];
}
