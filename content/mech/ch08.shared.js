// Classical Mechanics — Chapter 8: helpers shared by ch08.js, ch08-b.js and ch08-c.js

// ── shared helpers ────────────────────────────────────────────────────────────
export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/** One classical RK4 step of an autonomous system y' = f(y). */
export function rk4(f, y, h) {
  const k1 = f(y), y2 = y.map((c, i) => c + (h / 2) * k1[i]), k2 = f(y2);
  const y3 = y.map((c, i) => c + (h / 2) * k2[i]), k3 = f(y3), y4 = y.map((c, i) => c + h * k3[i]), k4 = f(y4);
  return y.map((c, i) => c + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

/**
 * Planar motion (unit mass) under a radial acceleration acc(r) (negative = attractive), RK4 with the step
 * h = eta·min(r/|v|, √(r/|a|)) adapted to the local time scale. s0 = [x, y, vx, vy].
 * o: {T (may be negative), eta, rmax, rmin, maxSteps, revs (stop after |Δθ| ≥ revs·2π), hmax}.
 * Returns {t: [], s: [[x, y, vx, vy]], stop: 'time' | 'escape' | 'centre' | 'revs' | 'steps'}.
 */
export function centralOrbit(acc, s0, o = {}) {
  const T = o.T ?? 50, dir = T < 0 ? -1 : 1, eta = o.eta ?? 0.02, rmax = o.rmax ?? Infinity, rmin = o.rmin ?? 1e-3, maxN = o.maxSteps ?? 30000;
  let x = s0[0], y = s0[1], vx = s0[2], vy = s0[3], t = 0, th = Math.atan2(y, x), turn = 0, stop = 'steps';
  const out = { t: [0], s: [[x, y, vx, vy]], stop };
  // inline RK4 for the planar central-force system (no allocations in the inner loop)
  const A = (px, py) => { const r = Math.sqrt(px * px + py * py); return acc(r) / r; };
  for (let n = 0; n < maxN; n++) {
    const r = Math.sqrt(x * x + y * y), v = Math.sqrt(vx * vx + vy * vy), a = Math.abs(acc(r));
    let h = eta * Math.min(r / (v || 1e-12), Math.sqrt(r / (a || 1e-12)));
    if (o.hmax) h = Math.min(h, o.hmax);
    const left = Math.abs(T) - Math.abs(t);
    if (left <= 1e-12 * Math.abs(T)) { stop = 'time'; break; }
    if (h > left) h = left;
    h *= dir;
    const q1 = A(x, y), k1x = vx, k1y = vy, l1x = q1 * x, l1y = q1 * y;
    const x2 = x + 0.5 * h * k1x, y2 = y + 0.5 * h * k1y, u2 = vx + 0.5 * h * l1x, w2 = vy + 0.5 * h * l1y, q2 = A(x2, y2);
    const x3 = x + 0.5 * h * u2, y3 = y + 0.5 * h * w2, u3 = vx + 0.5 * h * q2 * x2, w3 = vy + 0.5 * h * q2 * y2, q3 = A(x3, y3);
    const x4 = x + h * u3, y4 = y + h * w3, u4 = vx + h * q3 * x3, w4 = vy + h * q3 * y3, q4 = A(x4, y4);
    x += (h / 6) * (k1x + 2 * u2 + 2 * u3 + u4); y += (h / 6) * (k1y + 2 * w2 + 2 * w3 + w4);
    vx += (h / 6) * (l1x + 2 * q2 * x2 + 2 * q3 * x3 + q4 * x4); vy += (h / 6) * (l1y + 2 * q2 * y2 + 2 * q3 * y3 + q4 * y4);
    t += h;
    const th2 = Math.atan2(y, x); let d = th2 - th; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; turn += d; th = th2;
    out.t.push(t); out.s.push([x, y, vx, vy]);
    const r2 = Math.sqrt(x * x + y * y);
    if (r2 > rmax) { stop = 'escape'; break; }
    if (r2 < rmin) { stop = 'centre'; break; }
    if (o.revs && Math.abs(turn) >= o.revs * TAU) { stop = 'revs'; break; }
  }
  out.stop = stop; out.turn = turn;
  return out;
}

/** State [x, y, vx, vy] of an orbit record at time t (binary search + Hermite interpolation). */
export function stateAt(R, t) {
  const ts = R.t, n = ts.length - 1, sg = ts[n] < 0 ? -1 : 1;
  const tt = sg * t;
  if (tt <= sg * ts[0]) return R.s[0];
  if (tt >= sg * ts[n]) return R.s[n];
  let lo = 0, hi = n;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (sg * ts[m] <= tt) lo = m; else hi = m; }
  const h = ts[hi] - ts[lo], u = (t - ts[lo]) / h, A = R.s[lo], B = R.s[hi];
  // cubic Hermite for the positions (their derivatives are the stored velocities), linear for the velocities
  const h00 = 2 * u ** 3 - 3 * u * u + 1, h10 = u ** 3 - 2 * u * u + u, h01 = -2 * u ** 3 + 3 * u * u, h11 = u ** 3 - u * u;
  const out = A.map((c, i) => c + u * (B[i] - c));
  out[0] = h00 * A[0] + h10 * h * A[2] + h01 * B[0] + h11 * h * B[2];
  out[1] = h00 * A[1] + h10 * h * A[3] + h01 * B[1] + h11 * h * B[3];
  return out;
}

/** Kepler elements of a state (unit mass, GM = mu): energy, angular momentum, eccentricity vector, a, p, period. */
export function kepEl(mu, x, y, vx, vy) {
  const r = Math.hypot(x, y), v2 = vx * vx + vy * vy, h = x * vy - y * vx, E = v2 / 2 - mu / r, rv = x * vx + y * vy;
  const ex = (v2 / mu - 1 / r) * x - (rv / mu) * vx, ey = (v2 / mu - 1 / r) * y - (rv / mu) * vy;
  const e = Math.hypot(ex, ey), a = -mu / (2 * E);
  return { r, h, E, ex, ey, e, a, p: (h * h) / mu, w: Math.atan2(ey, ex), T: E < 0 ? TAU * Math.sqrt(a * a * a / mu) : Infinity };
}

/** Points of the conic r = p/(1 + e cos(θ − w)) with the focus at (fx, fy); null breaks beyond rmax. */
export function conicPts(p, e, w, rmax = 1e6, n = 720, fx = 0, fy = 0) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const th = w - Math.PI + (TAU * i) / n, d = 1 + e * Math.cos(th - w);
    if (d <= 1e-9) { pts.push(null); continue; }
    const r = p / d;
    if (r > rmax) { pts.push(null); continue; }
    pts.push([fx + r * Math.cos(th), fy + r * Math.sin(th)]);
  }
  return pts;
}

