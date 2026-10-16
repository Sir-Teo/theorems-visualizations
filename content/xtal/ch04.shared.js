// Crystallography — Chapter 4 shared helpers. Re-exports the chapter-3 helpers (which re-export chapter 1's); adds index algebra, reciprocal bases,
// plane sections of a cell, orbits of planes/directions under point-group matrices, and a handle that snaps to integer indices.
export * from './ch03.shared.js';
import { dot, cross, comb, unit, sub, norm, clamp, mv3 } from './ch03.shared.js';

export const gcd2 = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const gcd3 = (a) => gcd2(gcd2(a[0], a[1]), a[2]);
export const lcm2 = (a, b) => (a && b ? Math.abs(a * b) / gcd2(a, b) : 0);
export const fixZero = (x) => (Object.is(x, -0) || Math.abs(x) < 1e-9 ? 0 : x);
export const rint = (a) => a.map((x) => fixZero(Math.round(x + 1e-9 * Math.sign(x))));
/** n, written with an overbar when negative (TeX). */
export const barTex = (n) => (n < 0 ? `\\bar{${-n}}` : `${n}`);
/** Index triple in brackets, e.g. idxTex([1,-1,0], '(', ')') = (1\bar{1}0); entries of two or more digits are comma-separated. */
export function idxTex(a, open = '(', close = ')') {
  const wide = a.some((x) => Math.abs(x) > 9);
  return `${open}${a.map(barTex).join(wide ? ',\\,' : '')}${close}`;
}
export const reduceIdx = (a) => { const g = gcd3(a) || 1; return a.map((x) => fixZero(x / g)); };

// ------------------------------------------------------------------ 3x3 inverse, reciprocal basis, metric tensors
export function inv3(A) {
  const [a, b, c] = A[0], [d, e, f] = A[1], [g, h, i] = A[2];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [[(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det], [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det], [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]];
}
/** Rows a*_i with a*_i . a_j = delta_ij (no 2 pi), for the direct basis rows V. */
export function recipBasis(V) {
  const vol = dot(V[0], cross(V[1], V[2]));
  return [cross(V[1], V[2]), cross(V[2], V[0]), cross(V[0], V[1])].map((r) => r.map((x) => x / vol));
}
export const quad = (G, p, q) => p.reduce((s, x, i) => s + x * (G[i][0] * q[0] + G[i][1] * q[1] + G[i][2] * q[2]), 0);
export const gramOf = (V) => V.map((r) => V.map((s) => dot(r, s)));

/** 1/d_hkl^2 from the reciprocal metric tensor (valid for every cell). */
export const invD2 = (V, hkl) => quad(inv3(gramOf(V)), hkl, hkl);
export const dSpacing = (V, hkl) => 1 / Math.sqrt(invD2(V, hkl));

/** Cells used by several items: [a, b, c, alpha, beta, gamma]. Monoclinic has the unique axis c (so a 2-fold axis along z, as in the point-group generators). */
export const CELLS = {
  cubic: [1, 1, 1, 90, 90, 90], tetragonal: [1, 1, 1.45, 90, 90, 90], orthorhombic: [1, 1.25, 1.6, 90, 90, 90],
  hexagonal: [1, 1, 1.6, 90, 90, 120], monoclinic: [1, 1.2, 1.4, 90, 90, 105], triclinic: [1, 1.2, 1.45, 80, 95, 102],
};

// ------------------------------------------------------------------ the plane  n . f = m  inside the fractional box [lo, hi]^3
/** Cartesian polygon (ordered) of the plane sum_i n_i f_i = m clipped to the fractional box; null if it misses the box. n is real (not necessarily integer). */
export function planeSection(V, n, m, lo = 0, hi = 1) {
  const A = recipBasis(V), cs = [];
  for (let x = 0; x < 8; x++) cs.push([lo + (hi - lo) * (x & 1), lo + (hi - lo) * ((x >> 1) & 1), lo + (hi - lo) * ((x >> 2) & 1)]);
  const pts = [], add = (p) => { if (!pts.some((q) => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) + Math.abs(q[2] - p[2]) < 1e-7)) pts.push(p); };
  for (let x = 0; x < 8; x++) for (let k = 0; k < 3; k++) if (!((x >> k) & 1)) {
    const p = cs[x], q = cs[x | (1 << k)], d0 = dot(n, p) - m, d1 = dot(n, q) - m;
    if (Math.abs(d0) < 1e-9) add(p);
    if (Math.abs(d1) < 1e-9) add(q);
    if (d0 * d1 < -1e-18) { const t = d0 / (d0 - d1); add(p.map((c, i) => c + (q[i] - c) * t)); }
  }
  if (pts.length < 3) return null;
  const P = pts.map((f) => comb(f, V)), c = P.reduce((s, p) => s.map((t, i) => t + p[i] / P.length), [0, 0, 0]);
  const nc = unit(comb(n, A)), e1 = unit(sub(P[0], c)), e2 = cross(nc, e1);
  return P.map((p) => ({ p, a: Math.atan2(dot(sub(p, c), e2), dot(sub(p, c), e1)) })).sort((u, w) => u.a - w.a).map((o) => o.p);
}

