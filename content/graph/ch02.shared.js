// Graph Theory (Diestel) — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
// Graphs are indexed with ix() from ch01.shared.js: vertices 0..n−1, edges 0..m−1 with E[k] = [a, b, edgeObject].
//
//  1. layout/editing helpers (fixed graphs, stages, a multigraph click-editor, a signature cache)
//  2. matchings: bipartite augmenting paths with events, Edmonds' blossom search with events, maximum matchings
//  3. brute force on vertex bitmasks (n ≤ 20): components, Tutte deficiency, vertex covers, feedback sets, cycle packings
//  4. spanning-tree families: exchange chains (Lemma 2.4.5) and the Bowler–Carmesin partition (Theorem 2.4.4)
//  5. path covers of digraphs and drawing helpers
import { K, ix, comps, bfs, ekey, blob, PALETTE, named } from './ch01.shared.js';
export { K, ix, comps, bfs, ekey, blob, PALETTE, named };
export { degrees, parPath, pathEdges, lambda, randomCubic, emap } from './ch01.shared.js';

const TAU = 2 * Math.PI;
// ================================================================ 1. layout and editing
/** Graph with fixed positions: P = {id: [x, y]}, E = 'ab cd …' (one-letter ids) or an array of pairs. */
export const fixed = (P, E) => ({
  nodes: Object.entries(P).map(([id, [x, y]]) => ({ id, x, y })),
  edges: Array.isArray(E) ? E.map((p) => [p[0], p[1]]) : E.trim().split(/\s+/).map((p) => [p[0], p[1]]),
  layout: 'none',
});
export const gstage = (v, o = {}) => v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 320, ...o });
export const EDIT = 'click empty space to add a vertex, click two vertices to add or remove the edge between them, Alt-click to delete, drag to move';
export const eset = (H, ks) => new Set([...ks].map((k) => H.E[k][2]));
/** A string that changes whenever the graph's vertices or edges change (positions ignored). */
export const sig = (G) => G.nodes.map((n) => K(n.id)).join(',') + '|' + G.edges.map((e) => K(e.from) + '-' + K(e.to)).join(',');
/** Cache the last result of f(G) by the graph's signature (plus an extra key). */
export function cacheBy(f) {
  let key = null, val = null;
  return (G, extra = '') => { const k = sig(G) + '#' + extra; if (k !== key) { key = k; val = f(G, extra); } return val; };
}
/**
 * Click-editor for multigraphs (parallel edges allowed, no loops): click empty space = new vertex, click a vertex then
 * another = add an edge (a parallel one if it exists), click an edge = add a parallel copy, shift-click an edge = remove it,
 * Alt-click = delete. Returns state {sel} (the selected vertex id, draw it with a ring).
 */
export function multiEdit(G, { maxNodes = 14, onEdit } = {}) {
  const st = { sel: null };
  const done = () => { if (onEdit) onEdit(); };
  G.onClick = ({ node, edge, x, y, alt, shift }) => {
    if (alt) { if (node) G.removeNode(node.id); else if (edge) G.removeEdge(edge); st.sel = null; done(); return true; }
    if (node) {
      if (st.sel == null || !G.has(st.sel)) st.sel = node.id;
      else if (K(st.sel) === K(node.id)) st.sel = null;
      else { G.addEdge(st.sel, node.id); st.sel = null; done(); }
      return true;
    }
    if (edge) { if (shift) G.removeEdge(edge); else G.addEdge(edge.from, edge.to); st.sel = null; done(); return true; }
    if (st.sel != null) { st.sel = null; return true; }
    if (G.nodes.length < maxNodes) { G.addNode({ id: G._newId ? G._newId() : 'n' + G.nodes.length, x, y }); done(); }
    return true;
  };
  return st;
}
export const MULTI_EDIT = 'click empty space to add a vertex, click two vertices to add an edge between them (again for a parallel edge), shift-click an edge to remove it, Alt-click a vertex to delete it';
/** Points on a circle (relative coordinates for layout 'fit' or data units around (cx, cy)). */
export const ringPts = (n, R = 1, cx = 0, cy = 0, a0 = Math.PI / 2) => Array.from({ length: n }, (_, i) => [cx + R * Math.cos(a0 - (TAU * i) / n), cy + R * Math.sin(a0 - (TAU * i) / n)]);

