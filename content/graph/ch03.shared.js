// Graph Theory (Diestel) — Chapter 3: helpers shared by ch03.js and ch03-b.js (plain named exports).
// Re-exports the chapter 1–2 toolbox (ix, BFS, components, κ/λ by max-flow, named graphs, blobs, bitmask brute force) and adds:
//
//  1. blocks, cutvertices, block graphs, ear decompositions                                   (§3.1)
//  2. multigraphs with "paths" on their edges: G ∸ e (delete + suppress), G/e, brute-force 3-connectivity (§3.2)
//  3. cycles, bonds, induced non-separating cycles, GF(2) solving                              (§§3.1–3.2)
//  4. Menger: disjoint A–B paths by alternating walks (with events), fans, independent and edge-disjoint
//     paths, brute-force minimum separators                                                    (§3.3)
//  5. A-paths and H-paths by brute force (Gallai, Mader)                                         (§3.4)
//  6. linkages and topological complete minors by backtracking                                  (§3.5)
import { K, ix, comps, bfs, ekey, blob, PALETTE, named, blobs, fixed, gstage, EDIT, eset, cacheBy, popc, bitsOf, smallestSet, compMasks, ringPts, squareMark } from './ch02.shared.js';
import { kappa, lambda, vertexCut, girth, NAMED, parPath } from './ch01.shared.js';
export { K, ix, comps, bfs, ekey, blob, PALETTE, named, blobs, fixed, gstage, EDIT, eset, cacheBy, popc, bitsOf, smallestSet, compMasks, ringPts, squareMark };
export { kappa, lambda, vertexCut, girth, NAMED, parPath };
export { degrees, pathEdges, emap } from './ch01.shared.js';

const TAU = 2 * Math.PI;
// ================================================================ 0. small utilities
/** Adjacency bitmasks of an index structure (n ≤ 30); loops and parallel edges ignored. */
export function amask(H) { const A = new Array(H.n).fill(0); for (const [a, b] of H.E) if (a !== b) { A[a] |= 1 << b; A[b] |= 1 << a; } return A; }
/** Is the vertex set alive (bitmask) connected (and non-empty)? */
export function maskConnected(A, alive) {
  if (!alive) return false; let comp = alive & -alive, fr = comp;
  while (fr) { const b = fr & -fr; fr ^= b; const v = 31 - Math.clz32(b), nb = A[v] & alive & ~comp; comp |= nb; fr |= nb; }
  return comp === alive;
}
/** Graph spec with relative coordinates for layout 'fit': P = {id: [x, y]}, E = 'ab cd' or pairs. */
export const fit = (P, E) => ({ ...fixed(P, E), layout: 'fit' });
/** Wheel C^n * K^1 (hub 'h'). */
export function wheel(n) {
  const nodes = [{ id: 'h', x: 0, y: 0 }], edges = [];
  for (let i = 0; i < n; i++) { const a = Math.PI / 2 - (TAU * i) / n; nodes.push({ id: 'w' + i, label: String(i + 1), x: Math.cos(a), y: Math.sin(a) }); edges.push(['h', 'w' + i], ['w' + i, 'w' + ((i + 1) % n)]); }
  return { nodes, edges, layout: 'fit' };
}
/** Subscript digits. */
const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const sub = (s) => String(s).replace(/\d/g, (d) => SUB[d]);

// ================================================================ 1. blocks
/**
 * Blocks of a (simple) graph by Tarjan's lowpoint DFS. Returns {blocks: [{V: [vertex idx], E: [edge idx]}],
 * edgeBlock (block index per edge), cut (Uint8Array, cutvertices), vBlocks (block indices per vertex)}.
 * Isolated vertices form blocks without edges.
 */
export function blocks(H) {
  const n = H.n, disc = new Int32Array(n).fill(-1), low = new Int32Array(n), out = [], edgeBlock = new Int32Array(H.m).fill(-1), cut = new Uint8Array(n);
  let time = 0; const est = [];
  for (let r = 0; r < n; r++) {
    if (disc[r] >= 0) continue;
    if (!H.adj[r].length) { disc[r] = time++; out.push({ V: [r], E: [] }); continue; }
    disc[r] = low[r] = time++; let rootKids = 0;
    const st = [[r, -1, 0]];
    while (st.length) {
      const top = st[st.length - 1], [u, pe] = top;
      if (top[2] < H.adj[u].length) {
        const [w, k] = H.adj[u][top[2]++];
        if (k === pe) continue;
        if (disc[w] < 0) { est.push(k); disc[w] = low[w] = time++; st.push([w, k, 0]); if (u === r) rootKids++; }
        else if (disc[w] < disc[u]) { est.push(k); low[u] = Math.min(low[u], disc[w]); }
      } else {
        st.pop(); if (!st.length) break;
        const p = st[st.length - 1][0]; low[p] = Math.min(low[p], low[u]);
        if (low[u] >= disc[p]) {
          if (p !== r) cut[p] = 1;
          const E = [], Vs = new Set(); let k;
          do { k = est.pop(); E.push(k); Vs.add(H.E[k][0]); Vs.add(H.E[k][1]); edgeBlock[k] = out.length; } while (k !== pe);
          out.push({ V: [...Vs].sort((a, b) => a - b), E });
        }
      }
    }
    if (rootKids > 1) cut[r] = 1;
  }
  const vBlocks = Array.from({ length: n }, () => []); out.forEach((B, i) => B.V.forEach((v) => vBlocks[v].push(i)));
  return { blocks: out, edgeBlock, cut, vBlocks };
}
/** Block graph: bipartite on cutvertices and blocks, a ~ B iff a ∈ B. Returns {nodes: [{kind: 'cut'|'block', i}], edges: [[p, q]]}. */
export function blockGraph(H, BL = blocks(H)) {
  const nodes = [], edges = [], cutIdx = new Map();
  BL.blocks.forEach((B, i) => nodes.push({ kind: 'block', i }));
  for (let v = 0; v < H.n; v++) if (BL.cut[v]) { cutIdx.set(v, nodes.length); nodes.push({ kind: 'cut', i: v }); }
  BL.blocks.forEach((B, i) => B.V.forEach((v) => { if (BL.cut[v]) edges.push([i, cutIdx.get(v)]); }));
  return { nodes, edges, cutIdx };
}
/**
 * Ear decomposition (Proposition 3.1.1), following Diestel's proof: start from a shortest cycle C = H; while H ≠ G, add an edge
 * of G − E(H) with both ends in H (an ear of length 1), or else take an edge vw with w ∈ H, v ∉ H and a v–H path P in G − w,
 * and add the ear wvP. Returns {ok, cycle: [vertex idx], ears: [[vertex idx]], fail: {w, v, reason} | null}.
 */
