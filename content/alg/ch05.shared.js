// Abstract Algebra (Judson) — Chapter 5: helpers shared by ch05.js and ch05-b.js (plain named exports).
//
// A permutation of {1, …, n} is stored 0-based as an array p with p[i] = the image of i (shown as i + 1). Products are
// compositions read RIGHT TO LEFT, as in Judson: compose(s, t) = st = "first t, then s", so (st)(i) = s(t(i)).
// Beads: slot i holds a bead; applying σ moves the bead in slot i to slot σ(i). Wiring diagrams draw that move as a wire
// from slot i (before) to slot σ(i) (after); two wires cross exactly when the pair is an inversion.
// The group machinery of Chapter 3 (Cayley tables as index arrays, orders, closure) and the rigid-motion helpers for
// polygon cards are re-exported from ch03.shared.js; clock positions from ch04.shared.js.
export { EC, elColor, finish, generated, subgroupTest, orderOf, permMatrix, mm, mv, I2, partial, axisOf, drawFigure } from './ch03.shared.js';
export { hour, hitHour, arc, mod, TAU } from './ch04.shared.js';
import { EC, elColor, finish, permMatrix } from './ch03.shared.js';

// ------------------------------------------------------------------ permutations
export const idp = (n) => [...Array(n).keys()];
/** st = "first t, then s": (st)(i) = s(t(i)). */
export const compose = (s, t) => t.map((x) => s[x]);
export const inverse = (p) => { const q = new Array(p.length); p.forEach((x, i) => { q[x] = i; }); return q; };
export const isId = (p) => p.every((x, i) => x === i);
export const pkey = (p) => p.join(',');
export const same = (p, q) => p.length === q.length && p.every((x, i) => x === q[i]);
/** The transposition (a b) of {0..n-1}. */
export function transp(n, a, b) { const p = idp(n); p[a] = b; p[b] = a; return p; }
/** Permutation from 1-based cycles, e.g. fromCycles(6, [[1, 3, 5, 2], [4, 6]]). */
export function fromCycles(n, cyc) {
  const p = idp(n);
  for (const c of cyc) for (let k = 0; k < c.length; k++) p[c[k] - 1] = c[(k + 1) % c.length] - 1;
  return p;
}
/** Disjoint cycles (0-based), each starting at its smallest element, in order of that element; fixed points omitted unless `fixed`. */
export function cycles(p, fixed = false) {
  const seen = new Array(p.length).fill(false), out = [];
  for (let i = 0; i < p.length; i++) {
    if (seen[i]) continue;
    const c = []; let x = i;
    while (!seen[x]) { seen[x] = true; c.push(x); x = p[x]; }
    if (c.length > 1 || fixed) out.push(c);
  }
  return out;
}
/** Cycle notation as TeX: (1\,3\,5\,2)(4\,6); the identity is (1). */
export function cycTex(p) { const C = cycles(p); return C.length ? C.map((c) => `(${c.map((x) => x + 1).join('\\,')})`).join('') : '(1)'; }
/** Cycle notation as plain text with thin spaces: (1 3 5 2)(4 6). */
export function cycText(p) { const C = cycles(p); return C.length ? C.map((c) => `(${c.map((x) => x + 1).join(' ')})`).join('') : '(1)'; }
/** A list of 0-based cycles (each an array) as TeX. */
export const cycListTex = (C) => (C.length ? C.map((c) => `(${c.map((x) => x + 1).join('\\,')})`).join('') : '(1)');
/** One-line notation: the bottom row of the two-row array, e.g. 2143. */
export const oneLine = (p) => p.map((x) => x + 1).join('');
/** Two-row notation as TeX. */
export function twoRow(p) { return `\\begin{pmatrix}${p.map((_, i) => i + 1).join('&')}\\\\ ${p.map((x) => x + 1).join('&')}\\end{pmatrix}`; }
/** Inversions: pairs i < j with p(i) > p(j) — the crossings of the straight wiring diagram. */
export function inversions(p) { const out = []; for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[i] > p[j]) out.push([i, j]); return out; }
/** +1 for even, −1 for odd (computed from the cycle type: n − #cycles transpositions). */
export const sign = (p) => ((p.length - cycles(p, true).length) % 2 ? -1 : 1);
/** All n! permutations in lexicographic order of one-line notation. */
export function allPerms(n) {
  const out = [], a = idp(n), used = new Array(n).fill(false), cur = [];
  const rec = () => { if (cur.length === n) { out.push(cur.slice()); return; } for (const x of a) if (!used[x]) { used[x] = true; cur.push(x); rec(); cur.pop(); used[x] = false; } };
  rec(); return out;
}
/** The product t₁t₂⋯t_r of transpositions [a, b] (written order; t_r acts first). */
export function productOf(list, n) { let p = idp(n); for (let k = list.length - 1; k >= 0; k--) p = compose(transp(n, list[k][0], list[k][1]), p); return p; }
/**
 * Judson's decomposition: each cycle (a₁ a₂ … a_k) = (a₁ a_k)(a₁ a_{k−1})⋯(a₁ a₂); the cycles' lists are concatenated
 * (disjoint cycles commute). Returns [{t: [a, b], cyc: index of the cycle}] in written order.
 */
