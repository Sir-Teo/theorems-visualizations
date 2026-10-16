// Graph Theory (Diestel) — Chapter 5, part A (§§5.1–5.3): helpers shared by ch05-a.js and ch05-a2.js.
// Re-exports the chapter 1–4 toolbox (planarity, triangulations, ...) and adds a colouring toolkit:
//  1. exact colouring by DSATUR backtracking (vertices; edges via the line graph), greedy, degeneracy, Kempe chains
//  2. graph builders (crown, Grötzsch, random, regular), triangle counting, independence number
//  3. Misra–Gries (Vizing) and bipartite alternating-path edge colouring as frame lists for v.steps
//  4. Hajós construction: recursive search for a k-constructible subgraph (the proof of Hajós's theorem, run)
export * from './ch04-z.shared.js';
import { ix, named, ekey, planarEdges } from './ch04-z.shared.js';

export const TAU = 2 * Math.PI;
/** Class colours (palette names); `red` is kept for conflicts. */
export const COL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'];
export const colName = (c) => 'abcdefg'[c] || '?';
/** Small seeded generator (mulberry32), usable outside the viz runtime. */
export function rng32(seed) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffled(a, r) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

// ================================================================ 1. colouring
/** Neighbour lists without loops / repeats: adj[v] = [w, …]. */
export function nbrs(H) { return H.adj.map((l, v) => [...new Set(l.map((x) => x[0]).filter((w) => w !== v))]); }
/** Proper? Returns the list of conflicting edge indices (both ends coloured alike, colour ≥ 0). */
export function conflicts(H, col) { const out = []; H.E.forEach(([a, b], k) => { if (a !== b && col[a] >= 0 && col[a] === col[b]) out.push(k); }); return out; }
/**
 * Is the graph with neighbour lists `adj` k-colourable? DSATUR backtracking. → {status: 'yes'|'no'|'unknown', col}
 */
export function colourWith(adj, k, budget = 2e6) {
  const n = adj.length, col = new Int16Array(n).fill(-1), cnt = Array.from({ length: n }, () => new Int16Array(Math.max(k, 1)));
  let steps = 0, over = false;
  const sat = (v) => { let s = 0; for (let c = 0; c < k; c++) if (cnt[v][c]) s++; return s; };
  function rec(left, used) {
    if (!left) return true;
    if (++steps > budget) { over = true; return false; }
    let v = -1, bs = -1, bd = -1;
    for (let u = 0; u < n; u++) if (col[u] < 0) { const s = sat(u); if (s > bs || (s === bs && adj[u].length > bd)) { v = u; bs = s; bd = adj[u].length; } }
    const lim = Math.min(k, used + 1);
    for (let c = 0; c < lim; c++) {
      if (cnt[v][c]) continue;
      col[v] = c; for (const w of adj[v]) cnt[w][c]++;
      if (rec(left - 1, Math.max(used, c + 1))) return true;
      for (const w of adj[v]) cnt[w][c]--; col[v] = -1;
      if (over) return false;
    }
    return false;
  }
  if (n === 0) return { status: 'yes', col: [] };
  if (k <= 0) return { status: 'no', col: null };
  const ok = rec(n, 0);
  return ok ? { status: 'yes', col: Array.from(col) } : { status: over ? 'unknown' : 'no', col: null };
}
/** A clique (greedy) as a lower bound. */
export function greedyClique(adj) {
  let best = 1;
  const order = adj.map((_, v) => v).sort((a, b) => adj[b].length - adj[a].length);
  for (const s of order.slice(0, 12)) {
    const C = [s]; for (const v of order) if (!C.includes(v) && C.every((u) => adj[u].includes(v))) C.push(v);
    best = Math.max(best, C.length);
  }
  return best;
}
/** Chromatic number of a graph given by an index structure: {k, col, exact}. */
export function chromatic(H) {
  const adj = nbrs(H);
  if (H.n === 0) return { k: 0, col: [], exact: true };
  let k = H.m ? Math.max(2, greedyClique(adj)) : 1;
  if (!adj.some((l) => l.length)) return { k: 1, col: new Array(H.n).fill(0), exact: true };
  for (; k <= H.n; k++) { const r = colourWith(adj, k); if (r.status === 'yes') return { k, col: r.col, exact: true }; if (r.status === 'unknown') return { k, col: null, exact: false }; }
  return { k: H.n, col: Array.from({ length: H.n }, (_, i) => i), exact: true };
}
/** Greedy colouring along `order` (vertex indices). → {col, used, forbidden (per step: sorted colours seen)}. */
export function greedyColour(H, order) {
  const adj = nbrs(H), col = new Array(H.n).fill(-1), forb = [];
  for (const v of order) {
    const seen = new Set(adj[v].map((w) => col[w]).filter((c) => c >= 0)); let c = 0; while (seen.has(c)) c++;
    col[v] = c; forb.push([...seen].sort((a, b) => a - b));
  }
  return { col, used: col.length ? Math.max(...col) + 1 : 0, forb };
}
/**
 * Smallest-last order: repeatedly delete a vertex of least degree. → {removed (deletion order), mins (degree at deletion),
 * d (= max mins = degeneracy = max over subgraphs of δ), coreAt (index in `removed` where the degeneracy is first reached)}
 */
