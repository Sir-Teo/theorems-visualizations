// Algorithms — Chapter 9 (shortest paths): helpers shared by ch09.js and ch09-b.js.
// Every algorithm is written out with frame snapshots for v.steps, so a picture shows exactly the state
// the text talks about. The independent checks at the bottom (exhaustive search over simple paths and
// simple cycles) share no code with the algorithms they check.

export const K = (id) => String(id);
export const INF = Infinity;
export const W = (e) => e.w ?? 1;
export const ids = (G) => G.nodes.map((n) => n.id);
export const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + 's'}`;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** Plain-text number: ∞, −∞, at most 2 decimals, real minus sign. */
export const fmt = (x) => (x === INF ? '∞' : x === -INF ? '−∞' : x == null ? '·' : String(Math.round(x * 100) / 100).replace('-', '−'));
/** TeX number. */
export const tnum = (x) => (x === INF ? '\\infty' : x === -INF ? '-\\infty' : String(Math.round(x * 100) / 100));
/** Nodes from a {id: [x, y]} table. */
export const nodesAt = (P, extra = {}) => Object.entries(P).map(([id, [x, y]]) => ({ id, x, y, ...(extra[id] || {}) }));
/** Directed arcs of G (an undirected edge gives both directions): [{from, to, w, edge}]. */
export function arcs(G) {
  const A = [];
  for (const e of G.edges) { A.push({ from: K(e.from), to: K(e.to), w: W(e), edge: e }); if (!G.isDirected(e)) A.push({ from: K(e.to), to: K(e.from), w: W(e), edge: e }); }
  return A;
}
/** Weight of a vertex path (ids) along the cheapest parallel arc; Infinity if an arc is missing. */
export function pathW(G, P) {
  let t = 0;
  for (let k = 0; k + 1 < P.length; k++) { const a = G.adj(P[k]).filter((x) => K(x.id) === K(P[k + 1])); if (!a.length) return INF; t += Math.min(...a.map((x) => x.w)); }
  return t;
}
/** Edge objects along a vertex path. */
export function pathEdges(G, P) {
  const out = [];
  for (let k = 0; k + 1 < P.length; k++) { const a = G.adj(P[k]).filter((x) => K(x.id) === K(P[k + 1])); if (a.length) out.push(a.reduce((b, x) => (x.w < b.w ? x : b)).edge); }
  return out;
}
/** Follow predecessor pointers from t back to the source: ids source → t ([] if broken or cyclic). */
export function predPath(prev, t, n) {
  const out = []; let x = K(t), g = 0;
  while (x != null && g++ <= n + 1) { out.push(x); x = prev[x] == null ? null : K(prev[x]); }
  return g > n + 1 ? [] : out.reverse();
}
/** Is the predecessor graph a tree hanging from s (every vertex with a pointer leads back to s without a cycle)? */
export function predIsTree(prev, s, n) {
  for (const v of Object.keys(prev)) { if (prev[v] == null) continue; const P = predPath(prev, v, n); if (!P.length || P[0] !== K(s)) return false; }
  return true;
}

// ---------------------------------------------------------------- independent checks: exhaustive search
/**
 * Exhaustive search from s over every simple path, plus every simple cycle (n ≤ 11).
 * dist[v] = least weight of a simple s–v path, or −∞ when v can be reached from a negative cycle that s reaches;
 * path[v] = a best simple path; cycles = the negative cycles reachable from s; count = simple paths examined.
 */
export function bruteSP(G, s) {
  const I = ids(G).map(K), out = new Map(I.map((u) => [u, []]));
  for (const a of arcs(G)) if (out.has(a.from) && out.has(a.to)) out.get(a.from).push(a);
  const dist = {}, path = {}; for (const u of I) { dist[u] = INF; path[u] = null; }
  let count = 0; const on = new Set();
  const go = (u, d, P) => {
    count++; if (d < dist[u]) { dist[u] = d; path[u] = P.slice(); }
    if (count > 400000) return;
    for (const a of out.get(u)) if (!on.has(a.to)) { on.add(a.to); P.push(a.to); go(a.to, d + a.w, P); P.pop(); on.delete(a.to); }
  };
  if (out.has(K(s))) { on.add(K(s)); go(K(s), 0, [K(s)]); }
  const reach = new Set(I.filter((u) => dist[u] < INF));
  const cycles = simpleCycles(G).filter((c) => c.w < 0 && c.nodes.some((x) => reach.has(x)));
  if (cycles.length) {
    const st = cycles.flatMap((c) => c.nodes), seen = new Set(st);
    while (st.length) { const u = st.pop(); for (const a of out.get(u)) if (!seen.has(a.to)) { seen.add(a.to); st.push(a.to); } }
    for (const u of seen) dist[u] = -INF;
  }
  return { dist, path, cycles, count };
}
/** Every simple directed cycle of G, once each (started at its smallest vertex index): [{nodes, w}]. */
export function simpleCycles(G) {
  const I = ids(G).map(K), ix = new Map(I.map((u, i) => [u, i])), out = new Map(I.map((u) => [u, []])), res = [];
  for (const a of arcs(G)) if (out.has(a.from) && out.has(a.to)) out.get(a.from).push(a);
  for (const s of I) {
    const on = new Set([s]);
    const go = (u, d, P) => {
      if (res.length > 3000) return;
      for (const a of out.get(u)) {
        if (a.to === s) { if (G.isDirected(a.edge) || P.length > 2) res.push({ nodes: P.slice(), w: d + a.w }); continue; }
        if (ix.get(a.to) < ix.get(s) || on.has(a.to)) continue;
        on.add(a.to); P.push(a.to); go(a.to, d + a.w, P); P.pop(); on.delete(a.to);
      }
    };
    go(s, 0, [s]);
  }
  return res;
}
/** Every simple path from s to t, cheapest first: [{nodes, w}] (at most `limit`). */
export function simplePaths(G, s, t, limit = 2000) {
  const res = [], on = new Set([K(s)]);
  const go = (u, d, P) => {
    if (res.length >= limit) return;
    if (u === K(t)) { res.push({ nodes: P.slice(), w: d }); return; }
    for (const a of G.adj(u)) { const x = K(a.id); if (on.has(x)) continue; on.add(x); P.push(x); go(x, d + a.w, P); P.pop(); on.delete(x); }
  };
  go(K(s), 0, [K(s)]);
  return res.sort((a, b) => a.w - b.w || a.nodes.length - b.nodes.length);
}
/** All-pairs distances by exhaustive search from every vertex: {I, D (matrix)}; D[i][j] may be ±∞. */
export function allPairsBrute(G) {
  const I = ids(G).map(K);
  return { I, D: I.map((u) => { const r = bruteSP(G, u).dist; return I.map((v) => r[v]); }) };
}

// ---------------------------------------------------------------- Bellman–Ford (in place, edge order)
export const BF_CODE = [
  'for each vertex v:  d[v] ← ∞;  π[v] ← nil',
  'd[s] ← 0',
  'repeat n − 1 times:                          ▷ round i',
  '  for each edge u → v of weight w:  Relax(u, v)',
  'for each edge u → v:                         ▷ round n: the check',
  '  if d[u] + w < d[v]:  negative cycle reachable from s',
  'Relax(u, v):  if d[u] + w < d[v]:  d[v] ← d[u] + w;  π[v] ← u',
];
/**
 * Bellman–Ford with one frame per round (rounds 1 … n − 1, then the check round n).
 * Frame: {round, dist, prev, improved (Set of edges), line, note, check?, bad?, cycle?}.
 * Result: {dist, prev, cycle (ids, forward order) | null, frames, history (dist per round, extra rounds up to `extra`)}.
 */
export function bellmanFord(G, s, o = {}) {
  const I = ids(G).map(K), n = I.length, A = arcs(G).filter((a) => I.includes(a.from) && I.includes(a.to));
  const d = {}, prev = {}, prevEdge = {}; for (const u of I) { d[u] = INF; prev[u] = null; prevEdge[u] = null; }
  d[K(s)] = 0;
  const frames = [], history = [{ ...d }];
  const snap = (e) => frames.push({ ...e, dist: { ...d }, prev: { ...prev }, prevEdge: { ...prevEdge } });
  snap({ round: 0, improved: new Set(), line: [1, 2], note: `Every estimate starts at ∞ except $d[${G.lab(s)}] = 0$.` });
  const round = () => { const imp = new Set(); for (const a of A) if (d[a.from] + a.w < d[a.to]) { d[a.to] = d[a.from] + a.w; prev[a.to] = a.from; prevEdge[a.to] = a.edge; imp.add(a.edge); } return imp; };
  let stable = null;
  for (let r = 1; r < n; r++) {
    const imp = round(); history.push({ ...d });
    if (!imp.size && stable == null) stable = r;
    snap({ round: r, improved: imp, line: [3, 4, 7], note: imp.size ? `Round ${r}: relax all ${A.length} edges in order; ${plural(imp.size, 'edge')} improve an estimate (orange).` : `Round ${r}: no edge improves anything — the estimates have already converged.` });
  }
  // check round
  const bad = A.filter((a) => d[a.from] + a.w < d[a.to]);
  let cycle = null;
  if (bad.length) {
    const a = bad[0], p2 = { ...prev }; p2[a.to] = a.from;
    let x = a.to; for (let k = 0; k < n; k++) x = p2[x];
    const C = [x]; let y = p2[x], g = 0; while (y !== x && y != null && g++ < n) { C.push(y); y = p2[y]; }
    cycle = C.reverse();
    snap({ round: n, check: true, bad: new Set(bad.map((b) => b.edge)), cycle, improved: new Set(), line: [5, 6], note: `Round ${n} (the check): ${plural(bad.length, 'edge')} can still be relaxed — impossible if every estimate were a true distance. Walking ${n} steps back along π from ${G.lab(a.to)} lands on a cycle: ${cycle.map((c) => G.lab(c)).join(' → ')} → ${G.lab(cycle[0])}, of weight ${fmt(cycleW(G, cycle))}.` });
  } else snap({ round: n, check: true, bad: new Set(), improved: new Set(), line: [5, 6], note: `Round ${n} (the check): no edge can be relaxed, so no negative cycle is reachable and every $d[v]$ is the true distance.` });
  // extra rounds for convergence charts
  const d2 = { ...d };
  for (let r = n; r <= (o.extra ?? 0); r++) { round(); history.push({ ...d }); }
  for (const u of I) d[u] = d2[u];
  return { dist: d2, prev, prevEdge, cycle, frames, history, stable, A };
}
/** Weight of a closed walk given as ids (the last vertex returns to the first). */
export function cycleW(G, C) { return pathW(G, C.concat([C[0]])); }

// ---------------------------------------------------------------- Dijkstra with an explicit binary heap
export const DIJ_CODE = [
  'for each vertex v:  d[v] ← ∞;  π[v] ← nil',
  'd[s] ← 0;  Q ← ⟨s⟩                ▷ binary min-heap keyed by d',
  'while Q is not empty:',
  '  u ← extract-min(Q);  settle u    ▷ d[u] is final',
  '  for each edge u → v of weight w, v not settled:',
  '    if d[u] + w < d[v]:            ▷ relax',
  '      d[v] ← d[u] + w;  π[v] ← u',
  '      if v ∈ Q: decrease-key(Q, v)   else: insert(Q, v)',
];
/**
 * Dijkstra's algorithm with a binary heap (decrease-key by sift-up), one frame per operation.
 * Frame: {type: init|extract|relax|skip|done, u, v, edge, improved, missed, heap (ids, heap order), dist, prev, prevEdge,
 *         settled (ids in order), ops {ins, ext, dec, rel}, line, note}.
 */
export function dijkstra(G, s, o = {}) {
  const I = ids(G).map(K), L = (x) => `**${G.lab(x)}**`;
  const d = {}, prev = {}, prevEdge = {}, pos = {}; for (const u of I) { d[u] = INF; prev[u] = null; prevEdge[u] = null; pos[u] = -1; }
  const H = [], settled = [], done = new Set(), ops = { ins: 0, ext: 0, dec: 0, rel: 0 }, frames = [];
  const less = (a, b) => d[a] < d[b] || (d[a] === d[b] && I.indexOf(a) < I.indexOf(b));
  const sw = (i, j) => { [H[i], H[j]] = [H[j], H[i]]; pos[H[i]] = i; pos[H[j]] = j; };
  const up = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (less(H[i], H[p])) { sw(i, p); i = p; } else break; } };
  const down = (i) => { for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && less(H[l], H[m])) m = l; if (r < H.length && less(H[r], H[m])) m = r; if (m === i) break; sw(i, m); i = m; } };
  const snap = (e) => { if (o.frames !== false) frames.push({ ...e, heap: H.slice(), dist: { ...d }, prev: { ...prev }, prevEdge: { ...prevEdge }, settled: settled.slice(), ops: { ...ops } }); };
  d[K(s)] = 0; H.push(K(s)); pos[K(s)] = 0; ops.ins++;
  snap({ type: 'init', line: [1, 2], note: `Every estimate is ∞ except $d[${G.lab(s)}] = 0$; the heap holds only ${L(s)}.` });
  while (H.length) {
    const u = H[0]; sw(0, H.length - 1); H.pop(); pos[u] = -1; if (H.length) down(0); ops.ext++;
    settled.push(u); done.add(u);
    snap({ type: 'extract', u, line: 4, note: `Extract-min gives ${L(u)} with key ${fmt(d[u])}: no unsettled vertex is closer, so $d[${G.lab(u)}] = ${tnum(d[u])}$ is final.` });
    for (const { id, edge, w } of G.adj(u)) {
      const v = K(id);
      if (done.has(v)) {
        const missed = d[u] + w < d[v];
        if (missed || o.showSkips) snap({ type: 'skip', u, v, edge, missed, line: 5, note: missed ? `Edge ${G.lab(u)}→${G.lab(v)} would give ${fmt(d[u])} + (${fmt(w)}) = ${fmt(d[u] + w)} < ${fmt(d[v])} — but ${L(v)} is already settled, so Dijkstra never looks at it again.` : `${L(v)} is already settled: skip ${G.lab(u)}→${G.lab(v)}.` });
        continue;
      }
      ops.rel++;
      const nd = d[u] + w, better = nd < d[v];
      if (better) {
        const was = d[v]; d[v] = nd; prev[v] = u; prevEdge[v] = edge;
        if (pos[v] >= 0) { up(pos[v]); ops.dec++; } else { H.push(v); pos[v] = H.length - 1; up(H.length - 1); ops.ins++; }
        snap({ type: 'relax', u, v, edge, improved: true, line: [6, 7, 8], note: `Relax ${G.lab(u)}→${G.lab(v)}: ${fmt(d[u])} + ${fmt(w)} = ${fmt(nd)} < ${fmt(was)}, so ${L(v)} improves to ${fmt(nd)} (${was === INF ? 'insert' : 'decrease-key'}).` });
      } else snap({ type: 'relax', u, v, edge, improved: false, line: 6, note: `Relax ${G.lab(u)}→${G.lab(v)}: ${fmt(d[u])} + ${fmt(w)} = ${fmt(nd)} ≥ ${fmt(d[v])}: no change.` });
    }
  }
  snap({ type: 'done', line: 3, note: `The heap is empty: ${plural(settled.length, 'vertex', 'vertices')} settled, and the green π-edges form the shortest-path tree.` });
  return { dist: d, prev, prevEdge, settled, frames, ops };
}

// ---------------------------------------------------------------- topological order (DFS finishing times)
/** Reverse postorder of a DFS over all vertices; null if a cycle is found. */
export function topoOrder(G) {
  const I = ids(G).map(K), col = {}, post = []; let cyc = false;
  for (const u of I) col[u] = 0;
  const visit = (u) => { col[u] = 1; for (const { id } of G.adj(u)) { const v = K(id); if (col[v] === 1) cyc = true; else if (col[v] === 0) visit(v); } col[u] = 2; post.push(u); };
  for (const u of I) if (col[u] === 0) visit(u);
  return cyc ? null : post.reverse();
}

// ---------------------------------------------------------------- Floyd–Warshall
/** D^(0) … D^(n) with via-pointers; frames per phase k. Vertex k (1-based) is allowed as an intermediate from phase k on. */
export function floydWarshall(G) {
  const I = ids(G).map(K), n = I.length, ix = new Map(I.map((u, i) => [u, i]));
  const D = I.map((u, i) => I.map((v, j) => (i === j ? 0 : INF))), via = I.map(() => new Array(n).fill(-1));
  for (const a of arcs(G)) { const i = ix.get(a.from), j = ix.get(a.to); if (i == null || j == null) continue; if (a.w < D[i][j]) D[i][j] = a.w; }
  const mats = [D.map((r) => r.slice())], vias = [via.map((r) => r.slice())], changed = [new Set()];
  for (let k = 0; k < n; k++) {
    const ch = new Set();
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (D[i][k] + D[k][j] < D[i][j]) { D[i][j] = D[i][k] + D[k][j]; via[i][j] = k; ch.add(i * n + j); }
    mats.push(D.map((r) => r.slice())); vias.push(via.map((r) => r.slice())); changed.push(ch);
  }
  return { I, n, mats, vias, changed };
}
/** Vertex indices of the path i → j recorded by via-pointers (null if none or if it loops). */
export function fwPath(via, D, i, j) {
  if (D[i][j] === INF) return null;
  const out = [i]; let guard = 0;
  const rec = (a, b) => { if (guard++ > 200) return; const k = via[a][b]; if (k < 0) { out.push(b); return; } rec(a, k); rec(k, b); };
  if (i === j) return D[i][j] < 0 ? null : [i];
  rec(i, j); return guard > 200 ? null : out;
}

// ---------------------------------------------------------------- drawing helpers (pixel geometry)
export const R = (s, X0, Y0, X1, Y1, st) => s.rect(s.invX(X0), s.invY(Y1), s.invX(X1), s.invY(Y0), st);
export const LN = (s, X0, Y0, X1, Y1, st) => s.line(s.invX(X0), s.invY(Y0), s.invX(X1), s.invY(Y1), st);
export const TX = (s, str, X, Y, st) => s.textPx(String(str), X, Y, st);
/** Soft rounded hull around node positions (data coords), padded by pad px. */
export function blob(v, s, pts, pad, st) {
  if (!pts.length) return;
  const P = [];
  for (const [x, y] of pts) { const X = s.X(x), Y = s.Y(y); for (let k = 0; k < 18; k++) { const a = (2 * Math.PI * k) / 18; P.push([X + pad * Math.cos(a), Y + pad * Math.sin(a)]); } }
  const H = v.M.hull(P).map(([X, Y]) => [s.invX(X), s.invY(Y)]);
  s.poly(H, { fill: st.color, fillAlpha: st.alpha ?? 0.12, color: st.color, width: 1.2, alpha: st.edge ?? 0.5, dash: st.dash });
}
/** A row of labelled cells in pixel geometry; items [{label, fill?, color?, note?, noteColor?}]. Returns the cell centres. */
export function strip(s, items, X0, Y0, o = {}) {
  const gap = o.gap ?? 4, h = o.h ?? 26; let w = o.w ?? 30, x = X0;
  if (o.title) { s.textPx(o.title, X0, Y0 + h / 2, { size: 12, weight: 600, color: 'muted', align: 'left' }); x += o.titleW ?? 70; }
  if (o.maxW && items.length) w = Math.min(w, (o.maxW - (x - X0) - gap * (items.length - 1)) / items.length);
  w = Math.max(w, 12);
  if (!items.length && o.empty) s.textPx(o.empty, x, Y0 + h / 2, { size: 12, color: 'faint', align: 'left' });
  const centres = [];
  items.forEach((it, i) => {
    const X = x + i * (w + gap), col = it.color || 'muted';
    R(s, X, Y0, X + w, Y0 + h, { fill: it.fill || col, fillAlpha: it.fill ? it.fillAlpha ?? 0.85 : 0.1, color: col, width: it.width ?? 1.4, radius: 4 });
    s.textPx(String(it.label), X + w / 2, Y0 + h / 2 + 0.5, { align: 'center', size: o.size ?? (w < 24 ? 10.5 : 12.5), weight: 700, color: it.fill ? 'panel' : 'ink', halo: false });
    if (it.note != null) s.textPx(String(it.note), X + w / 2, Y0 + h + 9, { align: 'center', size: 10.5, weight: 600, color: it.noteColor || 'muted' });
    centres.push([X + w / 2, Y0 + h / 2]);
  });
  return centres;
}
/**
 * A binary heap drawn as a tree (top) over its array (bottom) inside the pixel box [X0, X0 + Wd] × [Y0, Y0 + Ht].
 * heap: ids in heap order; key(id) → number; o: {label(id), hot (id → colour | null)}.
 */
export function heapPic(s, heap, key, X0, Y0, Wd, Ht, o = {}) {
  const lab = o.label || ((x) => x), n = heap.length;
  const levels = Math.max(1, Math.ceil(Math.log2(n + 1))), arrH = 40, treeH = Ht - arrH - 8, dy = Math.min(46, treeH / Math.max(1, levels));
  if (!n) { s.textPx(o.empty || 'heap is empty', X0 + Wd / 2, Y0 + treeH / 2, { align: 'center', size: 12.5, color: 'faint' }); }
  const P = heap.map((_, i) => { const l = Math.floor(Math.log2(i + 1)), k = i - (2 ** l - 1); return [X0 + ((k + 0.5) / 2 ** l) * Wd, Y0 + 16 + l * dy]; });
  for (let i = 1; i < n; i++) { const p = (i - 1) >> 1; LN(s, P[p][0], P[p][1], P[i][0], P[i][1], { color: 'faint', width: 1.4 }); }
  const bw = Math.min(54, Wd / Math.max(2, 2 ** (levels - 1)) - 6);
  heap.forEach((id, i) => {
    const [X, Y] = P[i], hot = o.hot ? o.hot(id) : null;
    R(s, X - bw / 2, Y - 11, X + bw / 2, Y + 11, { fill: hot || 'orange', fillAlpha: hot ? 0.85 : 0.14, color: hot || 'orange', width: 1.4, radius: 9 });
    s.textPx(`${lab(id)}:${fmt(key(id))}`, X, Y + 0.5, { align: 'center', size: bw < 40 ? 10 : 11.5, weight: 700, color: hot ? 'panel' : 'ink', halo: false });
  });
  // array view
  const cw = Math.min(46, (Wd - 60) / Math.max(1, n)), AY = Y0 + Ht - arrH + 4;
  s.textPx('array', X0, AY + 11, { size: 11, weight: 600, color: 'muted' });
  heap.forEach((id, i) => {
    const X = X0 + 48 + i * cw, hot = o.hot ? o.hot(id) : null;
    R(s, X, AY, X + cw - 3, AY + 22, { fill: hot || 'orange', fillAlpha: hot ? 0.85 : 0.1, color: hot || 'orange', width: 1.2, radius: 3 });
    s.textPx(`${lab(id)}`, X + (cw - 3) / 2, AY + 11.5, { align: 'center', size: 11, weight: 700, color: hot ? 'panel' : 'ink', halo: false });
    s.textPx(String(i + 1), X + (cw - 3) / 2, AY + 31, { align: 'center', size: 9.5, color: 'faint' });
  });
}