export function earDecomp(H) {
  const n = H.n;
  if (n < 3) return { ok: false, cycle: [], ears: [], fail: { reason: 'small' } };
  const C = comps(H); if (C.k > 1) return { ok: false, cycle: [], ears: [], fail: { reason: 'disconnected' } };
  const g = girth(H); if (g.g === Infinity) return { ok: false, cycle: [], ears: [], fail: { reason: 'forest' } };
  const inV = new Uint8Array(n), inE = new Uint8Array(H.m), ears = [];
  const M = new Map(H.E.map(([a, b], k) => [ekey(a, b), k]));
  const mark = (vs, close) => { vs.forEach((v) => (inV[v] = 1)); for (let i = 0; i + 1 < vs.length; i++) inE[M.get(ekey(vs[i], vs[i + 1]))] = 1; if (close) inE[M.get(ekey(vs[vs.length - 1], vs[0]))] = 1; };
  mark(g.cycle, true);
  for (let guard = 0; guard < H.m + n; guard++) {
    let k1 = -1; for (let k = 0; k < H.m; k++) if (!inE[k] && inV[H.E[k][0]] && inV[H.E[k][1]]) { k1 = k; break; }
    if (k1 >= 0) { const ear = [H.E[k1][0], H.E[k1][1]]; mark(ear); ears.push(ear); continue; }
    let w = -1, v = -1;
    for (let k = 0; k < H.m && w < 0; k++) { const [a, b] = H.E[k]; if (inV[a] && !inV[b]) { w = a; v = b; } else if (inV[b] && !inV[a]) { w = b; v = a; } }
    if (w < 0) break;
    const r = bfs(H, v, (x) => x !== w);
    let best = -1; for (let x = 0; x < n; x++) if (inV[x] && x !== w && r.dist[x] < Infinity && (best < 0 || r.dist[x] < r.dist[best])) best = x;
    if (best < 0) return { ok: false, cycle: g.cycle, ears, fail: { w, v, reason: 'cutvertex' } };
    const P = parPath(r.par, best), ear = [w, ...P]; mark(ear); ears.push(ear);
  }
  return { ok: true, cycle: g.cycle, ears, fail: null };
}

// ================================================================ 2. multigraphs with edge paths (§3.2)
/** Multigraph {ids, E: [{a, b, path: [ids]}]} from a kit graph / index structure; every edge remembers the path of G it stands for. */
export function toMG(H) { return { ids: H.ids.slice(), E: H.E.map(([a, b]) => ({ a, b, path: [H.ids[a], H.ids[b]] })) }; }
export const mgN = (M) => M.ids.length;
export function mgDeg(M) { const d = new Array(M.ids.length).fill(0); for (const e of M.E) { d[e.a]++; d[e.b]++; } return d; }
/** Index structure (for ix-based helpers) of a multigraph; o.multi keeps loops/parallels. */
export function mgIx(M, o = {}) { return ix({ nodes: M.ids.map((id) => ({ id })), edges: M.E.map((e) => ({ from: M.ids[e.a], to: M.ids[e.b], mg: e })) }, o); }
/** Number of pairs of parallel edges and loops. */
export function mgFlaws(M) {
  const seen = new Map(); let par = 0, loops = 0; const parE = [];
  for (const e of M.E) { if (e.a === e.b) { loops++; continue; } const k = ekey(e.a, e.b); if (seen.has(k)) { par++; parE.push(e, seen.get(k)); } else seen.set(k, e); }
  return { par, loops, parE };
}
/** G ∸ e: delete edge k, then suppress every end of it that now has degree 2. Returns {M, suppressed: [ids], newEdges}. */
export function delSuppress(M, k) {
  let E = M.E.filter((_, i) => i !== k).map((e) => ({ ...e }));
  const ends = [M.E[k].a, M.E[k].b], gone = new Set(), newEdges = [];
  for (const x of ends) {
    if (gone.has(x)) continue;
    const inc = E.filter((e) => e.a === x || e.b === x);
    if (inc.length !== 2 || inc.some((e) => e.a === e.b)) continue;
    const [e1, e2] = inc, p = e1.a === x ? e1.b : e1.a, q = e2.a === x ? e2.b : e2.a;
    const toX = e1.a === x ? e1.path.slice().reverse() : e1.path, fromX = e2.a === x ? e2.path : e2.path.slice().reverse();
    E = E.filter((e) => e !== e1 && e !== e2);
    const ne = { a: p, b: q, path: toX.concat(fromX.slice(1)) }; E.push(ne); newEdges.push(ne); gone.add(x);
  }
  const keep = M.ids.map((_, i) => i).filter((i) => !gone.has(i)), re = new Map(keep.map((i, j) => [i, j]));
  return { M: { ids: keep.map((i) => M.ids[i]), E: E.map((e) => ({ ...e, a: re.get(e.a), b: re.get(e.b) })) }, suppressed: [...gone].map((i) => M.ids[i]), newEdges: newEdges.map((e) => ({ ...e, a: re.get(e.a), b: re.get(e.b) })) };
}
/** G/e for a simple graph: merge the ends of edge k (into the first end), drop loops and parallel copies. bags: id → [original ids]. */
export function contractMG(M, k, bags) {
  const { a, b } = M.E[k], keep = M.ids.map((_, i) => i).filter((i) => i !== b), re = new Map(keep.map((i, j) => [i, j]));
  re.set(b, re.get(a));
  const seen = new Set(), E = [];
  for (const e of M.E) { const x = re.get(e.a), y = re.get(e.b); if (x === y) continue; const key = ekey(x, y); if (seen.has(key)) continue; seen.add(key); E.push({ a: x, b: y, path: e.path }); }
  const nb = bags ? { ...bags } : null;
  if (nb) { nb[K(M.ids[a])] = (bags[K(M.ids[a])] || [M.ids[a]]).concat(bags[K(M.ids[b])] || [M.ids[b]]); delete nb[K(M.ids[b])]; }
  return { M: { ids: keep.map((i) => M.ids[i]), E }, bags: nb, kept: M.ids[a], merged: M.ids[b] };
}
/**
 * Smallest separator of size < k by brute force on bitmasks (n ≤ 26): returns {ok (no such separator and n > k), sep: [indices] | null}.
 * Parallel edges/loops are ignored here; use mgIs3 for Diestel's convention that a 3-connected multigraph has no parallel edges.
 */