export function degeneracy(H) {
  const adj = nbrs(H), deg = adj.map((l) => l.length), gone = new Array(H.n).fill(false), removed = [], mins = [];
  for (let t = 0; t < H.n; t++) {
    let v = -1; for (let u = 0; u < H.n; u++) if (!gone[u] && (v < 0 || deg[u] < deg[v])) v = u;
    mins.push(deg[v]); removed.push(v); gone[v] = true; for (const w of adj[v]) if (!gone[w]) deg[w]--;
  }
  const d = Math.max(0, ...mins);
  return { removed, mins, d, coreAt: mins.indexOf(d) };
}
/** Component of `start` in the subgraph on vertices coloured a or b (Kempe chain). Returns a Set. */
export function kempe(adj, col, start, a, b) {
  const S = new Set([start]), q = [start];
  while (q.length) { const u = q.pop(); for (const w of adj[u]) if (!S.has(w) && (col[w] === a || col[w] === b)) { S.add(w); q.push(w); } }
  return S;
}
/** Number of triangles. */
export function triangles(H) { const adj = nbrs(H).map((l) => new Set(l)); let t = 0; for (const [a, b] of H.E) for (const w of adj[a]) if (w > b && b > a && adj[b].has(w)) t++; return t; }
/** Chromatic index data: line graph neighbour lists of H. */
export function lineAdj(H) { const adj = Array.from({ length: H.m }, () => []); const at = Array.from({ length: H.n }, () => []); H.E.forEach(([a, b], k) => { at[a].push(k); at[b].push(k); }); for (const l of at) for (const x of l) for (const y of l) if (x !== y && !adj[x].includes(y)) adj[x].push(y); return adj; }
export const maxDeg = (H) => Math.max(0, ...nbrs(H).map((l) => l.length));
/** Maximum independent set size of a graph on ≤ 30 vertices (neighbour bitmasks). */
export function alphaMask(adjMask, mask) {
  if (!mask) return 0;
  let v = -1, bd = -1;
  for (let u = 0; u < 31; u++) if (mask & (1 << u)) { const d = popcnt(adjMask[u] & mask); if (d > bd) { bd = d; v = u; } }
  if (bd === 0) return popcnt(mask);
  if (bd <= 1) { // matching components: take one of each pair, isolated vertices
    let r = 0, m = mask; while (m) { const u = 31 - Math.clz32(m & -m); m &= ~(1 << u); const nb = adjMask[u] & m; r++; m &= ~nb; } return r;
  }
  return Math.max(alphaMask(adjMask, mask & ~(1 << v)), 1 + alphaMask(adjMask, mask & ~(1 << v) & ~adjMask[v]));
}
export function popcnt(x) { let c = 0; while (x) { x &= x - 1; c++; } return c; }