// ================================================================ 2. matchings
/** mate array (vertex index or −1) from a set/array of edge indices. */
export function mateOf(H, ks) { const mate = new Int32Array(H.n).fill(-1); for (const k of ks) { const [a, b] = H.E[k]; mate[a] = b; mate[b] = a; } return mate; }
/** Edge indices of the matching described by mate. */
export function matchEdges(H, mate) { const out = []; H.E.forEach(([a, b], k) => { if (a !== b && mate[a] === b && mate[b] === a) out.push(k); }); const seen = new Set(); return out.filter((k) => { const [a, b] = H.E[k], key = ekey(a, b); if (seen.has(key)) return false; seen.add(key); return true; }); }
export const matchSize = (mate) => { let c = 0; for (let v = 0; v < mate.length; v++) if (mate[v] > v) c++; return c; };
/** Is the set of edges (indices) a matching? Returns the first conflicting vertex or −1. */
export function conflict(H, ks) { const used = new Map(); for (const k of ks) { const [a, b] = H.E[k]; for (const x of [a, b]) { if (used.has(x)) return x; used.set(x, k); } } return -1; }

/**
 * Alternating search in a bipartite graph (side[v] = 0 for A, 1 for B) from the unmatched A-vertices in `roots`
 * (all of them by default): BFS along non-matching edges A → B and matching edges B → A.
 * Returns {reachA, reachB (Uint8Array), par (BFS parent), endB (an unmatched B-vertex reached, or −1)}.
 */
export function altReach(H, side, mate, roots) {
  const par = new Int32Array(H.n).fill(-1), seen = new Uint8Array(H.n), q = [];
  const R = roots ?? [...Array(H.n).keys()].filter((v) => side[v] === 0 && mate[v] < 0);
  for (const r of R) { seen[r] = 1; q.push(r); }
  let endB = -1;
  for (let i = 0; i < q.length; i++) {
    const u = q[i];
    if (side[u] === 0) {
      for (const [w] of H.adj[u]) if (!seen[w] && side[w] === 1 && mate[u] !== w) { seen[w] = 1; par[w] = u; q.push(w); if (mate[w] < 0 && endB < 0) endB = w; }
    } else if (mate[u] >= 0 && !seen[mate[u]]) { seen[mate[u]] = 1; par[mate[u]] = u; q.push(mate[u]); }
  }
  const reachA = new Uint8Array(H.n), reachB = new Uint8Array(H.n);
  for (let v = 0; v < H.n; v++) if (seen[v]) (side[v] ? reachB : reachA)[v] = 1;
  return { reachA, reachB, par, endB, order: q };
}
/** Vertex path root … t along parents. */
export function backPath(par, t) { const out = []; for (let u = t, g = 0; u >= 0 && g < 1e5; u = par[u], g++) out.push(u); return out.reverse(); }
/** Flip the matching along an augmenting path (vertex list). */
export function augment(mate, path) { for (let i = 0; i + 1 < path.length; i += 2) { mate[path[i]] = path[i + 1]; mate[path[i + 1]] = path[i]; } }
/**
 * Maximum bipartite matching by repeated augmenting paths, one search per unmatched A-vertex (Diestel §2.1, Ex. 1).
 * Returns {mate, events}; events (if o.events) are snapshots {type: 'search' | 'augment' | 'stuck' | 'done', root, path, mate, reachA, reachB, par}.
 */
