// Algorithms — Chapter 10 (greedy algorithms, spanning trees, matroids): helpers shared by ch10.js, ch10-b.js, ch10-c.js.
// Re-exports the chapter-9 helpers (graph drawing, pixel text, strips) and adds: intervals and their brute force,
// Huffman/Shannon–Fano with frame snapshots, forest drawing, the MST algorithms with frames, and matroid tests.
// Every algorithm has an independent exhaustive check next to it (subsets, set partitions, permutations, all trees).
import { K, ids, plural, fmt, R, LN, TX } from './ch09.shared.js';
export * from './ch09.shared.js';

export const rngOf = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const sumOf = (a, f = (x) => x) => a.reduce((t, x) => t + f(x), 0);
export const r3 = (x) => String(Math.round(x * 1000) / 1000).replace('-', '−');

// ---------------------------------------------------------------- intervals
/** n random intervals on [0, T]: [{id, s, f}] with f > s. */
export function ivRandom(seed, n, T = 20, maxLen = 7) {
  const r = rngOf(seed);
  return Array.from({ length: n }, (_, id) => { const s = Math.floor(r() * (T - 2)), f = Math.min(T, s + 1 + Math.floor(r() * maxLen)); return { id, s, f }; });
}
export const ivOk = (a, b) => a.f <= b.s || b.f <= a.s;
/** Greedy by a rule: finish | start | short | conflicts. Returns {order, picked} (ids). */
export function ivGreedy(iv, rule = 'finish') {
  const conf = (a) => iv.filter((b) => b !== a && !ivOk(a, b)).length;
  const key = { finish: (a) => [a.f, a.s], start: (a) => [a.s, a.f], short: (a) => [a.f - a.s, a.f], conflicts: (a) => [conf(a), a.f] }[rule];
  const order = iv.slice().sort((a, b) => { const x = key(a), y = key(b); return x[0] - y[0] || x[1] - y[1] || a.id - b.id; });
  const picked = [];
  for (const a of order) if (picked.every((id) => ivOk(iv.find((q) => q.id === id), a))) picked.push(a.id);
  return { order: order.map((a) => a.id), picked };
}
/** Exhaustive search: the maximum number of pairwise compatible intervals and every set that attains it (ids sorted by finish). */
export function ivBrute(iv) {
  const byF = iv.slice().sort((a, b) => a.f - b.f || a.s - b.s || a.id - b.id);
  let best = 0, sets = [];
  const go = (i, cur) => {
    if (cur.length + (byF.length - i) < best) return;
    if (i === byF.length) { if (cur.length > best) { best = cur.length; sets = []; } if (cur.length === best && sets.length < 400) sets.push(cur.map((a) => a.id)); return; }
    const a = byF[i];
    if (cur.every((b) => ivOk(a, b))) { cur.push(a); go(i + 1, cur); cur.pop(); }
    go(i + 1, cur);
  };
  go(0, []);
  return { best, sets };
}
/** Depth of an interval family: the largest number of intervals that contain a common point (half-open intervals [s, f)). */
export function ivDepth(iv) {
  let d = 0, at = 0;
  const pts = [...new Set(iv.map((a) => a.s))];
  for (const t of pts) { const c = iv.filter((a) => a.s <= t && t < a.f).length; if (c > d) { d = c; at = t; } }
  return { depth: d, at };
}

// ---------------------------------------------------------------- Huffman, Shannon–Fano, entropy
/**
 * Huffman's merge procedure on [{sym, w}], with D-ary generalisation (dummy zero-weight leaves are added so that every merge takes
 * exactly D trees). Frames: {forest (list of trees, each {id, w, sym?, kids?}), hot (ids just merged), note}. Result: {root, codes, frames, lens, avg}.
 */