// ================================================================ 2. graph builders (kit specs with layout 'fit')
const ring = (n, R = 1, a0 = Math.PI / 2, off = 0) => Array.from({ length: n }, (_, i) => ({ id: i + off, x: R * Math.cos(a0 - (TAU * i) / n), y: R * Math.sin(a0 - (TAU * i) / n) }));
/** Crown graph: K_{n,n} minus a perfect matching; vertices a_i = 2i, b_i = 2i+1 (so the label order interleaves the sides). */
export function crown(n) {
  const nodes = [], edges = [];
  for (let i = 0; i < n; i++) { nodes.push({ id: 2 * i, label: 'a' + (i + 1), x: -1, y: (n - 1) / 2 - i }, { id: 2 * i + 1, label: 'b' + (i + 1), x: 1, y: (n - 1) / 2 - i }); }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) edges.push([2 * i, 2 * j + 1]);
  return { nodes, edges, layout: 'fit' };
}
/** Grötzsch graph = Mycielskian of C5: 11 vertices, 20 edges, triangle-free, χ = 4. */
export function grotzsch() {
  const u = ring(5, 1.6), w = ring(5, 0.85, Math.PI / 2, 5), edges = [];
  for (let i = 0; i < 5; i++) { edges.push([i, (i + 1) % 5]); edges.push([5 + i, (i + 1) % 5], [5 + i, (i + 4) % 5], [10, 5 + i]); }
  return { nodes: [...u, ...w, { id: 10, x: 0, y: 0 }], edges, layout: 'fit' };
}
/** Random graph G(n, m) on a ring layout (or force layout when `force`). */
export function gnm(n, m, r, force = false) {
  const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  const edges = shuffled(pairs, r).slice(0, m);
  return { nodes: ring(n), edges, layout: force ? 'force' : 'fit' };
}
/** Random d-regular simple graph on n vertices: circulant plus random edge switches. */
export function regularGraph(n, d, r, switches = 200) {
  const E = new Set(); const key = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
  for (let i = 0; i < n; i++) for (let o = 1; o <= Math.floor(d / 2); o++) E.add(key(i, (i + o) % n));
  if (d % 2) for (let i = 0; i < n / 2; i++) E.add(key(i, i + n / 2));
  let list = [...E].map((s) => s.split(',').map(Number));
  for (let t = 0; t < switches; t++) {
    const i = Math.floor(r() * list.length), j = Math.floor(r() * list.length); if (i === j) continue;
    const [a, b] = list[i], [c, e] = list[j]; if (new Set([a, b, c, e]).size < 4) continue;
    const [p, q] = r() < 0.5 ? [[a, c], [b, e]] : [[a, e], [b, c]];
    const k1 = key(p[0], p[1]), k2 = key(q[0], q[1]); if (E.has(k1) || E.has(k2)) continue;
    E.delete(key(a, b)); E.delete(key(c, e)); E.add(k1); E.add(k2); list[i] = p; list[j] = q;
  }
  return { nodes: ring(n), edges: list, layout: 'fit' };
}
/** Random maximal triangle-free planar graph on n vertices (edges added in random order while triangle-free and planar). */
export function triFreePlanar(n, r) {
  const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  const E = [], adj = Array.from({ length: n }, () => new Set());
  for (const [a, b] of shuffled(pairs, r)) {
    if ([...adj[a]].some((w) => adj[b].has(w))) continue;
    E.push([a, b]);
    if (!planarEdges(n, E)) { E.pop(); continue; }
    adj[a].add(b); adj[b].add(a);
  }
  return E;
}
/** Kit spec with straight-line planar positions for a planar edge list (or a ring layout if not planar). */
export function planarSpec(n, E) {
  const H = ix({ nodes: Array.from({ length: n }, (_, i) => ({ id: i })), edges: E });
  const P = planarPos(H);
  return { nodes: Array.from({ length: n }, (_, i) => ({ id: i, x: P ? P[i][0] : Math.cos(TAU * i / n), y: P ? P[i][1] : Math.sin(TAU * i / n) })), edges: E.map(([a, b]) => [a, b]), layout: 'fit' };
}
import { planarPos } from './ch04-z.shared.js';