export function bipMatch(H, side, o = {}) {
  const mate = o.mate ? Int32Array.from(o.mate) : new Int32Array(H.n).fill(-1), ev = [];
  const push = (e) => o.events && ev.push({ ...e, mate: Int32Array.from(mate) });
  push({ type: 'init' });
  for (let a = 0; a < H.n; a++) {
    if (side[a] !== 0 || mate[a] >= 0) continue;
    const r = altReach(H, side, mate, [a]);
    if (r.endB >= 0) {
      const path = backPath(r.par, r.endB);
      push({ type: 'search', root: a, path, ...r });
      augment(mate, path); // path starts at the unmatched a and alternates: flipping pairs up (0,1), (2,3), …
      push({ type: 'augment', root: a, path });
    } else push({ type: 'stuck', root: a, ...r });
  }
  push({ type: 'done' });
  return { mate, events: ev };
}
/** König's cover (proof of 2.1.1) for a maximum matching: from each matching edge take its B-end if an alternating path ends there, else its A-end. */
export function konigCover(H, side, mate) {
  const r = altReach(H, side, mate), U = [];
  for (let a = 0; a < H.n; a++) if (side[a] === 0 && mate[a] >= 0) U.push(r.reachB[mate[a]] ? mate[a] : a);
  return { U, ...r };
}

/**
 * Edmonds' search for an augmenting path from the unmatched vertex root, shrinking blossoms (or, with o.naive,
 * ignoring odd cycles like a bipartite search would). Classic array version: base[] = blossom bases, p[] = parent
 * pointers of inner vertices. Returns {path (vertex list root … free vertex, or null), events}.
 */
export function edmondsSearch(H, mate, root, o = {}) {
  const n = H.n, p = new Int32Array(n).fill(-1), base = Int32Array.from({ length: n }, (_, i) => i), used = new Uint8Array(n), ev = [];
  const snap = (type, extra = {}) => { if (o.events) ev.push({ type, used: Uint8Array.from(used), p: Int32Array.from(p), base: Int32Array.from(base), ...extra }); };
  const lca = (a, b) => {
    const seen = new Uint8Array(n);
    for (let g = 0; g < 4 * n; g++) { a = base[a]; seen[a] = 1; if (mate[a] < 0) break; a = p[mate[a]]; }
    for (let g = 0; g < 4 * n; g++) { b = base[b]; if (seen[b]) return b; b = p[mate[b]]; }
    return b;
  };
  let blossom;
  const markPath = (v, b, child) => { for (let g = 0; base[v] !== b && g < 4 * n; g++) { blossom[base[v]] = blossom[base[mate[v]]] = 1; p[v] = child; child = mate[v]; v = p[mate[v]]; } };
  used[root] = 1; const q = [root]; snap('root', { v: root });
  for (let qi = 0; qi < q.length; qi++) {
    const v = q[qi];
    for (const [to] of H.adj[v]) {
      if (base[v] === base[to] || mate[v] === to) continue;
      if (to === root || (mate[to] >= 0 && p[mate[to]] >= 0)) {
        if (o.naive) { snap('odd', { v, to }); continue; }
        const cb = lca(v, to); blossom = new Uint8Array(n);
        markPath(v, cb, to); markPath(to, cb, v);
        for (let i = 0; i < n; i++) if (blossom[base[i]]) { base[i] = cb; if (!used[i]) { used[i] = 1; q.push(i); } }
        const members = []; for (let i = 0; i < n; i++) if (base[i] === cb) members.push(i);
        snap('blossom', { v, to, b: cb, members });
      } else if (p[to] < 0) {
        p[to] = v;
        if (mate[to] < 0) {
          const path = []; let x = to;
          for (let g = 0; x >= 0 && g < 2 * n; g++) { const px = p[x], ppx = mate[px]; path.push(x, px); x = ppx; }
          path.reverse(); snap('found', { v, to, path });
          return { path, events: ev };
        }
        used[mate[to]] = 1; q.push(mate[to]); snap('grow', { v, to, m: mate[to] });
      }
    }
  }
  snap('fail');
  return { path: null, events: ev };
}
/** Maximum matching in a general graph (Edmonds): mate array. Optional start matching. */
export function maxMatching(H, start) {
  const mate = start ? Int32Array.from(start) : new Int32Array(H.n).fill(-1);
  if (!start) for (const [a, b] of H.E) if (a !== b && mate[a] < 0 && mate[b] < 0) { mate[a] = b; mate[b] = a; } // greedy start
  for (let v = 0; v < H.n; v++) if (mate[v] < 0) { const r = edmondsSearch(H, mate, v); if (r.path) augment(mate, r.path); }
  return mate;
}
/** Maximum matching of the subgraph induced by the vertices with alive(v); returns mate over all of H (−1 for dead). */
export function maxMatchingOn(H, alive) {
  const keep = [...Array(H.n).keys()].filter(alive), loc = new Map(keep.map((v, i) => [v, i]));
  const sub = { n: keep.length, adj: keep.map((v) => H.adj[v].filter(([w]) => loc.has(w)).map(([w, k]) => [loc.get(w), k])), E: [] };
  const m = maxMatching(sub), mate = new Int32Array(H.n).fill(-1);
  keep.forEach((v, i) => { if (m[i] >= 0) mate[v] = keep[m[i]]; });
  return mate;
}

