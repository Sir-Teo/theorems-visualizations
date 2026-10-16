// Differential Geometry — Chapter 2 (Space curves): helpers shared by ch02.js and ch02-b.js.
// Conventions: unit tangent T, principal normal N, binormal B = T × N; Frenet–Serret
//   T' = κN,  N' = −κT + τB,  B' = −τN   (so a right-handed helix has τ > 0).

export const TAU = 2 * Math.PI;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
/** Normalized copy, robust against underflow of the squared length (null for the zero vector). */
export function unit(a) {
  const m = Math.max(Math.abs(a[0]), Math.abs(a[1]), Math.abs(a[2]));
  if (!(m > 0)) return null;
  const b = [a[0] / m, a[1] / m, a[2] / m], n = Math.hypot(b[0], b[1], b[2]);
  return [b[0] / n, b[1] / n, b[2] / n];
}

/** First three derivatives of r at t from 7-point central stencils (error O(h⁴) or better; h = 0.02). */
export function derivs(r, t, h = 0.02) {
  const f = [-3, -2, -1, 0, 1, 2, 3].map((k) => r(t + k * h));
  const comb = (w, sc) => [0, 1, 2].map((i) => (w[0] * f[0][i] + w[1] * f[1][i] + w[2] * f[2][i] + w[3] * f[3][i] + w[4] * f[4][i] + w[5] * f[5][i] + w[6] * f[6][i]) / sc);
  return [comb([-1, 9, -45, 0, 45, -9, 1], 60 * h), comb([2, -27, 270, -490, 270, -27, 2], 180 * h * h), comb([1, -8, 13, 0, -13, 8, -1], 8 * h * h * h)];
}

/**
 * A regular space curve r(t), t0 ≤ t ≤ t1. c.at(t) → {t, p, d1, d2, d3, sp, T, N, B, kappa, tau, ok};
 * N, B (and the frame) exist only where κ > 0 (ok = false otherwise: N = B = null, τ = 0).
 * o: {closed, d: t ↦ [r′, r″, r‴] (exact derivatives), tol, h}.
 */
export function mkCurve(r, t0, t1, o = {}) {
  const c = { r, t0, t1, closed: !!o.closed, name: o.name };
  const h = o.h ?? 0.02;
  c.d = o.d || ((t) => derivs(r, t, h));
  c.at = (t) => {
    const [d1, d2, d3] = c.d(t);
    const sp = len(d1), cr = cross(d1, d2), cn = len(cr), T = unit(d1);
    const ok = cn > 0 && cn > (o.tol ?? 1e-9) * sp * sp;
    const B = ok ? unit(cr) : null, N = ok ? cross(B, T) : null;
    return { t, p: r(t), d1, d2, d3, sp, T, N, B, kappa: cn / (sp * sp * sp), tau: ok ? dot(B, d3) / cn : 0, ok };
  };
  c.speed = (t) => len(c.d(t)[0]);
  return c;
}

/** Table of n panels: parameters, frames and arc length s (Simpson on the speed). tab.L = total length. */
export function tableOf(c, n = 400) {
  const dt = (c.t1 - c.t0) / n, t = [], fr = [], s = [0];
  for (let i = 0; i <= n; i++) { t.push(c.t0 + i * dt); fr.push(c.at(t[i])); }
  for (let i = 1; i <= n; i++) s.push(s[i - 1] + (dt / 6) * (fr[i - 1].sp + 4 * c.speed(t[i - 1] + dt / 2) + fr[i].sp));
  return { c, n, dt, t, fr, s, L: s[n], p: fr.map((f) => f.p) };
}
/** Arc length at parameter t (cubic Hermite through the table: error O(dt⁴)). */
export function sOfT(tab, t) {
  const i = clamp(Math.floor((t - tab.t[0]) / tab.dt), 0, tab.n - 1), h = tab.dt, u = (t - tab.t[i]) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * tab.s[i] + (u3 - 2 * u2 + u) * h * tab.fr[i].sp + (-2 * u3 + 3 * u2) * tab.s[i + 1] + (u3 - u2) * h * tab.fr[i + 1].sp;
}
/** Parameter at arc length s (clamped to [0, L]); Newton-polished. */
export function tOfS(tab, s) {
  s = clamp(s, 0, tab.L);
  let lo = 0, hi = tab.n;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab.s[m] <= s) lo = m; else hi = m; }
  let t = tab.t[lo] + ((s - tab.s[lo]) / (tab.s[lo + 1] - tab.s[lo] || 1)) * tab.dt;
  for (let k = 0; k < 3; k++) t -= (sOfT(tab, t) - s) / tab.c.speed(t);
  return clamp(t, tab.c.t0, tab.c.t1);
}
/** Frame and invariants at arc length s (wraps around for closed curves). */
export function atS(tab, s) {
  if (tab.c.closed) s = ((s % tab.L) + tab.L) % tab.L;
  return tab.c.at(tOfS(tab, s));
}
/** d/ds of a vector-valued function F(fr) of the frame at parameter t, by a central difference of half-width δ in t. */
export function dds(c, t, F, delta = 1e-3) {
  const a = c.at(t + delta), b = c.at(t - delta), sp = c.speed(t);
  const Fa = F(a), Fb = F(b);
  return Fa.map((x, i) => (x - Fb[i]) / (2 * delta * sp));
}

