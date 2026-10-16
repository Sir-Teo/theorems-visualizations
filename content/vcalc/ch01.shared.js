// Vector Calculus — Chapter 1: helpers shared by ch01.js and ch01-b.js

// ---------- number formatting ----------
/** A number for TeX: at most d decimals, trailing zeros dropped, never "-0". */
export function tn(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  let s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}
/** Fixed decimals for TeX (keeps trailing zeros so readouts do not jitter). */
export const tf = (x, d = 2) => { const s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d); return s === '-0' || /^-0\.0*$/.test(s) ? s.slice(1) : s; };
/** TeX column vector with fixed decimals. */
export const colv = (p, d = 2) => `\\begin{pmatrix}${p.map((x) => tf(x, d)).join('\\\\')}\\end{pmatrix}`;
/** TeX row tuple. */
export const tup = (p, d = 2) => `(${p.map((x) => tf(x, d)).join(',\\,')})`;

// ---------- vectors in R^3 ----------
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm3 = (a) => Math.hypot(a[0], a[1], a[2]);
export const unit3 = (a) => { const l = norm3(a); return l > 1e-12 ? mul3(a, 1 / l) : [0, 0, 0]; };
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** Angle between a and b in [0, π], computed with atan2 (accurate near 0 and π). */
export const angle3 = (a, b) => Math.atan2(norm3(cross3(a, b)), dot3(a, b));

/** Two orthonormal vectors spanning the plane with unit normal n. */
export function planeBasis(n) {
  const k = unit3(n), h = Math.abs(k[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
  const a = unit3(cross3(k, h)), b = cross3(k, a);
  return [a, b];
}

// ---------- scene3 drawing helpers ----------
/** Filled parametric patch f(u,v) → [x,y,z] on [u0,u1]×[v0,v1], tiled into nu×nv quads (depth-sorted by scene3). */
export function patch(sc, f, [u0, u1], [v0, v1], nu, nv, st = {}) {
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = u0 + ((u1 - u0) * i) / nu, b = u0 + ((u1 - u0) * (i + 1)) / nu, c = v0 + ((v1 - v0) * j) / nv, d = v0 + ((v1 - v0) * (j + 1)) / nv;
      sc.poly([f(a, c), f(b, c), f(b, d), f(a, d)], { fill: st.fill || 'accent', fillAlpha: st.fillAlpha ?? 0.12, edge: false, bias: st.bias });
    }
  }
}
/** A square patch of the plane through p with unit normal n and half-width h. */
export function planePatch(sc, p, n, h, st = {}, m = 6) {
  const [a, b] = planeBasis(n);
  const f = (s, t) => add3(p, add3(mul3(a, s), mul3(b, t)));
  patch(sc, f, [-h, h], [-h, h], m, m, st);
  if (st.grid !== false) {
    for (let k = -2; k <= 2; k++) {
      sc.line(f(-h, (k * h) / 2.5), f(h, (k * h) / 2.5), { color: st.fill || 'accent', width: 0.8, alpha: 0.28 }, 4);
      sc.line(f((k * h) / 2.5, -h), f((k * h) / 2.5, h), { color: st.fill || 'accent', width: 0.8, alpha: 0.28 }, 4);
    }
  }
}
/** Polyline through c(t), t in [t0, t1], n segments. */
export const sample = (c, t0, t1, n) => Array.from({ length: n + 1 }, (_, i) => c(t0 + ((t1 - t0) * i) / n));
/** Circle in 3D: centre c, orthonormal in-plane a, b, radius r. */
export const circle3 = (c, a, b, r, n = 72) => sample((t) => add3(c, add3(mul3(a, r * Math.cos(t)), mul3(b, r * Math.sin(t)))), 0, 2 * Math.PI, n);
/** Arc of the circle from angle t0 to t1. */
export const arc3 = (c, a, b, r, t0, t1, n = 24) => sample((t) => add3(c, add3(mul3(a, r * Math.cos(t)), mul3(b, r * Math.sin(t)))), t0, t1, n);

// ---------- curves ----------
/** Central-difference derivatives of a curve r(t) → [x,y,z]: position, velocity, acceleration. */
export function derivs(r, t, h = 1e-4) {
  const a = r(t - h), b = r(t), c = r(t + h);
  return { p: b, v: mul3(sub3(c, a), 1 / (2 * h)), a: mul3(add3(sub3(c, mul3(b, 2)), a), 1 / (h * h)) };
}
/** Speed, curvature and Frenet frame of r at t (κ from |r′×r″|/|r′|³; N is undefined where κ = 0). */
export function frenet(r, t, h = 1e-3) {
  const { p, v, a } = derivs(r, t, h), sp = norm3(v), T = unit3(v), c = cross3(v, a), kappa = norm3(c) / (sp ** 3 || 1);
  const B0 = unit3(c), N0 = kappa > 1e-6 ? cross3(B0, T) : [0, 0, 0];
  return { p, v, a, speed: sp, T, N: N0, B: B0, kappa };
}
/** Arc-length table of a curve: cumulative lengths at n+1 equal parameter steps (Simpson-free: 8 sub-chords per step). */
export function lengthTable(r, t0, t1, n) {
  const L = [0];
  let prev = r(t0);
  for (let i = 1; i <= n; i++) {
    let s = L[i - 1];
    for (let k = 1; k <= 8; k++) { const q = r(t0 + ((t1 - t0) * (i - 1 + k / 8)) / n); s += norm3(sub3(q, prev)); prev = q; }
    L.push(s);
  }
  return L;
}

/** TeX for a tiny non-negative number that should read as zero: "0 (below 10^-12)" or a scientific literal. */
export function tiny(x) {
  if (x < 1e-12) return '0\\ (<10^{-12})';
  const [m, e] = x.toExponential(1).split('e');
  return `${m}\\times10^{${+e}}`;
}
