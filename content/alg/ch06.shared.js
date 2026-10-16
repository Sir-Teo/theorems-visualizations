// Abstract Algebra (Judson) — Chapter 6: helpers shared by ch06.js and ch06-b.js (plain named exports).
//
// A "lab group" A bundles a finite group G (Cayley table of indices, Chapter 3 format) with a drawing of its Cayley graph:
// node positions pos[i], edges for a few generators (g — gx), short plain-text labels, and a default subgroup.
// Cosets are computed from the table: the left coset gH = {gh}, the right coset Hg = {hg}; products are read as in the
// group (for permutations, right to left). Everything shown in the chapter is computed from G.T.
export * from './ch05.shared.js';
export { allSubgroups, cyclic, units, klein, power, gcd, roster } from './ch03.shared.js';
import { allSubgroups, cyclic, units, klein } from './ch03.shared.js';
import { EC, elColor, generated, orderOf, subgroupTest, permGroup, allPerms, fromCycles, cycText, cycTex, dihedralJ, dlabel, closure } from './ch05.shared.js';

// ------------------------------------------------------------------ the lab groups
const TAU = 2 * Math.PI;
const at = (k, m, R, c = [0, 0]) => [c[0] + R * Math.cos(Math.PI / 2 - (TAU * k) / m), c[1] + R * Math.sin(Math.PI / 2 - (TAU * k) / m)];
const idxOf = (G, f) => { for (let i = 0; i < G.n; i++) if (f(i)) return i; return -1; };
const edgesOf = (G, gens) => {
  const seen = new Set(), out = [];
  for (let g = 0; g < G.n; g++) for (const x of gens) { const h = G.T[g][x]; if (h === g) continue; const k = g < h ? `${g}-${h}` : `${h}-${g}`; if (!seen.has(k)) { seen.add(k); out.push([g, h]); } }
  return out;
};
/** Outer ring: the powers of r; inner ring: h placed at the angle of h·s (s an involution outside ⟨r⟩). */
function ringLayout(G, ri, si, R = 1, r2 = 0.56) {
  const ord = []; let x = G.e; do { ord.push(x); x = G.T[x][ri]; } while (x !== G.e);
  const m = ord.length, pos = new Array(G.n);
  ord.forEach((e, k) => { pos[e] = at(k, m, R); });
  if (si != null) for (let h = 0; h < G.n; h++) if (!pos[h]) { const k = ord.indexOf(G.T[h][si]); pos[h] = at(k, m, r2); }
  return pos;
}
function circleLayout(G) { return Array.from({ length: G.n }, (_, k) => at(k, G.n, 1)); }