export function smallSep(n, A, k) {
  if (n <= k) return { ok: false, sep: null, tooSmall: true };
  const all = (1 << n) - 1;
  for (let s = 0; s < k; s++) {
    const sets = s === 0 ? [0] : combos(n, s);
    for (const X of sets) { const alive = all & ~X; if (!maskConnected(A, alive)) return { ok: false, sep: bitsOf(X) }; }
  }
  return { ok: true, sep: null };
}
/** All s-subsets of {0..n−1} as bitmasks. */
export function combos(n, s) { const out = []; const go = (i, left, m) => { if (!left) { out.push(m); return; } for (let j = i; j <= n - left; j++) go(j + 1, left - 1, m | (1 << j)); }; go(0, s, 0); return out; }
/** Is the multigraph 3-connected (Diestel: more than 3 vertices, no loops or parallel edges, no separator of ≤ 2 vertices)? */
export function mgIs3(M) {
  const n = mgN(M), f = mgFlaws(M);
  const A = new Array(n).fill(0); for (const e of M.E) if (e.a !== e.b) { A[e.a] |= 1 << e.b; A[e.b] |= 1 << e.a; }
  const r = smallSep(n, A, 3);
  return { ok: r.ok && !f.par && !f.loops, sep: r.sep, par: f.par, loops: f.loops, small: n <= 3 };
}
/** Is the (simple) index structure k-connected? brute force for small k: {ok, sep}. */
export function isKconn(H, k) { return smallSep(H.n, amask(H), k); }

// ================================================================ 3. cycles, bonds, GF(2)
/** All cycles (each once) as {vs: [vertex idx], E: Uint8Array(m)}; cap limits the count. */
export function allCycles(H, cap = 3000) {
  const out = [], on = new Uint8Array(H.n), M = new Map(H.E.map(([a, b], k) => [ekey(a, b), k])), path = [];
  const emit = () => { const E = new Uint8Array(H.m); for (let i = 0; i < path.length; i++) E[M.get(ekey(path[i], path[(i + 1) % path.length]))] = 1; out.push({ vs: path.slice(), E }); };
  const go = (s, u) => {
    if (out.length >= cap) return;
    for (const [w] of H.adj[u]) {
      if (w === s && path.length >= 3 && path[1] < u) emit();
      else if (w > s && !on[w]) { on[w] = 1; path.push(w); go(s, w); path.pop(); on[w] = 0; }
    }
  };
  for (let s = 0; s < H.n; s++) { on[s] = 1; path.push(s); go(s, s); path.pop(); on[s] = 0; }
  return out;
}
/** Bonds (minimal non-empty cuts) of each component, by brute force over vertex bipartitions (n ≤ 18): [{side: bitmask, E: Uint8Array}]. */
export function allBonds(H) {
  const A = amask(H), C = comps(H), out = [];
  for (const L of C.lists) {
    if (L.length < 2) continue;
    const base = L.reduce((m, v) => m | (1 << v), 0), r = L[0], rest = L.slice(1);
    for (let mask = 0; mask < 1 << rest.length; mask++) {
      let S = 1 << r; rest.forEach((v, i) => { if ((mask >> i) & 1) S |= 1 << v; });
      const T = base & ~S; if (!T) continue;
      if (!maskConnected(A, S) || !maskConnected(A, T)) continue;
      const E = new Uint8Array(H.m); H.E.forEach(([a, b], k) => { if (((S >> a) & 1) !== ((S >> b) & 1)) E[k] = 1; });
      out.push({ side: S, E });
    }
  }
  return out;
}
/** Is the edge set (mask) an induced cycle whose removal leaves G connected? */
export function nonSepInduced(H, A, cyc) {
  let vm = 0; for (const v of cyc.vs) vm |= 1 << v;
  let inside = 0; for (const [a, b] of H.E) if ((vm >> a) & 1 && (vm >> b) & 1) inside++;
  if (inside !== cyc.vs.length) return false;
  const rest = ((1 << H.n) - 1) & ~vm;
  return rest !== 0 && maskConnected(A, rest);
}
/** Express target (Uint8Array) as a sum of gens over GF(2): indices or null; also the rank of gens. */
export function solveF2(gens, target) {
  const m = target.length, rows = gens.map((g, i) => ({ v: Uint8Array.from(g), c: new Set([i]) })), piv = [];
  for (const r of rows) {
    for (const p of piv) if (r.v[p.col]) { for (let j = 0; j < m; j++) r.v[j] ^= p.v[j]; for (const x of p.c) r.c.has(x) ? r.c.delete(x) : r.c.add(x); }
    const col = r.v.findIndex((x) => x); if (col >= 0) piv.push({ ...r, col });
  }
  const t = { v: Uint8Array.from(target), c: new Set() };
  for (const p of piv) if (t.v[p.col]) { for (let j = 0; j < m; j++) t.v[j] ^= p.v[j]; for (const x of p.c) t.c.has(x) ? t.c.delete(x) : t.c.add(x); }
  return { sol: t.v.some((x) => x) ? null : [...t.c].sort((a, b) => a - b), rank: piv.length };
}

