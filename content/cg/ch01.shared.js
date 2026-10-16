// Computational Geometry — Chapter 1 (primitives and robustness): helpers shared by ch01.js and ch01-b.js.
// Everything numerical is real IEEE-754 double arithmetic; "exact" means BigInt arithmetic on the doubles'
// exact binary values, so there is no rounding at all.

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

// ------------------------------------------------------------------ plain orientation on small coordinates
/** 2×2 determinant (b−a)×(c−a): twice the signed area of triangle abc (positive = counter-clockwise). */
export const det3 = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
export const orient = (a, b, c) => sgn(det3(a, b, c));

/** Do closed segments ab and cd share a point? Orientation tests only (the textbook algorithm). */
export function segTest(a, b, c, d, eps = 1e-12) {
  const o = (p, q, r) => { const t = det3(p, q, r); return Math.abs(t) < eps ? 0 : t > 0 ? 1 : -1; };
  const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
  const on = (p, q, r) => Math.min(p[0], q[0]) - eps <= r[0] && r[0] <= Math.max(p[0], q[0]) + eps && Math.min(p[1], q[1]) - eps <= r[1] && r[1] <= Math.max(p[1], q[1]) + eps;
  let kind = 'none';
  if (o1 * o2 < 0 && o3 * o4 < 0) kind = 'cross';
  else if ((o1 === 0 && on(a, b, c)) || (o2 === 0 && on(a, b, d)) || (o3 === 0 && on(c, d, a)) || (o4 === 0 && on(c, d, b))) kind = o1 === 0 && o2 === 0 && o3 === 0 && o4 === 0 ? 'overlap' : 'touch';
  return { o1, o2, o3, o4, hit: kind !== 'none', kind };
}

/** Independent check: solve a + t(b−a) = c + u(d−c) for t, u in [0,1]; collinear case by 1-D projection. */
export function segSolve(a, b, c, d, eps = 1e-9) {
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0];
  const qp = [c[0] - a[0], c[1] - a[1]];
  if (Math.abs(den) > 1e-12) {
    const t = (qp[0] * s[1] - qp[1] * s[0]) / den, u = (qp[0] * r[1] - qp[1] * r[0]) / den;
    return t >= -eps && t <= 1 + eps && u >= -eps && u <= 1 + eps;
  }
  if (Math.abs(qp[0] * r[1] - qp[1] * r[0]) > 1e-9) return false; // parallel, different lines
  const rr = r[0] * r[0] + r[1] * r[1]; if (rr < 1e-18) return Math.hypot(...qp) < eps;
  const t0 = (qp[0] * r[0] + qp[1] * r[1]) / rr, t1 = t0 + (s[0] * r[0] + s[1] * r[1]) / rr;
  return Math.max(Math.min(t0, t1), 0) <= Math.min(Math.max(t0, t1), 1) + eps;
}

// ------------------------------------------------------------------ polygons
/** Winding number and crossing number of point p with respect to a closed polygon, for the rightward ray (half-open rule). */
export function windCross(p, poly) {
  let w = 0, cross = 0; const hits = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const up = a[1] <= p[1] && b[1] > p[1], dn = a[1] > p[1] && b[1] <= p[1];
    if (up || dn) {
      const x = a[0] + ((p[1] - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
      if (x > p[0]) { cross++; w += up ? 1 : -1; hits.push({ x, up, i }); }
    }
  }
  return { w, cross, hits };
}
/** Winding number by summing signed angles (independent of the ray). */
export function windAngle(p, poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    s += Math.atan2((a[0] - p[0]) * (b[1] - p[1]) - (a[1] - p[1]) * (b[0] - p[0]), (a[0] - p[0]) * (b[0] - p[0]) + (a[1] - p[1]) * (b[1] - p[1]));
  }
  return Math.round(s / (2 * Math.PI));
}
export const signedArea = (poly) => { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };

/** Do two (open) polygon edges properly cross? Used to test whether a polygon is simple. */
export function isSimple(poly) {
  const n = poly.length;
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const a = poly[i], b = poly[(i + 1) % n], c = poly[j], d = poly[(j + 1) % n];
    if (orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0) return false;
  }
  return true;
}

// ------------------------------------------------------------------ exact arithmetic (BigInt)
const dv = new DataView(new ArrayBuffer(8));
/** Exact decomposition of a finite double: x = m · 2^e with m a BigInt. */
export function decompose(x) {
  if (x === 0) return [0n, 0];
  dv.setFloat64(0, x); const hi = dv.getUint32(0), lo = dv.getUint32(4);
  const E = (hi >>> 20) & 0x7ff; let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo), e;
  if (E === 0) e = -1074; else { m |= 1n << 52n; e = E - 1075; }
  return [hi >>> 31 ? -m : m, e];
}
/** Exact sign of (b−a)×(c−a) for double coordinates, by BigInt arithmetic on their exact values. */
export function exactOrient(ax, ay, bx, by, cx, cy) {
  const D = [ax, ay, bx, by, cx, cy].map(decompose);
  let emin = Infinity; for (const [m, e] of D) if (m !== 0n && e < emin) emin = e;
  if (emin === Infinity) return 0;
  const I = D.map(([m, e]) => (m === 0n ? 0n : m << BigInt(e - emin)));
  const d = (I[2] - I[0]) * (I[5] - I[1]) - (I[3] - I[1]) * (I[4] - I[0]);
  return d > 0n ? 1 : d < 0n ? -1 : 0;
}