// ================================================================ 3. edge colouring
/**
 * Bipartite edge colouring by alternating paths (König). H is an index structure, `side` 0/1 per vertex is not needed.
 * Colours 0..ncol-1. Frames: {ecol (copy), cur (edge), path (edges), note, ok}. Stops with a "stuck" frame if no (α, β) works.
 */
export function konigFrames(H, ncol, nm) {
  const ecol = new Array(H.m).fill(-1), at = Array.from({ length: H.n }, () => new Array(ncol).fill(-1)), frames = [];
  const snap = (o) => frames.push({ ecol: ecol.slice(), cur: -1, path: [], ...o });
  const put = (k, c) => { const [a, b] = H.E[k]; if (ecol[k] >= 0) { at[a][ecol[k]] = -1; at[b][ecol[k]] = -1; } ecol[k] = c; if (c >= 0) { at[a][c] = k; at[b][c] = k; } };
  const other = (k, u) => (H.E[k][0] === u ? H.E[k][1] : H.E[k][0]);
  const walk = (y, al, be) => { const P = [], seen = new Set([y]); let cur = y, c = al; while (at[cur][c] >= 0) { const k = at[cur][c]; P.push(k); cur = other(k, cur); c = c === al ? be : al; if (seen.has(cur) && P.length > H.m) break; seen.add(cur); } return { P, end: cur }; };
  snap({ note: 'No edge coloured yet.' });
  for (let k = 0; k < H.m; k++) {
    const [x, y] = H.E[k], fx = [], fy = [];
    for (let c = 0; c < ncol; c++) { if (at[x][c] < 0) fx.push(c); if (at[y][c] < 0) fy.push(c); }
    const common = fx.find((c) => fy.includes(c));
    if (common != null) { put(k, common); snap({ cur: k, note: `Edge ${nm(x)}${nm(y)}: colour ${colName(common)} is free at both ends — use it.` }); continue; }
    let done = false, failure = null;
    for (const al of fx) {
      for (const be of fy) {
        const { P, end } = walk(y, al, be);
        if (end === x) { failure = failure || { al, be, P }; continue; }
        snap({ cur: k, path: P, note: `Edge ${nm(x)}${nm(y)}: ${colName(al)} is free at ${nm(x)}, ${colName(be)} is free at ${nm(y)}, no common free colour. Follow the ${colName(al)}/${colName(be)}-path from ${nm(y)} (${P.length} edge${P.length === 1 ? '' : 's'}); it does not reach ${nm(x)}.` });
        const cs = P.map((e) => ecol[e]); P.forEach((e) => put(e, -1)); P.forEach((e, i) => put(e, cs[i] === al ? be : al));
        snap({ cur: k, path: P, note: `Swap ${colName(al)} and ${colName(be)} on the path: now ${colName(al)} is free at both ends of ${nm(x)}${nm(y)}.` });
        put(k, al); snap({ cur: k, note: `Colour ${nm(x)}${nm(y)} with ${colName(al)}.` });
        done = true; break;
      }
      if (done) break;
    }
    if (!done) { snap({ cur: k, path: failure ? failure.P : [], ok: false, note: `Edge ${nm(x)}${nm(y)}: every alternating path from ${nm(y)} runs into ${nm(x)} — swapping would spoil ${nm(x)}. Only possible in a non-bipartite graph; stop.` }); return { frames, ecol, complete: false }; }
  }
  snap({ note: `All ${H.m} edges coloured with ${ncol} colours.` });
  return { frames, ecol, complete: true };
}
/**
 * Misra–Gries implementation of Vizing's theorem: colours H's edges with Δ+1 colours, one edge at a time via fan + path inversion.
 * Frames: {ecol, cur, fan (vertex list), centre, path (edges), note}.
 */
