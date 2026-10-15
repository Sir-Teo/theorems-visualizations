// Classical Mechanics — Chapter 9: helpers shared by ch09.js and ch09-b.js

// ── numerics ──────────────────────────────────────────────────────────────────
export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const DEG = Math.PI / 180;
/** Earth's sidereal rotation rate (rad/s) and day lengths (h). */
export const OMEGA = 7.2921159e-5;
export const SIDEREAL_H = TAU / OMEGA / 3600;

/** One-slot cache: recompute only when the key changes. */
export function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/** One classical RK4 step of y' = f(t, y) for an array state. */
export function rk4(f, t, y, h) {
  const k1 = f(t, y), y2 = y.map((c, i) => c + (h / 2) * k1[i]), k2 = f(t + h / 2, y2);
  const y3 = y.map((c, i) => c + (h / 2) * k2[i]), k3 = f(t + h / 2, y3), y4 = y.map((c, i) => c + h * k3[i]), k4 = f(t + h, y4);
  return y.map((c, i) => c + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** RK4 from t = 0 to T in n steps, recording every `every` steps → {t: [], y: [], dt}; stop(t, y) may end the run early. */
export function rk4rec(f, y0, T, n, every = 1, stop = null) {
  const h = T / n; let y = y0.slice(); const out = { t: [0], y: [y], dt: h * every, stopped: false };
  for (let k = 1; k <= n; k++) {
    y = rk4(f, (k - 1) * h, y, h);
    if (k % every === 0) { out.t.push(k * h); out.y.push(y); }
    if (stop && stop(k * h, y)) { if (k % every) { out.t.push(k * h); out.y.push(y); } out.stopped = true; break; }
  }
  return out;
}
/** Index of the record at time t (records equally spaced by dt). */
export const idxAt = (R, t) => Math.max(0, Math.min(R.t.length - 1, Math.round(t / R.dt)));

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

// ── 2D vectors and rotations ──────────────────────────────────────────────────
/** Rotate (x, y) by angle a (anticlockwise). */
export const rot = (x, y, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * x - s * y, s * x + c * y]; };
/** ω ẑ × (x, y) = ω(−y, x). */
export const zcross = (w, x, y) => [-w * y, w * x];

// ── drawing ───────────────────────────────────────────────────────────────────
/** A turntable of radius R centred at (cx, cy), turned by angle `ang`: rim, spokes, rings and one marked spoke. */
export function turntable(s, R, ang, o = {}) {
  const cx = o.cx ?? 0, cy = o.cy ?? 0, n = o.spokes ?? 12;
  s.circle(cx, cy, R, { fill: o.fill || 'accent', fillAlpha: o.fillAlpha ?? 0.07, color: o.rim || 'muted', width: 1.6 });
  for (const f of [1 / 3, 2 / 3]) s.circle(cx, cy, f * R, { color: 'faint', width: 0.9, alpha: 0.7 });
  for (let k = 0; k < n; k++) { const a = ang + (TAU * k) / n; s.line(cx, cy, cx + R * Math.cos(a), cy + R * Math.sin(a), { color: 'faint', width: 0.9, alpha: 0.7 }); }
  if (o.mark !== false) s.line(cx, cy, cx + R * Math.cos(ang), cy + R * Math.sin(ang), { color: o.markColor || 'pink', width: 2.2, alpha: 0.7 });
  for (let k = 0; k < 48; k++) { const a = ang + (TAU * k) / 48, r1 = k % 4 ? 0.97 : 0.93; s.line(cx + R * r1 * Math.cos(a), cy + R * r1 * Math.sin(a), cx + R * Math.cos(a), cy + R * Math.sin(a), { color: 'muted', width: 1, alpha: 0.6 }); }
}
/** Curved arrow on a circle of radius r about (cx, cy), from angle a0 sweeping `sweep` radians (sign = sense). */
export function spinArrow(s, cx, cy, r, a0, sweep, st = {}) {
  if (Math.abs(sweep) < 1e-3) return;
  const n = 30, pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (sweep * i) / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  s.path(pts.slice(0, n - 1), { color: st.color || 'muted', width: st.width ?? 1.6 });
  const A = pts[n - 3], B = pts[n];
  s.arrow(A[0], A[1], B[0], B[1], { color: st.color || 'muted', width: st.width ?? 1.6, head: st.head ?? 8 });
}
/** Arrow for a force (per unit mass) (fx, fy) applied at (x, y), drawn k data units per unit; skipped when shorter than 3 px. */
export function farrow(s, x, y, fx, fy, k, color, label = null, st = {}) {
  const X = x + k * fx, Y = y + k * fy, px = Math.hypot(s.X(X) - s.X(x), s.Y(Y) - s.Y(y));
  if (!(px > 3)) return;
  s.arrow(x, y, X, Y, { color, width: st.width ?? 2.4, head: st.head ?? 8, alpha: st.alpha, dash: st.dash });
  if (label && px > 14) {
    const ux = (s.X(X) - s.X(x)) / px, uy = (s.Y(Y) - s.Y(y)) / px;
    s.texPx(label, s.X(X) + ux * 11 + (st.ldx || 0), s.Y(Y) + uy * 11 + (st.ldy || 0), { color, size: st.size ?? 14 });
  }
}
/** Polyline of (xs[k], ys[k]) for k ≤ upto. */
export function series(s, xs, ys, upto, st) {
  const pts = []; for (let k = 0; k <= Math.min(upto, xs.length - 1); k++) pts.push([xs[k], ys[k]]);
  if (pts.length > 1) s.path(pts, st);
}