// ================================================================ 3. brute force on bitmasks
export const popc = (x) => { let c = 0; while (x) { x &= x - 1; c++; } return c; };
export const bitsOf = (x) => { const out = []; for (let v = 0; x; v++, x >>>= 1) if (x & 1) out.push(v); return out; };
/** Adjacency bitmasks (simple graph, n ≤ 30). */
export function adjMasks(H) { const A = new Array(H.n).fill(0); for (const [a, b] of H.E) if (a !== b) { A[a] |= 1 << b; A[b] |= 1 << a; } return A; }
/** Components of the subgraph induced by the bitmask alive, as bitmasks. */
export function compMasks(A, alive) {
  const out = []; let rest = alive;
  while (rest) {
    const low = rest & -rest; let comp = low, fr = low;
    while (fr) { const b = fr & -fr; fr ^= b; const v = 31 - Math.clz32(b), nb = A[v] & rest & ~comp; comp |= nb; fr |= nb; }
    rest &= ~comp; out.push(comp);
  }
  return out;
}
/** q(G − S): the number of odd components. */
export const oddCount = (A, n, S) => compMasks(A, ((1 << n) - 1) & ~S).filter((c) => popc(c) % 2).length;
/**
 * Tutte deficiency over all S ⊆ V (n ≤ 18): def = max_S q(G − S) − |S| (≥ 0 counting S = ∅ only when n is even...)
 * Returns {def, small (a smallest maximiser), large (a largest maximiser = Diestel's S in 2.2.3)} as bitmasks.
 */