// ================================================================ 4. Menger
function net(N) { return { N, g: Array.from({ length: N }, () => []), to: [], cap: [] }; }
function arc(F, a, b, c) { const i = F.to.length; F.g[a].push(i); F.to.push(b); F.cap.push(c); F.g[b].push(i + 1); F.to.push(a); F.cap.push(0); return i; }
function augPath(F, s, t) {
  const via = new Int32Array(F.N).fill(-1); via[s] = -2; const q = [s];
  for (let i = 0; i < q.length && via[t] === -1; i++) for (const a of F.g[q[i]]) { const w = F.to[a]; if (via[w] === -1 && F.cap[a] > 0) { via[w] = a; q.push(w); } }
  const reach = new Uint8Array(F.N); for (let x = 0; x < F.N; x++) if (via[x] !== -1) reach[x] = 1;
  if (via[t] === -1) return { arcs: null, reach };
  const arcs = []; for (let v = t; v !== s; v = F.to[via[v] ^ 1]) arcs.push(via[v]);
  return { arcs: arcs.reverse(), reach };
}
const pushArcs = (F, arcs) => { for (const a of arcs) { F.cap[a] -= 1; F.cap[a ^ 1] += 1; } };
/**
 * Disjoint A–B paths by augmenting along alternating walks (Diestel's third proof of 3.3.1, run as unit-capacity flow on the
 * vertex-split graph). A, B: arrays/Sets of vertex indices; o.gone(v) deletes vertices; o.start: an initial path system.
 * Returns {paths, sep (an A–B separator on the paths), reach (vertices on alternating walks), events (if o.events)}.
 * events: {type: 'walk', before, walk: [{v, back}], after} per augmentation, then {type: 'stuck', paths, sep, reach}.
 */
