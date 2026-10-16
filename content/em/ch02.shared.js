// Electromagnetism — Chapter 2 shared helpers.
// Units in the pictures: positions in cm, charges in nC, potentials in volts, fields in V/cm (1 V/cm = 100 V/m).
// Point charges are {x, y, q} in a plane, with the true 3D inverse-square law (the plane is a slice of space).

export const TAU = 2 * Math.PI;
/** k·1e-9/1e-2: volts of potential for 1 nC at 1 cm. */
export const KV = 898.7551792;
/** ε₀ in nC/(V·cm): flux of E (V·cm) through a closed surface = q/ε₀. */
export const EPS0 = (8.8541878128e-12 * 1e9) / 1e2;

/** Potential (V) of point charges src at (x, y, z=0 offset zz). */
export function pot(src, x, y, zz = 0) {
  let p = 0;
  for (const s of src) if (s.q) p += s.q / Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2 + (zz - (s.z || 0)) ** 2 + 1e-12);
  return KV * p;
}
/** Field (V/cm) of point charges src in the plane. */
export function fld(src, x, y) {
  let u = 0, w = 0;
  for (const s of src) {
    if (!s.q) continue;
    const dx = x - s.x, dy = y - s.y, r2 = dx * dx + dy * dy + 1e-12, k = s.q / (r2 * Math.sqrt(r2));
    u += k * dx; w += k * dy;
  }
  return [KV * u, KV * w];
}
export const sgnCol = (q) => (q > 0 ? 'red' : q < 0 ? 'blue' : 'muted');
export const showStage = (S, on) => { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; };
/** Signed charge as text: '+4 nC'. */
export const nC = (q) => (q > 0 ? '+' : q < 0 ? '−' : '') + String(+Math.abs(q).toFixed(2)) + ' nC';
/** A charge as a coloured disc with its sign inside. */
export function drawCharge(s, x, y, q, r = 8) {
  const col = sgnCol(q);
  s.dot(x, y, { r, color: col });
  s.text(q > 0 ? '+' : q < 0 ? '−' : '0', x, y, { align: 'center', size: 11, weight: 700, color: 'panel', halo: false });
}
/** Arrow of a given pixel length from data point (x, y) along (ux, uy) (equal-aspect stages). */
export function arrowPx(s, x, y, ux, uy, len, st) {
  const L = Math.hypot(ux, uy);
  if (!(L > 0) || !(len > 0.5) || !isFinite(len)) return;
  s.arrow(x, y, x + ((ux / L) * len) / s.sx, y + ((uy / L) * len) / s.sy, st);
}
/** Direction-field arrows on a pixel grid, length growing with log|F| between the 5th and 95th percentile. */
export function quiver(s, F, st = {}) {
  const sp = st.spacing ?? 30, pts = [];
  for (let px = sp / 2; px < s.W; px += sp) for (let py = sp / 2; py < s.H; py += sp) {
    const [x, y] = s.inv(px, py), f = F(x, y), m = Math.hypot(f[0], f[1]);
    if (isFinite(m) && m > 0) pts.push([x, y, f[0] / m, f[1] / m, Math.log10(m)]);
  }
  if (!pts.length) return;
  const ls = pts.map((p) => p[4]).sort((a, b) => a - b), lo = ls[Math.floor(ls.length * 0.05)], hi = ls[Math.floor(ls.length * 0.95)];
  for (const [x, y, ux, uy, g] of pts) {
    const t = Math.max(0, Math.min(1, (g - lo) / (hi - lo || 1))), len = sp * (0.3 + 0.5 * t);
    const x0 = x - ((ux * len) / 2) / s.sx, y0 = y - ((uy * len) / 2) / s.sy;
    s.arrow(x0, y0, x0 + (ux * len) / s.sx, y0 + (uy * len) / s.sy, { color: st.color || 'accent', alpha: (st.alpha ?? 0.75) * (0.35 + 0.65 * t), width: 1.4, head: 6 });
  }
}
/** Signed, compressed colour for a potential: tanh(V/scale) through the theme-safe diverging ramp. */
export function heatPot(s, f, scale, key, st = {}) {
  s.heat((x, y) => Math.tanh(f(x, y) / scale), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: st.res || 3, key, alpha: st.alpha ?? 0.85, id: st.id });
}
/** Evenly spaced potential levels (V) symmetric about 0 that include 0. */
export function levels(step, n) { const L = []; for (let k = -n; k <= n; k++) L.push(k * step); return L; }
/** Substeps for a segment: fine enough that the field barely changes over a step (steps ≤ 2 % of the distance to the nearest charge). */
export function nsub(src, x0, y0, x1, y1, per = 8) {
  if (!src || !src.length) return per;
  const len = Math.hypot(x1 - x0, y1 - y0); let dm = Infinity;
  for (const s of src) for (const t of [0, 0.25, 0.5, 0.75, 1]) dm = Math.min(dm, Math.hypot(x0 + (x1 - x0) * t - s.x, y0 + (y1 - y0) * t - s.y));
  return Math.min(4000, Math.max(per, Math.ceil(len / (0.02 * Math.max(dm, 0.01)))));
}
/** Line integral of F·dl along a polyline through pts (trapezoid, refined near the charges src). */
export function lineInt(F, pts, per = 8, src = null) {
  let W = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = nsub(src, x0, y0, x1, y1, per);
    let prev = F(x0, y0);
    for (let k = 1; k <= n; k++) {
      const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, f = F(x, y);
      W += 0.5 * ((prev[0] + f[0]) * (x1 - x0) + (prev[1] + f[1]) * (y1 - y0)) / n; prev = f;
    }
  }
  return W;
}
/** Catmull–Rom curve through control points P (array of [x,y]); returns a dense polyline. */
export function spline(P, per = 24) {
  const out = [], n = P.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(P[n - 1].slice());
  return out;
}
/** Jacobi-free 2×2 symmetric eigen-decomposition: eigenvalues descending and the unit eigenvector of the larger. */
export function eig2(a, b, d) {
  const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b), th = 0.5 * Math.atan2(2 * b, a - d);
  return { l1: m + r, l2: m - r, v1: [Math.cos(th), Math.sin(th)], v2: [-Math.sin(th), Math.cos(th)] };
}
/** Hessian of the potential of src at (x,y,z) (3×3, V/cm²). */
export function hess3(src, x, y, z = 0) {
  const H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const s of src) {
    if (!s.q) continue;
    const d = [x - s.x, y - s.y, z - (s.z || 0)], r2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2], r = Math.sqrt(r2), r5 = r2 * r2 * r;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) H[i][j] += (KV * s.q * (3 * d[i] * d[j] - (i === j ? r2 : 0))) / r5;
  }
  return H;
}