export function tutteDeficiency(H) {
  const A = adjMasks(H), n = H.n, all = (1 << n) - 1;
  let def = -Infinity, small = 0, large = 0;
  for (let S = 0; S <= all; S++) {
    const d = oddCount(A, n, S) - popc(S);
    if (d > def) { def = d; small = S; large = S; }
    else if (d === def) { if (popc(S) < popc(small)) small = S; if (popc(S) > popc(large)) large = S; }
  }
  return { def, small, large };
}
/** Next k-subset bitmask (Gosper's hack). */
const nextComb = (x) => { const c = x & -x, r = x + c; return (((r ^ x) >>> 2) / c) | r; };
/** Smallest set (bitmask) with pred(mask) true, searching sizes 0, 1, …, maxK. */
export function smallestSet(n, pred, maxK = n) {
  for (let k = 0; k <= Math.min(n, maxK); k++) {
    if (k === 0) { if (pred(0)) return 0; continue; }
    for (let x = (1 << k) - 1; x < 1 << n; x = nextComb(x)) { if (pred(x)) return x; if (k === n) break; }
  }
  return -1;
}
/** Minimum vertex cover (bitmask). */
export function minVertexCover(H) { const E = H.E.filter(([a, b]) => a !== b); return smallestSet(H.n, (U) => E.every(([a, b]) => (U >> a) & 1 || (U >> b) & 1)); }
/** Is G − X a forest? (simple graph) */
export function isForestMinus(H, A, X) {
  const alive = ((1 << H.n) - 1) & ~X; let m = 0;
  for (const [a, b] of H.E) if (a !== b && (alive >> a) & 1 && (alive >> b) & 1) m++;
  return m === popc(alive) - compMasks(A, alive).length;
}
/** Minimum feedback vertex set τ(G): a smallest X meeting every cycle (bitmask). */
export function minFeedback(H) { const A = adjMasks(H); return smallestSet(H.n, (X) => isForestMinus(H, A, X)); }
/** Induced (chordless) cycles through v inside alive, as vertex lists. */
function inducedCyclesThrough(A, alive, v, cap = 4000) {
  const out = [], path = [v];
  const go = (u, onPath) => {
    if (out.length >= cap) return;
    let cand = A[u] & alive & ~onPath;
    while (cand) {
      const b = cand & -cand; cand ^= b; const w = 31 - Math.clz32(b);
      if (w < v) continue; // v is the smallest vertex of the cycle
      const inner = onPath & ~(1 << v) & ~(1 << u); // path vertices other than the ends
      if (A[w] & inner) continue; // a chord
      if (path.length >= 2 && (A[w] >> v) & 1) { out.push([...path, w]); continue; } // w closes the cycle (extending would add a chord wv)
      path.push(w); go(w, onPath | b); path.pop();
    }
  };
  go(v, 1 << v);
  return out;
}
/** Maximum number of disjoint cycles ν(G) with a packing (lists of vertices); exact by memoised branching (n ≤ ~20). */
export function maxCyclePacking(H) {
  const A = adjMasks(H), memo = new Map();
  const core = (mask) => { // strip vertices of degree ≤ 1
    let ch = true;
    while (ch) { ch = false; for (let x = mask; x; x &= x - 1) { const v = 31 - Math.clz32(x & -x); if (popc(A[v] & mask) <= 1) { mask &= ~(1 << v); ch = true; } } }
    return mask;
  };
  const best = (mask0) => {
    const mask = core(mask0); if (!mask) return { val: 0, cyc: [] };
    if (memo.has(mask)) return memo.get(mask);
    const v = 31 - Math.clz32(mask & -mask); // the smallest vertex of the 2-core
    let res = best(mask & ~(1 << v));
    if (res.val < Math.floor(popc(mask) / 3)) {
      for (const C of inducedCyclesThrough(A, mask, v)) {
        let cm = 0; for (const w of C) cm |= 1 << w;
        const r = best(mask & ~cm);
        if (r.val + 1 > res.val) { res = { val: r.val + 1, cyc: [C, ...r.cyc] }; if (res.val >= Math.floor(popc(mask) / 3)) break; }
      }
    }
    memo.set(mask, res); return res;
  };
  return best((1 << H.n) - 1);
}
/** Max matching size by brute force (for verification, n ≤ 16). */
export function bruteMatching(H) {
  const E = H.E.filter(([a, b]) => a !== b); let best = 0;
  const go = (i, used, c) => { if (c + Math.floor((H.n - popc(used)) / 2) <= best) return; if (c > best) best = c; for (let k = i; k < E.length; k++) { const [a, b] = E[k]; if ((used >> a) & 1 || (used >> b) & 1) continue; go(k + 1, used | (1 << a) | (1 << b), c + 1); } };
  go(0, 0, 0); return best;
}