export function huffman(freqs, D = 2) {
  let nid = 0;
  let forest = freqs.map((f) => ({ id: nid++, w: f.w, sym: f.sym })).sort((a, b) => a.w - b.w || a.id - b.id);
  const total = sumOf(freqs, (f) => f.w) || 1;
  const frames = [];
  const clone = (t) => ({ id: t.id, w: t.w, sym: t.sym, dummy: t.dummy, kids: t.kids ? t.kids.map(clone) : undefined });
  const snap = (hot, note) => frames.push({ forest: forest.map(clone), hot: hot || [], note });
  if (D > 2) { while ((forest.length - 1) % (D - 1) !== 0) forest.unshift({ id: nid++, w: 0, sym: '∅', dummy: true }); }
  snap([], `${forest.length} one-leaf trees, one per symbol${forest.some((t) => t.dummy) ? ' (plus zero-weight dummy leaves so that every merge takes ' + D + ' trees)' : ''}.`);
  while (forest.length > 1) {
    const take = forest.splice(0, D), w = sumOf(take, (t) => t.w), node = { id: nid++, w, kids: take };
    let i = 0; while (i < forest.length && (forest[i].w < w || (forest[i].w === w && forest[i].id < node.id))) i++;
    forest.splice(i, 0, node);
    snap([node.id], `Merge the ${D === 2 ? 'two lightest trees' : D + ' lightest trees'} (weights ${take.map((t) => fmt(t.w)).join(', ')}) under a new root of weight ${fmt(w)}; ${forest.length} tree${forest.length === 1 ? '' : 's'} left.`);
  }
  const root = forest[0], codes = {}, lens = {};
  const walk = (t, pre) => { if (!t.kids) { if (!t.dummy) { codes[t.sym] = pre || '0'; lens[t.sym] = (pre || '0').length; } return; } t.kids.forEach((k, i) => walk(k, pre + i)); };
  if (root) walk(root, '');
  const avg = sumOf(freqs, (f) => (f.w / total) * (lens[f.sym] || 0));
  return { root, codes, lens, frames, avg, total };
}
/** Weighted path length Σ w·depth of a tree (leaves carry w). */
export function wpl(t, d = 0) { return t.kids ? sumOf(t.kids, (k) => wpl(k, d + 1)) : t.w * d; }
export function entropy(freqs) { const T = sumOf(freqs, (f) => f.w); return -sumOf(freqs.filter((f) => f.w > 0), (f) => (f.w / T) * Math.log2(f.w / T)); }
/** Fano's top-down split: sort by weight, cut where the two halves are closest in total weight, recurse. */
export function shannonFano(freqs) {
  const codes = {}, T = sumOf(freqs, (f) => f.w) || 1;
  const go = (L, pre) => {
    if (L.length === 1) { codes[L[0].sym] = pre || '0'; return; }
    const tot = sumOf(L, (f) => f.w); let acc = 0, bi = 1, bd = Infinity;
    for (let i = 1; i < L.length; i++) { acc += L[i - 1].w; const d = Math.abs(tot - 2 * acc); if (d < bd) { bd = d; bi = i; } }
    go(L.slice(0, bi), pre + '0'); go(L.slice(bi), pre + '1');
  };
  go(freqs.slice().sort((a, b) => b.w - a.w || String(a.sym).localeCompare(String(b.sym))), '');
  const avg = sumOf(freqs, (f) => (f.w / T) * codes[f.sym].length);
  return { codes, avg };
}
/** Exhaustive optimum: least Σ w·l over length vectors with Kraft sum exactly 1 (every optimal binary code is complete). n ≤ 9. */
export function bruteCodeLengths(ws) {
  const n = ws.length; if (n === 1) return 0;
  const W = ws.slice().sort((a, b) => b - a); // heavier symbols never get longer words, so lengths may be taken nondecreasing
  let best = Infinity;
  const go = (i, minL, kraft, cost) => {
    if (cost >= best) return;
    if (i === n) { if (Math.abs(kraft - 1) < 1e-12) best = cost; return; }
    for (let l = minL; l < n; l++) { const k = kraft + 2 ** -l; if (k > 1 + 1e-12) continue; if (i === n - 1 && Math.abs(k - 1) > 1e-12) continue; go(i + 1, l, k, cost + W[i] * l); }
  };
  go(0, 1, 0, 0);
  return best;
}
/** Letter frequencies of a text (spaces shown as ␣), by decreasing count then letter. */
export function textFreqs(txt, maxSyms = 16) {
  const m = new Map(); for (const ch of String(txt)) { const c = ch === ' ' ? '␣' : ch; m.set(c, (m.get(c) || 0) + 1); }
  const L = [...m.entries()].map(([sym, w]) => ({ sym, w })).sort((a, b) => b.w - a.w || a.sym.localeCompare(b.sym));
  return { list: L.slice(0, maxSyms), cut: L.length > maxSyms, all: L.length };
}