export function menger(H, A, B, o = {}) {
  const n = H.n, inA = new Uint8Array(n), inB = new Uint8Array(n), gone = o.gone || (() => false);
  for (const a of A) if (!gone(a)) inA[a] = 1; for (const b of B) if (!gone(b)) inB[b] = 1;
  const BIG = 4 * n + 4, S = 2 * n, T = 2 * n + 1, ev = [];
  let paths = (o.start || []).map((p) => p.slice());
  const build = () => {
    const F = net(2 * n + 2), sA = [], vA = [], tA = [], eA = new Map();
    for (let v = 0; v < n; v++) { if (gone(v)) continue; vA[v] = arc(F, 2 * v, 2 * v + 1, 1); if (inA[v]) sA[v] = arc(F, S, 2 * v, 1); if (inB[v]) tA[v] = arc(F, 2 * v + 1, T, 1); }
    for (const [a, b] of H.E) { if (a === b || gone(a) || gone(b)) continue; eA.set(a + '>' + b, arc(F, 2 * a + 1, 2 * b, BIG)); eA.set(b + '>' + a, arc(F, 2 * b + 1, 2 * a, BIG)); }
    for (const p of paths) { const arcs = [sA[p[0]], ...p.map((v) => vA[v])]; for (let i = 0; i + 1 < p.length; i++) arcs.push(eA.get(p[i] + '>' + p[i + 1])); arcs.push(tA[p[p.length - 1]]); pushArcs(F, arcs); }
    return { F, sA, vA, tA, eA };
  };
  const decompose = (N) => {
    const { F, sA, tA, eA } = N, fl = (a) => F.cap[a ^ 1], out = [];
    const used = new Set();
    for (let a = 0; a < n; a++) {
      if (sA[a] == null || !fl(sA[a])) continue;
      const p = [a]; let u = a;
      for (let g = 0; g < n + 2; g++) {
        if (tA[u] != null && fl(tA[u]) && !used.has('t' + u)) { used.add('t' + u); break; }
        let nx = -1; for (const [w] of H.adj[u]) { const id = eA.get(u + '>' + w); if (id != null && fl(id) && !used.has(id)) { used.add(id); nx = w; break; } }
        if (nx < 0) break; p.push(nx); u = nx;
      }
      out.push(p);
    }
    // trim to genuine A–B paths: from the last A-vertex to the first B-vertex after it
    return out.map((p) => { let i = 0; for (let j = 0; j < p.length; j++) if (inA[p[j]]) i = j; let q = p.slice(i); const jb = q.findIndex((v) => inB[v]); return q.slice(0, jb + 1); });
  };
  for (let guard = 0; guard <= n; guard++) {
    const N = build(), r = augPath(N.F, S, T);
    if (!r.arcs) {
      // Diestel's X: on each path P the last vertex reached by an alternating walk (its "in" copy is reachable), else P's first vertex
      const reach = new Uint8Array(n);
      for (let v = 0; v < n; v++) if (!gone(v) && (r.reach[2 * v] || r.reach[2 * v + 1])) reach[v] = 1;
      const sep = paths.map((p) => { let x = p[0]; for (const v of p) if (r.reach[2 * v]) x = v; return x; });
      if (o.events) ev.push({ type: 'stuck', paths: paths.map((p) => p.slice()), sep, reach });
      return { paths, sep, reach, events: ev };
    }
    // project the augmenting path onto G: an alternating walk
    const walk = [];
    for (const a of r.arcs) {
      const from = N.F.to[a ^ 1], to = N.F.to[a];
      if (from >= 2 * n || to >= 2 * n) { if (to < 2 * n && !walk.length) walk.push({ v: to >> 1, back: false }); continue; }
      const x = from >> 1, y = to >> 1; if (x === y) continue;
      walk.push({ v: y, back: (a & 1) === 1 });
    }
    if (o.limit != null && guard >= o.limit) { // report the pending alternating walk without using it
      const reach = new Uint8Array(n); for (let v = 0; v < n; v++) if (!gone(v) && (r.reach[2 * v] || r.reach[2 * v + 1])) reach[v] = 1;
      return { paths, sep: null, reach, walk, events: ev };
    }
    const before = paths.map((p) => p.slice());
    pushArcs(N.F, r.arcs); paths = decompose(N);
    if (o.events) ev.push({ type: 'walk', before, walk, after: paths.map((p) => p.slice()) });
  }
  return { paths, sep: [], reach: new Uint8Array(n), events: ev };
}
/** Does G − X (bitmask) contain an A–B path? (A, B bitmasks; a vertex of A ∩ B outside X is a trivial path.) */
export function hasABPath(Am, Amask, Bmask, X, alive) {
  const live = alive & ~X; if (Amask & Bmask & live) return true;
  for (const C of compMasks(Am, live)) if (C & Amask && C & Bmask) return true;
  return false;
}
/** Minimum A–B separator by brute force (n ≤ 20): bitmask. alive restricts the graph. */
export function bruteSep(H, A, B, alive = (1 << H.n) - 1) {
  const Am = amask(H), Amk = [...A].reduce((m, v) => m | (1 << v), 0) & alive, Bmk = [...B].reduce((m, v) => m | (1 << v), 0) & alive;
  return smallestSet(H.n, (X) => !(X & ~alive) && !hasABPath(Am, Amk, Bmk, X, alive));
}
/** Edge-disjoint s–t paths and a minimum s–t edge cut (unit capacities in both directions): {paths: [[v]], cut: [edge idx], k}. */
export function edgeMenger(H, s, t) {
  const F = net(H.n), ids = [];
  H.E.forEach(([a, b], k) => { if (a !== b) ids.push([arc(F, a, b, 1), arc(F, b, a, 1), k]); });
  let r; while ((r = augPath(F, s, t)).arcs) pushArcs(F, r.arcs);
  const net2 = new Map(); // directed unit flows after cancelling 2-cycles
  for (const [ab, ba, k] of ids) { const f = F.cap[ab ^ 1] - F.cap[ba ^ 1]; const [a, b] = H.E[k]; if (f > 0) net2.set(k, [a, b]); else if (f < 0) net2.set(k, [b, a]); }
  const out = new Map(); for (const [k, [a, b]] of net2) { if (!out.has(a)) out.set(a, []); out.get(a).push([b, k]); }
  const paths = [];
  for (let g = 0; g < H.m + 1; g++) {
    const first = out.get(s); if (!first || !first.length) break;
    const vs = [s], es = []; let u = s;
    for (let h = 0; h < H.m + 1 && u !== t; h++) { const L = out.get(u); if (!L || !L.length) break; const [w, k] = L.pop(); vs.push(w); es.push(k); u = w; }
    // shortcut repeated vertices (still edge-disjoint, uses a subset of the edges)
    const P = []; for (const v of vs) { const i = P.indexOf(v); if (i >= 0) P.length = i + 1; else P.push(v); }
    paths.push(P);
  }
  const reach = r.reach, cut = [];
  H.E.forEach(([a, b], k) => { if (reach[a] !== reach[b]) cut.push(k); });
  return { paths, cut, k: paths.length, reach };
}
/** Independent a–b paths (a ≠ b): if ab is an edge it counts as one path. {paths: [[v]], sep (when a, b non-adjacent), k}. */
export function indepPaths(H, a, b) {
  const adjAB = H.adj[a].some(([w]) => w === b);
  const Na = H.adj[a].map(([w]) => w).filter((w) => w !== b), Nb = H.adj[b].map(([w]) => w).filter((w) => w !== a);
  const r = menger(H, Na, Nb, { gone: (v) => v === a || v === b });
  const paths = r.paths.map((p) => [a, ...p, b]); if (adjAB) paths.unshift([a, b]);
  return { paths, sep: adjAB ? null : r.sep, k: paths.length, adj: adjAB };
}