// ================================================================ 4. spanning-tree families (§2.4), multigraphs
/** Tree structure (parent pointers) of the edge mask T on the multigraph H, rooted at 0: {par, parE, depth} (depth −1 if unreached). */
function treeOf(H, T) {
  const par = new Int32Array(H.n).fill(-1), parE = new Int32Array(H.n).fill(-1), depth = new Int32Array(H.n).fill(-1);
  for (let r = 0; r < H.n; r++) {
    if (depth[r] >= 0) continue; depth[r] = 0; const q = [r];
    for (let i = 0; i < q.length; i++) { const u = q[i]; for (const [w, k] of H.adj[u]) if (T[k] && depth[w] < 0) { depth[w] = depth[u] + 1; par[w] = u; parE[w] = k; q.push(w); } }
  }
  return { par, parE, depth };
}
/** Edge indices of the tree path between a and b. */
function treePathEdges(t, a, b) {
  const out = []; let x = a, y = b, g = 0;
  while (x !== y && g++ < 1e4) { if (t.depth[x] >= t.depth[y]) { out.push(t.parE[x]); x = t.par[x]; } else { out.push(t.parE[y]); y = t.par[y]; } }
  return out;
}
/** Fundamental cycle (edge indices, without f itself) of the chord f with respect to the tree mask T (with structure t). */
export function fundCycleEdges(H, t, f) { const [a, b] = H.E[f]; return a === b ? [] : treePathEdges(t, a, b); }
/** Is the edge mask a spanning tree of the (connected) multigraph H? */
export function isSpanningTree(H, T) { let m = 0; for (const x of T) m += x; if (m !== H.n - 1) return false; const t = treeOf(H, T); return [...t.depth].filter((d) => d === 0).length === 1; }
/** BFS spanning tree mask of a connected multigraph. */
export function bfsTreeMask(H) { const T = new Uint8Array(H.m), t = bfs(H, 0); for (let v = 0; v < H.n; v++) if (t.parE[v] >= 0) T[t.parE[v]] = 1; return T; }
/**
 * Exchange-chain search (the set D of Theorem 2.4.4's proof): BFS backwards from the edges in no tree; an edge e enters
 * D via (f, j) if f ∈ D is a chord of T_j whose fundamental cycle contains e. Returns {inD, dist, via, used, hit}
 * where hit is the first edge reached that lies in ≥ 2 trees (−1 if none), whose chain e_0 = hit, e_1 = via…, ends unused.
 */
export function exchangeSearch(H, T, stopAtHit = true) {
  const k = T.length, m = H.m, used = new Int32Array(m);
  for (const Tj of T) for (let e = 0; e < m; e++) used[e] += Tj[e];
  const ts = T.map((Tj) => treeOf(H, Tj)), dist = new Int32Array(m).fill(-1), via = Array(m).fill(null), q = [];
  for (let e = 0; e < m; e++) if (!used[e]) { dist[e] = 0; q.push(e); }
  let hit = -1;
  for (let i = 0; i < q.length && !(stopAtHit && hit >= 0); i++) {
    const f = q[i];
    for (let j = 0; j < k; j++) {
      if (T[j][f]) continue;
      for (const e of fundCycleEdges(H, ts[j], f)) {
        if (dist[e] >= 0) continue;
        dist[e] = dist[f] + 1; via[e] = { f, j }; q.push(e);
        if (used[e] >= 2 && hit < 0) hit = e;
      }
    }
  }
  return { inD: Uint8Array.from(dist, (d) => (d >= 0 ? 1 : 0)), dist, via, used, hit };
}
/** The chain e_0 = hit, e_1, …, e_n (edge indices) with the tree index j(i) for each step. */
export function chainFrom(X, e0) { const chain = [e0], js = []; let e = e0; for (let g = 0; X.via[e] && g < 1e4; g++) { js.push(X.via[e].j); e = X.via[e].f; chain.push(e); } return { chain, js }; }
/**
 * Bowler–Carmesin: k spanning trees of the connected multigraph H with E(T) maximal, by Lemma 2.4.5 exchanges,
 * then the partition P = components of (V, D). Returns {T (masks), D (mask), part (class index per vertex), np,
 * rounds: [{before, chain, js, after}] (if o.log), ok}.
 */