// ------------------------------------------------------------------ orbits under point-group matrices (Cartesian), cell basis rows V
/** Distinct planes (hkl) obtained from hkl by the Cartesian matrices `ops` (the cell must be compatible with them). */
export function planeOrbit(ops, V, hkl) {
  const A = recipBasis(V), g = comb(hkl, A), out = [], seen = new Set();
  for (const R of ops) {
    const g2 = mv3(R, g), q = rint(V.map((a) => dot(a, g2))), k = q.join(',');
    if (!seen.has(k)) { seen.add(k); out.push(q); }
  }
  return out;
}
/** Distinct directions [uvw] obtained from uvw by `ops`. */
export function dirOrbit(ops, V, uvw) {
  const A = recipBasis(V), r = comb(uvw, V), out = [], seen = new Set();
  for (const R of ops) {
    const r2 = mv3(R, r), q = rint(A.map((b) => dot(b, r2))), k = q.join(',');
    if (!seen.has(k)) { seen.add(k); out.push(q); }
  }
  return out;
}
/** Distinct images of the integer vector f under integer matrices M (acting on fractional coordinates). */
export function intOrbit(Ms, f) {
  const out = [], seen = new Set();
  for (const M of Ms) { const q = rint(mv3(M, f)), k = q.join(','); if (!seen.has(k)) { seen.add(k); out.push(q); } }
  return out;
}

// ------------------------------------------------------------------ a scene3 handle that snaps to integer indices, tied to integer sliders
/**
 * Creates three integer sliders and a scene3 handle that stay in sync. `toPos(idx)` maps integer indices to a scene point, `toIdx(p)` back (real).
 * Returns { get(): current integer indices, set(idx), h }.  Both toPos and toIdx may read variables that change (e.g. the chosen cell).
 */
export function indexHandle(v, sc, { names, init, range = 2, color = 'accent', label, toPos, toIdx, onChange }) {
  let cur = init.slice(), busy = false;
  const clampIdx = (a) => a.map((x) => clamp(Math.round(x), -range, range));
  const sl = names.map((n, i) => v.slider(n, -range, range, init[i], {
    int: true,
    onChange: (x) => { if (busy) return; busy = true; cur[i] = Math.round(x); h.set(toPos(cur)); busy = false; onChange && onChange(); },
  }));
  const h = sc.handle(toPos(init), {
    color, label, lim: 99, r: 7.5,
    snap: (p) => toPos(clampIdx(toIdx(p))),
    onDrag: () => { if (busy) return; busy = true; cur = rint(clampIdx(toIdx(h.p))); sl.forEach((s, i) => s.set(cur[i])); busy = false; onChange && onChange(); },
  });
  return {
    h, sl, get: () => cur.slice(),
    set(idx) { busy = true; cur = idx.slice(); sl.forEach((s, i) => s.set(cur[i])); h.set(toPos(cur)); busy = false; },
    refresh() { h.set(toPos(cur)); },
  };
}