// ================================================================ 5. A-paths and H-paths (brute force, small graphs)
/** Does G[alive] contain an A-path (a nontrivial path meeting A exactly in its two ends)? */
export function hasAPath(H, Am, Amask, alive) {
  const live = alive, liveA = Amask & live;
  for (const [a, b] of H.E) if ((liveA >> a) & 1 && (liveA >> b) & 1 && a !== b) return true;
  for (const C of compMasks(Am, live & ~Amask)) {
    let nb = 0; for (const v of bitsOf(C)) nb |= Am[v] & liveA;
    if (popc(nb) >= 2) return true;
  }
  return false;
}
/** Maximum number of disjoint A-paths, with a packing (vertex lists), by memoised branching over chordless A-paths (n ≤ 18). */
export function maxAPaths(H, A) {
  const Am = amask(H), Amask = [...A].reduce((m, v) => m | (1 << v), 0), memo = new Map();
  const best = (avail) => {
    const aa = avail & Amask; if (popc(aa) < 2) return { val: 0, P: [] };
    if (memo.has(avail)) return memo.get(avail);
    const a = 31 - Math.clz32(aa & -aa);
    let res = best(avail & ~(1 << a));
    const path = [a];
    const go = (u, onP) => {
      let cand = Am[u] & avail & ~onP;
      while (cand) {
        const bit = cand & -cand; cand ^= bit; const w = 31 - Math.clz32(bit);
        if (Am[w] & onP & ~(1 << u)) continue; // chord back into the path
        if ((Amask >> w) & 1) { const r = best(avail & ~onP & ~bit); if (r.val + 1 > res.val) res = { val: r.val + 1, P: [[...path, w], ...r.P] }; continue; }
        path.push(w); go(w, onP | bit); path.pop();
      }
    };
    go(a, 1 << a);
    memo.set(avail, res); return res;
  };
  return best((1 << H.n) - 1);
}
/** Smallest vertex set meeting every A-path (bitmask). */
export function minAHit(H, A) {
  const Am = amask(H), Amask = [...A].reduce((m, v) => m | (1 << v), 0), all = (1 << H.n) - 1;
  return smallestSet(H.n, (X) => !hasAPath(H, Am, Amask, all & ~X));
}
/**
 * H-paths for an induced subgraph on the vertex mask Hm (|G| ≤ 20, |G − H| ≤ ~12). Interiors are chordless paths Q in G − H whose
 * ends have distinct H-neighbours. Returns helpers {Y (mask of G − H), interiors: [{mask, vs, h1, h2}], maxIndep(), kappaH(), mader()}.
 */
export function hPaths(H, Hm) {
  const Am = amask(H), all = (1 << H.n) - 1, Y = all & ~Hm, ints = [];
  const hn = (v) => Am[v] & Hm;
  const ends = (u, w) => {
    const a = bitsOf(hn(u)), b = bitsOf(hn(w)); if (!a.length || !b.length) return null;
    if (u === w) return a.length >= 2 ? [a[0], a[1]] : null;
    for (const x of a) for (const y of b) if (x !== y) return [x, y];
    return null;
  };
  for (const s of bitsOf(Y)) { // chordless paths in G − H, each recorded once (first end < last end)
    const path = [s];
    const go = (u, onP) => {
      if (path.length === 1 || path[0] < u) { const e = ends(s, u); if (e) ints.push({ mask: onP, vs: path.slice(), h1: e[0], h2: e[1] }); }
      let cand = Am[u] & Y & ~onP;
      while (cand) { const bit = cand & -cand; cand ^= bit; const w = 31 - Math.clz32(bit); if (Am[w] & onP & ~(1 << u)) continue; path.push(w); go(w, onP | bit); path.pop(); }
    };
    go(s, 1 << s);
  }
  // keep inclusion-minimal interiors only (enough for packing)
  const minimal = ints.filter((I) => !ints.some((J) => J !== I && (J.mask & I.mask) === J.mask && J.mask !== I.mask));
  const uniq = []; const seenM = new Set(); for (const I of minimal) if (!seenM.has(I.mask)) { seenM.add(I.mask); uniq.push(I); }
  const maxIndep = () => {
    const memo = new Map();
    const best = (avail) => {
      if (memo.has(avail)) return memo.get(avail);
      const cand = uniq.filter((I) => (I.mask & avail) === I.mask);
      if (!cand.length) { const r = { val: 0, P: [] }; memo.set(avail, r); return r; }
      const low = cand.reduce((m, I) => m | I.mask, 0), v = 31 - Math.clz32(low & -low);
      let res = best(avail & ~(1 << v));
      for (const I of cand) if ((I.mask >> v) & 1) { const r = best(avail & ~I.mask); if (r.val + 1 > res.val) res = { val: r.val + 1, P: [I, ...r.P] }; }
      memo.set(avail, res); return res;
    };
    return best(Y);
  };
  const killed = (X, Fset) => { // does G − X − F contain no H-path?  (F: Set of edge indices inside G[Y − X])
    const alive = Y & ~X, A2 = new Array(H.n).fill(0);
    H.E.forEach(([a, b], k) => { if ((alive >> a) & 1 && (alive >> b) & 1 && !Fset.has(k)) { A2[a] |= 1 << b; A2[b] |= 1 << a; } });
    for (const C of compMasks(A2, alive)) { let nb = 0; for (const v of bitsOf(C)) nb |= hn(v); if (popc(nb) >= 2) return false; }
    return true;
  };
  const kappaH = () => smallestSet(H.n, (X) => !(X & ~Y) && killed(X, new Set()));
  /** Mader's bound M_H(G) by brute force over X ⊆ V(G − H) and F ⊆ E(G − H − X); returns the minimiser {val, X, F, parts: [{C, dC}]}. */
  const mader = (upper = Infinity) => {
    let best = { val: upper, X: 0, F: [], parts: [] };
    for (let X = Y; ; X = (X - 1) & Y) {
      const xs = popc(X);
      if (xs <= best.val) {
        const alive = Y & ~X, Ein = []; H.E.forEach(([a, b], k) => { if ((alive >> a) & 1 && (alive >> b) & 1) Ein.push(k); });
        if (Ein.length <= 16) for (let f = 0; f < 1 << Ein.length; f++) {
          const Fs = new Set(Ein.filter((_, i) => (f >> i) & 1));
          if (!killed(X, Fs)) continue;
          const AF = new Array(H.n).fill(0); for (const k of Fs) { const [a, b] = H.E[k]; AF[a] |= 1 << b; AF[b] |= 1 << a; }
          let val = xs; const parts = [];
          for (const C of compMasks(AF, alive)) { let d = 0; for (const v of bitsOf(C)) if (Am[v] & all & ~X & ~C) d |= 1 << v; parts.push({ C, dC: d }); val += Math.floor(popc(d) / 2); if (val > best.val) break; }
          // ties: prefer a smaller X (then the F-part of the formula is visible)
          if (val < best.val || (val === best.val && (best.parts.length === 0 || xs < popc(best.X)))) best = { val, X, F: [...Fs], parts };
        }
      }
      if (X === 0) break;
    }
    return best;
  };
  return { Y, interiors: uniq, maxIndep, kappaH, mader, killed };
}