export function packCover(H, k, o = {}) {
  const T0 = o.start ? o.start.map((x) => Uint8Array.from(x)) : null;
  let T = T0 || Array.from({ length: k }, () => bfsTreeMask(H));
  const rounds = [];
  for (let g = 0; g < H.m + 2; g++) {
    const X = exchangeSearch(H, T);
    if (X.hit < 0) break;
    const { chain, js } = chainFrom(X, X.hit), before = T.map((x) => Uint8Array.from(x));
    for (let i = 0; i + 1 < chain.length; i++) { const j = js[i]; T[j][chain[i + 1]] = 1; T[j][chain[i]] = 0; }
    if (o.log) rounds.push({ before, chain, js, after: T.map((x) => Uint8Array.from(x)) });
  }
  const X = exchangeSearch(H, T, false), D = X.inD;
  const C = comps(H, null, (e) => D[e] === 1), part = C.comp;
  const ok = T.every((Tj) => isSpanningTree(H, Tj));
  return { T, D, part, np: C.k, rounds, ok, used: X.used };
}
/** Number of edges between different classes of a partition (cross-edges); loops never cross. */
export function crossEdges(H, part) { let c = 0; for (const [a, b] of H.E) if (part[a] !== part[b]) c++; return c; }
/** Densest set for tree covering: max over U (|U| ≥ 2) of ‖G[U]‖ / (|U| − 1), with U as a bitmask (n ≤ 16, multigraph). */
export function densest(H) {
  let best = { ratio: 0, U: 0, e: 0 };
  for (let U = 1; U < 1 << H.n; U++) {
    const s = popc(U); if (s < 2) continue; let e = 0;
    for (const [a, b] of H.E) if ((U >> a) & 1 && (U >> b) & 1) e++;
    const r = e / (s - 1); if (r > best.ratio + 1e-9 || (Math.abs(r - best.ratio) < 1e-9 && s < popc(best.U))) best = { ratio: r, U, e };
  }
  return best;
}
/** Is the multigraph connected? */
export const isConnected = (H) => H.n > 0 && comps(H).k === 1;

// ================================================================ 5. path covers and drawing
/** Draw translucent blobs for vertex sets (arrays of ids) on the stage of the kit graph G; colors = palette names. */
export function blobs(v, s, G, groups, colors, wpx = 34, alpha = 0.2) {
  groups.forEach((ids, i) => {
    const set = new Set(ids.map(K)), pts = ids.map((id) => G.node(id)).filter(Boolean).map((n) => [n.x, n.y]);
    const segs = G.edges.filter((e) => set.has(K(e.from)) && set.has(K(e.to)) && K(e.from) !== K(e.to)).map((e) => [[G.node(e.from).x, G.node(e.from).y], [G.node(e.to).x, G.node(e.to).y]]);
    const col = typeof colors === 'function' ? colors(i, ids) : Array.isArray(colors) ? colors[i % colors.length] : colors;
    blob(s, pts, segs, v.color(col), wpx, alpha);
  });
}
/** Square marker around a vertex (for S-sets): outline in pixels. */
export function squareMark(s, G, id, color, half = 17, width = 2.4) {
  const n = G.node(id); if (!n) return;
  const c = s.ctx, X = s.X(n.x), Y = s.Y(n.y); c.save(); c.strokeStyle = color; c.lineWidth = width; c.setLineDash([]);
  c.beginPath(); c.rect(X - half, Y - half, 2 * half, 2 * half); c.stroke(); c.restore();
}
/** Vertex-disjoint directed paths from a successor map (Map id → id): arrays of ids, each from first to last vertex. */
export function pathsFromSucc(ids, succ) {
  const hasPred = new Set([...succ.values()].map(K)), out = [];
  for (const id of ids) if (!hasPred.has(K(id))) { const P = [id]; let x = id, g = 0; while (succ.has(K(x)) && g++ < 1e4) { x = succ.get(K(x)); P.push(x); } out.push(P); }
  return out;
}