/** Roots of g(r) = 0 on [a, b] found by scanning n cells and bisecting sign changes. */
export function roots(g, a, b, n = 600) {
  const out = []; let x0 = a, g0 = g(a);
  for (let i = 1; i <= n; i++) {
    const x1 = a + ((b - a) * i) / n, g1 = g(x1);
    if (isFinite(g0) && isFinite(g1) && g0 * g1 < 0) {
      let lo = x0, hi = x1, glo = g0;
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, gm = g(m); if (gm * glo <= 0) hi = m; else { lo = m; glo = gm; } }
      out.push((lo + hi) / 2);
    }
    x0 = x1; g0 = g1;
  }
  return out;
}

/** Range [lo, hi] of several arrays, padded, with a minimum span. */
export function span(arrs, pad = 0.1, minSpan = 1) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (const y of a) { if (!isFinite(y)) continue; if (y < lo) lo = y; if (y > hi) hi = y; }
  if (!isFinite(lo)) { lo = -1; hi = 1; }
  if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
/** TeX for a number that may be tiny (use inside $…$). */
export const sci = (v, x, d = 2) => (Math.abs(x) < 1e-300 ? '0' : v.sci(x, d));
/** Fixed decimals, or TeX scientific notation when that would print as zero (use inside $…$). */
export const num = (v, x, d = 4) => (Math.abs(x) < 1e-30 ? '0' : Math.abs(x) >= 0.5 * 10 ** -d ? v.fix(x, d) : v.sci(x, 2));

/** A small sun / star glyph. */
export function sun(s, x, y, o = {}) {
  s.circle(x, y, o.r ?? 0.07, { fill: o.color || 'gold', fillAlpha: 0.9, color: o.color || 'gold', width: 1 });
  if (o.label) s.text(o.label, x, y, { color: o.color || 'gold', size: 11, dy: o.dy ?? 14, align: 'center' });
}

// ── solar-system data (NASA planetary fact sheets; J2000 elements, rounded) ─────
// a (AU), sidereal period (yr), e, longitude of perihelion ϖ (°), mean anomaly at J2000 (°)
export const BODIES = [
  { n: 'Mercury', a: 0.387098, T: 0.240846, e: 0.205630, w: 77.46, M0: 174.8, c: 'muted' },
  { n: 'Venus', a: 0.723332, T: 0.615198, e: 0.006772, w: 131.6, M0: 50.1, c: 'gold' },
  { n: 'Earth', a: 1.000001, T: 1.000017, e: 0.016709, w: 102.9, M0: 357.5, c: 'blue' },
  { n: 'Mars', a: 1.523679, T: 1.88082, e: 0.093400, w: 336.1, M0: 19.4, c: 'red' },
  { n: 'Ceres', a: 2.7691, T: 4.6, e: 0.0758, w: 153.9, M0: 77.4, c: 'faint' },
  { n: 'Jupiter', a: 5.2044, T: 11.862, e: 0.048900, w: 14.75, M0: 20.0, c: 'orange' },
  { n: 'Saturn', a: 9.5826, T: 29.457, e: 0.056500, w: 92.43, M0: 317.0, c: 'gold' },
  { n: 'Uranus', a: 19.2184, T: 84.0205, e: 0.045700, w: 170.96, M0: 142.2, c: 'teal' },
  { n: 'Neptune', a: 30.07, T: 164.8, e: 0.011300, w: 44.97, M0: 256.2, c: 'blue' },
  { n: 'Pluto', a: 39.482, T: 247.94, e: 0.2488, w: 224.07, M0: 14.5, c: 'purple' },
  { n: 'Halley', a: 17.834, T: 75.32, e: 0.96714, w: 169.75, M0: 67, c: 'pink', retro: true },
];

