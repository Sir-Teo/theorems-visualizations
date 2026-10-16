// Classical Mechanics — Chapter 12: helpers shared by ch12.js, ch12-b.js and ch12-c.js

// ── numerics ──────────────────────────────────────────────────────────────────
export const TAU = 2 * Math.PI;
export const DEG = Math.PI / 180;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/** TeX for a number that may be tiny (use inside $…$). */
export const sci = (v, x, d = 2) => (!isFinite(x) ? '\\infty' : Math.abs(x) < 1e-300 ? '0' : v.sci(x, d));
/** Fixed decimals, or TeX scientific notation when that would print as zero (use inside $…$). */
export const num = (v, x, d = 4) => (!isFinite(x) ? '\\text{—}' : Math.abs(x) < 1e-30 ? '0' : Math.abs(x) >= 0.5 * 10 ** -d ? v.fix(x, d) : v.sci(x, 2));

/** One classical RK4 step of y' = f(t, y) for an array state. */
export function rk4(f, t, y, h) {
  const n = y.length, k1 = f(t, y), y2 = new Array(n), y3 = new Array(n), y4 = new Array(n), out = new Array(n);
  for (let i = 0; i < n; i++) y2[i] = y[i] + (h / 2) * k1[i];
  const k2 = f(t + h / 2, y2); for (let i = 0; i < n; i++) y3[i] = y[i] + (h / 2) * k2[i];
  const k3 = f(t + h / 2, y3); for (let i = 0; i < n; i++) y4[i] = y[i] + h * k3[i];
  const k4 = f(t + h, y4); for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return out;
}
/** RK4 from t = 0 to T in n steps, recording every `every` steps → {t: [], y: [], dt}. */
export function rk4rec(f, y0, T, n, every = 1, stop = null) {
  const h = T / n; let y = y0.slice(); const out = { t: [0], y: [y], dt: h * every, stopped: false };
  for (let k = 1; k <= n; k++) {
    y = rk4(f, (k - 1) * h, y, h);
    if (k % every === 0) { out.t.push(k * h); out.y.push(y); }
    if (stop && stop(k * h, y)) { out.stopped = true; break; }
  }
  return out;
}
/** Index of the record at time t (records equally spaced by dt). */
export const idxAt = (R, t) => Math.max(0, Math.min(R.t.length - 1, Math.round(t / R.dt)));
/** Wrap an angle into [−π, π). */
export const wrap = (q) => q - TAU * Math.floor((q + Math.PI) / TAU);
/** Simpson's rule with n (even) panels. */
export function simpson(f, a, b, n = 400) { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; }
/** Bisection for a sign change of f on [a, b]. */
export function bisect(f, a, b, it = 70) { let fa = f(a); for (let k = 0; k < it; k++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }
/** Times at which a sampled signal crosses zero upward (linear interpolation). */
export function upCrossings(ts, xs) {
  const out = [];
  for (let i = 1; i < xs.length; i++) if (xs[i - 1] < 0 && xs[i] >= 0) out.push(ts[i - 1] + ((-xs[i - 1]) / (xs[i] - xs[i - 1])) * (ts[i] - ts[i - 1]));
  return out;
}

// ── elliptic integrals and the pendulum H = p²/2 − cos q (m l² = 1, ω₀ = 1) ──────
const agm = (a, b) => { for (let i = 0; i < 40 && Math.abs(a - b) > 1e-16 * a; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; } return a; };
/** Complete elliptic integral of the first kind K(m), parameter m = k². */
export const ellipK = (m) => Math.PI / (2 * agm(1, Math.sqrt(Math.max(0, 1 - m))));
/** Complete elliptic integral of the second kind E(m). */
export function ellipE(m) {
  if (m >= 1) return 1;
  let a = 1, b = Math.sqrt(1 - m), s = 0.5 * m, p2 = 1;
  for (let i = 0; i < 40; i++) { const an = (a + b) / 2, cn = (a - b) / 2; b = Math.sqrt(a * b); a = an; p2 *= 2; s += 0.5 * p2 * cn * cn; if (cn < 1e-17) break; }
  return ellipK(m) * (1 - s);
}
export const pendH = (q, p) => 0.5 * p * p - Math.cos(q);
/**
 * Exact period T, action J (= area/2π, per revolution for rotations) and frequency ω = 2π/T of the pendulum orbit
 * of energy E. Libration (E < 1): T = 4K(k²), J = (8/π)[E(k²) − (1 − k²)K(k²)], k² = (1 + E)/2.
 * Rotation (E > 1): T = 2√m K(m), J = 4E(m)/(π√m), m = 2/(1 + E).
 */
export function pendInfo(E) {
  if (E <= -1) return { kind: 'rest', T: TAU, J: 0, w: 1, qmax: 0 };
  if (Math.abs(E - 1) < 1e-12) return { kind: 'separatrix', T: Infinity, J: 8 / Math.PI, w: 0, qmax: Math.PI };
  if (E < 1) { const k2 = (1 + E) / 2, K = ellipK(k2), T = 4 * K; return { kind: 'libration', T, J: (8 / Math.PI) * (ellipE(k2) - (1 - k2) * K), w: TAU / T, qmax: Math.acos(-E), k2 }; }
  const m = 2 / (1 + E), T = 2 * Math.sqrt(m) * ellipK(m);
  return { kind: 'rotation', T, J: (4 * ellipE(m)) / (Math.PI * Math.sqrt(m)), w: TAU / T, qmax: Math.PI, m };
}
/** One leapfrog (kick–drift–kick) step of the pendulum, with optional exact linear damping split around it. */
export function pendStep(y, h, gamma = 0) {
  if (gamma) y[1] *= Math.exp(-gamma * h / 2);
  y[1] -= 0.5 * h * Math.sin(y[0]); y[0] += h * y[1]; y[1] -= 0.5 * h * Math.sin(y[0]);
  if (gamma) y[1] *= Math.exp(-gamma * h / 2);
}

// ── polygons and adaptive loops of initial conditions ─────────────────────────
/** Signed (shoelace) area of a closed polygon, using coordinates (i, j) of each point. */
export function shoelace(pts, i = 0, j = 1) {
  let a = 0; const n = pts.length;
  for (let k = 0, l = n - 1; k < n; l = k++) a += pts[l][i] * pts[k][j] - pts[k][i] * pts[l][j];
  return a / 2;
}
export function perimeter(pts, i = 0, j = 1) { let s = 0; const n = pts.length; for (let k = 0, l = n - 1; k < n; l = k++) s += Math.hypot(pts[k][i] - pts[l][i], pts[k][j] - pts[l][j]); return s; }
/**
 * A closed loop of initial conditions carried by a flow, refined adaptively: when two neighbours drift farther apart
 * than `tol` (in the metric `dist`), a new point is created at the mid parameter and integrated from t = 0 with the
 * same fixed steps, so the polygon stays a faithful picture of the exact image of the initial curve.
 * init(s) → state array for s ∈ [0, 1); step(y, h) advances a state in place.
 */
export function makeLoop({ init, step, h, n0 = 160, tol = 0.05, maxPts = 7000, dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) }) {
  const L = { S: [], Y: [], steps: 0, h, capped: false };
  L.reset = () => { L.S = []; L.Y = []; L.steps = 0; L.capped = false; for (let k = 0; k < n0; k++) { L.S.push(k / n0); L.Y.push(init(k / n0)); } return L; };
  L.advance = () => { for (const y of L.Y) step(y, h); L.steps++; };
  L.fresh = (s) => { const y = init(s - Math.floor(s)); for (let k = 0; k < L.steps; k++) step(y, h); return y; };
  L.refine = (budget = 400) => {
    let added = 0;
    for (let pass = 0; pass < 6 && added < budget; pass++) {
      const S2 = [], Y2 = []; let ins = 0; const n = L.S.length;
      for (let i = 0; i < n; i++) {
        S2.push(L.S[i]); Y2.push(L.Y[i]);
        const j = (i + 1) % n, sj = j ? L.S[j] : L.S[0] + 1;
        if (L.S.length + ins < maxPts && added + ins < budget && sj - L.S[i] > 1e-9 && dist(L.Y[i], L.Y[j]) > tol) { const sm = (L.S[i] + sj) / 2; S2.push(sm < 1 ? sm : sm - 1); Y2.push(L.fresh(sm)); ins++; }
      }
      if (!ins) break;
      // keep parameters sorted (a wrapped insert after the last point belongs at the front)
      const ord = S2.map((s, k) => k).sort((a, b) => S2[a] - S2[b]);
      L.S = ord.map((k) => S2[k]); L.Y = ord.map((k) => Y2[k]); added += ins;
      if (L.S.length >= maxPts) { L.capped = true; break; }
    }
    return added;
  };
  return L.reset();
}
/** Draw a (q, p) polygon on a phase cylinder of period 2π: every lift that meets the window is drawn. */
export function drawCyl(s, pts, st) {
  if (pts.length < 3) return;
  let lo = Infinity, hi = -Infinity; for (const p of pts) { if (p[0] < lo) lo = p[0]; if (p[0] > hi) hi = p[0]; }
  const [x0, x1] = s.bounds.x;
  for (let k = Math.ceil((x0 - hi) / TAU); k <= Math.floor((x1 - lo) / TAU); k++) s.poly(k ? pts.map((p) => [p[0] + k * TAU, p[1]]) : pts, st);
}

