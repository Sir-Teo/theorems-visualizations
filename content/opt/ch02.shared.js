// Optimization — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports, pure functions).
//
// House style: a convex set is a thing you can *test*. Wherever the statement is "this set is convex" the picture
// runs a seeded chord test (random pairs of points of the set, are the midpoints and quarter points still in it?)
// so that a non-convex variant visibly fails; separation and projection are computed from closest pairs, never drawn.

export const TAU = Math.PI * 2;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** Small seeded generator (mulberry32) → uniform [0, 1). */
export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Even–odd point-in-polygon test. */
export function inPoly(x, y, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

/** Convex hull (monotone chain), counter-clockwise, no repeated first point. */
export function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/** Closest point of segment ab to p. */
export function segClosest(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
  const t = L < 1e-18 ? 0 : clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L, 0, 1);
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Closest point of the boundary polyline of `poly` to p, with its distance (the polygon is treated as closed). */
export function boundaryClosest(p, poly) {
  let best = null, bd = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const q = segClosest(p, poly[i], poly[(i + 1) % poly.length]), d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < bd) { bd = d; best = q; }
  }
  return { q: best, d: bd };
}

/** Distinct closest points of the boundary (local minima of the distance within `tol` of the global one). */
export function closestPoints(p, poly, tol = 2e-3) {
  const cand = [];
  for (let i = 0; i < poly.length; i++) {
    const q = segClosest(p, poly[i], poly[(i + 1) % poly.length]);
    cand.push({ q, d: Math.hypot(p[0] - q[0], p[1] - q[1]) });
  }
  const dmin = Math.min(...cand.map((c) => c.d)), out = [];
  for (const c of cand) {
    if (c.d > dmin + tol) continue;
    if (!out.some((o) => Math.hypot(o.q[0] - c.q[0], o.q[1] - c.q[1]) < 0.05)) out.push(c);
  }
  return out;
}

/** Keep the part of convex polygon `poly` with a·x + b·y ≤ c (Sutherland–Hodgman). */
export function clipHalf(poly, a, b, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = a * P[0] + b * P[1] - c, fq = a * Q[0] + b * Q[1] - c;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}

export const boxPoly = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** Polyhedron {x : n_i·x ≤ c_i} intersected with a big box, as a polygon (possibly empty). */
export function polyhedron(hs, box = boxPoly(-9, -9, 9, 9)) {
  let P = box;
  for (const h of hs) { P = clipHalf(P, h.nx, h.ny, h.c); if (!P.length) break; }
  return P;
}

/**
 * Chord test of a set given by a membership function: draw points of the set by seeded rejection sampling from the
 * box [x0, y0, x1, y1], join random pairs, and count the chords that leave the set at one of five interior points.
 * Returns {m: points found, tested, bad, worst: [a, b] (longest violating chord), pts}.
 */
export function chordTest(inside, box, { n = 1400, seed = 7, tries = 7000, keep = 280 } = {}) {
  const r = mulberry(seed), pts = [];
  for (let i = 0; i < tries && pts.length < keep; i++) {
    const x = box[0] + (box[2] - box[0]) * r(), y = box[1] + (box[3] - box[1]) * r();
    if (inside(x, y)) pts.push([x, y]);
  }
  const res = { m: pts.length, tested: 0, bad: 0, worst: null, pts };
  if (pts.length < 12) return res;
  let wl = 0;
  for (let k = 0; k < n; k++) {
    const a = pts[(r() * pts.length) | 0], b = pts[(r() * pts.length) | 0];
    res.tested++;
    for (const t of [0.2, 0.4, 0.5, 0.6, 0.8]) {
      if (!inside(a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]))) {
        res.bad++;
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (L > wl) { wl = L; res.worst = [a, b]; }
        break;
      }
    }
  }
  return res;
}

/** Test sets of the plane (membership functions) used by the convexity items. `convex` is only the textbook truth. */
export const SETS = [
  { key: 'disc', label: 'disc', convex: true, inside: (x, y) => (x - 0.3) ** 2 + y * y <= 4 },
  { key: 'lens', label: 'lens', convex: true, inside: (x, y) => (x + 0.8) ** 2 + y * y <= 4.84 && (x - 0.8) ** 2 + y * y <= 4.84 },
  { key: 'ring', label: 'ring', convex: false, inside: (x, y) => { const r = Math.hypot(x, y); return r >= 1.1 && r <= 2.3; } },
  { key: 'crescent', label: 'crescent', convex: false, inside: (x, y) => x * x + y * y <= 5.76 && (x - 1.0) ** 2 + (y - 0.2) ** 2 >= 3.6 },
  { key: 'two', label: 'two discs', convex: false, inside: (x, y) => (x + 1.8) ** 2 + (y - 0.2) ** 2 <= 1.8 || (x - 1.8) ** 2 + (y + 0.2) ** 2 <= 1.8 },
  { key: 'star', label: 'star', convex: false, inside: (x, y) => inPoly(x, y, STAR) },
];
export const STAR = Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? 1.0 : 2.5, t = Math.PI / 2 + (k * Math.PI) / 5; return [r * Math.cos(t), r * Math.sin(t)]; });

