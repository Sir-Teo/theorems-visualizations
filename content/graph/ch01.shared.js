// Graph Theory (Diestel) — Chapter 1: helpers shared by ch01.js, ch01-b.js and ch01-c.js.
// Everything works on an index structure H = ix(G) built from a kit graph (or any {nodes, edges}):
// vertices are 0..n-1, edges 0..m-1 with ends E[k] = [a, b, edgeObject]. Edge sets are Uint8Array(m) over GF(2).

export const K = (id) => String(id);
const TAU = 2 * Math.PI;
const efrom = (e) => (Array.isArray(e) ? e[0] : e.from), eto = (e) => (Array.isArray(e) ? e[1] : e.to);

/** Index a graph. o.skipNode(id), o.skipEdge(e) leave things out; loops and repeated pairs are kept only if o.multi. */
export function ix(G, o = {}) {
  const nodes = G.nodes.filter((n) => !(o.skipNode && o.skipNode(n.id)));
  const pos = new Map(nodes.map((n, i) => [K(n.id), i]));
  const n = nodes.length, E = [], adj = Array.from({ length: n }, () => []), seen = new Set(), eix = new Map();
  for (const e of G.edges) {
    if (o.skipEdge && o.skipEdge(e)) continue;
    const a = pos.get(K(efrom(e))), b = pos.get(K(eto(e)));
    if (a == null || b == null) continue;
    if (!o.multi) { if (a === b) continue; const key = a < b ? a + ',' + b : b + ',' + a; if (seen.has(key)) continue; seen.add(key); }
    const k = E.length; E.push([a, b, e]); eix.set(e, k);
    adj[a].push([b, k]); if (a !== b) adj[b].push([a, k]); else adj[a].push([a, k]);
  }
  return { nodes, ids: nodes.map((x) => x.id), pos, n, m: E.length, E, adj, eix, at: (id) => pos.get(K(id)) };
}
/** Map "a,b" (a < b) → edge index. */
export function emap(H) { const M = new Map(); H.E.forEach(([a, b], k) => M.set(a < b ? a + ',' + b : b + ',' + a, k)); return M; }
export const ekey = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
/** Edge indices along a vertex sequence. */
export function pathEdges(H, vs, close = false) {
  const M = emap(H), out = [];
  for (let i = 0; i + 1 < vs.length; i++) { const k = M.get(ekey(vs[i], vs[i + 1])); if (k != null) out.push(k); }
  if (close && vs.length > 2) { const k = M.get(ekey(vs[vs.length - 1], vs[0])); if (k != null) out.push(k); }
  return out;
}
/** Degrees (of the spanning subgraph with edge set F if given: Uint8Array mask). */
export function degrees(H, F) {
  const d = new Array(H.n).fill(0);
  H.E.forEach(([a, b], k) => { if (F && !F[k]) return; d[a]++; d[b]++; });
  return d;
}
/** Breadth-first search from s; alive(v) / aliveE(k) restrict the graph. */
export function bfs(H, s, alive, aliveE) {
  const dist = new Array(H.n).fill(Infinity), par = new Array(H.n).fill(-1), parE = new Array(H.n).fill(-1), order = [];
  if (s == null || s < 0 || (alive && !alive(s))) return { dist, par, parE, order };
  dist[s] = 0; const q = [s];
  while (q.length) {
    const u = q.shift(); order.push(u);
    for (const [w, k] of H.adj[u]) {
      if (dist[w] < Infinity || (alive && !alive(w)) || (aliveE && !aliveE(k))) continue;
      dist[w] = dist[u] + 1; par[w] = u; parE[w] = k; q.push(w);
    }
  }
  return { dist, par, parE, order };
}
/** Path s … t along BFS parents (vertex indices), [] if unreachable. */
export function parPath(par, t) { const out = []; for (let u = t, g = 0; u !== -1 && g < 1e5; u = par[u], g++) out.push(u); return out.reverse(); }
/** Connected components: {comp[v] (−1 if dead), k, lists}. */
export function comps(H, alive, aliveE) {
  const comp = new Array(H.n).fill(-1), lists = [];
  for (let v = 0; v < H.n; v++) {
    if (comp[v] !== -1 || (alive && !alive(v))) continue;
    const c = lists.length, L = [v]; comp[v] = c;
    for (let i = 0; i < L.length; i++) for (const [w, k] of H.adj[L[i]]) if (comp[w] === -1 && (!alive || alive(w)) && (!aliveE || aliveE(k))) { comp[w] = c; L.push(w); }
    lists.push(L);
  }
  return { comp, k: lists.length, lists };
}
export const connected = (H) => H.n > 0 && comps(H).k === 1;
/** Girth and a shortest cycle (vertex list); g = Infinity for forests. */
export function girth(H) {
  let best = Infinity, cyc = [];
  for (let r = 0; r < H.n; r++) {
    const dist = new Array(H.n).fill(-1), par = new Array(H.n).fill(-1), parE = new Array(H.n).fill(-1); dist[r] = 0; const q = [r];
    for (let qi = 0; qi < q.length; qi++) {
      const u = q[qi]; if (2 * dist[u] + 1 >= best) break;
      for (const [w, k] of H.adj[u]) {
        if (k === parE[u]) continue;
        if (dist[w] === -1) { dist[w] = dist[u] + 1; par[w] = u; parE[w] = k; q.push(w); }
        else { const L = dist[u] + dist[w] + 1; if (L < best) { best = L; const A = parPath(par, u), B = parPath(par, w); cyc = A.concat(B.slice(1).reverse()); } }
      }
    }
  }
  return { g: best, cycle: best < Infinity ? cyc : [] };
}
/** Longest path by exhaustive search (budget = node expansions); {path, exact}. */
export function longestPath(H, budget = 4e5) {
  let best = H.n ? [0] : [], steps = 0; const on = new Uint8Array(H.n), cur = [];
  const go = (u) => {
    if (++steps > budget) return; cur.push(u); on[u] = 1; if (cur.length > best.length) best = cur.slice();
    if (best.length < H.n) for (const [w] of H.adj[u]) if (!on[w]) go(w);
    on[u] = 0; cur.pop();
  };
  for (let s = 0; s < H.n && best.length < H.n; s++) go(s);
  return { path: best, exact: steps <= budget };
}
/** Longest cycle by exhaustive search (smallest vertex first); {cycle, exact}. */
export function longestCycle(H, budget = 4e5) {
  let best = [], steps = 0; const on = new Uint8Array(H.n), cur = [];
  const go = (s, u) => {
    if (++steps > budget) return; cur.push(u); on[u] = 1;
    for (const [w] of H.adj[u]) {
      if (w === s && cur.length >= 3 && cur.length > best.length) best = cur.slice();
      else if (w > s && !on[w] && best.length < H.n) go(s, w);
    }
    on[u] = 0; cur.pop();
  };
  for (let s = 0; s < H.n && best.length < H.n - s; s++) go(s, s);
  return { cycle: best, exact: steps <= budget };
}
/** Eccentricities, diameter, radius, centre, and a diametral pair. */
export function eccs(H) {
  const ecc = [], D = []; let diam = 0, far = [0, 0];
  for (let v = 0; v < H.n; v++) { const d = bfs(H, v).dist; D.push(d); const e = Math.max(...d); ecc.push(e); if (e > diam) { diam = e; far = [v, d.indexOf(e)]; } }
  const rad = H.n ? Math.min(...ecc) : 0;
  return { ecc, D, diam, rad, center: ecc.map((e, v) => (e === rad ? v : -1)).filter((v) => v >= 0), far };
}
// ---------------------------------------------------------------- flows (Menger)
function net(N) { return { N, g: Array.from({ length: N }, () => []), to: [], cap: [] }; }
function arc(F, a, b, c) { F.g[a].push(F.to.length); F.to.push(b); F.cap.push(c); F.g[b].push(F.to.length); F.to.push(a); F.cap.push(0); }
function flow(F, s, t, limit = Infinity) {
  let val = 0;
  while (val < limit) {
    const via = new Int32Array(F.N).fill(-1); via[s] = -2; const q = [s];
    for (let i = 0; i < q.length && via[t] === -1; i++) for (const a of F.g[q[i]]) { const w = F.to[a]; if (via[w] === -1 && F.cap[a] > 0) { via[w] = a; q.push(w); } }
    if (via[t] === -1) break;
    let b = Infinity; for (let v = t; v !== s; v = F.to[via[v] ^ 1]) b = Math.min(b, F.cap[via[v]]);
    for (let v = t; v !== s; v = F.to[via[v] ^ 1]) { F.cap[via[v]] -= b; F.cap[via[v] ^ 1] += b; }
    val += b;
  }
  const reach = new Uint8Array(F.N); reach[s] = 1; const q = [s];
  for (let i = 0; i < q.length; i++) for (const a of F.g[q[i]]) { const w = F.to[a]; if (!reach[w] && F.cap[a] > 0) { reach[w] = 1; q.push(w); } }
  return { val, reach };
}
/** Smallest s–t vertex separator (s, t non-adjacent): {k, sep}. Vertices in `gone` are treated as deleted. */
export function vertexCut(H, s, t, gone) {
  const BIG = H.n + 5, F = net(2 * H.n);
  for (let v = 0; v < H.n; v++) if (!gone || !gone[v]) arc(F, 2 * v, 2 * v + 1, v === s || v === t ? BIG : 1);
  for (const [a, b] of H.E) { if (gone && (gone[a] || gone[b])) continue; arc(F, 2 * a + 1, 2 * b, BIG); arc(F, 2 * b + 1, 2 * a, BIG); }
  const { val, reach } = flow(F, 2 * s + 1, 2 * t);
  const sep = []; for (let v = 0; v < H.n; v++) if (v !== s && v !== t && reach[2 * v] && !reach[2 * v + 1]) sep.push(v);
  return { k: val, sep };
}
/** Connectivity κ(G) with a smallest separator (empty when G is complete or disconnected). */
export function kappa(H) {
  if (H.n <= 1) return { k: 0, sep: [], pair: null };
  const C = comps(H); if (C.k > 1) return { k: 0, sep: [], pair: [C.lists[0][0], C.lists[1][0]] };
  const A = H.adj.map((l) => new Set(l.map(([w]) => w)));
  let best = { k: H.n - 1, sep: [], pair: null };
  for (let s = 0; s < H.n; s++) for (let t = s + 1; t < H.n; t++) {
    if (A[s].has(t)) continue;
    const r = vertexCut(H, s, t); if (r.k < best.k) best = { k: r.k, sep: r.sep, pair: [s, t] };
  }
  return best;
}
/** Edge-connectivity λ(G) with a smallest cut (edge indices). */
export function lambda(H) {
  if (H.n <= 1) return { l: 0, cut: [], side: [] };
  const C = comps(H); if (C.k > 1) return { l: 0, cut: [], side: C.lists[0] };
  let best = { l: Infinity, cut: [], side: [] };
  for (let t = 1; t < H.n; t++) {
    const F = net(H.n); for (const [a, b] of H.E) { arc(F, a, b, 1); arc(F, b, a, 1); }
    const { val, reach } = flow(F, 0, t, best.l);
    if (val < best.l) best = { l: val, cut: H.E.map(([a, b], k) => (reach[a] !== reach[b] ? k : -1)).filter((k) => k >= 0), side: [...reach.keys()].filter((v) => reach[v]) };
  }
  return best;
}
/** Is the graph k-connected? (|G| > k and no separator of fewer than k vertices.) */
export const isKConnected = (H, k) => H.n > k && (k === 0 || kappa(H).k >= k);
// ---------------------------------------------------------------- trees
/** Spanning tree (of the component of root) by 'bfs' | 'dfs' | 'random' (seeded rng required): {par, parE, inT, order, depth}. */
export function spanTree(H, root = 0, kind = 'bfs', rng) {
  const par = new Array(H.n).fill(-1), parE = new Array(H.n).fill(-1), depth = new Array(H.n).fill(-1), inT = new Uint8Array(H.m), order = [];
  if (!H.n) return { par, parE, inT, order, depth };
  depth[root] = 0; order.push(root);
  if (kind === 'dfs') {
    const it = new Array(H.n).fill(0), st = [root];
    while (st.length) {
      const u = st[st.length - 1];
      if (it[u] < H.adj[u].length) { const [w, k] = H.adj[u][it[u]++]; if (depth[w] < 0) { depth[w] = depth[u] + 1; par[w] = u; parE[w] = k; inT[k] = 1; order.push(w); st.push(w); } }
      else st.pop();
    }
  } else if (kind === 'random') {
    const front = H.adj[root].map(([w, k]) => [root, w, k]);
    while (front.length) {
      const i = Math.floor(rng() * front.length), [u, w, k] = front[i]; front.splice(i, 1);
      if (depth[w] >= 0) continue; depth[w] = depth[u] + 1; par[w] = u; parE[w] = k; inT[k] = 1; order.push(w);
      for (const [x, kk] of H.adj[w]) if (depth[x] < 0) front.push([w, x, kk]);
    }
  } else {
    const r = bfs(H, root); r.order.forEach((v) => { depth[v] = r.dist[v]; par[v] = r.par[v]; parE[v] = r.parE[v]; if (r.parE[v] >= 0) inT[r.parE[v]] = 1; }); order.length = 0; order.push(...r.order);
  }
  return { par, parE, inT, order, depth };
}
/** Path between u and w in a rooted tree (vertex list). */
export function treePath(T, u, w) {
  const A = [], B = []; let a = u, b = w;
  while (T.depth[a] > T.depth[b]) { A.push(a); a = T.par[a]; }
  while (T.depth[b] > T.depth[a]) { B.push(b); b = T.par[b]; }
  while (a !== b) { A.push(a); a = T.par[a]; B.push(b); b = T.par[b]; }
  return A.concat([a], B.reverse());
}
/** x ≤ y in the tree-order (x on the root path of y). */
export function below(T, x, y) { for (let u = y; u !== -1; u = T.par[u]) if (u === x) return true; return false; }
export const comparable = (T, x, y) => below(T, x, y) || below(T, y, x);
/** Fundamental cycle of the chord e and fundamental cut of the tree edge f (edge masks). */
export function fundCycle(H, T, e) {
  const [a, b] = H.E[e], F = new Uint8Array(H.m); F[e] = 1;
  const vs = treePath(T, a, b); for (let i = 0; i + 1 < vs.length; i++) { const u = vs[i], w = vs[i + 1]; F[T.par[u] === w ? T.parE[u] : T.parE[w]] = 1; }
  return F;
}
export function fundCut(H, T, f) {
  const [a, b] = H.E[f], low = T.par[a] === b ? a : b, F = new Uint8Array(H.m);
  const side = new Uint8Array(H.n); for (let v = 0; v < H.n; v++) side[v] = below(T, low, v) ? 1 : 0;
  H.E.forEach(([x, y], k) => { if (side[x] !== side[y]) F[k] = 1; });
  return { F, side };
}
// ---------------------------------------------------------------- GF(2)
export const xor = (A, B) => { const C = new Uint8Array(A.length); for (let i = 0; i < A.length; i++) C[i] = A[i] ^ B[i]; return C; };
export const popcount = (A) => { let c = 0; for (const x of A) c += x; return c; };
export const dotF2 = (A, B) => { let c = 0; for (let i = 0; i < A.length; i++) c ^= A[i] & B[i]; return c; };
export function rankF2(rows) {
  const R = rows.map((r) => Uint8Array.from(r)); let rank = 0; const m = R.length ? R[0].length : 0;
  for (let c = 0; c < m && rank < R.length; c++) {
    let p = -1; for (let i = rank; i < R.length; i++) if (R[i][c]) { p = i; break; }
    if (p < 0) continue; [R[rank], R[p]] = [R[p], R[rank]];
    for (let i = 0; i < R.length; i++) if (i !== rank && R[i][c]) for (let j = c; j < m; j++) R[i][j] ^= R[rank][j];
    rank++;
  }
  return rank;
}
/** Vertices of odd degree in (V, F). */
export function oddVerts(H, F) { return degrees(H, F).map((d, v) => (d % 2 ? v : -1)).filter((v) => v >= 0); }
/** Split an even edge set into edge-disjoint cycles: [[edge indices]], or null if some degree is odd. */
export function cycleDecomp(H, F) {
  if (oddVerts(H, F).length) return null;
  const left = Uint8Array.from(F), out = [];
  for (let k0 = 0; k0 < H.m; k0++) {
    if (!left[k0]) continue;
    let u = H.E[k0][0], first = k0; const vs = [u], es = [], where = new Map([[u, 0]]);
    for (let guard = 0; guard < 4 * H.m + 4; guard++) {
      let k = -1, w = -1;
      if (first >= 0) { k = first; w = H.E[k][0] === u ? H.E[k][1] : H.E[k][0]; first = -1; }
      else for (const [x, kk] of H.adj[u]) if (left[kk]) { k = kk; w = x; break; }
      if (k < 0) break;
      left[k] = 0; es.push(k);
      if (where.has(w)) {
        const i = where.get(w); out.push(es.splice(i));
        for (const v of vs.splice(i + 1)) where.delete(v);
        u = w;
        if (!es.length && !H.adj[w].some(([, kk]) => left[kk])) break;
      } else { where.set(w, vs.length); vs.push(w); u = w; }
    }
  }
  return out;
}
/** 2-colour by BFS parity; returns {col, ok, bad (edge index), odd: vertex list of an odd cycle}. */
export function twoColour(H) {
  const col = new Array(H.n).fill(-1), par = new Array(H.n).fill(-1), dep = new Array(H.n).fill(0);
  for (let r = 0; r < H.n; r++) {
    if (col[r] >= 0) continue; col[r] = 0; const q = [r];
    for (let i = 0; i < q.length; i++) { const u = q[i]; for (const [w] of H.adj[u]) if (col[w] < 0) { col[w] = 1 - col[u]; par[w] = u; dep[w] = dep[u] + 1; q.push(w); } }
  }
  for (let k = 0; k < H.m; k++) {
    const [a, b] = H.E[k]; if (col[a] !== col[b]) continue;
    const A = [], B = []; let x = a, y = b;
    while (dep[x] > dep[y]) { A.push(x); x = par[x]; } while (dep[y] > dep[x]) { B.push(y); y = par[y]; }
    while (x !== y) { A.push(x); x = par[x]; B.push(y); y = par[y]; }
    return { col, ok: false, bad: k, odd: A.concat([x], B.reverse()) };
  }
  return { col, ok: true, bad: -1, odd: null };
}
// ---------------------------------------------------------------- bounds
/** Moore bound n₀(d, g) of Alon–Hoory–Linial / Diestel §1.3 (d real ≥ 2). */
export function n0(d, g) {
  const r = Math.floor(g / 2); let s = 0; for (let i = 0; i < r; i++) s += Math.pow(d - 1, i);
  return g % 2 ? 1 + d * s : 2 * s;
}
// ---------------------------------------------------------------- named graphs ({nodes: [{id, x, y}], edges: [[a, b]]}, layout 'fit')
const ring = (n, R = 1, a0 = Math.PI / 2, off = 0) => Array.from({ length: n }, (_, i) => ({ id: i + off, x: R * Math.cos(a0 - (TAU * i) / n), y: R * Math.sin(a0 - (TAU * i) / n) }));
export function lcf(n, pat) { const edges = []; for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n]); for (let i = 0; i < n; i++) { const j = (((i + pat[i % pat.length]) % n) + n) % n; if (i < j) edges.push([i, j]); } return { nodes: ring(n), edges, layout: 'fit' }; }
export const NAMED = {
  petersen() {
    const nodes = ring(5).concat(ring(5, 0.5, Math.PI / 2, 5)), edges = [];
    for (let i = 0; i < 5; i++) edges.push([i, (i + 1) % 5], [i, i + 5], [i + 5, ((i + 2) % 5) + 5]);
    return { nodes, edges, layout: 'fit' };
  },
  heawood: () => lcf(14, [5, -5]),
  mcgee: () => lcf(24, [12, 7, -7]),
  tutteCoxeter: () => lcf(30, [-13, -9, 7, -7, 9, 13]),
  hoffmanSingleton() {
    // pentagons P_h (vertices 5h+i) and pentagrams Q_j (25+5j+i); P_h^i ~ Q_j^{hj+i}
    const nodes = [], edges = [];
    for (let h = 0; h < 5; h++) for (let i = 0; i < 5; i++) {
      const a = TAU * h / 5 + Math.PI / 2, c = [1.9 * Math.cos(a), 1.9 * Math.sin(a)], b = Math.PI / 2 + TAU * i / 5;
      nodes.push({ id: 5 * h + i, x: c[0] + 0.45 * Math.cos(b), y: c[1] + 0.45 * Math.sin(b) });
    }
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
      const a = TAU * j / 5 + Math.PI / 2 + Math.PI / 5, c = [0.95 * Math.cos(a), 0.95 * Math.sin(a)], b = Math.PI / 2 + TAU * i / 5;
      nodes.push({ id: 25 + 5 * j + i, x: c[0] + 0.32 * Math.cos(b), y: c[1] + 0.32 * Math.sin(b) });
    }
    for (let h = 0; h < 5; h++) for (let i = 0; i < 5; i++) { edges.push([5 * h + i, 5 * h + ((i + 1) % 5)]); edges.push([25 + 5 * h + i, 25 + 5 * h + ((i + 2) % 5)]); }
    for (let h = 0; h < 5; h++) for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) edges.push([5 * h + i, 25 + 5 * j + ((h * j + i) % 5)]);
    return { nodes, edges, layout: 'fit' };
  },
  complete(n) { const edges = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([i, j]); return { nodes: ring(n), edges, layout: 'fit' }; },
  cycle(n) { return { nodes: ring(n), edges: Array.from({ length: n }, (_, i) => [i, (i + 1) % n]), layout: 'fit' }; },
  kmn(m, n) {
    const nodes = [], edges = [], w = Math.max(m, n);
    for (let i = 0; i < m; i++) nodes.push({ id: i, x: (i - (m - 1) / 2) * 1.2, y: 1 });
    for (let j = 0; j < n; j++) nodes.push({ id: m + j, x: (j - (n - 1) / 2) * 1.2, y: -0.3 - 0.15 * w });
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) edges.push([i, m + j]);
    return { nodes, edges, layout: 'fit' };
  },
  cube() {
    const P = [[0, 0], [1, 0], [1, 1], [0, 1]], nodes = [];
    P.forEach(([x, y], i) => nodes.push({ id: i, x: 2.2 * x - 1.1, y: 2.2 * y - 1.1 })); P.forEach(([x, y], i) => nodes.push({ id: i + 4, x: x - 0.5, y: y - 0.5 }));
    const edges = []; for (let i = 0; i < 4; i++) edges.push([i, (i + 1) % 4], [i + 4, ((i + 1) % 4) + 4], [i, i + 4]);
    return { nodes, edges, layout: 'fit' };
  },
  octahedron() {
    const nodes = ring(3, 1.15, Math.PI / 2).concat(ring(3, 0.45, -Math.PI / 2, 3)), edges = [];
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (j !== i + 3) edges.push([i, j]);
    return { nodes, edges, layout: 'fit' };
  },
  prism(n) {
    const nodes = ring(n).concat(ring(n, 0.5, Math.PI / 2, n)), edges = [];
    for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n], [i + n, ((i + 1) % n) + n], [i, i + n]);
    return { nodes, edges, layout: 'fit' };
  },
};
/** Fresh copy of a named graph with string or numeric ids, ready to spread into a v.graph spec. */
export function named(name, ...args) { return NAMED[name](...args); }
/** Random simple cubic graph on n (even) vertices by the configuration model (rejection). Edges [[a, b]]. */
export function randomCubic(n, rng) {
  for (let t = 0; t < 400; t++) {
    const pts = []; for (let v = 0; v < n; v++) pts.push(v, v, v);
    for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
    const seen = new Set(), edges = []; let ok = true;
    for (let i = 0; i < pts.length; i += 2) { const a = pts[i], b = pts[i + 1], k = ekey(a, b); if (a === b || seen.has(k)) { ok = false; break; } seen.add(k); edges.push([a, b]); }
    if (ok) return edges;
  }
  return null;
}
/** Improve the girth of a cubic edge list by random double-edge switches (keeps it simple and cubic). */
export function girthSwitch(n, edges, rng, iters = 300) {
  const H0 = () => ix({ nodes: Array.from({ length: n }, (_, i) => ({ id: i })), edges });
  const score = (H) => { const { g } = girth(H); if (g === Infinity) return [Infinity, 0]; let c = 0; for (let r = 0; r < n; r++) if (localGirth(H, r) === g) c++; return [g, c]; };
  let H = H0(), sc = score(H);
  for (let it = 0; it < iters; it++) {
    const i = Math.floor(rng() * edges.length), j = Math.floor(rng() * edges.length); if (i === j) continue;
    const [a, b] = edges[i], [c, d] = edges[j]; if (new Set([a, b, c, d]).size < 4) continue;
    const alt = rng() < 0.5 ? [[a, c], [b, d]] : [[a, d], [b, c]];
    const keys = new Set(edges.map(([x, y]) => ekey(x, y))); if (alt.some(([x, y]) => keys.has(ekey(x, y)))) continue;
    const old = [edges[i], edges[j]]; edges[i] = alt[0]; edges[j] = alt[1];
    const H2 = H0(), s2 = score(H2);
    if (comps(H2).k === 1 && (s2[0] > sc[0] || (s2[0] === sc[0] && s2[1] <= sc[1]))) { H = H2; sc = s2; } else { edges[i] = old[0]; edges[j] = old[1]; }
  }
  return edges;
}
/** Length of a shortest cycle through r. */
export function localGirth(H, r) {
  const dist = new Array(H.n).fill(-1), br = new Array(H.n).fill(-1), parE = new Array(H.n).fill(-1); dist[r] = 0; const q = [r]; let best = Infinity;
  for (let i = 0; i < q.length; i++) {
    const u = q[i]; if (2 * dist[u] + 1 >= best) break;
    for (const [w, k] of H.adj[u]) {
      if (k === parE[u]) continue;
      if (dist[w] === -1) { dist[w] = dist[u] + 1; br[w] = u === r ? w : br[u]; parE[w] = k; q.push(w); }
      else if (w === r || br[w] !== br[u]) best = Math.min(best, dist[u] + dist[w] + 1);
    }
  }
  return best;
}
// ---------------------------------------------------------------- drawing helpers (stage in data coordinates)
/** Translucent "blob" around a vertex set: thick round strokes along edges and big dots at vertices (pixel widths). */
export function blob(s, pts, segs, color, wpx = 30, alpha = 0.22) {
  const c = s.ctx; c.save(); c.globalAlpha = alpha; c.strokeStyle = c.fillStyle = color; c.lineCap = 'round'; c.lineWidth = wpx;
  for (const [p, q] of segs) { c.beginPath(); c.moveTo(s.X(p[0]), s.Y(p[1])); c.lineTo(s.X(q[0]), s.Y(q[1])); c.stroke(); }
  for (const p of pts) { c.beginPath(); c.arc(s.X(p[0]), s.Y(p[1]), wpx / 2, 0, TAU); c.fill(); }
  c.restore();
}
/** Radial BFS layout around root (relative coordinates for layout 'fit'): layer i on a circle of radius i. */
export function radial(H, root) {
  const r = bfs(H, root), layers = []; r.order.forEach((v) => { (layers[r.dist[v]] ||= []).push(v); });
  const t = new Array(H.n).fill(0), P = new Array(H.n).fill(null), L1 = layers[1] ? layers[1].length : 1;
  layers.forEach((L, i) => {
    if (i === 0) { P[L[0]] = [0, 0]; return; }
    if (i > 1) L.sort((a, b) => t[r.par[a]] - t[r.par[b]] || a - b);
    L.forEach((v, j) => { t[v] = i === 1 ? j / L.length : (j + 0.5) / L.length - 0.5 / L1; const th = Math.PI / 2 - 2 * Math.PI * t[v]; P[v] = [i * Math.cos(th), i * Math.sin(th)]; });
  });
  const far = layers.length; for (let v = 0; v < H.n; v++) if (!P[v]) P[v] = [far * Math.cos(v), far * Math.sin(v)];
  return { P, layers, dist: r.dist, par: r.par };
}
/** Colour palette for parts/components. */
export const PALETTE = ['blue', 'orange', 'purple', 'teal', 'pink', 'gold', 'green', 'red'];