// ================================================================ 6. linkages and topological minors
/**
 * Disjoint paths P_i = s_i … t_i (pairs of vertex indices) with no inner vertex among the terminals, by backtracking with
 * connectivity pruning; endpoints may be shared between pairs (as for the branch vertices of a TK^r). o.budget caps the search.
 * Returns {paths | null, exact}.
 */
export function linkPairs(H, pairs, o = {}) {
  const n = H.n, block = new Uint8Array(n), used = new Uint8Array(n), budget = o.budget ?? 2e5; let steps = 0;
  for (const [s, t] of pairs) { block[s] = 1; block[t] = 1; }
  if (o.avoid) for (const v of o.avoid) block[v] = 1;
  const adjSet = H.adj.map((l) => new Set(l.map(([w]) => w)));
  const free = (v) => !block[v] && !used[v];
  const reachable = (s, t) => { if (adjSet[s].has(t)) return true; const seen = new Uint8Array(n), q = [s]; seen[s] = 1; for (let i = 0; i < q.length; i++) for (const [w] of H.adj[q[i]]) { if (w === t) return true; if (!seen[w] && free(w)) { seen[w] = 1; q.push(w); } } return false; };
  const distTo = (t) => { const d = new Int32Array(n).fill(1e9); d[t] = 0; const q = [t]; for (let i = 0; i < q.length; i++) for (const [w] of H.adj[q[i]]) if (d[w] === 1e9 && (free(w) || w === t)) { d[w] = d[q[i]] + 1; if (free(w)) q.push(w); } return d; };
  const out = [];
  const route = (i) => {
    if (i === pairs.length) return true;
    for (let j = i; j < pairs.length; j++) if (!reachable(pairs[j][0], pairs[j][1])) return false;
    const [s, t] = pairs[i], d = distTo(t), path = [s];
    const go = (u) => {
      if (++steps > budget) return false;
      if (adjSet[u].has(t)) { path.push(t); out.push(path.slice()); if (route(i + 1)) return true; out.pop(); path.pop(); }
      const nb = H.adj[u].map(([w]) => w).filter((w) => free(w) && d[w] < 1e9).sort((x, y) => d[x] - d[y]);
      for (const w of nb) { used[w] = 1; path.push(w); if (go(w)) return true; path.pop(); used[w] = 0; if (steps > budget) return false; }
      return false;
    };
    return go(s);
  };
  const ok = route(0);
  return { paths: ok ? out : null, exact: steps <= budget };
}
/** All perfect pairings of a list (for k-linkedness tests). */
export function pairings(L) { if (!L.length) return [[]]; const [a, ...rest] = L, out = []; rest.forEach((b, i) => { for (const P of pairings(rest.filter((_, j) => j !== i))) out.push([[a, b], ...P]); }); return out; }
/**
 * Is G k-linked? Tests every set of 2k vertices and every pairing of it (exhaustive), or o.sample random placements (seeded rng o.rng).
 * Returns {ok, fail: pairs | null, tested, exhaustive, unsure}.
 */
export function kLinked(H, k, o = {}) {
  if (H.n < 2 * k) return { ok: false, fail: null, tested: 0, exhaustive: true, tooSmall: true };
  let tested = 0, unsure = 0;
  const test = (pairs) => { tested++; const r = linkPairs(H, pairs, { budget: o.budget ?? 4e4 }); if (!r.paths && !r.exact) unsure++; return !!r.paths || !r.exact; };
  if (o.sample) {
    for (let i = 0; i < o.sample; i++) {
      const pick = []; while (pick.length < 2 * k) { const v = Math.floor(o.rng() * H.n); if (!pick.includes(v)) pick.push(v); }
      const pairs = []; for (let j = 0; j < k; j++) pairs.push([pick[2 * j], pick[2 * j + 1]]);
      if (!test(pairs)) return { ok: false, fail: pairs, tested, exhaustive: false, unsure };
    }
    return { ok: true, fail: null, tested, exhaustive: false, unsure };
  }
  for (const X of combos(H.n, 2 * k)) for (const P of pairings(bitsOf(X))) if (!test(P)) return { ok: false, fail: P, tested, exhaustive: true, unsure };
  return { ok: true, fail: null, tested, exhaustive: true, unsure };
}
/** A topological K^r: {U: branch vertices, paths: [[v]]} or null. Branch sets are tried in order of decreasing degree sum. */
export function findTK(H, r, o = {}) {
  const deg = H.adj.map((l) => l.length), cand = [...Array(H.n).keys()].filter((v) => deg[v] >= r - 1);
  if (cand.length < r) return { found: null, tried: 0, exact: true };
  const sets = combos(cand.length, r).map((m) => bitsOf(m).map((i) => cand[i])).sort((A, B) => B.reduce((s, v) => s + deg[v], 0) - A.reduce((s, v) => s + deg[v], 0));
  const adjSet = H.adj.map((l) => new Set(l.map(([w]) => w))); let tried = 0, exact = true;
  for (const U of sets.slice(0, o.maxSets ?? 400)) {
    tried++;
    const direct = [], pairs = [];
    for (let i = 0; i < r; i++) for (let j = i + 1; j < r; j++) (adjSet[U[i]].has(U[j]) ? direct : pairs).push([U[i], U[j]]);
    const res = linkPairs(H, pairs, { budget: o.budget ?? 3e4, avoid: U });
    if (!res.exact) exact = false;
    if (res.paths) return { found: { U, paths: [...direct, ...res.paths] }, tried, exact };
  }
  return { found: null, tried, exact: exact && sets.length <= (o.maxSets ?? 400) };
}
/** Random graph G(n, p) edges (seeded rng). */
export function gnp(n, p, rng) { const E = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (rng() < p) E.push([i, j]); return E; }
/** Plain index structure from n and an edge list (no kit graph needed). */
export function ixOf(n, edges) { return ix({ nodes: Array.from({ length: n }, (_, i) => ({ id: i })), edges }); }

