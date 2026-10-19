// Computational Geometry — Chapter 4 (linear programming and duality): helpers shared by ch04*.js.
// Constraints are [a, b, c] meaning a·x + b·y ≤ c with (a, b) a unit normal; lines are [a, b, c] meaning a·x + b·y = c.
export * from './ch03.shared.js';
import { clipHalf, polyArea } from './ch03.shared.js';

// ------------------------------------------------------------------ half-planes and regions
export const BOX = (B) => [[-B, -B], [B, -B], [B, B], [-B, B]];
/** Half-plane to the LEFT of the directed line p → q, as [a, b, c] with a·x + b·y ≤ c (unit normal). */
export function hpABC(p, q) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, a = dy / L, b = -dx / L;
  return [a, b, a * p[0] + b * p[1]];
}
/** Intersection of the half-planes with the square [−B, B]²: a counter-clockwise polygon ([] when empty). */
export function regionOf(cons, B) {
  let poly = BOX(B);
  for (const [a, b, c] of cons) { poly = clipHalf(poly, a, b, c); if (poly.length < 3) return []; }
  return polyArea(poly) > 1e-10 ? poly : [];
}
/** Endpoints of the line a·x + b·y = c inside the window [x0, x1] × [y0, y1] (unit normal), or null. */
export function lineEnds(a, b, c, [x0, x1], [y0, y1]) {
  const px = a * c, py = b * c, dx = -b, dy = a;
  let lo = -1e9, hi = 1e9;
  for (const [p, d, m, M] of [[px, dx, x0, x1], [py, dy, y0, y1]]) {
    if (Math.abs(d) < 1e-12) { if (p < m || p > M) return null; continue; }
    let t1 = (m - p) / d, t2 = (M - p) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    lo = Math.max(lo, t1); hi = Math.min(hi, t2);
  }
  return lo < hi ? [[px + lo * dx, py + lo * dy], [px + hi * dx, py + hi * dy]] : null;
}
/** Index of the vertex of a polygon maximizing c·v. */
export function lpBest(poly, cx, cy) {
  let bi = -1, bv = -Infinity;
  poly.forEach((p, i) => { const val = cx * p[0] + cy * p[1]; if (val > bv + 1e-12) { bv = val; bi = i; } });
  return { i: bi, v: bv, p: poly[bi] };
}
/** Indices of the constraints that are tight (within tol) at p. */
export const tightAt = (cons, p, tol = 1e-7) => cons.map((q, i) => (Math.abs(q[0] * p[0] + q[1] * p[1] - q[2]) < tol ? i : -1)).filter((i) => i >= 0);

// ------------------------------------------------------------------ Seidel's randomized incremental LP
/** Random bounded 2-D LP: m constraints tangent-ish to a ring around the origin (so the origin is feasible), one per angular sector. */
export function randLP(r, m) {
  const cons = [];
  for (let k = 0; k < m; k++) {
    const th = ((k + r()) * 2 * Math.PI) / m, rr = r.uniform(1, 1.3);
    cons.push([Math.cos(th), Math.sin(th), rr]);
  }
  const ang = r.uniform(0, 2 * Math.PI);
  return { cons, c: [Math.cos(ang), Math.sin(ang)] };
}
/** Maximize c·x over the constraints taken in `order` (plus the box |x|,|y| ≤ B, which starts the algorithm).
 *  Frames: after every constraint, with the optimum, whether it was violated, and the 1-D problem solved on its boundary line. */