const cache = new Map();
const MAKE = {
  Z5: () => ({ G: cyclic(5), tex: '\\mathbb Z_5', menu: '$\\mathbb Z_5$', circ: true, gens: [1] }),
  Z6: () => ({ G: cyclic(6), tex: '\\mathbb Z_6', menu: '$\\mathbb Z_6$', circ: true, gens: [1] }),
  Z7: () => ({ G: cyclic(7), tex: '\\mathbb Z_7', menu: '$\\mathbb Z_7$', circ: true, gens: [1] }),
  Z9: () => ({ G: cyclic(9), tex: '\\mathbb Z_9', menu: '$\\mathbb Z_9$', circ: true, gens: [1] }),
  Z11: () => ({ G: cyclic(11), tex: '\\mathbb Z_{11}', menu: '$\\mathbb Z_{11}$', circ: true, gens: [1] }),
  Z13: () => ({ G: cyclic(13), tex: '\\mathbb Z_{13}', menu: '$\\mathbb Z_{13}$', circ: true, gens: [1] }),
  Z12: () => ({ G: cyclic(12), tex: '\\mathbb Z_{12}', menu: '$\\mathbb Z_{12}$', circ: true, gens: [1], def: [4] }),
  Z24: () => ({ G: cyclic(24), tex: '\\mathbb Z_{24}', menu: '$\\mathbb Z_{24}$', circ: true, gens: [1], def: [6] }),
  V: () => { const G = klein(); G.plain = ['e', 'a', 'b', 'c']; return { G, tex: 'V_4', menu: '$V_4$', circ: true, gens: [1, 2] }; },
  S3: () => {
    const P = allPerms(3), G0 = permGroup(P, P.map(cycTex)), G = G0;
    const plain = P.map((p, i) => (i === G.e ? 'id' : cycText(p).replace(/ /g, '')));
    const r = idxOf(G, (i) => P[i].join() === fromCycles(3, [[1, 2, 3]]).join()), s = idxOf(G, (i) => P[i].join() === fromCycles(3, [[1, 2]]).join());
    G.plain = plain;
    return { G, tex: 'S_3', menu: '$S_3$', pos: ringLayout(G, r, s), gens: [r, s], def: [s] };
  },
  D4: () => {
    const G = dihedralJ(4); G.plain = G.L.map((_, j) => dlabel(j, 4));
    return { G, tex: 'D_4', menu: '$D_4$', pos: ringLayout(G, 1, 4), gens: [1, 4], def: [4] };
  },
  D6: () => {
    const G = dihedralJ(6); G.plain = G.L.map((_, j) => dlabel(j, 6));
    return { G, tex: 'D_6', menu: '$D_6$', pos: ringLayout(G, 1, 6), gens: [1, 6], def: [6] };
  },
  A4: () => {
    const even = allPerms(4).filter((p) => closure([fromCycles(4, [[1, 2, 3]]), fromCycles(4, [[1, 2], [3, 4]])], 4).some((q) => q.join() === p.join()));
    const G = permGroup(even, even.map(cycTex)); G.plain = even.map((p, i) => (i === G.e ? 'id' : cycText(p).replace(/ /g, '')));
    const a = idxOf(G, (i) => even[i].join() === fromCycles(4, [[1, 2, 3]]).join()), b = idxOf(G, (i) => even[i].join() === fromCycles(4, [[1, 2], [3, 4]]).join());
    // four triangles g⟨a⟩: the one through the identity in the middle, the others hung on the b-edges of e, a, a²
    const a2 = G.T[a][a], pos = new Array(G.n), tri = (g, c, a0, tr = 0.27) => { let x = g; for (let k = 0; k < 3; k++) { pos[x] = [c[0] + tr * Math.cos(a0 + (TAU * k) / 3), c[1] + tr * Math.sin(a0 + (TAU * k) / 3)]; x = G.T[x][a]; } };
    const dirs = [Math.PI / 2, Math.PI / 2 + TAU / 3, Math.PI / 2 + (2 * TAU) / 3];
    tri(G.e, [0, 0], Math.PI / 2, 0.24);
    [G.e, a, a2].forEach((g, k) => { const x = G.T[g][b], c = [1.0 * Math.cos(dirs[k]), 1.0 * Math.sin(dirs[k])]; tri(x, c, dirs[k] + Math.PI); });
    return { G, tex: 'A_4', menu: '$A_4$', pos, gens: [a, b], def: [b] };
  },
  U15: () => { const G = units(15); G.plain = G.L; return { G, tex: 'U(15)', menu: '$U(15)$', pos: ringLayout(G, G.vals.indexOf(2), G.vals.indexOf(14)), gens: [G.vals.indexOf(2), G.vals.indexOf(14)], def: [G.vals.indexOf(4)] }; },
  U21: () => { const G = units(21); G.plain = G.L; return { G, tex: '\\mathbb Z_2\\times\\mathbb Z_6\\;(\\cong U(21))', menu: '$\\mathbb Z_2{\\times}\\mathbb Z_6$', pos: ringLayout(G, G.vals.indexOf(2), G.vals.indexOf(20)), gens: [G.vals.indexOf(2), G.vals.indexOf(20)], def: [G.vals.indexOf(4)] }; },
};
/** The lab group `key`: {key, G, tex, menu, pos, edges, plain, subs, def (index of the default subgroup)}. Cached. */
export function getGroup(key) {
  if (cache.has(key)) return cache.get(key);
  const A = MAKE[key](); A.key = key; const G = A.G;
  if (!G.plain) G.plain = G.L.map((x) => String(x));
  A.plain = G.plain; { const ml = Math.max(...G.plain.map((t) => String(t).length)); A.fs = ml > 6 ? 9.5 : G.n > 16 ? 10 : G.n > 12 ? 11 : 12; A.r = Math.max(nodeR(G.n), Math.ceil((ml * A.fs * 0.6) / 2) + 6); } A.pos = A.circ ? circleLayout(G) : A.pos; A.edges = edgesOf(G, A.gens);
  A.subs = allSubgroups(G); A.add = !!G.add;
  const want = A.def ? generated(G, A.def).join() : null; A.defSub = Math.max(0, A.subs.findIndex((H) => H.join() === want));
  if (!want) A.defSub = Math.min(1, A.subs.length - 1);
  cache.set(key, A); return A;
}

// ------------------------------------------------------------------ cosets
/** The coset of g: left gH = {gh} or right Hg = {hg}, as a sorted array of element indices. */
export function cosetOf(G, H, g, side = 'L') {
  const out = new Set(H.map((h) => (side === 'L' ? G.T[g][h] : G.T[h][g])));
  return [...out].sort((a, b) => a - b);
}
/** The partition of G into cosets of H (ordered by smallest element); also `of[g]` = index of the class of g. */
export function cosetClasses(G, H, side = 'L') {
  const of = new Array(G.n).fill(-1), classes = [];
  for (let g = 0; g < G.n; g++) { if (of[g] >= 0) continue; const C = cosetOf(G, H, g, side); C.forEach((x) => { of[x] = classes.length; }); classes.push(C); }
  classes.of = of; return classes;
}
export const sameSet = (A, B) => A.length === B.length && A.every((x, i) => x === B[i]);
export const isSub = (A, B) => A.every((x) => B.includes(x));
/** Colour for coset k of m: palette names for m ≤ 8, blends beyond. */
export const cosetColor = (v, k, m) => (m <= 8 ? EC[k % 8] : elColor(v, k, m));
/** Name of a coset in the group's notation: gH / Hg or g + H. */
export function cosetTex(A, g, side = 'L', Hn = 'H') {
  const x = A.G.L[g];
  if (A.add) return `${x}+${Hn}`;
  return side === 'L' ? `${x}${Hn}` : `${Hn}${x}`;
}
/** TeX roster of a set of elements. */
export const setTex = (G, S) => `\\{${[...S].map((i) => G.L[i]).join(',\\,')}\\}`;
/** TeX for the subgroup (as a roster, shortened when large). */
export const subTex = (G, H) => (H.length > 8 ? `\\{${H.slice(0, 6).map((i) => G.L[i]).join(',\\,')},\\dots\\}` : setTex(G, H));
/** A non-subgroup subset {e, a, b} of G (the first one that fails the subgroup test). */
export function badSubset(G) {
  for (let a = 1; a < G.n; a++) for (let b = a + 1; b < G.n; b++) { const S = [G.e, a, b].sort((x, y) => x - y); if (!subgroupTest(G, S).ok) return S; }
  return [G.e];
}