export function cycleTranspositions(p) {
  const out = [];
  cycles(p).forEach((c, ci) => { for (let k = c.length - 1; k >= 1; k--) out.push({ t: [c[0], c[k]], cyc: ci }); });
  return out;
}
/** Adjacent transpositions s₁s₂⋯s_m = p found by bubble sort (m = number of inversions), written order. */
export function bubbleTranspositions(p) {
  // sort the arrangement (bead in slot j) back to the identity; each swap of slots (j, j+1) is recorded
  const arr = inverse(p), swaps = []; // arr[slot] = bead: after p, bead i sits in slot p(i)
  let done = false;
  while (!done) { done = true; for (let j = 0; j + 1 < arr.length; j++) if (arr[j] > arr[j + 1]) { [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; swaps.push([j, j + 1]); done = false; } }
  // swaps u₁, …, u_m (in time order) satisfy u_m ⋯ u₁ p = id, so p = u₁ u₂ ⋯ u_m (each is its own inverse)
  return swaps;
}
/** Closure of a set of permutations under composition (the generated permutation group), identity first. */
export function closure(gens, n) {
  const e = idp(n), seen = new Map([[pkey(e), e]]), queue = [e];
  while (queue.length) { const g = queue.shift(); for (const s of gens) { const h = compose(s, g); const k = pkey(h); if (!seen.has(k)) { seen.set(k, h); queue.push(h); } } }
  return [...seen.values()];
}
/** A group object (Chapter 3 format: n, L, T, e, inv) from a list of permutations closed under composition. */
export function permGroup(perms, labels) {
  const idx = new Map(perms.map((p, i) => [pkey(p), i]));
  const G = finish({ n: perms.length, perms, L: labels || perms.map(cycTex), sym: '\\circ', T: perms.map((p) => perms.map((q) => idx.get(pkey(compose(p, q))))) });
  G.idx = idx; return G;
}
/** Seeded shuffle of 0..n−1 that is not the identity. */
export function shuffled(v, n, seed) {
  const r = v.rng(seed);
  for (let tries = 0; tries < 50; tries++) { const p = idp(n); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } if (!isId(p)) return p; }
  return transp(n, 0, 1);
}

// ------------------------------------------------------------------ colours and drawing
/** Bead colour for bead k of n (palette names for n ≤ 8, blends beyond). */
export const beadCol = (v, k, n = 8) => (n <= 8 ? EC[k % 8] : elColor(v, k, n));
/** A numbered bead (filled disc, number in the panel colour). */
export function bead(v, s, x, y, k, o = {}) {
  const r = o.r ?? 13, col = o.color || beadCol(v, k, o.n ?? 8);
  if (o.ring) s.dot(x, y, { r: r + 4, color: o.ring, hollow: true, width: 2.4 });
  s.dot(x, y, { r, color: col, alpha: o.alpha });
  s.text(String(o.label ?? k + 1), x, y, { align: 'center', size: o.size ?? Math.round(r * 0.95), weight: 700, color: 'panel', halo: false, alpha: o.alpha });
}
const ss = (t) => t * t * (3 - 2 * t);
/** S-shaped wire from A to B; `flow` 'y' (vertical layers: y linear, x eased) or 'x' (horizontal layers). */
export function wire(s, A, B, st = {}, flow = 'y') {
  const [x0, y0] = A, [x1, y1] = B;
  s.curve((t) => (flow === 'y' ? [x0 + (x1 - x0) * ss(t), y0 + (y1 - y0) * t] : [x0 + (x1 - x0) * t, y0 + (y1 - y0) * ss(t)]), 0, 1, { n: 40, ...st });
}
/** Point on the wire at parameter t (same easing as `wire`). */
export function wireAt(A, B, t, flow = 'y') { const [x0, y0] = A, [x1, y1] = B; return flow === 'y' ? [x0 + (x1 - x0) * ss(t), y0 + (y1 - y0) * t] : [x0 + (x1 - x0) * t, y0 + (y1 - y0) * ss(t)]; }
/**
 * One layer of a wiring diagram: wire from slot i at `from` to slot p(i) at `to`. o.pos(slot, level) → [x, y];
 * o.col(i) wire colour for the wire leaving slot i; o.flow ('y' | 'x'); o.width; o.alpha(i).
 */