/** Is w in the cone generated by 2-D vectors `gens` (nonnegative combinations)? Conic Carathéodory: two generators suffice. */
export function inCone2(gens, w, tol = 1e-9) {
  if (Math.hypot(w[0], w[1]) < tol) return true;
  for (let i = 0; i < gens.length; i++) {
    const g = gens[i], n2 = g[0] * g[0] + g[1] * g[1];
    if (n2 < 1e-18) continue;
    const t = (w[0] * g[0] + w[1] * g[1]) / n2;
    if (t >= -tol && Math.hypot(w[0] - t * g[0], w[1] - t * g[1]) < 1e-7 * (1 + Math.hypot(w[0], w[1]))) return true;
    for (let j = i + 1; j < gens.length; j++) {
      const h = gens[j], det = g[0] * h[1] - g[1] * h[0];
      if (Math.abs(det) < 1e-12) continue;
      const a = (w[0] * h[1] - w[1] * h[0]) / det, b = (g[0] * w[1] - g[1] * w[0]) / det;
      if (a >= -tol && b >= -tol) return true;
    }
  }
  return false;
}

/** Fraction of the circle of directions lying in the cone generated by `gens` (a measure of its opening angle / 2π). */
export function coneWidth(gens, n = 1440) {
  let k = 0;
  for (let i = 0; i < n; i++) if (inCone2(gens, [Math.cos((TAU * i) / n), Math.sin((TAU * i) / n)], 1e-7)) k++;
  return k / n;
}

/** Dual cone of the cone generated by `gens` in ℝ²: the unit directions y with y·g ≥ 0 for every generator (as angle flags). */
export function dualDirs(gens, n = 1440, tol = 1e-9) {
  const ok = [];
  for (let i = 0; i < n; i++) {
    const c = Math.cos((TAU * i) / n), s = Math.sin((TAU * i) / n);
    ok.push(gens.every((g) => c * g[0] + s * g[1] >= -tol));
  }
  return ok;
}

/** Polygon of the closed convex cone of a flag set of directions, cut at radius R (a fan from the origin). */
export function fanPoly(flags, R) {
  const n = flags.length, pts = [[0, 0]];
  const idx = []; for (let i = 0; i < n; i++) if (flags[i]) idx.push(i);
  if (!idx.length) return [];
  if (idx.length === n) return Array.from({ length: n }, (_, i) => [R * Math.cos((TAU * i) / n), R * Math.sin((TAU * i) / n)]);
  // rotate so that the run of true flags is contiguous
  let start = idx.find((i) => !flags[(i - 1 + n) % n]); if (start === undefined) start = idx[0];
  for (let k = 0; k < n; k++) { const i = (start + k) % n; if (!flags[i]) break; pts.push([R * Math.cos((TAU * i) / n), R * Math.sin((TAU * i) / n)]); }
  return pts;
}

/** Sum of two 2-vectors etc. */
export const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
export const len2 = (a) => Math.hypot(a[0], a[1]);

/** Do two polygons (simple, possibly non-convex) have a common point? Edge crossings or containment. */
export function polysIntersect(P, Q) {
  const segX = (a, b, c, d) => {
    const o1 = cross(a, b, c), o2 = cross(a, b, d), o3 = cross(c, d, a), o4 = cross(c, d, b);
    return o1 * o2 < 0 && o3 * o4 < 0;
  };
  for (let i = 0; i < P.length; i++) for (let j = 0; j < Q.length; j++) if (segX(P[i], P[(i + 1) % P.length], Q[j], Q[(j + 1) % Q.length])) return true;
  return inPoly(P[0][0], P[0][1], Q) || inPoly(Q[0][0], Q[0][1], P);
}

/** Closest pair between two disjoint polygons: {a on P, b on Q, d}; d = 0 (a = b = null) when they overlap. */
export function polyDistance(P, Q) {
  if (polysIntersect(P, Q)) return { a: null, b: null, d: 0 };
  let best = { a: null, b: null, d: Infinity };
  for (const p of P) for (let i = 0; i < Q.length; i++) {
    const q = segClosest(p, Q[i], Q[(i + 1) % Q.length]), d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < best.d) best = { a: p, b: q, d };
  }
  for (const q of Q) for (let i = 0; i < P.length; i++) {
    const p = segClosest(q, P[i], P[(i + 1) % P.length]), d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < best.d) best = { a: p, b: q, d };
  }
  return best;
}

/** A smooth closed curve (as a dense polygon) used for "a convex set with a smooth boundary": a superellipse. */
export function superellipse(cx, cy, a, b, p = 2.6, n = 360, rot = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (TAU * i) / n, c = Math.cos(t), s = Math.sin(t);
    const x = a * Math.sign(c) * Math.abs(c) ** (2 / p), y = b * Math.sign(s) * Math.abs(s) ** (2 / p);
    out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return out;
}

/** Support value max over polygon vertices of a·x (valid for any polygon, convex or not). */
export const support = (poly, a) => Math.max(...poly.map((p) => a[0] * p[0] + a[1] * p[1]));
export const infimum = (poly, a) => Math.min(...poly.map((p) => a[0] * p[0] + a[1] * p[1]));