// ---------------------------------------------------------------- drawing: forests of weighted trees (pixel geometry)
/**
 * Draw trees {id, w, sym?, kids?, dummy?} side by side. o: {hot: Set of ids, bits: true (edge digits), fmtW, color(t), top, bottom, left, right, small}.
 * Returns {pos: Map id → [x, y], depth}.
 */
export function drawForest(s, trees, o = {}) {
  const W = s.width, H = s.height, fw = o.fmtW || ((x) => fmt(x)), pos = new Map();
  const depthOf = (t) => (t.kids ? 1 + Math.max(...t.kids.map(depthOf)) : 0), leaves = (t) => (t.kids ? sumOf(t.kids, leaves) : 1);
  const L = sumOf(trees, leaves), gap = 16, left = o.left ?? 12, right = o.right ?? 12, top = o.top ?? 22, bottom = o.bottom ?? 22;
  const dx = Math.min(o.maxDx ?? 46, (W - left - right - gap * Math.max(0, trees.length - 1)) / Math.max(1, L));
  const md = Math.max(1, ...trees.map(depthOf)), dy = Math.min(o.maxDy ?? 50, (H - top - bottom) / md);
  let leaf = 0, off = left;
  const place = (t, d) => {
    if (!t.kids) { const x = off + (leaf + 0.5) * dx; leaf++; pos.set(t.id, [x, top + d * dy]); return x; }
    const xs = t.kids.map((k) => place(k, d + 1)), x = (xs[0] + xs[xs.length - 1]) / 2; pos.set(t.id, [x, top + d * dy]); return x;
  };
  for (const t of trees) { const l0 = leaf; place(t, 0); off += gap; void l0; }
  const bw = Math.max(18, Math.min(42, dx - 3));
  const drawEdges = (t) => { if (!t.kids) return; const [x, y] = pos.get(t.id); t.kids.forEach((k, i) => { const [kx, ky] = pos.get(k.id); LN(s, x, y + 10, kx, ky - 10, { color: o.hot && o.hot.has(k.id) ? 'gold' : 'muted', width: o.hot && o.hot.has(k.id) ? 2.4 : 1.5 }); if (o.bits) TX(s, i, (x + kx) / 2 + (kx < x ? -7 : kx > x ? 7 : 8), (y + ky) / 2, { size: 11, weight: 700, color: 'orange' }); drawEdges(k); }); };
  trees.forEach(drawEdges);
  const drawNodes = (t) => {
    const [x, y] = pos.get(t.id), hot = o.hot && o.hot.has(t.id), col = (o.color && o.color(t)) || (t.kids ? 'accent' : t.dummy ? 'faint' : 'teal');
    if (t.kids) {
      R(s, x - 17, y - 11, x + 17, y + 11, { fill: 'panel', fillAlpha: 1, stroke: false, radius: 11 });
      R(s, x - 17, y - 11, x + 17, y + 11, { fill: hot ? 'gold' : col, fillAlpha: hot ? 0.9 : 0.16, color: hot ? 'gold' : col, width: 1.5, radius: 11 });
      TX(s, fw(t.w), x, y + 0.5, { align: 'center', size: 11.5, weight: 700, color: hot ? 'panel' : 'ink', halo: false });
      t.kids.forEach(drawNodes);
    } else {
      R(s, x - bw / 2, y - 11, x + bw / 2, y + 11, { fill: 'panel', fillAlpha: 1, stroke: false, radius: 5 });
      R(s, x - bw / 2, y - 11, x + bw / 2, y + 11, { fill: hot ? 'gold' : col, fillAlpha: hot ? 0.9 : 0.2, color: col, width: 1.5, radius: 5 });
      TX(s, `${t.sym}`, x, y + 0.5, { align: 'center', size: 12.5, weight: 700, color: hot ? 'panel' : 'ink', halo: false });
      TX(s, fw(t.w), x, y + 21, { align: 'center', size: 10.5, weight: 600, color: 'muted' });
    }
  };
  trees.forEach(drawNodes);
  return { pos, depth: md };
}