export function seidel(cons, order, c, B = 8) {
  const box = [[1, 0, B], [-1, 0, B], [0, 1, B], [0, -1, B]];
  let v = [B * (c[0] >= 0 ? 1 : -1), B * (c[1] >= 0 ? 1 : -1)];
  const active = box.slice();
  const frames = [{ i: 0, v: v.slice(), vOld: v.slice(), violated: false, changes: 0, work: 0, k: -1, info: null }];
  let changes = 0, work = 0;
  order.forEach((k, idx) => {
    const [a, b, r] = cons[k], vOld = v.slice();
    const violated = a * v[0] + b * v[1] > r + 1e-9;
    let info = null;
    if (violated) {
      const px = a * r, py = b * r, dx = -b, dy = a;
      let lo = -Infinity, hi = Infinity;
      for (const [aj, bj, cj] of active) {
        const den = aj * dx + bj * dy, num = cj - (aj * px + bj * py);
        if (Math.abs(den) < 1e-12) continue;
        const t = num / den;
        if (den > 0) hi = Math.min(hi, t); else lo = Math.max(lo, t);
      }
      const t = c[0] * dx + c[1] * dy > 0 ? hi : lo;
      v = [px + t * dx, py + t * dy]; changes++; work += active.length;
      info = { lo, hi, t, p0: [px, py], d: [dx, dy], p1: [px + lo * dx, py + lo * dy], p2: [px + hi * dx, py + hi * dy] };
    }
    active.push(cons[k]);
    frames.push({ i: idx + 1, k, violated, v: v.slice(), vOld, info, changes, work });
  });
  return frames;
}

// ------------------------------------------------------------------ smallest enclosing disc (Welzl / de Berg's iterative form)
export const circ2 = (p, q) => ({ x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, r: Math.hypot(p[0] - q[0], p[1] - q[1]) / 2 });
export function circ3(p, q, s) {
  const ax = p[0], ay = p[1], bx = q[0] - ax, by = q[1] - ay, cx = s[0] - ax, cy = s[1] - ay, d = 2 * (bx * cy - by * cx);
  if (Math.abs(d) <= 32 * Number.EPSILON * Math.hypot(bx, by) * Math.hypot(cx, cy)) {
    const cs = [circ2(p, q), circ2(p, s), circ2(q, s)];
    return cs.reduce((m, c) => (c.r > m.r ? c : m));
  }
  const ux = (cy * (bx * bx + by * by) - by * (cx * cx + cy * cy)) / d, uy = (bx * (cx * cx + cy * cy) - cx * (bx * bx + by * by)) / d;
  return { x: ax + ux, y: ay + uy, r: Math.hypot(ux, uy) };
}
const inDisc = (D, p) => Math.hypot(p[0] - D.x, p[1] - D.y) <= D.r
  + 32 * Number.EPSILON * Math.max(Math.abs(D.x), Math.abs(D.y), Math.abs(p[0]), Math.abs(p[1]), D.r, Number.MIN_VALUE);
/** Process P in the given order. Returns frames (one per point from the third on) and the totals of containment tests. */
export function welzlRun(P) {
  if (!P.length) return { frames: [], tests: 0, rebuilds: 0, D: null };
  if (P.length === 1) {
    const D = { x: P[0][0], y: P[0][1], r: 0 };
    return { frames: [{ i: 0, D: { ...D }, bnd: [0], reb: false, tests: 0, total: 0, rebuilds: 0 }], tests: 0, rebuilds: 0, D };
  }
  let tests = 0;
  const T = (D, p) => { tests++; return inDisc(D, p); };
  let D = circ2(P[0], P[1]), bnd = [0, 1];
  const frames = [{ i: 1, D: { ...D }, bnd: bnd.slice(), reb: false, tests: 0, total: 0, rebuilds: 0 }];
  let rebuilds = 0;
  for (let i = 2; i < P.length; i++) {
    const t0 = tests; let reb = false;
    if (!T(D, P[i])) {
      reb = true; rebuilds++;
      D = circ2(P[0], P[i]); bnd = [0, i];
      for (let j = 1; j < i; j++) {
        if (!T(D, P[j])) {
          D = circ2(P[i], P[j]); bnd = [i, j];
          for (let k = 0; k < j; k++) if (!T(D, P[k])) { D = circ3(P[i], P[j], P[k]); bnd = [i, j, k]; }
        }
      }
    }
    frames.push({ i, D: { ...D }, bnd: bnd.slice(), reb, tests: tests - t0, total: tests, rebuilds });
  }
  return { frames, tests, rebuilds, D };
}