// ================================================================ 7. more path tools (§§3.3, 3.5)
/** A random maximal (not necessarily maximum) system of disjoint A–B paths, grown greedily from random BFS orders. */
export function greedyPaths(H, A, B, rng) {
  const n = H.n, inA = new Uint8Array(n), inB = new Uint8Array(n), used = new Uint8Array(n), out = [];
  for (const a of A) inA[a] = 1; for (const b of B) inB[b] = 1;
  const order = (L) => { const M = L.slice(); for (let i = M.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [M[i], M[j]] = [M[j], M[i]]; } return M; };
  let progress = true;
  while (progress) {
    progress = false;
    for (const a of order([...A])) {
      if (used[a]) continue;
      if (inB[a]) { used[a] = 1; out.push([a]); progress = true; continue; }
      const par = new Int32Array(n).fill(-2); par[a] = -1; const q = [a]; let end = -1;
      for (let i = 0; i < q.length && end < 0; i++) for (const [w] of order(H.adj[q[i]])) {
        if (par[w] !== -2 || used[w] || inA[w]) continue; par[w] = q[i];
        if (inB[w]) { end = w; break; } q.push(w);
      }
      if (end < 0) continue;
      const p = []; for (let x = end; x !== -1; x = par[x]) p.push(x); p.reverse();
      p.forEach((x) => (used[x] = 1)); out.push(p); progress = true;
    }
  }
  return out;
}
/**
 * Disjoint paths from the sources S to distinct vertices of U, with no inner vertex in U, minimising the total cost of the
 * edges used (successive shortest paths with Bellman–Ford on the vertex-split graph). cost(k) ≥ 0 per edge index.
 * Returns {paths (source … u), total} — fewer paths than |S| if not all can be routed.
 */
export function minCostPaths(H, S, U, cost) {
  const n = H.n, N = 2 * n + 2, s = 2 * n, t = 2 * n + 1, inU = new Uint8Array(n); for (const u of U) inU[u] = 1;
  const g = Array.from({ length: N }, () => []), to = [], cap = [], cst = [];
  const add = (a, b, c, w) => { g[a].push(to.length); to.push(b); cap.push(c); cst.push(w); g[b].push(to.length); to.push(a); cap.push(0); cst.push(-w); };
  for (let v = 0; v < n; v++) add(2 * v, inU[v] ? t : 2 * v + 1, 1, 0);
  for (const a of S) add(s, 2 * a, 1, 0);
  H.E.forEach(([a, b], k) => { if (a === b) return; if (!inU[a]) add(2 * a + 1, 2 * b, 1, cost(k)); if (!inU[b]) add(2 * b + 1, 2 * a, 1, cost(k)); });
  let total = 0;
  for (let it = 0; it < S.length; it++) {
    const dist = new Array(N).fill(Infinity), via = new Int32Array(N).fill(-1); dist[s] = 0;
    for (let round = 0; round < N; round++) { let ch = false; for (let x = 0; x < N; x++) if (dist[x] < Infinity) for (const a of g[x]) if (cap[a] > 0 && dist[x] + cst[a] < dist[to[a]]) { dist[to[a]] = dist[x] + cst[a]; via[to[a]] = a; ch = true; } if (!ch) break; }
    if (dist[t] === Infinity) break;
    for (let x = t; x !== s; x = to[via[x] ^ 1]) { cap[via[x]] -= 1; cap[via[x] ^ 1] += 1; }
    total += dist[t];
  }
  // decompose
  const paths = [], fl = (a) => cap[a ^ 1] > 0 && (a & 1) === 0;
  for (const a0 of S) {
    const first = g[s].find((a) => to[a] === 2 * a0 && fl(a)); if (first == null) continue;
    const p = [a0]; let x = 2 * a0;
    for (let guard = 0; guard < N; guard++) {
      const nx = g[x].find((a) => fl(a)); if (nx == null) break;
      cap[nx ^ 1] -= 1; const y = to[nx]; if (y === t) break;
      if ((y >> 1) !== (x >> 1)) p.push(y >> 1);
      x = y;
    }
    paths.push(p);
  }
  return { paths, total };
}
/** Local vertex connectivity of non-adjacent s, t, stopping at limit. */
export function localKappa(H, s, t, limit = Infinity) {
  const F = net(2 * H.n), BIG = 4 * H.n;
  for (let v = 0; v < H.n; v++) arc(F, 2 * v, 2 * v + 1, v === s || v === t ? BIG : 1);
  for (const [a, b] of H.E) { arc(F, 2 * a + 1, 2 * b, BIG); arc(F, 2 * b + 1, 2 * a, BIG); }
  let val = 0, r; while (val < limit && (r = augPath(F, 2 * s + 1, 2 * t)).arcs) { pushArcs(F, r.arcs); val++; }
  return val;
}
/** κ(G) with the Even-style shortcut (sources among the first κ + 1 vertices), capped at cap. */
export function kappaFast(H, cap = 64) {
  if (H.n <= 1) return 0; if (comps(H).k > 1) return 0;
  const A = H.adj.map((l) => new Set(l.map(([w]) => w)));
  let best = Math.min(H.n - 1, cap);
  for (let i = 0; i <= best && i < H.n; i++) for (let j = i + 1; j < H.n; j++) { if (A[i].has(j)) continue; const k = localKappa(H, i, j, best); if (k < best) best = k; }
  return best;
}