export function vizingFrames(H, nm) {
  const D = maxDeg(H), Kc = D + 1, ecol = new Array(H.m).fill(-1), at = Array.from({ length: H.n }, () => new Array(Kc).fill(-1)), frames = [];
  const snap = (o) => frames.push({ ecol: ecol.slice(), cur: -1, fan: [], centre: -1, path: [], ...o });
  const put = (k, c) => { const [a, b] = H.E[k]; if (ecol[k] >= 0) { at[a][ecol[k]] = -1; at[b][ecol[k]] = -1; } ecol[k] = c; if (c >= 0) { at[a][c] = k; at[b][c] = k; } };
  const other = (k, u) => (H.E[k][0] === u ? H.E[k][1] : H.E[k][0]);
  const free = (v) => at[v].findIndex((e) => e < 0);
  const isFree = (v, c) => at[v][c] < 0;
  const edgeTo = (u, w) => { for (const [x, k] of H.adj[u]) if (x === w) return k; return -1; };
  snap({ note: `Δ = ${D}: we will use ${Kc} colours.` });
  for (let k0 = 0; k0 < H.m; k0++) {
    const u = H.E[k0][0], v0 = H.E[k0][1], fan = [v0];
    for (let g = 0; g < H.n; g++) {
      const last = fan[fan.length - 1]; let nxt = -1;
      for (const [w, k] of H.adj[u]) if (!fan.includes(w) && ecol[k] >= 0 && isFree(last, ecol[k])) { nxt = w; break; }
      if (nxt < 0) break; fan.push(nxt);
    }
    const last = fan[fan.length - 1], c = free(u), d = free(last);
    if (fan.length === 1 && isFree(v0, c)) { put(k0, c); snap({ cur: k0, centre: u, note: `Edge ${nm(u)}${nm(v0)}: colour ${colName(c)} is free at both ends — use it.` }); continue; }
    if (isFree(last, c)) { // fan end sees c too: rotate directly
      snap({ cur: k0, centre: u, fan, note: `Edge ${nm(u)}${nm(v0)}: fan at ${nm(u)} = ${fan.map(nm).join(', ')}. Colour ${colName(c)} is free at ${nm(u)} and at the end ${nm(last)} of the fan.` });
    } else snap({ cur: k0, centre: u, fan, note: `Edge ${nm(u)}${nm(v0)}: build the fan ${fan.map(nm).join(', ')} at ${nm(u)} (each edge's colour is free at the previous fan vertex). c = ${colName(c)} is free at ${nm(u)}, d = ${colName(d)} is free at ${nm(last)}.` });
    // invert the c/d path from u
    const path = []; let cur = u, cc = d;
    while (at[cur][cc] >= 0 && path.length <= H.m) { const e = at[cur][cc]; path.push(e); cur = other(e, cur); cc = cc === d ? c : d; }
    if (path.length) {
      snap({ cur: k0, centre: u, fan, path, note: `Follow the ${colName(d)}/${colName(c)}-path from ${nm(u)} (${path.length} edge${path.length > 1 ? 's' : ''}) and invert it: swap ${colName(c)} and ${colName(d)} along it, which makes ${colName(d)} free at ${nm(u)}.` });
      const cs = path.map((e) => ecol[e]); path.forEach((e) => put(e, -1)); path.forEach((e, i) => put(e, cs[i] === c ? d : c));
      snap({ cur: k0, centre: u, fan, path, note: `Path inverted.` });
    }
    // shortest valid prefix ending at a vertex where d is free
    let idx = -1;
    for (let i = 0; i < fan.length; i++) {
      let okp = true; for (let j = 0; j < i; j++) { const e = edgeTo(u, fan[j + 1]); if (ecol[e] < 0 || !isFree(fan[j], ecol[e])) { okp = false; break; } }
      if (okp && isFree(fan[i], d)) { idx = i; break; }
    }
    if (idx < 0) { snap({ cur: k0, centre: u, fan, note: 'Internal error: no admissible fan prefix.' }); return { frames, ecol, ok: false, K: Kc }; }
    const pre = fan.slice(0, idx + 1), cs = [];
    for (let j = 1; j <= idx; j++) cs.push(ecol[edgeTo(u, pre[j])]);
    for (let j = 1; j <= idx; j++) put(edgeTo(u, pre[j]), -1);
    for (let j = 0; j < idx; j++) put(edgeTo(u, pre[j]), cs[j]);
    put(edgeTo(u, pre[idx]), d);
    snap({ cur: k0, centre: u, fan: pre, note: idx ? `Rotate the fan ${pre.map(nm).join(', ')}: each edge takes the colour of the next one, and the last edge ${nm(u)}${nm(pre[idx])} gets ${colName(d)}.` : `${colName(d)} is free at ${nm(v0)}: colour ${nm(u)}${nm(v0)} with ${colName(d)}.` });
  }
  snap({ note: `Done: ${H.m} edges, ${Kc} colours available (Δ + 1 = ${Kc}).` });
  const bad = H.adj.some((l, v) => new Set(l.map(([, k]) => ecol[k])).size !== l.length || l.some(([, k]) => ecol[k] < 0));
  return { frames, ecol, ok: !bad, K: Kc };
}