// ------------------------------------------------------------------ the lab: group menu + subgroup stepper + chosen element
/**
 * Adds a group menu (when several keys), ◀ ▶ buttons that step through all subgroups, and keeps a chosen element g.
 * Returns L with L.A (lab group), L.G, L.H() (the subgroup), L.g, L.g2, L.si; onChange() is called after any change.
 */
export function useLab(v, keys, o = {}) {
  const L = { A: getGroup(o.group || keys[0]), si: 0, g: o.g ?? 1, g2: o.g2 ?? 2 };
  const reset = () => { L.G = L.A.G; L.si = o.sub ? o.sub(L.A) : L.A.defSub; L.g = Math.min(o.g ?? 1, L.G.n - 1); L.g2 = Math.min(o.g2 ?? 2, L.G.n - 1); };
  reset();
  if (keys.length > 1) L.sel = v.select('Group', keys.map((k) => ({ value: k, label: getGroup(k).menu })), L.A.key, { onChange: (k) => { L.A = getGroup(k); reset(); if (o.onChange) o.onChange(); } });
  const step = (d) => { const m = L.A.subs.length; L.si = (L.si + d + m) % m; if (o.onChange) o.onChange(); };
  if (!o.noSub) { v.button('◀ subgroup', () => step(-1)); v.button('subgroup ▶', () => step(1)); }
  L.H = () => L.A.subs[L.si];
  L.reset = reset;
  return L;
}

// ------------------------------------------------------------------ drawing a Cayley graph
export const nodeR = (n) => (n <= 8 ? 17 : n <= 12 ? 15 : n <= 16 ? 13 : 11);
/** A stage for a Cayley graph (equal axes, no axes). */
export const cgStage = (v, o = {}) => v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, height: o.height ?? 360, weight: o.weight ?? 1.5, minWidth: o.minWidth ?? 280 });
/**
 * Draw the Cayley graph of A. o: fill(i) → colour or null (hollow), alpha(i), ring(i) → colour or null, label(i), edges (false to hide),
 * dim(i) → true to fade, size.
 */
export function drawCG(v, s, A, o = {}) {
  const G = A.G, r = o.r ?? A.r;
  if (o.edges !== false) for (const [a, b] of A.edges) s.line(A.pos[a][0], A.pos[a][1], A.pos[b][0], A.pos[b][1], { color: 'muted', width: 1.2, alpha: 0.28 });
  for (let i = 0; i < G.n; i++) {
    const [x, y] = A.pos[i], c = o.fill ? o.fill(i) : null, ring = o.ring ? o.ring(i) : null, dim = o.dim && o.dim(i);
    if (ring) s.dot(x, y, { r: r + 4.5, color: ring, hollow: true, width: 2.6 });
    if (c) s.dot(x, y, { r, color: c, alpha: dim ? 0.3 : (o.alpha ? o.alpha(i) : 1) });
    else s.dot(x, y, { r, color: 'muted', hollow: true, width: 1.4, alpha: dim ? 0.45 : 1 });
    const t = o.label ? o.label(i) : A.plain[i];
    if (t != null) s.text(String(t), x, y, { align: 'center', size: o.size ?? A.fs, weight: 700, color: c ? 'panel' : 'ink', halo: false, alpha: dim ? 0.5 : 1 });
  }
}
/** Index of the node nearest to the data point (x, y), or −1 when farther than the node radius. */
export function hitNode(s, A, x, y) {
  let best = -1, bd = Infinity;
  A.pos.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y) * s.scale; if (d < bd) { bd = d; best = i; } });
  return bd <= A.r + 8 ? best : -1;
}
/** Number of elements of G with each order: {order: count}. */
export function orderCounts(G) { const c = {}; for (let a = 0; a < G.n; a++) { const k = orderOf(G, a); c[k] = (c[k] || 0) + 1; } return c; }
/** Divisors of n. */
export const divisors = (n) => { const d = []; for (let k = 1; k <= n; k++) if (n % k === 0) d.push(k); return d; };
