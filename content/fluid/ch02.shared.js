// Fluid Dynamics — Chapter 2 shared helpers (plain named exports)

export const G0 = 9.81;      // m/s^2
export const RHO_W = 1000;   // kg/m^3, fresh water
export const P_ATM = 101325; // Pa

export function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

/** Signed area of a polygon [[x,y],...]. */
export function polyArea(P) {
  let a = 0;
  for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}
/** Centroid of a polygon (any orientation); null if degenerate. */
export function polyCentroid(P) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length], c = p[0] * q[1] - q[0] * p[1];
    a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c;
  }
  if (Math.abs(a) < 1e-14) return null;
  return [cx / (3 * a), cy / (3 * a)];
}
/** Part of polygon P lying at y <= y0 (Sutherland-Hodgman against one half-plane). */
export function clipBelow(P, y0) {
  const out = [];
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length];
    const pin = p[1] <= y0, qin = q[1] <= y0;
    if (pin) out.push(p);
    if (pin !== qin) { const t = (y0 - p[1]) / (q[1] - p[1]); out.push([p[0] + t * (q[0] - p[0]), y0]); }
  }
  return out;
}
export function rotate(p, a) { const c = Math.cos(a), s = Math.sin(a); return [c * p[0] - s * p[1], s * p[0] + c * p[1]]; }
/** Plain bisection for a root of f on [a, b] (f(a), f(b) of opposite sign). */
export function bisect(f, a, b, n = 70) {
  let fa = f(a);
  for (let i = 0; i < n; i++) {
    const m = (a + b) / 2, fm = f(m);
    if ((fm <= 0) === (fa <= 0)) { a = m; fa = fm; } else b = m;
  }
  return (a + b) / 2;
}
/** Cumulative trapezoid integral of ys on the grid xs (same length, starts at 0). */
export function cumTrapz(xs, ys) {
  const out = [0];
  for (let i = 1; i < xs.length; i++) out.push(out[i - 1] + 0.5 * (ys[i] + ys[i - 1]) * (xs[i] - xs[i - 1]));
  return out;
}
/** Simpson integral of f on [a, b] with n (even) panels. */
export function simpson(f, a, b, n = 200) {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
/** Smooth constriction: radius falling from r0 to rt in a Gaussian dip centred at xc with width w. */
export function dip(x, r0, rt, xc, w) { return r0 - (r0 - rt) * Math.exp(-(((x - xc) / w) ** 2)); }
/** Linear interpolation in a table of equally spaced samples ys on [a, b]. */
export function tableAt(ys, a, b, x) {
  const u = clamp((x - a) / (b - a), 0, 1) * (ys.length - 1), i = Math.min(ys.length - 2, Math.floor(u));
  return ys[i] + (u - i) * (ys[i + 1] - ys[i]);
}
/** U-tube manometer drawn on stage s: left/right leg x positions, bottom and top y, level offset d (>0: left level lower). */
export function utube(s, xl, xr, yb, yt, ymid, d, opts = {}) {
  const w = opts.w || 0.28, lvL = ymid - d / 2, lvR = ymid + d / 2;
  const fluid = opts.fluid || 'accent';
  s.poly([[xl - w, lvL], [xl - w, yb + w], [xr + w, yb + w], [xr + w, lvR], [xr - w, lvR], [xr - w, yb + 2 * w], [xl + w, yb + 2 * w], [xl + w, lvL]],
    { fill: fluid, fillAlpha: 0.55, color: fluid, width: 1 });
  s.path([[xl - w, yt], [xl - w, yb + w], [xr + w, yb + w], [xr + w, yt]], { color: 'ink', width: 2 });
  s.path([[xl + w, yt], [xl + w, yb + 2 * w], [xr - w, yb + 2 * w], [xr - w, yt]], { color: 'ink', width: 2 });
  return { lvL, lvR };
}