// ------------------------------------------------------------------ arrangements and the zone of a line
/** m random lines through the window |x| ≤ 5, |y| ≤ 3.6 (unit normals, general position with probability one). */
export function randLines(r, m) {
  const L = [];
  for (let k = 0; k < m; k++) { const th = r.uniform(0, Math.PI); L.push([Math.cos(th), Math.sin(th), r.uniform(-3.6, 3.6)]); }
  return L;
}
/** The face of the arrangement containing q, clipped to the square [−B, B]²: polygon and the number of lines contributing an edge. */
export function faceAt(lines, q, B = 60) {
  let poly = BOX(B);
  for (const [a, b, c] of lines) {
    const s = a * q[0] + b * q[1] - c > 0 ? 1 : -1;
    poly = clipHalf(poly, -s * a, -s * b, -s * c);
  }
  let edges = 0;
  for (const [a, b, c] of lines) {
    const on = poly.filter((p) => Math.abs(a * p[0] + b * p[1] - c) < 1e-6);
    if (on.length >= 2 && Math.hypot(on[0][0] - on[on.length - 1][0], on[0][1] - on[on.length - 1][1]) > 1e-6) edges++;
    else if (on.length >= 3) edges++;
  }
  return { poly, edges };
}
/** The zone of the line through P0 and P1: the m + 1 faces it crosses, and their total number of edges. */
export function zoneOf(lines, P0, P1, B = 60) {
  const dx = P1[0] - P0[0], dy = P1[1] - P0[1];
  const ts = [];
  for (const [a, b, c] of lines) { const den = a * dx + b * dy; if (Math.abs(den) > 1e-12) ts.push((c - a * P0[0] - b * P0[1]) / den); }
  ts.sort((x, y) => x - y);
  const u = ts.filter((t, i) => i === 0 || t - ts[i - 1] > 1e-9);
  const samples = [];
  if (!u.length) samples.push(0); else { samples.push(u[0] - 1); for (let i = 0; i + 1 < u.length; i++) samples.push((u[i] + u[i + 1]) / 2); samples.push(u[u.length - 1] + 1); }
  const faces = samples.map((t) => faceAt(lines, [P0[0] + t * dx, P0[1] + t * dy], B));
  return { faces, total: faces.reduce((s, f) => s + f.edges, 0), ts: u };
}

// ------------------------------------------------------------------ discrepancy of point sets with respect to half-planes
const SQ = [[0, 0], [1, 0], [1, 1], [0, 1]];
export function halton(i, base) { let f = 1, r = 0; while (i > 0) { f /= base; r += f * (i % base); i = Math.floor(i / base); } return r; }
/** n = k² points in the unit square: 'random', 'jittered' (one per cell), 'regular' (cell centres) or 'halton'. */
export function pixelPattern(kind, k, r) {
  const n = k * k, P = [];
  if (kind === 'random') for (let i = 0; i < n; i++) P.push([r(), r()]);
  else if (kind === 'jittered') for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) P.push([(i + r()) / k, (j + r()) / k]);
  else if (kind === 'regular') for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) P.push([(i + 0.5) / k, (j + 0.5) / k]);
  else for (let i = 1; i <= n; i++) P.push([halton(i, 2), halton(i, 3)]);
  return P;
}
/** For the direction θ (half-planes u·x ≤ c, u = (cos θ, sin θ)): the largest |area − fraction of points| over all offsets c, and the c attaining it. */
export function discAt(P, th) {
  const n = P.length, a = Math.cos(th), b = Math.sin(th);
  const s = P.map((p) => a * p[0] + b * p[1]).sort((x, y) => x - y);
  let best = 0, bc = 0, bk = 0;
  for (let i = 0; i < n; i++) {
    const A = polyArea(clipHalf(SQ, a, b, s[i]));
    for (const k of [i, i + 1]) { const d = Math.abs(A - k / n); if (d > best) { best = d; bc = s[i]; bk = k; } }
  }
  return { d: best, c: bc, k: bk };
}
/** Discrepancy over `nth` directions in [0, 2π): the maximum and the whole curve. */
export function discrepancy(P, nth = 720) {
  let best = { d: -1 };
  const curve = [];
  for (let j = 0; j < nth; j++) {
    const th = (2 * Math.PI * j) / nth, q = discAt(P, th);
    curve.push(q.d);
    if (q.d > best.d) best = { ...q, th };
  }
  return { ...best, curve };
}
export const areaLeft = (th, c) => polyArea(clipHalf(SQ, Math.cos(th), Math.sin(th), c));