// ================================================================ 4. Hajós construction
/** Does the graph (bit neighbour masks) contain K^k? */
function hasClique(A, n, k) {
  const go = (cand, size) => { if (size === k) return true; if (popcnt(cand) + size < k) return false; for (let v = 0; v < n; v++) if (cand & (1 << v)) { if (go(cand & A[v] & ~((2 << v) - 1), size + 1)) return true; } return false; };
  return go((1 << n) - 1, 0);
}
function cliqueOf(A, n, k) {
  const out = []; const go = (cand, S) => { if (S.length === k) { out.push(S.slice()); return true; } for (let v = 0; v < n; v++) if (cand & (1 << v)) { S.push(v); if (go(cand & A[v] & ~((2 << v) - 1), S)) return true; S.pop(); } return false; };
  go((1 << n) - 1, []); return out[0];
}
/**
 * Proof of Hajós's theorem as an algorithm. G on n ≤ 12 vertices (edge pairs) with χ(G) ≥ k.
 * Returns null on failure, else {nodes} in post-order: each node {kind: 'K' | 'J', edges: ['a,b'…] (in G's vertex labels; edges not in G
 * are "virtual" and get removed by joins), x, y1, y2, a, b (child indices), id}.
 */
export function hajosRecipe(n, E, k, limit = 400) {
  const memo = new Map(), nodes = []; let calls = 0;
  const key = (A) => A.join(',');
  const ekeyS = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
  function rec(A) {
    const kk = key(A); if (memo.has(kk)) return memo.get(kk);
    if (++calls > 60000) throw new Error('limit');
    let res;
    if (hasClique(A, n, k)) {
      const S = cliqueOf(A, n, k), edges = []; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) edges.push(ekeyS(S[i], S[j]));
      nodes.push({ kind: 'K', edges, verts: S }); res = nodes.length - 1;
    } else {
      let found = null;
      outer: for (let x = 0; x < n; x++) for (let y1 = 0; y1 < n; y1++) {
        if (y1 === x || (A[x] >> y1) & 1) continue;
        for (let y2 = y1 + 1; y2 < n; y2++) if (y2 !== x && !((A[x] >> y2) & 1) && (A[y1] >> y2) & 1) { found = [x, y1, y2]; break outer; }
      }
      if (!found) return null;
      const [x, y1, y2] = found, add = (x0, y0) => { const B = A.slice(); B[x0] |= 1 << y0; B[y0] |= 1 << x0; return B; };
      const A1 = rec(add(x, y1)); if (A1 == null) return null;
      const A2 = rec(add(x, y2)); if (A2 == null) return null;
      const e1 = ekeyS(x, y1), e2 = ekeyS(x, y2), n1 = nodes[A1], n2 = nodes[A2];
      if (!n1.edges.includes(e1)) res = A1; // already inside G + nothing new
      else if (!n2.edges.includes(e2)) res = A2;
      else {
        const set = new Set([...n1.edges.filter((e) => e !== e1), ...n2.edges.filter((e) => e !== e2), ekeyS(y1, y2)]);
        nodes.push({ kind: 'J', edges: [...set], x, y1, y2, a: A1, b: A2 }); res = nodes.length - 1;
      }
    }
    memo.set(kk, res); return res;
  }
  const A0 = Array(n).fill(0); for (const [a, b] of E) { A0[a] |= 1 << b; A0[b] |= 1 << a; }
  let root; try { root = rec(A0); } catch (e) { return null; }
  if (root == null) return null;
  // keep only nodes reachable from the root, in post-order
  const order = [], seen = new Set();
  (function walk(i) { if (seen.has(i)) return; seen.add(i); const nd = nodes[i]; if (nd.kind === 'J') { walk(nd.a); walk(nd.b); } order.push(i); })(root);
  const map = new Map(order.map((i, j) => [i, j]));
  return { nodes: order.map((i) => { const nd = nodes[i]; return nd.kind === 'J' ? { ...nd, a: map.get(nd.a), b: map.get(nd.b) } : nd; }), calls };
}
/** Edge colouring of H with k colours (exact search on the line graph): {status, col (per edge)}. */
export function edgeColourWith(H, k, budget = 1.5e6) { return colourWith(lineAdj(H), k, budget); }
import { randomTriangulation as _rt, triDraw as _triDraw } from './ch04-z.shared.js';
/**
 * Random plane triangulation with a well-spread straight-line drawing: {n, E, tri, pos}. Starts from a Tutte drawing, then relaxes it with
 * Fruchterman–Reingold forces; a move is accepted only if all triangles at the vertex keep their orientation (so the drawing stays plane).
 */
