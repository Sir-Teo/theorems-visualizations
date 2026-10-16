// Differential Geometry — Chapter 3 (Global properties of curves): helpers shared by ch03.js and ch03-b.js.
// Re-exports the chapter-2 helpers (vectors, Frenet curves, scene/plot factories) and adds closed plane curves:
// a trigonometric interpolant through draggable points, sampling with curvature / tangent angle / area,
// self-intersection detection, support-function curves, random lines.
export * from './ch02.shared.js';
import { TAU, clamp } from './ch02.shared.js';

/** Closed trigonometric interpolant through an odd number N of plane points at t_j = 2πj/N (C^∞, exact derivatives). */
export function fourier2(pts) {
  const N = pts.length, K = (N - 1) / 2;
  const a0 = [0, 1].map((i) => pts.reduce((s, p) => s + p[i], 0) / N);
  const A = [], B = [];
  for (let k = 1; k <= K; k++) {
    A.push([0, 1].map((i) => (2 / N) * pts.reduce((s, p, j) => s + p[i] * Math.cos((k * TAU * j) / N), 0)));
    B.push([0, 1].map((i) => (2 / N) * pts.reduce((s, p, j) => s + p[i] * Math.sin((k * TAU * j) / N), 0)));
  }
  // {p, d1, d2, d3} at t
  return (t) => {
    const p = a0.slice(), d1 = [0, 0], d2 = [0, 0];
    for (let k = 1; k <= K; k++) {
      const c = Math.cos(k * t), s = Math.sin(k * t);
      for (let i = 0; i < 2; i++) {
        p[i] += A[k - 1][i] * c + B[k - 1][i] * s;
        d1[i] += k * (-A[k - 1][i] * s + B[k - 1][i] * c);
        d2[i] -= k * k * (A[k - 1][i] * c + B[k - 1][i] * s);
      }
    }
    return { p, d1, d2 };
  };
}
/** Points f(2πj/N), j = 0..N-1 (to seed handles). */
export const ringPts = (f, N = 9) => Array.from({ length: N }, (_, j) => f((TAU * j) / N));

/** Evaluator {p, d1, d2} of a parametrized plane curve r(t) by 5-point central differences (for curves given only as r). */
export function numEval(r, h = 1e-3) {
  return (t) => {
    const f = [-2, -1, 0, 1, 2].map((k) => r(t + k * h));
    const d1 = [0, 1].map((i) => (f[0][i] - 8 * f[1][i] + 8 * f[3][i] - f[4][i]) / (12 * h));
    const d2 = [0, 1].map((i) => (-f[0][i] + 16 * f[1][i] - 30 * f[2][i] + 16 * f[3][i] - f[4][i]) / (12 * h * h));
    return { p: f[2], d1, d2 };
  };
}

/**
 * Sample a closed plane curve ev(t) → {p, d1, d2} on [t0, t0 + period) at m equally spaced parameters.
 * Returns P (points), sp (speed), kappa (signed curvature), s (arc length, s[m] = L), th (tangent angle, unwrapped from th[0],
 * th[m] = turning over the whole curve), L, A (signed area, ½∮ x dy − y dx), K (∫κ ds), rot (rotation index = K / 2π),
 * minSp. Trapezoid sums are spectrally accurate for smooth periodic integrands.
 */
export function sampleClosed(ev, m = 480, t0 = 0, period = TAU) {
  const dt = period / m, P = [], sp = [], kappa = [], th = [], s = [0], T = [];
  let A = 0, K = 0, prev = 0;
  for (let i = 0; i <= m; i++) {
    const e = ev(t0 + i * dt), v = e.d1, w = e.d2, q = Math.hypot(v[0], v[1]) || 1e-300;
    sp.push(q); kappa.push((v[0] * w[1] - v[1] * w[0]) / (q * q * q));
    T.push([v[0] / q, v[1] / q]);
    let a = Math.atan2(v[1], v[0]);
    if (i === 0) prev = a; else { let d = a - prev; d -= TAU * Math.round(d / TAU); prev += d; }
    th.push(prev);
    if (i < m) { P.push(e.p); A += 0.5 * (e.p[0] * v[1] - e.p[1] * v[0]) * dt; K += kappa[i] * q * dt; }
    if (i > 0) s.push(s[i - 1] + 0.5 * (sp[i - 1] + sp[i]) * dt);
  }
  return { m, dt, P, sp, kappa, th, s, T, L: s[m], A, K, rot: K / TAU, minSp: Math.min(...sp.slice(0, m)) };
}