// ───────────────────────────────────────────────────────────── a small zoo of curves
const S3 = Math.sin, C3 = Math.cos, PI = Math.PI;
export const CURVES = {
  trefoil: mkCurve((t) => [0.5 * (S3(t) + 2 * S3(2 * t)), 0.5 * (C3(t) - 2 * C3(2 * t)), -0.8 * S3(3 * t)], 0, TAU, { closed: true, name: 'trefoil knot' }),
  helix: mkCurve((t) => [C3(t), S3(t), 0.22 * (t - TAU)], 0, 2 * TAU, { name: 'circular helix' }),
  viviani: mkCurve((t) => [0.8 * C3(t), 0.8 * S3(t), 1.6 * S3(t / 2)], 0, 2 * TAU, { closed: true, name: 'Viviani curve' }),
  cubic: mkCurve((t) => [1.1 * t, 1.3 * t * t - 0.9, 0.9 * t * t * t], -1.25, 1.25, { name: 'twisted cubic' }),
  flat: mkCurve((t) => [1.2 * t, 0.8 * t * t * t, 0.5 * t * t * t * t], -1.3, 1.3, { name: 'curve with a flat point', tol: 1e-12 }),
  ellipse: mkCurve((t) => [1.4 * C3(t), 0.9 * S3(t) * C3(0.6), 0.9 * S3(t) * S3(0.6)], 0, TAU, { closed: true, name: 'planar ellipse (tilted)' }),
};
export const curveChoices = (keys) => keys.map((k) => ({ value: k, label: CURVES[k].name }));

// ───────────────────────────────────────────────────────────── drawing (scene3 = v.scene3 on a 2D stage)
export const FC = { T: 'blue', N: 'orange', B: 'purple' };
export function scene(v, o = {}) {
  const S = v.stage({ x: [-2.3, 2.3], y: [-2, 2], equal: true, axes: false, height: o.height ?? 400, weight: o.weight ?? 1.3, minWidth: o.minWidth ?? 300, title: o.title });
  const sc = v.scene3(S, { yaw: o.yaw ?? -0.7, pitch: o.pitch ?? 0.38, axes: !!o.axes, hint: o.hint ?? true, lim: o.lim ?? 2, axis: o.axis ?? 1.6 });
  return { S, sc };
}
export function plot(v, o) {
  return v.stage({ x: o.x ?? [0, 1], y: o.y ?? [0, 1], axes: 'box', gutter: true, height: o.height ?? 400, weight: o.weight ?? 0.8, minWidth: o.minWidth ?? 250, xlabel: o.xlabel, ylabel: o.ylabel, title: o.title, ylog: o.ylog });
}
/** Polyline of the curve, optionally coloured per segment (colors[i] for segment i). */
export function drawTrack(sc, pts, st = {}, colors = null) {
  for (let i = 0; i + 1 < pts.length; i++) sc.line(pts[i], pts[i + 1], colors ? { ...st, color: colors[i] } : st, 1);
}
/** T, N, B arrows (and labels) at p; fr is a frame {T, N, B}. */
export function drawFrame(sc, p, fr, k = 0.7, o = {}) {
  for (const key of ['T', 'N', 'B']) {
    if (!fr[key] || (o.only && !o.only.includes(key))) continue;
    const q = add(p, mul(fr[key], k));
    sc.arrow(p, q, { color: FC[key], width: o.width ?? 2.8 });
    if (o.labels !== false) sc.tex(key === 'T' ? '\\mathbf T' : key === 'N' ? '\\mathbf N' : '\\mathbf B', add(p, mul(fr[key], k * 1.16)), { color: FC[key], size: 15 });
  }
}
export const bbox = (pts) => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); }
  return { lo, hi, c: lo.map((x, i) => (x + hi[i]) / 2), r: Math.max(...hi.map((x, i) => x - lo[i])) / 2 };
};
/** The three great circles of a sphere of radius R, faint (for orientation). */
export function sphereWire(sc, R = 1, st = {}) {
  const n = 72;
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = (TAU * i) / n, p = [0, 0, 0]; p[a] = R * Math.cos(t); p[b] = R * Math.sin(t); pts.push(p); }
    drawTrack(sc, pts, { color: 'faint', width: 1, alpha: 0.5, ...st });
  }
}