export function drawLayer(v, s, p, o) {
  p.forEach((q, i) => wire(s, o.pos(i, 0), o.pos(q, 1), { color: o.col(i), width: o.width ?? 3, alpha: o.alpha ? o.alpha(i) : 0.9 }, o.flow || 'y'));
}
/** Curved arrow from A to B bending to its right by `bend` (fraction of length), trimmed `trim` px at both ends. */
export function curvedArrow(s, A, B, st = {}) {
  const [ax, ay] = A, [bx, by] = B, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
  if (L < 1e-9) return;
  const bend = st.bend ?? 0.18, cx = (ax + bx) / 2 + bend * dy, cy = (ay + by) / 2 - bend * dx;
  const q = (t) => [(1 - t) ** 2 * ax + 2 * (1 - t) * t * cx + t * t * bx, (1 - t) ** 2 * ay + 2 * (1 - t) * t * cy + t * t * by];
  const Lpx = L * s.scale, tr = Math.min(0.4, (st.trim ?? 12) / Lpx), t0 = tr, t1 = 1 - tr, N = 24, pts = [];
  for (let k = 0; k <= N; k++) pts.push(q(t0 + ((t1 - t0) * k) / N));
  const lim = st.upto ?? 1; // draw only the first fraction (for animation)
  const m = Math.max(2, Math.round(N * lim));
  s.path(pts.slice(0, m + 1), { color: st.color || 'accent', width: st.width ?? 2, alpha: st.alpha });
  if (st.head !== false) s.arrow(...pts[m - 2], ...pts[m], { color: st.color || 'accent', width: st.width ?? 2, alpha: st.alpha, head: st.headSize ?? 9 });
}
/** Small loop arrow at a fixed point P (radius direction = outward from c). */
export function loopArrow(s, P, c, st = {}) {
  const [px, py] = P, d = Math.hypot(px - c[0], py - c[1]) || 1, ux = (px - c[0]) / d, uy = (py - c[1]) / d, rr = st.r ?? 0.16;
  const cx = px + ux * (rr + (st.off ?? 0.12)), cy = py + uy * (rr + (st.off ?? 0.12)), a0 = Math.atan2(-uy, -ux), pts = [];
  for (let k = 0; k <= 24; k++) { const a = a0 + 0.55 + ((2 * Math.PI - 1.1) * k) / 24; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  s.path(pts.slice(0, 23), { color: st.color || 'muted', width: st.width ?? 1.6, alpha: st.alpha });
  s.arrow(...pts[21], ...pts[24], { color: st.color || 'muted', width: st.width ?? 1.6, head: 7, alpha: st.alpha });
}
/**
 * Arrow diagram of p on a circle: numbers 1..n clockwise from the top; arrows i → p(i) (loops at fixed points).
 * o: c, R, nodeColor(i), arrowColor(i) (null hides), arrowAlpha(i), r (node px), loops (default true), bend, upto(i).
 */
export function permCircle(v, s, p, o = {}) {
  const n = p.length, c = o.c || [0, 0], R = o.R ?? 1, at = (i) => { const a = Math.PI / 2 - (2 * Math.PI * i) / n; return [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]; };
  if (o.ring !== false) s.circle(c[0], c[1], R, { color: 'faint', width: 1, dash: [3, 5], fill: false });
  for (let i = 0; i < n; i++) {
    const col = o.arrowColor ? o.arrowColor(i) : 'accent'; if (!col) continue;
    if (p[i] === i) { if (o.loops !== false) loopArrow(s, at(i), c, { color: col, alpha: o.arrowAlpha ? o.arrowAlpha(i) : 0.8, r: o.loopR ?? 0.14 * R }); }
    else curvedArrow(s, at(i), at(p[i]), { color: col, width: o.width ?? 2.2, bend: o.bend ?? 0.16, trim: (o.r ?? 12) + 3, alpha: o.arrowAlpha ? o.arrowAlpha(i) : 1, upto: o.upto ? o.upto(i) : 1 });
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = at(i), nc = o.nodeColor ? o.nodeColor(i) : 'ink';
    if (o.nodeRing && o.nodeRing(i)) s.dot(x, y, { r: (o.r ?? 12) + 4, hollow: true, color: o.nodeRing(i), width: 2.4 });
    s.dot(x, y, { r: o.r ?? 12, color: nc });
    s.text(String(i + 1), x, y, { align: 'center', size: o.size ?? 13, weight: 700, color: 'panel', halo: false });
  }
  return at;
}

// ------------------------------------------------------------------ dihedral groups in Judson's numbering
/** Vertex positions of a regular n-gon (radius 1): vertex 1 at the top, numbered clockwise. */
export function ngon(n) { return Array.from({ length: n }, (_, k) => [Math.cos(Math.PI / 2 - (2 * Math.PI * k) / n), Math.sin(Math.PI / 2 - (2 * Math.PI * k) / n)]); }
/**
 * D_n as permutations of the vertex positions 1..n (0-based): r = clockwise turn by 360°/n = (1 2 … n), s = the flip
 * fixing vertex 1, so s(i) = −i mod n. Elements in Judson's order 1, r, …, r^{n−1}, s, rs, …, r^{n−1}s (index k and n + k),
 * with TeX labels, 2×2 matrices and the group table (products right to left).
 */
export function dihedralJ(n) {
  const pos = ngon(n), perms = [];
  for (let k = 0; k < n; k++) perms.push(Array.from({ length: n }, (_, i) => (i + k) % n));
  for (let k = 0; k < n; k++) perms.push(Array.from({ length: n }, (_, i) => (((k - i) % n) + n) % n));
  const L = perms.map((_, j) => { const k = j % n, refl = j >= n; const rk = k === 0 ? '' : k === 1 ? 'r' : `r^{${k}}`; return refl ? `${rk}s` : k === 0 ? '1' : rk; });
  const G = permGroup(perms, L);
  G.m = n; G.pos = pos; G.mat = perms.map((p) => permMatrix(pos, p));
  return G;
}
/** Plain-text label (r², r³s) for canvas text. */
export function dlabel(j, n) { const k = j % n, sup = '⁰¹²³⁴⁵⁶⁷⁸⁹'; const rk = k === 0 ? '' : k === 1 ? 'r' : `r${String(k).split('').map((d) => sup[+d]).join('')}`; return j >= n ? `${rk}s` : k === 0 ? '1' : rk; }

// ------------------------------------------------------------------ the cube (rotations as integer 3×3 matrices)
export const mat3 = (A, B) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
export const ap3 = (A, p) => [0, 1, 2].map((i) => A[i][0] * p[0] + A[i][1] * p[1] + A[i][2] * p[2]);
export const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
export const mkey = (A) => A.flat().map((x) => Math.round(x)).join(',');
/** Rotation by angle th about the unit axis u (Rodrigues). */
export function rot3(u, th) {
  const L = Math.hypot(...u), [x, y, z] = u.map((c) => c / L), c = Math.cos(th), s = Math.sin(th), C = 1 - c;
  return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
}
export const round3 = (A) => A.map((r) => r.map((x) => Math.round(x)));
/** The 13 axes of the cube [−1,1]³: 3 through face centres (order 4), 6 through edge midpoints (2), 4 through vertices (3). */
export const AXES = {
  face: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  edge: [[1, 1, 0], [1, -1, 0], [1, 0, 1], [1, 0, -1], [0, 1, 1], [0, 1, -1]],
  vertex: [[1, 1, 1], [-1, 1, 1], [-1, -1, 1], [1, -1, 1]],
};
export const AXIS_ANGLE = { face: Math.PI / 2, edge: Math.PI, vertex: (2 * Math.PI) / 3 };
export const CUBE_V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
/** Faces as [vertex indices, outward normal]. */
export const CUBE_F = [[[1, 2, 6, 5], [1, 0, 0]], [[0, 4, 7, 3], [-1, 0, 0]], [[2, 3, 7, 6], [0, 1, 0]], [[0, 1, 5, 4], [0, -1, 0]], [[4, 5, 6, 7], [0, 0, 1]], [[0, 3, 2, 1], [0, 0, -1]]];
/** All 24 rotations of the cube (closure of the quarter turns about x, y, z), identity first. */
export function cubeGroup() {
  const gens = AXES.face.map((u) => round3(rot3(u, Math.PI / 2))), seen = new Map([[mkey(I3), I3]]), q = [I3];
  while (q.length) { const g = q.shift(); for (const s of gens) { const h = mat3(s, g), k = mkey(h); if (!seen.has(k)) { seen.set(k, h); q.push(h); } } }
  return [...seen.values()];
}