/** Intersection point of segments ab and cd (interior crossings only), or null. */
export function segX(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]], q = [d[0] - c[0], d[1] - c[1]], den = r[0] * q[1] - r[1] * q[0];
  if (Math.abs(den) < 1e-14) return null;
  const u = ((c[0] - a[0]) * q[1] - (c[1] - a[1]) * q[0]) / den, w = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  if (u <= 0 || u >= 1 || w <= 0 || w >= 1) return null;
  return [a[0] + u * r[0], a[1] + u * r[1]];
}
/** Transversal self-crossings of the closed polygon P (points, last joined to first): list of [x, y]. */
export function crossings(P) {
  const n = P.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const x = segX(a, b, P[j], P[(j + 1) % n]);
      if (x) out.push(x);
    }
  }
  return out;
}
/** Even-odd (ray-casting) crossing count of the ray from q to +x with polygon P. */
export function rayCount(P, q) {
  let c = 0; const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    if ((a[1] > q[1]) !== (b[1] > q[1])) { const x = a[0] + ((q[1] - a[1]) / (b[1] - a[1])) * (b[0] - a[0]); if (x > q[0]) c++; }
  }
  return c;
}
/** Winding number of closed polygon P about q. */
export function windingAbout(P, q) {
  let tot = 0; const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    tot += Math.atan2((a[0] - q[0]) * (b[1] - q[1]) - (a[1] - q[1]) * (b[0] - q[0]), (a[0] - q[0]) * (b[0] - q[0]) + (a[1] - q[1]) * (b[1] - q[1]));
  }
  return Math.round(tot / TAU);
}
/** Local extrema (vertices) of a closed periodic sequence k[0..m-1], ignoring swings smaller than tol: {max: [idx], min: [idx]}. */
export function periodicExtrema(k, tol) {
  const m = k.length, out = { max: [], min: [] };
  let i0 = 0; for (let i = 1; i < m; i++) if (k[i] < k[i0]) i0 = i;
  out.min.push(i0);
  let mode = 1, best = i0, bv = k[i0];
  for (let step = 1; step <= m; step++) {
    const idx = (i0 + step) % m, val = k[idx];
    if (mode > 0) {
      if (val > bv) { best = idx; bv = val; } else if (bv - val > tol) { out.max.push(best); mode = -1; best = idx; bv = val; }
    } else if (val < bv) { best = idx; bv = val; } else if (val - bv > tol) { if (step < m) out.min.push(best); mode = 1; best = idx; bv = val; }
  }
  if (!out.max.length) return { max: [], min: [] };
  return out;
}

/** Support-function curve: boundary p(θ) = h u + h′ u′ (u = (cosθ, sinθ)) for h given with its derivative. Returns [x, y]. */
export const supportPoint = (h, hp, th) => [h * Math.cos(th) - hp * Math.sin(th), h * Math.sin(th) + hp * Math.cos(th)];
/** Width of a convex polygon P in direction φ: max⟨p,u⟩ − min⟨p,u⟩. */
export function widthDir(P, phi) {
  const c = Math.cos(phi), s = Math.sin(phi); let lo = Infinity, hi = -Infinity;
  for (const p of P) { const d = p[0] * c + p[1] * s; if (d < lo) lo = d; if (d > hi) hi = d; }
  return hi - lo;
}
/** Boundary polygon of a regular Reuleaux n-gon (n odd) of width w, centred at the origin (n·m points). */
export function reuleaux(n, w, per = 60) {
  // vertices on a circle of radius R with longest diagonal = w:  w = 2R sin(π(n−1)/(2n)) ... (diagonal skipping (n−1)/2 vertices)
  const R = w / (2 * Math.sin((Math.PI * (n - 1)) / (2 * n)));
  const V = Array.from({ length: n }, (_, j) => [R * Math.cos(Math.PI / 2 + (TAU * j) / n), R * Math.sin(Math.PI / 2 + (TAU * j) / n)]);
  const pts = [];
  for (let j = 0; j < n; j++) {
    // arc centred at the vertex opposite to the pair (j+(n-1)/2, j+(n+1)/2): its endpoints
    const c = V[j], e1 = V[(j + (n - 1) / 2) % n], e2 = V[(j + (n + 1) / 2) % n];
    let a1 = Math.atan2(e1[1] - c[1], e1[0] - c[0]), a2 = Math.atan2(e2[1] - c[1], e2[0] - c[0]);
    let d = a2 - a1; d -= TAU * Math.round(d / TAU);
    for (let i = 0; i < per; i++) { const a = a1 + (d * i) / per; pts.push([c[0] + w * Math.cos(a), c[1] + w * Math.sin(a)]); }
  }
  // order the arcs counter-clockwise by angle about the origin
  pts.sort((p, q) => Math.atan2(p[1], p[0]) - Math.atan2(q[1], q[0]));
  return { pts, V };
}
/** Polygon area (positive for counter-clockwise). */
export const polyArea = (P) => 0.5 * P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
export const polyLen = (P) => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);