// ---------------------------------------------------------------- spanning-tree machinery on a kit graph
export const eKey = (e) => `${K(e.from)}–${K(e.to)}`;
export class UF {
  constructor(items) { this.p = {}; for (const x of items) this.p[K(x)] = K(x); }
  find(x) { x = K(x); while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
  union(a, b) { const x = this.find(a), y = this.find(b); if (x === y) return false; this.p[x] = y; return true; }
}
/** Edges of G ranked by (weight, position): the tie-break that every algorithm here shares, so all of them find the same tree. */
export const ranked = (G) => G.edges.map((e, i) => ({ e, i })).sort((a, b) => (a.e.w ?? 1) - (b.e.w ?? 1) || a.i - b.i).map((x) => x.e);
export const wOf = (e) => e.w ?? 1;
export const totalW = (es) => sumOf([...es], wOf);
/** Number of connected components of the graph (V, es). */
export function compCount(G, es) { const u = new UF(ids(G)); let c = ids(G).length; for (const e of es) if (u.union(e.from, e.to)) c--; return c; }
/** Is es a spanning tree of G (n − 1 edges, connected)? */
export const isSpanningTree = (G, es) => { const A = [...es]; return A.length === ids(G).length - 1 && compCount(G, A) === 1; };
/** Exhaustive minimum spanning tree: {w, count (how many optimal trees), best (one optimal tree), all (number of spanning trees)}. m ≤ ~18. */
export function mstBrute(G) {
  const n = ids(G).length, E = G.edges, m = E.length; let best = Infinity, cnt = 0, bestSet = null, all = 0;
  const go = (i, chosen, w, u) => {
    if (chosen.length === n - 1) { all++; if (w < best - 1e-9) { best = w; cnt = 1; bestSet = chosen.slice(); } else if (Math.abs(w - best) < 1e-9) cnt++; return; }
    if (m - i < n - 1 - chosen.length) return;
    const e = E[i];
    // take e if it joins two components
    const u2 = new UF(ids(G)); for (const c of chosen) u2.union(c.from, c.to);
    if (u2.find(e.from) !== u2.find(e.to)) { chosen.push(e); go(i + 1, chosen, w + wOf(e), u); chosen.pop(); }
    go(i + 1, chosen, w, u);
  };
  go(0, [], 0, null);
  return { w: best, count: cnt, best: bestSet || [], all };
}
/** Kruskal with frames: {k, edge, ok, chosen (Set), comp (id → rep), weight, line, note}. */
export const KRUSKAL_CODE = ['sort the edges by weight', 'for each vertex v:  make-set(v)', 'for each edge u–v in sorted order:', '  if find(u) ≠ find(v):          ▷ different components', '    add u–v to T;  union(u, v)', '  else:  reject u–v              ▷ it would close a cycle', 'return T'];
export function kruskalTrace(G) {
  const order = ranked(G), u = new UF(ids(G)), chosen = new Set(), F = [], n = ids(G).length; let wt = 0;
  const comp = () => { const c = {}; for (const id of ids(G)) c[K(id)] = u.find(id); return c; };
  F.push({ k: 0, edge: null, chosen: new Set(chosen), comp: comp(), weight: 0, order, line: [1, 2], note: `Sort the ${order.length} edges by weight; every vertex starts as its own component.` });
  order.forEach((e, k) => {
    const ok = u.find(e.from) !== u.find(e.to);
    const done = chosen.size === n - 1;
    if (ok) { u.union(e.from, e.to); chosen.add(e); wt += wOf(e); }
    F.push({ k: k + 1, edge: e, ok, chosen: new Set(chosen), comp: comp(), weight: wt, order, line: ok ? [3, 4, 5] : [3, 4, 6], late: done,
      note: ok ? `Edge ${eKey(e)} (weight ${fmt(wOf(e))}) joins two different components: **accept**. Total ${fmt(wt)}.` : `Edge ${eKey(e)} (weight ${fmt(wOf(e))}) has both ends in one component: it would close a cycle, **reject**.` });
  });
  F.push({ k: order.length + 1, edge: null, chosen: new Set(chosen), comp: comp(), weight: wt, order, end: true, line: 7, note: chosen.size === n - 1 ? `Done: ${n - 1} edges, total weight ${fmt(wt)}.` : `Done, but only ${chosen.size} edges: the graph is disconnected, so this is a minimum spanning forest.` });
  return { frames: F, tree: [...chosen], weight: wt };
}
/** Prim–Jarník with frames: {step, tree (Set of vertices), edges (Set), cross (sorted crossing edges), pick, weight}. */
export const PRIM_CODE = ['pick a root r;  S ← {r};  T ← ∅', 'while S ≠ V:', '  among edges with one end in S and one outside,', '  take the lightest, u–v  (v ∉ S)', '  add v to S and u–v to T', 'return T'];
export function primTrace(G, root) {
  const I = ids(G).map(K), S = new Set([K(root)]), T = new Set(), F = [], order = ranked(G); let wt = 0;
  const cross = () => order.filter((e) => S.has(K(e.from)) !== S.has(K(e.to)));
  F.push({ S: new Set(S), T: new Set(T), cross: cross(), pick: null, weight: 0, line: 1, note: `Start the tree at ${G.lab(root)}.` });
  while (S.size < I.length) {
    const c = cross(); if (!c.length) { F.push({ S: new Set(S), T: new Set(T), cross: [], pick: null, weight: wt, end: true, line: 6, note: `No edge leaves the tree but ${I.length - S.size} vertices remain: the graph is disconnected.` }); break; }
    const e = c[0], v = S.has(K(e.from)) ? K(e.to) : K(e.from);
    F.push({ S: new Set(S), T: new Set(T), cross: c, pick: e, weight: wt, line: [3, 4], note: `The cut (S, V∖S) is crossed by ${plural(c.length, 'edge')}; the lightest is ${eKey(e)} of weight **${fmt(wOf(e))}**.` });
    S.add(v); T.add(e); wt += wOf(e);
    F.push({ S: new Set(S), T: new Set(T), cross: cross(), pick: null, added: e, weight: wt, line: 5, note: `Add ${G.lab(v)} to the tree. Total weight ${fmt(wt)}.` });
  }
  if (S.size === I.length) F.push({ S: new Set(S), T: new Set(T), cross: [], pick: null, weight: wt, end: true, line: 6, note: `S = V: a spanning tree of weight ${fmt(wt)}.` });
  return { frames: F, tree: [...T], weight: wt };
}
/** Borůvka: frames per round, each with a "select" frame (every component's lightest outgoing edge) and a "merge" frame. */
export function boruvkaTrace(G) {
  const order = ranked(G), rk = new Map(order.map((e, i) => [e, i])), u = new UF(ids(G)), T = new Set(), F = [], n = ids(G).length;
  const comp = () => { const c = {}; for (const id of ids(G)) c[K(id)] = u.find(id); return c; };
  let round = 0, nc = n;
  F.push({ round: 0, phase: 'init', comp: comp(), T: new Set(T), picks: new Map(), nc, line: 1, note: `Every vertex is a component: ${n} of them.` });
  while (nc > 1) {
    round++;
    const best = new Map();
    for (const e of order) { const a = u.find(e.from), b = u.find(e.to); if (a === b) continue; if (!best.has(a)) best.set(a, e); if (!best.has(b)) best.set(b, e); }
    if (!best.size) { F.push({ round, phase: 'stuck', comp: comp(), T: new Set(T), picks: new Map(), nc, end: true, line: 6, note: `No edge leaves any component: the graph is disconnected (${nc} components remain).` }); break; }
    F.push({ round, phase: 'select', comp: comp(), T: new Set(T), picks: new Map(best), nc, line: [2, 3], note: `Round ${round}: each of the ${nc} components picks its lightest outgoing edge (${new Set(best.values()).size} distinct edges; several components may pick the same one).` });
    for (const e of new Set(best.values())) { if (u.union(e.from, e.to)) T.add(e); }
    const nc2 = new Set(ids(G).map((id) => u.find(id))).size;
    F.push({ round, phase: 'merge', comp: comp(), T: new Set(T), picks: new Map(best), nc: nc2, before: nc, line: 4, note: `Merge along the picked edges: ${nc} → **${nc2}** components${nc2 <= nc / 2 ? `, at most half of ${nc}` : ''}.` });
    nc = nc2;
  }
  const tw = totalW(T);
  F.push({ round, phase: 'done', comp: comp(), T: new Set(T), picks: new Map(), nc, end: true, line: 6, note: nc === 1 ? `One component after ${round} round${round === 1 ? '' : 's'}: a spanning tree of weight ${fmt(tw)}.` : `Finished with ${nc} components.` });
  void rk;
  return { frames: F, tree: [...T], weight: tw, rounds: round };
}
/** A random spanning tree by randomised Kruskal; forceIn edges are taken first, forceOut edges never. */
export function randomTree(G, seed, forceIn = [], forceOut = []) {
  const r = rngOf(seed), u = new UF(ids(G)), T = [];
  for (const e of forceIn) if (u.union(e.from, e.to)) T.push(e);
  const rest = G.edges.filter((e) => !forceIn.includes(e) && !forceOut.includes(e)).map((e) => ({ e, k: r() })).sort((a, b) => a.k - b.k);
  for (const { e } of rest) if (u.union(e.from, e.to)) T.push(e);
  return T;
}
/** Edges on the path from a to b in the forest given by edge list T (null if none). */
export function treePath(T, a, b) {
  const adj = new Map(); for (const e of T) { for (const [x, y] of [[K(e.from), K(e.to)], [K(e.to), K(e.from)]]) { if (!adj.has(x)) adj.set(x, []); adj.get(x).push([y, e]); } }
  const prev = new Map([[K(a), null]]), q = [K(a)];
  while (q.length) { const x = q.shift(); if (x === K(b)) break; for (const [y, e] of adj.get(x) || []) if (!prev.has(y)) { prev.set(y, [x, e]); q.push(y); } }
  if (!prev.has(K(b))) return null;
  const P = []; let x = K(b); while (prev.get(x)) { P.push(prev.get(x)[1]); x = prev.get(x)[0]; } return P.reverse();
}
/** The 8-vertex, 15-edge road map used by the spanning-tree items (distinct weights; the minimum spanning tree has weight 34). */
export const MST_POS = { a: [0.8, 3.0], b: [2.7, 5.3], c: [2.7, 0.7], d: [4.8, 3.1], e: [6.2, 5.3], f: [6.2, 0.7], g: [7.9, 3.0], h: [9.4, 3.0] };
export const MST_EDGES = [['f', 'g', 1], ['d', 'g', 2], ['d', 'e', 3], ['c', 'd', 4], ['a', 'b', 5], ['b', 'd', 6], ['a', 'c', 7], ['d', 'f', 8], ['b', 'e', 9], ['c', 'f', 10], ['e', 'g', 11], ['a', 'd', 12], ['g', 'h', 13], ['e', 'h', 14], ['f', 'h', 15]];
export const nodesFrom = (P, extra = {}) => Object.entries(P).map(([id, [x, y]]) => ({ id, x, y, ...(extra[id] || {}) }));
export const COMPC = ['blue', 'orange', 'purple', 'teal', 'pink', 'green', 'gold', 'red'];

// ---------------------------------------------------------------- matroids and independence systems
/**
 * A system on elements 0…n−1 with an independence oracle indep(mask). info(): all independent masks.
 * Builders: graphic (edge list over vertices), linear (2-D vectors), uniform, matchings (of a graph).
 */
export const popc = (m) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
export const bitsOf = (m, n) => { const o = []; for (let i = 0; i < n; i++) if (m >> i & 1) o.push(i); return o; };
export function sysGraphic(edges) { const vs = [...new Set(edges.flat())]; return { n: edges.length, indep: (m) => { const u = new UF(vs); for (const i of bitsOf(m, edges.length)) if (!u.union(edges[i][0], edges[i][1])) return false; return true; } }; }
export function sysLinear(vecs) { return { n: vecs.length, indep: (m) => { const b = bitsOf(m, vecs.length).map((i) => vecs[i]); if (b.some(([x, y]) => x === 0 && y === 0)) return false; if (b.length > 2) return false; if (b.length === 2) { const [p, q] = b; return p[0] * q[1] - p[1] * q[0] !== 0; } return true; } }; }
export function sysUniform(k, n) { return { n, indep: (m) => popc(m) <= k }; }
export function sysMatching(edges) { return { n: edges.length, indep: (m) => { const seen = new Set(); for (const i of bitsOf(m, edges.length)) for (const x of edges[i]) { if (seen.has(x)) return false; seen.add(x); } return true; } }; }
export function allIndep(sys) { const out = []; for (let m = 0; m < 1 << sys.n; m++) if (sys.indep(m)) out.push(m); return out; }
/** Test the three axioms exhaustively. Returns {hereditary, nonempty, exchange, witness: {A, B} | null, count, pairs}. */
export function matroidTest(sys) {
  const I = allIndep(sys), set = new Set(I); let pairs = 0, witness = null, hered = true;
  for (const m of I) for (let i = 0; i < sys.n; i++) if (m >> i & 1 && !set.has(m & ~(1 << i))) hered = false;
  for (const A of I) for (const B of I) {
    if (popc(A) >= popc(B)) continue; pairs++;
    let ok = false; for (let i = 0; i < sys.n && !ok; i++) if ((B >> i & 1) && !(A >> i & 1) && set.has(A | 1 << i)) ok = true;
    if (!ok && !witness) witness = { A, B };
  }
  return { hereditary: hered, nonempty: set.has(0), exchange: !witness, witness, count: I.length, pairs, set };
}
/** Greedy: scan elements by decreasing weight, keep an element when the set stays independent. */
export function greedyIndep(sys, w) {
  const ord = Array.from({ length: sys.n }, (_, i) => i).sort((a, b) => w[b] - w[a] || a - b); let m = 0; const trace = [];
  for (const i of ord) { const ok = sys.indep(m | 1 << i); if (ok) m |= 1 << i; trace.push({ i, ok }); }
  return { mask: m, trace, ord, weight: sumOf(bitsOf(m, sys.n), (i) => w[i]) };
}
/** Best independent set by brute force (maximum total weight; weights are ≥ 0). */
export function bestIndep(sys, w) { let best = -Infinity, bm = 0; for (let m = 0; m < 1 << sys.n; m++) if (sys.indep(m)) { const t = sumOf(bitsOf(m, sys.n), (i) => w[i]); if (t > best) { best = t; bm = m; } } return { weight: best, mask: bm }; }