// ------------------------------------------------------------------ floating-point orientation, three algebraically equal forms
/** (qx−px)(ry−py) − (qy−py)(rx−px) in double precision. */
export const floatDet = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
/** The same determinant with the three points cyclically relabelled: k = 0, 1, 2 (equal in exact arithmetic). */
export function floatOrient(k, p, q, r) {
  const [a, b, c] = k === 0 ? [p, q, r] : k === 1 ? [q, r, p] : [r, p, q];
  return sgn(floatDet(a[0], a[1], b[0], b[1], c[0], c[1]));
}

// ------------------------------------------------------------------ Shewchuk-style adaptive orient2d
// Error-free transformations (Knuth, Dekker) and expansions (nonoverlapping sums of doubles); the stages and the
// error bounds follow Shewchuk's orient2d (predicates.c, 1997).
export const cost = { flops: 0 };
const SPLITTER = 134217729; // 2^27 + 1
const EPS = 2 ** -53;
const ERR_A = (3 + 16 * EPS) * EPS, ERR_B = (2 + 12 * EPS) * EPS, ERR_C = (9 + 64 * EPS) * EPS * EPS, ERR_RES = (3 + 8 * EPS) * EPS;
function twoSum(a, b) { const x = a + b, bv = x - a, av = x - bv; cost.flops += 6; return [x, (a - av) + (b - bv)]; }
function twoDiff(a, b) { const x = a - b, bv = a - x, av = x + bv; cost.flops += 6; return [x, (a - av) + (bv - b)]; }
function split(a) { const c = SPLITTER * a, abig = c - a, hi = c - abig; return [hi, a - hi]; }
function twoProd(a, b) {
  const x = a * b, [ah, al] = split(a), [bh, bl] = split(b); cost.flops += 17;
  return [x, al * bl - (((x - ah * bh) - al * bh) - ah * bl)];
}
/** Add a double to an expansion (smallest-to-largest, zeros removed). */
function grow(e, b) {
  const h = []; let Q = b;
  for (const x of e) { const [s, t] = twoSum(Q, x); Q = s; if (t !== 0) h.push(t); }
  if (Q !== 0 || h.length === 0) h.push(Q);
  return h;
}
const expSign = (e) => sgn(e[e.length - 1]);

/**
 * Adaptive orient2d(a, b, c) = (ax−cx)(by−cy) − (ay−cy)(bx−cx), correct sign always.
 * Returns {sign, stage} with stage 'A' (plain float filter), 'B' (exact product of rounded differences),
 * 'C' (tail correction) or 'D' (full exact expansion).
 */
export function orientAdaptive(ax, ay, bx, by, cx, cy, force = false) {
  const acx = ax - cx, bcx = bx - cx, acy = ay - cy, bcy = by - cy; cost.flops += 4;
  let det, dsum;
  if (!force) {
    const dl = acx * bcy, dr = acy * bcx; det = dl - dr; cost.flops += 3;
    if (dl > 0) { if (dr <= 0) return { sign: sgn(det), stage: 'A' }; dsum = dl + dr; }
    else if (dl < 0) { if (dr >= 0) return { sign: sgn(det), stage: 'A' }; dsum = -dl - dr; }
    else return { sign: sgn(det), stage: 'A' };
    let eb = ERR_A * dsum; cost.flops += 3;
    if (det >= eb || -det >= eb) return { sign: sgn(det), stage: 'A' };
    // stage B: exact (acx·bcy − acy·bcx) for the rounded differences
    const [l1, l0] = twoProd(acx, bcy), [r1, r0] = twoProd(acy, bcx);
    const B = grow(grow(grow([l0], l1), -r0), -r1);
    det = B.reduce((s, x) => s + x, 0); cost.flops += 4; eb = ERR_B * dsum;
    if (det >= eb || -det >= eb) return { sign: sgn(det), stage: 'B' };
    const [, acxt] = twoDiff(ax, cx), [, bcxt] = twoDiff(bx, cx), [, acyt] = twoDiff(ay, cy), [, bcyt] = twoDiff(by, cy);
    if (acxt === 0 && acyt === 0 && bcxt === 0 && bcyt === 0) return { sign: expSign(B), stage: 'B' };
    // stage C: first-order correction from the tails of the differences
    eb = ERR_C * dsum + ERR_RES * Math.abs(det); cost.flops += 20;
    det += (acx * bcyt + bcy * acxt) - (acy * bcxt + bcx * acyt);
    if (det >= eb || -det >= eb) return { sign: sgn(det), stage: 'C' };
    return { sign: stageD(acx, acxt, acy, acyt, bcx, bcxt, bcy, bcyt), stage: 'D' };
  }
  const acxt = twoDiff(ax, cx)[1], bcxt = twoDiff(bx, cx)[1], acyt = twoDiff(ay, cy)[1], bcyt = twoDiff(by, cy)[1];
  return { sign: stageD(acx, acxt, acy, acyt, bcx, bcxt, bcy, bcyt), stage: 'D' };
}
/** Stage D: the whole determinant as an exact expansion. */
function stageD(acx, acxt, acy, acyt, bcx, bcxt, bcy, bcyt) {
  let E = [];
  for (const [u, w, s] of [[acx, bcy, 1], [acx, bcyt, 1], [acxt, bcy, 1], [acxt, bcyt, 1], [acy, bcx, -1], [acy, bcxt, -1], [acyt, bcx, -1], [acyt, bcxt, -1]]) {
    const [p1, p0] = twoProd(u, w); E = grow(grow(E, s * p0), s * p1);
  }
  return expSign(E);
}