export function triangulation(n, seed, flips = 60) {
  const T = _rt(n, rng32(seed), flips), D = _triDraw(T), P = D.pos.map((p) => [p[0], p[1]]);
  // normalise the outer triangle 0,1,2 to a fixed equilateral one
  const A = [-1, -0.8], B = [1, -0.8], C = [0, 0.93], o = [A, B, C];
  const [p0, p1, p2] = [P[0], P[1], P[2]], det = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]);
  const aff = (q) => { const l1 = ((q[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (q[1] - p0[1])) / det, l2 = ((p1[0] - p0[0]) * (q[1] - p0[1]) - (q[0] - p0[0]) * (p1[1] - p0[1])) / det, l0 = 1 - l1 - l2; return [l0 * A[0] + l1 * B[0] + l2 * C[0], l0 * A[1] + l1 * B[1] + l2 * C[1]]; };
  const Q = P.map(aff), inc = Array.from({ length: n }, () => []);
  T.tri.forEach((t, i) => t.forEach((v) => inc[v].push(i)));
  const area = (t) => { const [a, b, c] = t.map((v) => Q[v]); return (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]); };
  const sgn = Math.sign(area(T.tri[0])) || 1;
  const ang = (t) => { let m = 9; for (let i = 0; i < 3; i++) { const p = Q[t[i]], q = Q[t[(i + 1) % 3]], r = Q[t[(i + 2) % 3]], ux = q[0] - p[0], uy = q[1] - p[1], wx = r[0] - p[0], wy = r[1] - p[1]; m = Math.min(m, Math.acos(Math.max(-1, Math.min(1, (ux * wx + uy * wy) / (Math.hypot(ux, uy) * Math.hypot(wx, wy) + 1e-12))))); } return m; };
  const worst = (v) => Math.min(...inc[v].map((i) => (sgn * area(T.tri[i]) > 1e-9 ? ang(T.tri[i]) : -1)));
  const adj = Array.from({ length: n }, () => []); T.E.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const kk = Math.sqrt(3.4 / n);
  for (let it = 0; it < 400; it++) for (let v = 3; v < n; v++) {
    let fx = 0, fy = 0;
    for (let w = 0; w < n; w++) { if (w === v) continue; const dx = Q[v][0] - Q[w][0], dy = Q[v][1] - Q[w][1], d = Math.hypot(dx, dy) + 1e-3; const f = (kk * kk) / d / d; fx += dx * f; fy += dy * f; }
    for (const w of adj[v]) { const dx = Q[w][0] - Q[v][0], dy = Q[w][1] - Q[v][1], d = Math.hypot(dx, dy); fx += (dx * d) / kk; fy += (dy * d) / kk; }
    const fl = Math.hypot(fx, fy) || 1, step = Math.min(0.08, fl * 0.08) / fl, old = Q[v], w0 = worst(v);
    for (let s = 1, t = 0; t < 6; t++, s /= 2) { Q[v] = [old[0] + fx * step * s, old[1] + fy * step * s]; const w1 = worst(v); if (w1 > 0 && w1 >= Math.min(w0, 0.25)) break; Q[v] = old; }
  }
  return { ...T, pos: Q };
}