// ───────────────────────────────────────────────────────────── numerics
/** Closed trigonometric interpolant through an odd number N of 3D points at t_j = 2πj/N (C^∞, passes through them). */
export function trigInterp(pts) {
  const N = pts.length, K = (N - 1) / 2, a0 = [0, 1, 2].map((i) => pts[0][i] * 0 + pts.reduce((s, p) => s + p[i], 0) / N);
  const A = [], B = [];
  for (let k = 1; k <= K; k++) {
    A.push([0, 1, 2].map((i) => (2 / N) * pts.reduce((s, p, j) => s + p[i] * Math.cos((k * TAU * j) / N), 0)));
    B.push([0, 1, 2].map((i) => (2 / N) * pts.reduce((s, p, j) => s + p[i] * Math.sin((k * TAU * j) / N), 0)));
  }
  return (t) => {
    const out = a0.slice();
    for (let k = 1; k <= K; k++) for (let i = 0; i < 3; i++) out[i] += A[k - 1][i] * Math.cos(k * t) + B[k - 1][i] * Math.sin(k * t);
    return out;
  };
}
/** RK4 for the Frenet–Serret system with given κ(s), τ(s): returns n+1 states {s, p, T, N, B} from s = 0 to L. */
export function integrateFS(kf, tf, L, n, init) {
  let y = [...init.p, ...init.T, ...init.N, ...init.B], s = 0;
  const h = L / n, out = [];
  const F = (s, y) => {
    const k = kf(s), t = tf(s), T = y.slice(3, 6), N = y.slice(6, 9), B = y.slice(9, 12);
    return [...T, ...mul(N, k), ...add(mul(T, -k), mul(B, t)), ...mul(N, -t)];
  };
  const push = () => out.push({ s, p: y.slice(0, 3), T: y.slice(3, 6), N: y.slice(6, 9), B: y.slice(9, 12) });
  push();
  for (let i = 0; i < n; i++) {
    const k1 = F(s, y), k2 = F(s + h / 2, y.map((v, j) => v + (h / 2) * k1[j])), k3 = F(s + h / 2, y.map((v, j) => v + (h / 2) * k2[j])), k4 = F(s + h, y.map((v, j) => v + h * k3[j]));
    y = y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); s += h; push();
  }
  return out;
}
/** Rotation matrix (rows) from yaw about z, pitch about y, roll about x. */
export function rotMat(yaw, pitch, roll) {
  const cz = Math.cos(yaw), sz = Math.sin(yaw), cy = Math.cos(pitch), sy = Math.sin(pitch), cx = Math.cos(roll), sx = Math.sin(roll);
  return [[cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx], [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx], [-sy, cy * sx, cy * cx]];
}
export const applyMat = (M, p) => [dot(M[0], p), dot(M[1], p), dot(M[2], p)];
/** Angle in degrees between two unit vectors. */
export const angleDeg = (a, b) => (Math.acos(clamp(dot(a, b), -1, 1)) * 180) / PI;