/** A plane stage with equal axes and no axes drawn. */
export function plane(v, o = {}) {
  return v.stage({ x: o.x ?? [-2.2, 2.2], y: o.y ?? [-1.75, 1.75], equal: true, axes: false, height: o.height ?? 380, weight: o.weight ?? 1.2, minWidth: o.minWidth ?? 290, title: o.title, full: !!o.full });
}
/** Colour of a position u ∈ [0,1) along a closed curve (blue → red → blue). */
export const hueAlong = (v, u) => v.mix('blue', 'red', 1 - Math.abs(2 * (((u % 1) + 1) % 1) - 1));

// ───────────────────────────────────────────────────────────── presets of plane curves (parametrized on [0, 2π))
export const SHAPES = {
  circle: { name: 'circle', f: (t) => [1.3 * Math.cos(t), 1.3 * Math.sin(t)] },
  ellipse: { name: 'ellipse', f: (t) => [1.7 * Math.cos(t), 0.95 * Math.sin(t)] },
  egg: { name: 'egg', f: (t) => [1.5 * Math.cos(t) + 0.28 * Math.cos(2 * t) - 0.2, 1.1 * Math.sin(t) + 0.12 * Math.sin(2 * t)] },
  bean: { name: 'bean (not convex)', f: (t) => [1.55 * Math.cos(t) + 0.05, 1.0 * Math.sin(t) - 0.42 * Math.cos(t) * Math.cos(t) + 0.2 + 0.05 * Math.cos(2 * t)] },
  figure8: { name: 'figure eight', f: (t) => [1.6 * Math.sin(t), 0.95 * Math.sin(2 * t)] },
  limacon: { name: 'limaçon with a loop', f: (t) => { const r = 0.5 + Math.cos(t); return [1.15 * r * Math.cos(t) - 0.35, 1.15 * r * Math.sin(t)]; } },
  rosette: { name: 'three-lobed rosette', f: (t) => [(1.3 + 0.3 * Math.cos(3 * t)) * Math.cos(t), (1.3 + 0.3 * Math.cos(3 * t)) * Math.sin(t)] },
};

/**
 * Convex curve of constant width w from its support function h(θ) = w/2 + Σ h_k cos kθ (odd k = 3, 5, 7), whose radius of
 * curvature is ρ = h + h″ = (w/2)(1 + r3 cos 3θ + r5 cos 5θ + r7 cos 7θ). The r's are scaled so that |r3|+|r5|+|r7| ≤ 0.98 (ρ > 0).
 * Returns m boundary points p(θ) = h u + h′ u′ and the normalised coefficients.
 */
export function widthCurve(w, r3 = 0, r5 = 0, r7 = 0, m = 720) {
  const s = Math.abs(r3) + Math.abs(r5) + Math.abs(r7), f = s > 0.98 ? 0.98 / s : 1;
  const rk = [[3, r3 * f], [5, r5 * f], [7, r7 * f]], pts = [];
  for (let i = 0; i < m; i++) {
    const th = (TAU * i) / m; let h = w / 2, hp = 0;
    for (const [k, r] of rk) { const hk = (-(w / 2) * r) / (k * k - 1); h += hk * Math.cos(k * th); hp += -k * hk * Math.sin(k * th); }
    pts.push(supportPoint(h, hp, th));
  }
  return { pts, r: rk.map((x) => x[1]) };
}
/** Rotate points by φ about the origin. */
export const rotPts = (P, phi) => { const c = Math.cos(phi), s = Math.sin(phi); return P.map((p) => [c * p[0] - s * p[1], s * p[0] + c * p[1]]); };