// ── drawing ───────────────────────────────────────────────────────────────────
/** Ticks at multiples of π/2 inside [a, b]. */
export function piTicks(a, b, step = 0.5) {
  const lab = (k) => { const n = k * step; if (n === 0) return '0'; const s = n < 0 ? '−' : ''; const m = Math.abs(n); return s + (m === 1 ? 'π' : Number.isInteger(m) ? `${m}π` : m === 0.5 ? 'π/2' : `${Math.round(m * 2)}π/2`); };
  const out = []; for (let k = Math.ceil(a / (Math.PI * step) - 1e-9); k * Math.PI * step <= b + 1e-9; k++) out.push([k * Math.PI * step, lab(k)]);
  return out;
}
/** Soft energy shading of a phase plane: raster of H mapped from the panel colour toward `color` (cached by key). */
export function energyShade(v, s, H, lo, hi, key, color = 'accent', strength = 0.32) {
  s.raster((x, y) => v.ramp(strength * clamp((H(x, y) - lo) / (hi - lo), 0, 1), color), { key, res: 3, id: 'energy' });
}
/** Small right-angle mark at (x, y) between data directions u and w (drawn in pixels; meaningful on equal axes). */
export function rightAngle(s, x, y, u, w, size = 9, st = {}) {
  const X = s.X(x), Y = s.Y(y), un = (d) => { const a = d[0] * s.sx, b = -d[1] * s.sy; const n = Math.hypot(a, b) || 1; return [a / n, b / n]; };
  const a = un(u), b = un(w);
  const P = (px, py) => s.inv(px, py);
  s.path([P(X + a[0] * size, Y + a[1] * size), P(X + (a[0] + b[0]) * size, Y + (a[1] + b[1]) * size), P(X + b[0] * size, Y + b[1] * size)], { color: st.color || 'ink', width: st.width ?? 1.3, alpha: st.alpha ?? 0.8 });
}
/** Arrow from (x, y) along the data direction d, with length `px` pixels. */
export function arrowPx(s, x, y, d, px, st = {}) {
  const a = d[0] * s.sx, b = d[1] * s.sy, n = Math.hypot(a, b); if (!(n > 1e-12)) return;
  const X = s.X(x) + (a / n) * px, Y = s.Y(y) - (b / n) * px, [x2, y2] = s.inv(X, Y);
  s.arrow(x, y, x2, y2, { width: 2.2, head: 9, ...st });
}
/** Polyline of (xs[k], ys[k]) for k ≤ upto. */
export function series(s, xs, ys, upto, st) {
  const pts = []; for (let k = 0; k <= Math.min(upto, xs.length - 1); k++) pts.push([xs[k], ys[k]]);
  if (pts.length > 1) s.path(pts, st);
}
/** A pendulum drawn in real space: pivot at (0, 0), rod of length l, bob at angle q from the downward vertical. */
export function drawPendulum(s, q, l = 1, st = {}) {
  const bx = l * Math.sin(q), by = -l * Math.cos(q);
  s.line(0, 0, bx, by, { color: 'ink', width: st.width ?? 2.2 });
  s.dot(0, 0, { r: 3.5, color: 'ink' });
  s.circle(bx, by, st.r ?? 0.09, { fill: st.color || 'accent', fillAlpha: 0.85, color: st.color || 'accent', width: 1.5 });
  return [bx, by];
}