// ------------------------------------------------------------------ convex hull (monotone chain) with a pluggable predicate
/** Andrew's monotone chain; orientFn(a, b, c) must return +1 for a left turn. Points are [x, y, id]. */
export function hullWith(pts, orientFn) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const half = (arr) => { const h = []; for (const p of arr) { while (h.length >= 2 && orientFn(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); } h.pop(); return h; };
  return [...half(P), ...half(P.slice().reverse())];
}

// ------------------------------------------------------------------ symbolic perturbation (Simulation of Simplicity style)
// A polynomial in the infinitesimal ε is a Map exponent → integer coefficient; its sign is the sign of the lowest-order term.
const padd = (A, B, s = 1) => { const R = new Map(A); for (const [k, c] of B) { const t = (R.get(k) || 0) + s * c; if (t === 0) R.delete(k); else R.set(k, t); } return R; };
const pmul = (A, B) => { const R = new Map(); for (const [i, a] of A) for (const [j, b] of B) { const t = (R.get(i + j) || 0) + a * b; if (t === 0) R.delete(i + j); else R.set(i + j, t); } return R; };
const pnum = (c) => (c === 0 ? new Map() : new Map([[0, c]]));
/** Coordinate x_i + ε^{2^{2i}} (k = 0) or y_i + ε^{2^{2i+1}} (k = 1): distinct exponents for all coordinates of all points. */
const pcoord = (c, i, k) => new Map([[0, c], [2 ** (2 * i + k), 1]]);
export const psign = (P) => { if (!P.size) return 0; const k = Math.min(...P.keys()); return sgn(P.get(k)); };
/** Orientation of three labelled points after perturbing point i by (ε^{2^{2i}}, ε^{2^{2i+1}}); never zero for distinct labels. */
export function orientSoS(a, ai, b, bi, c, ci) {
  const X = (p, i) => pcoord(p[0], i, 0), Y = (p, i) => pcoord(p[1], i, 1);
  const t1 = pmul(padd(X(b, bi), X(a, ai), -1), padd(Y(c, ci), Y(a, ai), -1));
  const t2 = pmul(padd(Y(b, bi), Y(a, ai), -1), padd(X(c, ci), X(a, ai), -1));
  return psign(padd(t1, t2, -1));
}
/** In-circle determinant of labelled points: > 0 iff d lies inside the circle through counter-clockwise a, b, c (perturbed). */
export function inCircleSoS(pts, ids) {
  const [a, b, c, d] = pts, [ia, ib, ic, id] = ids;
  const X = (p, i) => pcoord(p[0], i, 0), Y = (p, i) => pcoord(p[1], i, 1);
  const row = (p, i) => { const dx = padd(X(p, i), X(d, id), -1), dy = padd(Y(p, i), Y(d, id), -1); return [dx, dy, padd(pmul(dx, dx), pmul(dy, dy))]; };
  const [r1, r2, r3] = [row(a, ia), row(b, ib), row(c, ic)];
  const m = (u, v) => padd(pmul(u[0], v[1]), pmul(u[1], v[0]), -1); // 2×2 minors of the first two columns
  let D = padd(pmul(r1[2], m(r2, r3)), pmul(r2[2], m(r3, r1)));
  D = padd(D, pmul(r3[2], m(r1, r2)));
  return psign(D);
}
/** The same in-circle determinant on the unperturbed coordinates (sign only). */
export function inCircle(a, b, c, d) {
  const r = (p) => { const dx = p[0] - d[0], dy = p[1] - d[1]; return [dx, dy, dx * dx + dy * dy]; };
  const [r1, r2, r3] = [r(a), r(b), r(c)];
  return sgn(r1[2] * (r2[0] * r3[1] - r2[1] * r3[0]) + r2[2] * (r3[0] * r1[1] - r3[1] * r1[0]) + r3[2] * (r1[0] * r2[1] - r1[1] * r2[0]));
}