/** Frames of the five-colour proof on a plane triangulation D = {n, E, pos}: peel vertices of degree ≤ 5, re-insert with Kempe swaps. */
export function fiveFrames(D, pickSeed) {
          const n = D.n, adj = Array.from({ length: n }, () => new Set()); D.E.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });
          const live = new Array(n).fill(true), order = [], frames = [], blank = new Array(n).fill(-1);
          const deg = (u) => [...adj[u]].filter((w) => live[w]).length;
          for (let t = 0; t < n; t++) {
            let u = -1; for (let w = 0; w < n; w++) if (live[w] && deg(w) <= 5 && (u < 0 || deg(w) > deg(u))) u = w; // any vertex of degree ≤ 5 will do; prefer degree 5
            frames.push({ live: live.slice(), col: blank, cur: u, nb: [], chain: [], note: `Remove ${u + 1}: it has degree ${deg(u)} ≤ 5 in the remaining planar graph.` });
            order.push(u); live[u] = false;
          }
          const col = blank.slice(), alive = new Array(n).fill(false); let swaps = 0;
          const A = (u) => [...adj[u]].filter((w) => alive[w]);
          for (let i = n - 1; i >= 0; i--) {
            const u = order[i], nb = A(u), used = new Set(nb.map((w) => col[w]));
            alive[u] = true;
            if (used.size < 5) {
              const fr = [0, 1, 2, 3, 4].filter((x) => !used.has(x)), c = fr[(u * 7 + pickSeed) % fr.length]; col[u] = c;
              frames.push({ live: alive.slice(), col: col.slice(), cur: u, nb, chain: [], note: `Re-insert ${u + 1}: its ${nb.length} neighbours show ${used.size} colour${used.size === 1 ? '' : 's'}, so colour ${colName(c)} is free.` });
            } else {
              nb.sort((a, b) => Math.atan2(D.pos[a][1] - D.pos[u][1], D.pos[a][0] - D.pos[u][0]) - Math.atan2(D.pos[b][1] - D.pos[u][1], D.pos[b][0] - D.pos[u][0]));
              frames.push({ live: alive.slice(), col: col.slice(), cur: u, nb, chain: [], note: `Re-insert ${u + 1}: five neighbours carry all five colours. Look at Kempe chains.` });
              const adjL = adj.map((S0) => [...S0].filter((w) => alive[w]));
              let done = false;
              for (const [p, q] of [[0, 2], [1, 3]]) {
                const a = nb[p], b = nb[q], ca = col[a], cb = col[b], Kc = kempe(adjL, col, a, ca, cb);
                if (!Kc.has(b)) {
                  frames.push({ live: alive.slice(), col: col.slice(), cur: u, nb, chain: [...Kc], note: `The ${colName(ca)}/${colName(cb)}-chain from ${a + 1} does not reach ${b + 1}.` });
                  for (const w of Kc) col[w] = col[w] === ca ? cb : ca;
                  col[u] = ca; swaps++; done = true;
                  frames.push({ live: alive.slice(), col: col.slice(), cur: u, nb, chain: [...Kc], note: `Swap ${colName(ca)} and ${colName(cb)} on the chain: ${colName(ca)} is now free at ${u + 1}.` });
                  break;
                }
                frames.push({ live: alive.slice(), col: col.slice(), cur: u, nb, chain: [...Kc], note: `The ${colName(ca)}/${colName(cb)}-chain from ${a + 1} reaches ${b + 1}; with ${u + 1} it closes a curve, so the other pair of colours is cut apart.` });
              }
              if (!done) col[u] = 5;
            }
          }
          frames.push({ live: alive.slice(), col: col.slice(), cur: -1, nb: [], chain: [], note: `Done: ${n} vertices coloured with ${Math.max(...col) + 1} colours after ${swaps} Kempe swap${swaps === 1 ? '' : 's'}.` });
  return { D, frames, swaps, edges: D.E };
}
