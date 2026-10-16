// Algorithms — Chapter 9: Shortest paths (items 9.9–9.16; 9.1–9.8 in ch09.js)
import { K, INF, W, ids, plural, clamp, fmt, tnum, nodesAt, arcs, pathW, pathEdges, predPath, bruteSP, simpleCycles, simplePaths, allPairsBrute, bellmanFord, cycleW, dijkstra, floydWarshall, fwPath, R, TX, blob, strip } from './ch09.shared.js';

/** A light graph-like object (the subset of the kit API the shared algorithms use) over explicit arcs [{from, to, w}]. */
function fakeGraph(nodeIds, arcList) {
  const nodes = nodeIds.map((id) => ({ id }));
  return {
    nodes, edges: arcList, isDirected: () => true, lab: (x) => String(x),
    adj: (u) => arcList.filter((a) => K(a.from) === K(u)).map((a) => ({ id: a.to, edge: a, w: a.w })),
    inn: (u) => arcList.filter((a) => K(a.to) === K(u)).map((a) => ({ id: a.from, edge: a, w: a.w })),
  };
}
const near = (a, b) => (a === b) || Math.abs(a - b) < 1e-9;

// ---------------------------------------------------------------- 9.9 graph
const P99 = { s: [0.7, 3.0], a: [2.8, 5.0], b: [2.8, 1.0], c: [5.0, 3.0], d: [7.1, 5.0], e: [7.1, 1.0], t: [9.3, 3.0] };
const E99 = [['s', 'a', 2], ['s', 'b', 4], ['a', 'b', 1], ['a', 'c', 5], ['b', 'c', 2], ['a', 'd', 7], ['c', 'd', 1], ['c', 'e', 4], ['b', 'e', 7], ['e', 'd', 2], ['d', 't', 3], ['e', 't', 2]];

// ---------------------------------------------------------------- 9.10 the smallest failure
const P910 = { s: [0.8, 2.4], a: [4.0, 4.3], b: [4.0, 0.6], c: [7.0, 4.3], t: [9.2, 2.4] };
const E910 = [['s', 'a', 1], ['s', 'b', 4], ['b', 'a', -4], ['a', 'c', 1], ['c', 't', 1], ['b', 't', 6]];

// ---------------------------------------------------------------- 9.11 potentials: x fixed, height = h(v)
const X911 = { s: 0.7, a: 2.5, b: 4.3, c: 6.1, d: 7.9, t: 9.6 };
const H911 = { s: 3, a: 6.5, b: 1.5, c: 4.5, d: 8, t: 5 };
const E911 = [['s', 'a', 3], ['s', 'b', 6], ['a', 'b', 2], ['a', 'c', 6], ['b', 'c', 1], ['b', 'd', 7], ['c', 'd', 2], ['c', 't', 8], ['d', 't', 3], ['d', 'a', -4]];

// ---------------------------------------------------------------- 9.12 a road map (weights = lengths rounded up)
const P912 = { s: [0.6, 3.0], a: [2.0, 5.2], b: [2.2, 1.0], c: [3.5, 3.2], d: [4.5, 5.4], e: [4.7, 0.8], f: [5.8, 2.9], g: [6.8, 5.0], h: [7.1, 1.1], i: [8.2, 3.3], j: [9.4, 5.2], t: [9.5, 1.4] };
const E912 = [['s', 'a'], ['s', 'b'], ['s', 'c'], ['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'e'], ['c', 'd'], ['c', 'f'], ['c', 'e'], ['d', 'g'], ['d', 'f'], ['e', 'f'], ['e', 'h'], ['f', 'g'], ['f', 'i'], ['f', 'h'], ['g', 'i'], ['g', 'j'], ['h', 'i'], ['h', 't'], ['i', 'j'], ['i', 't'], ['j', 't']];
const ASTAR_CODE = [
  'g[s] ← 0;  open ← {s}',
  'while open is not empty:',
  '  u ← the open vertex with least f(u) = g[u] + h(u)',
  '  if u = t:  return g[t]                 ▷ the path follows π',
  '  close u',
  '  for each edge u–v with v not closed:',
  '    if g[u] + w < g[v]:  g[v] ← g[u] + w;  π[v] ← u;  open v',
];
/** A* without reopening closed vertices (exact for consistent h). One frame per expansion / relaxation. */
function astar(G, s, t, h) {
  const I = ids(G).map(K), g = {}, prev = {}, prevEdge = {}, open = new Set([K(s)]), closed = [], F = [];
  for (const u of I) { g[u] = INF; prev[u] = null; prevEdge[u] = null; }
  g[K(s)] = 0;
  const snap = (e) => F.push({ ...e, g: { ...g }, prevEdge: { ...prevEdge }, open: [...open], closed: closed.slice() });
  snap({ line: 1, note: `Start: $g[s] = 0$, and $s$ is the only open vertex; its $f = h(s) = ${fmt(h(K(s)))}$.` });
  let found = false;
  while (open.size) {
    let u = null; for (const x of open) { const fx = g[x] + h(x), fu = u == null ? INF : g[u] + h(u); if (u == null || fx < fu - 1e-9 || (near(fx, fu) && g[x] > g[u])) u = x; }
    open.delete(u); closed.push(u);
    if (u === K(t)) { found = true; snap({ u, line: [3, 4], end: true, note: `The target ${u} has the least $f$: stop. $g[t] = ${fmt(g[u])}$, after ${plural(closed.length, 'expansion')}.` }); break; }
    snap({ u, line: [3, 5], note: `Expand **${u}**: least $f = g + h = ${fmt(g[u])} + ${fmt(h(u))} = ${fmt(g[u] + h(u))}$ among the open vertices.` });
    for (const { id, edge, w } of G.adj(u)) {
      const v = K(id); if (closed.includes(v)) continue;
      if (g[u] + w < g[v] - 1e-9) { g[v] = g[u] + w; prev[v] = u; prevEdge[v] = edge; open.add(v); snap({ u, v, edge, line: 7, note: `Relax ${u}–${v}: $g[${v}] = ${fmt(g[v])}$, so $f(${v}) = ${fmt(g[v])} + ${fmt(h(v))} = ${fmt(g[v] + h(v))}$.` }); }
    }
  }
  if (!found) snap({ line: 2, end: true, note: 'The open set is empty: t is unreachable.' });
  return { g, prev, frames: F, closed, found };
}

// ---------------------------------------------------------------- 9.13 Floyd–Warshall graph (vertices 1…5)
const P913 = { 1: [5.0, 5.6], 2: [9.1, 3.7], 3: [7.6, 0.6], 4: [2.4, 0.6], 5: [0.9, 3.7] };
const E913 = [['1', '2', 4], ['1', '3', 9], ['2', '3', 2], ['2', '4', 7], ['3', '4', 1], ['3', '5', 6], ['4', '1', 3], ['4', '5', 2], ['5', '2', -2], ['5', '1', 8]];
const FW_CODE = [
  '$D \\leftarrow W$   ($D[i][i] = 0$, $\\infty$ where there is no edge)',
  'for $k = 1, \\dots, n$:                 ▷ now allow vertex k as an intermediate',
  '  for $i = 1, \\dots, n$:',
  '    for $j = 1, \\dots, n$:',
  '      $D[i][j] \\leftarrow \\min\\{D[i][j],\\ D[i][k] + D[k][j]\\}$',
];

// ---------------------------------------------------------------- 9.14 Johnson
const P914 = { a: [0.9, 3.6], b: [3.8, 5.4], c: [7.2, 5.4], d: [9.3, 3.4], e: [5.4, 2.7], q: [5.0, 0.45] };
const E914 = [['a', 'b', 3], ['a', 'e', 8], ['b', 'c', -2], ['b', 'e', 4], ['e', 'c', -1], ['c', 'd', 2], ['e', 'd', -3], ['d', 'a', { w: 6, bend: -38 }]];
const JOHNSON_CODE = [
  'add a vertex q and an edge q → v of weight 0 for every v',
  'Bellman–Ford from q:  h(v) ← δ(q, v)      ▷ stop if it finds a negative cycle',
  'reweight:  ŵ(u, v) ← w(u, v) + h(u) − h(v)      ▷ now ŵ ≥ 0',
  'for each vertex u:  Dijkstra from u with weights ŵ',
  '  D[u][v] ← d̂(u, v) − h(u) + h(v)',
];

// ---------------------------------------------------------------- 9.15 difference constraints
const C915 = 'x2 - x1 <= 3, x3 - x2 <= -2, x3 - x1 <= 2, x4 - x3 <= 1, x4 - x2 <= 4, x5 - x4 <= -3, x5 - x3 <= 0';
/** Parse "xj - xi <= c" items separated by commas, semicolons or new lines. */
function parseConstraints(src) {
  const out = [], bad = [];
  for (const raw of String(src).replace(/−/g, '-').replace(/≤/g, '<=').split(/[,;\n]/)) {
    const t = raw.trim(); if (!t) continue;
    const m = t.match(/^x(\d)\s*-\s*x(\d)\s*<=?\s*(-?\d+(?:\.\d+)?)$/);
    if (m && m[1] !== m[2]) out.push({ j: 'x' + m[1], i: 'x' + m[2], c: +m[3] }); else bad.push(t);
  }
  return { list: out, bad };
}

// ---------------------------------------------------------------- 9.16 min-plus products
const P916 = { a: [0.8, 3.0], b: [3.0, 5.3], c: [7.0, 5.3], d: [9.2, 3.0], e: [7.0, 0.7], f: [3.0, 0.7] };
const E916 = [['a', 'b', 2], ['b', 'c', 1], ['c', 'd', 3], ['d', 'e', 1], ['e', 'f', 2], ['a', 'c', 5], ['b', 'd', 6], ['c', 'e', 5], ['d', 'f', 4], ['f', 'a', 3], ['e', 'b', -1]];
/** Min-plus product of square matrices: C[i][j] = min_k A[i][k] + B[k][j], with the argmin k. */
function minPlus(A, B) {
  const n = A.length, C = [], arg = [];
  for (let i = 0; i < n; i++) { C.push([]); arg.push([]); for (let j = 0; j < n; j++) { let b = INF, bk = -1; for (let k = 0; k < n; k++) { const x = A[i][k] + B[k][j]; if (x < b) { b = x; bk = k; } } C[i].push(b); arg[i].push(bk); } }
  return { C, arg };
}
/** Lightest walk i → j with at most m edges (vertex indices), by an edge-budget table with parents. */
function budgetWalk(Wm, i, j, m) {
  const n = Wm.length; let d = Wm.map((_, v) => (v === i ? 0 : INF)); const par = [d.map(() => -1)];
  for (let k = 1; k <= m; k++) {
    const nd = d.slice(), p = d.map(() => -1);
    for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) if (u !== v && d[u] + Wm[u][v] < nd[v]) { nd[v] = d[u] + Wm[u][v]; p[v] = u; }
    d = nd; par.push(p);
  }
  if (d[j] === INF) return null;
  const walk = [j]; let x = j;
  for (let k = m; k >= 1 && x !== i; k--) { if (par[k][x] >= 0) { x = par[k][x]; walk.push(x); } }
  return x === i ? walk.reverse() : null;
}

export default {
  collection: 'algo',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.9
    {
      num: '9.9',
      kind: 'Theorem',
      name: 'Correctness of Dijkstra’s algorithm',
      statement: String.raw`Let $G$ be a directed graph with **nonnegative** edge weights and $s$ a source. Whenever Dijkstra's algorithm (9.8) extracts a vertex $u$ from the priority queue, $d[u]=\delta(s,u)$. Hence on termination $d[v]=\delta(s,v)$ for every vertex, and the predecessor pointers form a shortest-path tree. Moreover, vertices are extracted in non-decreasing order of distance.`,
      idea: String.raw`Induct on the extractions. Let $S$ be the set settled before $u$, all with correct estimates. Take any path $P$ from $s$ to $u$, and let $y$ be its first vertex outside $S$, entered by the edge $x\to y$ with $x\in S$. When $x$ was settled that edge was relaxed, so $d[y]\le\delta(s,x)+w(x,y)\le w(P_{s\leadsto y})$. Then
$$d[u]\ \le\ d[y]\ \le\ w(P_{s\leadsto y})\ \le\ w(P).$$
The first inequality holds because $u$ was the minimum of the queue. The last holds because the rest of $P$, from $y$ to $u$, has nonnegative weight. So no path beats $d[u]$, and $d[u]=\delta(s,u)$. Only the last step uses nonnegativity. A negative edge on the rest of $P$ breaks exactly that step (9.10).`,
      caption: String.raw`Step through the extractions. Blue is the settled set $S$, gold the vertex $u$ being extracted. **Drag the slider** to pick a rival path from $s$ to $u$: its part inside $S$ up to the first outside vertex $y$ (purple ring) is drawn solid, the rest dashed orange. The readout checks the chain $d[u]\le d[y]\le w(s\leadsto y)\le w(P)$ live. Turn on the **negative edge** and step to the extraction of d: the rival through e has a negative tail, the last inequality fails, and d is settled with the wrong distance.`,
      deps: ['algo-9.8'],
      refs: ['CLRS 4e §22.3', 'Erickson Ch. 8'],
      tags: ['shortest paths', 'greedy', 'correctness'],
      viz(v) {
        const neg = v.toggle('make e → d weigh −5', false, { onChange: () => { G.edge('e', 'd').w = neg.value ? -5 : 2; S.reset({ at: 'keep' }); } });
        const rv = v.slider('rival path #', 1, 9, 5, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 330 });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', nodes: nodesAt(P99, { s: { notePos: 'n' }, b: { notePos: 's' }, e: { notePos: 's' }, t: { notePos: 's' } }), edges: E99.map(([a, b, w]) => [a, b, w]) });
        let run = null, info = null;
        const frames = () => { run = dijkstra(G, 's'); return run.frames.filter((f) => f.type === 'extract').map((f) => ({ ...f, note: f.note, line: 4 })); };
        const S = v.steps({ frames, speed: 0.8, start: 4, still: 4, counter: 'extraction' });
        v.render(() => {
          const f = S.frame, u = f.u, Sset = new Set(f.settled.slice(0, -1));
          blob(v, s, G.nodes.filter((n) => Sset.has(K(n.id))).map((n) => [n.x, n.y]), 24, { color: 'accent', alpha: 0.1 });
          const rivals = u === 's' ? [] : simplePaths(G, 's', u), P = rivals.length ? rivals[clamp(rv.value, 1, rivals.length) - 1] : null;
          let yI = -1; if (P) yI = P.nodes.findIndex((x) => !Sset.has(x));
          const pre = P ? P.nodes.slice(0, yI + 1) : [], suf = P ? P.nodes.slice(yI) : [], y = P ? P.nodes[yI] : null;
          const preE = new Set(pathEdges(G, pre)), sufE = new Set(pathEdges(G, suf)), tree = new Set(Object.values(f.prevEdge).filter(Boolean));
          G.draw({
            nodeFill: (id) => (K(id) === u ? 'gold' : Sset.has(K(id)) ? 'accent' : null),
            nodeColor: (id) => (f.dist[K(id)] < INF ? 'orange' : null),
            nodeRing: (id) => (K(id) === y && y !== u ? 'purple' : null),
            nodeNote: (id) => fmt(f.dist[K(id)]),
            noteColor: (id) => (Sset.has(K(id)) || K(id) === u ? 'accent' : f.dist[K(id)] < INF ? 'orange' : 'faint'),
            edgeColor: (e) => (preE.has(e) ? 'accent' : sufE.has(e) ? 'orange' : tree.has(e) ? 'green' : null),
            edgeWidth: (e) => (preE.has(e) || sufE.has(e) ? 4.6 : tree.has(e) ? 2.4 : null),
            edgeDash: (e) => (sufE.has(e) ? [7, 4] : null),
          });
          info = { f, u, P, y, pre, suf, rivals };
        });
        v.legend([['accent', 'settled set S; rival path inside S', { area: true }], ['gold', 'extracted now', { dot: true }], ['purple', 'first vertex y outside S (ring)', { dot: true }], ['orange', 'rest of the rival path', { dash: true }], ['green', 'predecessor edges']]);
        v.readout(() => {
          if (!info) return '';
          const { f, u, P, y, pre, suf, rivals } = info;
          const truth = bellmanFord(G, 's').dist[u];
          const exact = f.dist[u] === truth ? `$d[${u}] = ${tnum(f.dist[u])} = \\delta(s,${u})$ ✓` : `$d[${u}] = ${tnum(f.dist[u])}$ but $\\delta(s,${u}) = ${tnum(truth)}$ ✗`;
          if (!P) return `extracting the source: $d[s] = 0$ · ${exact}`;
          const A = f.dist[u], B = f.dist[y], C = pathW(G, pre), D = P.w, tail = pathW(G, suf);
          const ok = (a, b) => (a <= b + 1e-9 ? '✓' : '✗');
          return `rival #${clamp(rv.value, 1, rivals.length)} of ${rivals.length}: ${P.nodes.join('→')}, first vertex outside S: **${y}** · $d[${u}] = ${tnum(A)} \\le d[${y}] = ${tnum(B)}$ ${ok(A, B)} $\\le w(s\\leadsto ${y}) = ${tnum(C)}$ ${ok(B, C)} $\\le w(P) = ${tnum(D)}$ ${ok(C, D)}${tail < 0 ? ` (the tail ${suf.join('→')} weighs ${fmt(tail)} < 0)` : ''} · ${exact}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.10
    {
      num: '9.10',
      kind: 'Proposition',
      name: 'Dijkstra can fail with negative edges',
      statement: String.raw`If some edge weights are negative, Dijkstra's algorithm can return wrong distances, even when the graph has no negative cycle. In the five-vertex graph shown, with $w(b,a)=-4$, Dijkstra settles $a$ at distance 1 although the path $s\to b\to a$ weighs 0, and the error propagates to everything reached through $a$. Bellman–Ford (9.6) handles the same graph correctly. (Re-inserting vertices whose estimate drops after they were settled restores correctness when there is no negative cycle, but then the number of extractions can grow exponentially in the worst case.)`,
      idea: String.raw`The proof of 9.9 breaks at a single inequality: a path that leaves the settled set can only grow, $w(P_{s\leadsto y})\le w(P)$. A negative edge lets a path that first wanders away to a far vertex ($b$, at distance 4) come back below a vertex that already looked closer ($a$, at 1). By then $a$ is settled, and the algorithm never revisits it, so its estimate and its descendants' stay too high. The failure is not about cycles, only about the greedy order.`,
      caption: String.raw`Left: Dijkstra's algorithm, step by step. Right: Bellman–Ford on the same graph. **Drag the slider** to change $w(b,a)$. At the step where $b$ is extracted, the edge b → a would improve the already-settled $a$ (red dashed) and is ignored. Vertices where the two answers differ get a red ring. The chart sweeps $w(b,a)$ from −6 to 6 and shows that Dijkstra's $d[t]$ and the true $\delta(s,t)$ part ways once $w(b,a)<-3$.`,
      deps: ['algo-9.9', 'algo-9.6'],
      refs: ['Erickson Ch. 8'],
      tags: ['shortest paths', 'counterexample'],
      viz(v) {
        const wb = v.slider('weight of b → a', -6, 6, -4, { int: true, onChange: () => { G.edge('b', 'a').w = wb.value; H.edge('b', 'a').w = wb.value; S.reset({ at: 'end' }); } });
        const opts = { x: [0, 10], y: [0, 4.9], axes: false, equal: true, height: 250 };
        const sl = v.stage({ ...opts, title: 'Dijkstra' }), sr = v.stage({ ...opts, title: 'Bellman–Ford' });
        const ch = v.stage({ x: [-6.5, 6.5], y: [-4, 6], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'weight of b → a', ylabel: 'distance to t' });
        const spec = () => ({ directed: true, weights: true, layout: 'none', draggable: false, nodes: nodesAt(P910, { s: { notePos: 'n' }, b: { notePos: 's' }, t: { notePos: 'n' } }), edges: E910.map(([a, b, w]) => [a, b, w]) });
        const G = v.graph(sl, spec()), H = v.graph(sr, spec());
        let run = null, bf = null;
        const S = v.steps({ frames: () => { run = dijkstra(G, 's'); bf = bellmanFord(H, 's'); const F = run.frames; F[F.length - 1] = { ...F[F.length - 1], note: `The heap is empty and Dijkstra stops. Compare its labels with Bellman–Ford's on the right: ${ids(G).some((u) => run.dist[K(u)] !== bf.dist[K(u)]) ? 'the red rings mark wrong distances.' : 'at this weight they agree.'}` }; return F; }, speed: 1.6, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame, done = new Set(f.settled), tree = new Set(Object.values(f.prevEdge).filter(Boolean)), I = ids(G).map(K);
          const wrong = new Set(I.filter((u) => run.dist[u] !== bf.dist[u]));
          G.draw({
            nodeFill: (id) => (f.type === 'extract' && K(id) === f.u ? 'gold' : done.has(K(id)) ? 'accent' : null),
            nodeColor: (id) => (f.dist[K(id)] < INF ? 'orange' : null),
            nodeRing: (id) => (f.type === 'done' && wrong.has(K(id)) ? 'red' : null),
            nodeNote: (id) => fmt(f.dist[K(id)]), noteColor: (id) => (f.type === 'done' && wrong.has(K(id)) ? 'red' : done.has(K(id)) ? 'accent' : 'orange'),
            edgeColor: (e) => (e === f.edge ? (f.type === 'skip' ? 'red' : f.improved ? 'gold' : 'muted') : tree.has(e) ? 'green' : null),
            edgeWidth: (e) => (e === f.edge ? 4.5 : tree.has(e) ? 3.2 : null), edgeDash: (e) => (e === f.edge && f.type === 'skip' ? [6, 4] : null),
          });
          const btree = new Set(Object.values(bf.prevEdge).filter(Boolean));
          H.draw({
            nodeFill: (id) => (K(id) === 's' ? 'accent' : null), nodeColor: () => 'green',
            nodeRing: (id) => (wrong.has(K(id)) ? 'red' : null),
            nodeNote: (id) => fmt(bf.dist[K(id)]), noteColor: () => 'green',
            edgeColor: (e) => (btree.has(e) ? 'green' : null), edgeWidth: (e) => (btree.has(e) ? 3.2 : null),
          });
          // sweep chart
          const e = G.edge('b', 'a'), keep = e.w, xs = [], dj = [], tr = [];
          for (let w = -6; w <= 6; w++) { e.w = w; xs.push(w); dj.push(dijkstra(G, 's', { frames: false }).dist.t); tr.push(bellmanFord(G, 's').dist.t); }
          e.w = keep;
          const all = dj.concat(tr); ch.setView([-6.5, 6.5], [Math.min(...all) - 1, Math.max(...all) + 1.5]);
          xs.forEach((w, k) => { if (dj[k] !== tr[k]) ch.rect(w - 0.5, tr[k], w + 0.5, dj[k], { fill: 'red', fillAlpha: 0.18, stroke: false }); });
          const step = (ys) => { const p = []; xs.forEach((w, k) => { p.push([w - 0.5, ys[k]], [w + 0.5, ys[k]]); }); return p; };
          ch.path(step(tr), { color: 'green', width: 3 });
          ch.path(step(dj), { color: 'orange', width: 2.2, dash: [6, 4] });
          ch.vline(wb.value, { color: 'gold', width: 2 });
        });
        v.legend([['orange', 'Dijkstra’s d[t]', { dash: true }], ['green', 'true δ(s, t) (Bellman–Ford) / its tree'], ['red', 'wrong answer', { area: true }], ['gold', 'current weight / extracted vertex']]);
        v.readout(() => {
          if (!run) return '';
          const I = ids(G).map(K), wrong = I.filter((u) => run.dist[u] !== bf.dist[u]), brute = bruteSP(G, 's').dist;
          const bfOK = I.every((u) => bf.dist[u] === brute[u]);
          return `Dijkstra: ${I.map((u) => `${u} ${fmt(run.dist[u])}`).join(', ')} · Bellman–Ford: ${I.map((u) => `${u} ${fmt(bf.dist[u])}`).join(', ')} (brute force agrees with Bellman–Ford ${bfOK ? '✓' : '✗'}) · ${wrong.length ? `Dijkstra is **wrong at ${wrong.join(', ')}** ✗ — it settled a before seeing the cheaper route through b` : `no error at this weight${wb.value < 0 ? ' (the negative edge is not negative enough to overturn the greedy order)' : ' ✓'}`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.11
    {
      num: '9.11',
      kind: 'Definition',
      name: 'Vertex potentials and reduced costs',
      statement: String.raw`A **potential** is any function $h:V\to\R$. The **reduced cost** (reweighting) of an edge with respect to $h$ is
$$w_h(u,v)=w(u,v)+h(u)-h(v).$$
For every path $P$ from $s$ to $t$, the sum telescopes: $w_h(P)=w(P)+h(s)-h(t)$. So all $s$–$t$ paths shift by the same constant, and **shortest paths are the same** under $w$ and $w_h$. Every cycle keeps its weight, so negative cycles are preserved too. A potential is **feasible** if all reduced costs are nonnegative. If $s$ reaches every vertex and there is no negative cycle, then $h(v)=\delta(s,v)$ is feasible by the triangle inequality $\delta(s,v)\le\delta(s,u)+w(u,v)$, and the edges of a shortest-path tree get reduced cost $0$.`,
      idea: String.raw`In $\sum_i\big(w(v_{i-1},v_i)+h(v_{i-1})-h(v_i)\big)$ every interior potential appears once with each sign, leaving only $h(v_0)-h(v_k)$. A potential therefore changes the edge weights but not the ranking of the paths between any two fixed endpoints. That freedom is used twice in this chapter. Johnson's algorithm (9.14) picks a feasible potential so that Dijkstra can run on a graph with negative edges. A* (9.12) uses a heuristic as a potential, which steers Dijkstra's search toward the goal. Feasible potentials are also exactly the dual solutions of the shortest-path linear program.`,
      caption: String.raw`Each vertex's **height is its potential** $h(v)$: drag any vertex up or down. Edge labels show the reduced costs $w_h$ (switch to the original weights with the selector). Negative ones are red, zeros green. The bar chart lists every $s$–$t$ path, original weight in grey and reduced weight in blue: all bars move together by $h(s)-h(t)$, so the cheapest path (gold) never changes. Press **h = δ(s, ·)** for a feasible potential: no red edge is left, and the shortest-path tree is all zeros.`,
      deps: ['algo-9.1'],
      refs: ['CLRS 4e §23.3', 'Erickson Ch. 9'],
      tags: ['shortest paths', 'potentials'],
      viz(v) {
        const lab = v.select('edge labels', [{ value: 'red', label: 'reduced $w_h$' }, { value: 'orig', label: 'original $w$' }], 'red');
        const s = v.stage({ x: [0, 10.3], y: [-1.5, 12.5], axes: 'box', gutter: true, height: 360, weight: 1.35, ylabel: 'potential h(v)', xticks: [] });
        const ch = v.stage({ x: [0, 10], y: [-5, 25], axes: 'box', gutter: true, height: 360, ylabel: 'path weight', xlabel: 's–t paths (by original weight)', title: 'every $s$–$t$ path: $w$ (grey), $w_h$ (blue)' });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', nodes: Object.keys(X911).map((id) => ({ id, x: X911[id], y: H911[id], notePos: 'e' })), edges: E911.map(([a, b, w]) => [a, b, w]) });
        const delta = bruteSP(G, 's').dist;
        v.button('h = 0', () => G.nodes.forEach((n) => { n.y = 0; }));
        v.button('h = δ(s, ·)', () => G.nodes.forEach((n) => { n.y = delta[K(n.id)]; }));
        v.button('scramble', () => G.nodes.forEach((n) => { n.y = H911[K(n.id)]; }));
        let info = null;
        v.render(() => {
          for (const n of G.nodes) { n.x = X911[K(n.id)]; n.y = clamp(Math.round(n.y * 2) / 2, -1, 12); }
          const h = (id) => G.node(id).y, wh = (e) => W(e) + h(e.from) - h(e.to);
          for (const n of G.nodes) { s.line(n.x, 0, n.x, n.y, { color: 'faint', width: 1.4, dash: [3, 3] }); s.text(`h(${n.id}) = ${fmt(n.y)}`, n.x, -0.8, { align: 'center', size: 11.5, color: 'purple', weight: 600 }); }
          s.hline(0, { color: 'faint', width: 1 });
          const paths = simplePaths(G, 's', 't').sort((a, b) => a.w - b.w), best = paths[0], be = new Set(pathEdges(G, best.nodes));
          G.draw({
            nodeFill: (id) => (K(id) === 's' || K(id) === 't' ? 'accent' : null),
            edgeLabel: (e) => fmt(lab.value === 'red' ? wh(e) : W(e)),
            edgeColor: (e) => (lab.value === 'red' && wh(e) < -1e-9 ? 'red' : be.has(e) ? 'gold' : lab.value === 'red' && near(wh(e), 0) ? 'green' : null),
            edgeWidth: (e) => (be.has(e) ? 4 : null),
          });
          // path bars
          const shift = h('s') - h('t'), ys = paths.flatMap((p) => [p.w, p.w + shift]);
          const lo = Math.min(0, ...ys), hi = Math.max(0, ...ys);
          ch.setView([0.3, paths.length + 0.7], [lo - 0.1 * (hi - lo + 1), hi + 0.18 * (hi - lo + 1)]);
          ch.setTicks(paths.map((_, k) => k + 1), null);
          ch.hline(0, { color: 'faint', width: 1 });
          paths.forEach((p, k) => {
            const x = k + 1, isB = k === 0;
            ch.rect(x - 0.36, Math.min(0, p.w), x - 0.02, Math.max(0, p.w), { fill: 'muted', fillAlpha: 0.25, color: isB ? 'gold' : 'muted', width: isB ? 2.4 : 1 });
            ch.rect(x + 0.02, Math.min(0, p.w + shift), x + 0.36, Math.max(0, p.w + shift), { fill: 'accent', fillAlpha: 0.55, color: isB ? 'gold' : 'accent', width: isB ? 2.4 : 1 });
          });
          ch.corner(`every bar shifts by h(s) − h(t) = ${fmt(shift)}`, 'tr', { color: 'purple', weight: 600, plate: true });
          info = { paths, shift, wh, h };
        });
        v.legend([['purple', 'potential h (height)'], ['red', 'negative reduced cost'], ['green', 'reduced cost 0'], ['gold', 'a shortest s–t path']]);
        v.readout(() => {
          if (!info) return '';
          const { paths, shift, wh, h } = info;
          const sameShift = paths.every((p) => near(pathW({ adj: (u) => G.adj(u).map((a) => ({ ...a, w: wh(a.edge) })) }, p.nodes), p.w + shift));
          const minW = paths[0].w, minR = Math.min(...paths.map((p) => p.w + shift));
          const sameArg = paths.every((p) => (p.w === minW) === near(p.w + shift, minR));
          const negs = G.edges.filter((e) => wh(e) < -1e-9).length, C = ['a', 'b', 'c', 'd'], cw = cycleW(G, C), cr = C.reduce((t, x, k) => t + wh(G.edge(x, C[(k + 1) % 4])), 0);
          const zeros = G.edges.filter((e) => near(wh(e), 0)).length;
          return `all ${paths.length} $s$–$t$ paths shift by exactly $h(s) - h(t) = ${tnum(shift)}$ ${sameShift ? '✓' : '✗'} · the shortest path is the same under $w$ and $w_h$ (${paths[0].nodes.join('→')}) ${sameArg ? '✓' : '✗'} · cycle a→b→c→d→a: $w = ${tnum(cw)}$, $w_h = ${tnum(cr)}$ ${near(cw, cr) ? '✓' : '✗'} · ${negs ? `${plural(negs, 'edge')} with negative reduced cost: $h$ is not feasible` : `no negative reduced cost: $h$ is **feasible** ✓${zeros >= 5 && G.nodes.every((n) => near(h(n.id), delta[K(n.id)])) ? ' (h = δ: the tree edges cost 0)' : ''}`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.12
    {
      num: '9.12',
      kind: 'Algorithm',
      name: 'A* search with a consistent heuristic',
      statement: String.raw`**Input:** a graph with nonnegative weights, a source $s$, a target $t$, and a **heuristic** $h:V\to\R_{\ge0}$ estimating the remaining distance to $t$. $A^*$ is Dijkstra's algorithm that orders the queue by $f(v)=g(v)+h(v)$ instead of $g(v)$, where $g(v)$ is the best known distance from $s$, and stops when $t$ is extracted.

Call $h$ **consistent** if $h(t)=0$ and $h(u)\le w(u,v)+h(v)$ for every edge. Equivalently, the reduced costs $w(u,v)-h(u)+h(v)$ (the potential $-h$ in 9.11) are all nonnegative. Then $A^*$ is exactly Dijkstra's algorithm on the reduced costs, so it returns a shortest $s$–$t$ path and never needs to reopen a closed vertex. It expands only vertices with $\delta(s,v)+h(v)\le\delta(s,t)$, never more than Dijkstra. On a road map, straight-line distance to $t$ is consistent whenever each road is at least as long as the straight line.`,
      idea: String.raw`With reduced costs $\hat w(u,v)=w(u,v)-h(u)+h(v)$, an $s$–$v$ path weighs $\hat w(P)=w(P)-h(s)+h(v)$ (9.11). So Dijkstra on $\hat w$ extracts vertices in order of $g(v)+h(v)$, up to the constant $h(s)$, which is $A^*$'s order. Consistency is precisely $\hat w\ge0$, the hypothesis of Dijkstra's correctness (9.9). A good heuristic makes $\hat w$ small along edges that head toward $t$ and large along edges that head away, so the search runs along the goal direction. With $h\equiv0$ it is plain Dijkstra. Scaling $h$ by $\alpha>1$ breaks consistency, and the path found may no longer be shortest.`,
      caption: String.raw`A road map: each road's weight is its length rounded up, and $h(v)$ is the straight-line distance from $v$ to $t$, scaled by the **slider** $\alpha$. Step through $A^*$: filled vertices are closed, orange-ringed ones open, with their $f=g+h$. The faint dashed lines are the heuristic's straight-line guesses from the open vertices to $t$. At the end, purple rings mark the vertices Dijkstra would also have expanded. Show the **reduced costs** $w-\alpha|h(u)-h(v)|$: they are all $\ge0$ for $\alpha\le1$. Push $\alpha$ to 3: red edges appear, and $A^*$ returns a longer path. **Drag nodes** to reshape the map.`,
      deps: ['algo-9.11', 'algo-9.9'],
      refs: ['Erickson Ch. 9'],
      tags: ['shortest paths', 'search', 'heuristics'],
      credit: 'Hart, Nilsson & Raphael, 1968',
      viz(v) {
        const al = v.slider('heuristic weight α', 0, 3, 1, { step: 0.25, onChange: () => S.reset({ at: 'end' }) });
        const lab = v.select('edge labels', [{ value: 'w', label: 'road length w' }, { value: 'red', label: 'reduced cost' }], 'w');
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 360 });
        const G = v.graph(s, { weights: true, layout: 'none', r: 12, nodes: nodesAt(P912, { s: { notePos: 'w' }, t: { notePos: 's' }, b: { notePos: 's' }, e: { notePos: 's' }, h: { notePos: 's' } }), edges: E912.map(([a, b]) => [a, b, 1]) });
        const reweigh = () => { for (const e of G.edges) { const A = G.node(e.from), B = G.node(e.to); e.w = Math.ceil(Math.hypot(A.x - B.x, A.y - B.y) * 10) / 10; } };
        reweigh();
        const hT = (id) => { const n = G.node(id), T = G.node('t'); return Math.hypot(n.x - T.x, n.y - T.y); };
        let run = null, dj = null;
        const frames = () => { const a = al.value; run = astar(G, 's', 't', (x) => a * hT(x)); dj = astar(G, 's', 't', () => 0); return run.frames; };
        const S = v.steps({ frames, code: ASTAR_CODE, codeTitle: 'A*(G, s, t, h)', codePos: 'below', speed: 2.5, start: 'end', still: 'end' });
        G.onChange = (k) => { if (k === 'move') { reweigh(); S.reset({ at: 'end' }); } };
        v.render(() => {
          const f = S.frame, a = al.value, closed = new Set(f.closed), open = new Set(f.open), T = G.node('t');
          const path = f.end && run.found ? predPath(run.prev, 't', G.nodes.length) : [], pe = new Set(pathEdges(G, path));
          const red = (e) => W(e) - a * Math.abs(hT(e.from) - hT(e.to));
          if (a > 0) for (const x of open) { const n = G.node(x); s.line(n.x, n.y, T.x, T.y, { color: 'purple', width: 1, dash: [3, 4], alpha: 0.55 }); }
          const djOnly = f.end ? new Set(dj.closed.filter((x) => !closed.has(x))) : new Set();
          G.draw({
            nodeFill: (id) => (K(id) === f.u ? 'gold' : closed.has(K(id)) ? 'accent' : null),
            nodeColor: (id) => (open.has(K(id)) ? 'orange' : null),
            nodeRing: (id) => (K(id) === 't' ? 'red' : djOnly.has(K(id)) ? 'purple' : open.has(K(id)) ? 'orange' : null),
            nodeNote: (id) => (open.has(K(id)) ? `f ${fmt(f.g[K(id)] + a * hT(id))}` : closed.has(K(id)) ? fmt(f.g[K(id)]) : null),
            noteColor: (id) => (open.has(K(id)) ? 'orange' : 'accent'),
            edgeLabel: (e) => fmt(lab.value === 'w' ? W(e) : red(e)),
            edgeColor: (e) => (pe.has(e) ? 'green' : e === f.edge ? 'gold' : lab.value === 'red' && red(e) < -1e-9 ? 'red' : null),
            edgeWidth: (e) => (pe.has(e) ? 4.5 : e === f.edge ? 4 : null),
          });
        });
        v.legend([['accent', 'closed (g final)', { dot: true }], ['orange', 'open, with f = g + h', { dot: true }], ['purple', 'h: straight line to t / Dijkstra-only expansions'], ['green', 'path found'], ['red', 'target ring / negative reduced cost']]);
        v.readout(() => {
          if (!run) return '';
          const a = al.value, opt = dj.g.t, I = ids(G).map(K);
          const toT = dijkstra(G, 't', { frames: false }).dist;
          const cons = G.edges.filter((e) => W(e) - a * Math.abs(hT(e.from) - hT(e.to)) < -1e-9).length, adm = I.every((x) => a * hT(x) <= toT[x] + 1e-9);
          const okCost = near(run.g.t, opt);
          return `α = ${fmt(a)}: ${cons ? `**${plural(cons, 'edge')}** with negative reduced cost — not consistent` : 'all reduced costs ≥ 0 — consistent ✓'}${adm ? ', admissible' : ', not even admissible'} · A* expanded **${run.closed.length}** vertices, Dijkstra ${dj.closed.length} · A* path cost ${fmt(run.g.t)}, shortest ${fmt(opt)} ${okCost ? '✓' : `✗ (${fmt(run.g.t - opt)} too long)`}${cons && okCost ? ' — no guarantee here, it happened to be optimal' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.13
    {
      num: '9.13',
      kind: 'Algorithm',
      name: 'Floyd–Warshall',
      statement: String.raw`Number the vertices $1,\dots,n$ and let $D^{(k)}[i][j]$ be the least weight of a path from $i$ to $j$ whose **intermediate** vertices all lie in $\{1,\dots,k\}$. Then $D^{(0)}$ is the weight matrix ($0$ on the diagonal, $\infty$ where there is no edge), and
$$D^{(k)}[i][j]=\min\big\{D^{(k-1)}[i][j],\ D^{(k-1)}[i][k]+D^{(k-1)}[k][j]\big\}.$$
If there is no negative cycle, $D^{(n)}[i][j]=\delta(i,j)$ for all pairs. The update can be done in place in one $n\times n$ array: $\Theta(n^3)$ time and $\Theta(n^2)$ space. A negative cycle exists if and only if some diagonal entry ends up negative. Recording, for each improved cell, the $k$ that improved it lets every shortest path be reconstructed.`,
      idea: String.raw`Consider a shortest $i$–$j$ path with intermediates in $\{1,\dots,k\}$. Either it avoids vertex $k$, and costs $D^{(k-1)}[i][j]$, or it passes through $k$ once (a cycle through $k$ would not help). In the second case it splits at $k$ into two paths with intermediates in $\{1,\dots,k-1\}$, each shortest by 9.2. Unlike Bellman–Ford, which grows the number of edges, this dynamic program (7.2) grows the set of allowed intermediate vertices. In phase $k$ the row and column of $k$ do not change (in the absence of negative cycles), which is why one array suffices.`,
      caption: String.raw`The matrix $D^{(k)}$ is filled one phase at a time: step through $k=0,\dots,5$. Cells that just improved are orange, and the shaded cross is row $k$ and column $k$, the only entries the update reads. **Click any cell** $(i,j)$: the graph shows its current best path, using only the allowed intermediate vertices (green rings), and the readout shows the comparison $D[i][k]+D[k][j]$ versus $D[i][j]$ for this phase. **Click weights** to edit them; a negative diagonal entry announces a negative cycle.`,
      deps: ['algo-9.2', 'algo-7.2'],
      refs: ['CLRS 4e §23.2', 'Erickson Ch. 9'],
      tags: ['shortest paths', 'dynamic programming', 'all pairs'],
      credit: 'Roy 1959; Floyd 1962; Warshall 1962',
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6.2], axes: false, equal: true, height: 300, weight: 1 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1 });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', editable: { editWeight: true, minWeight: -9, maxWeight: 12 }, nodes: nodesAt(P913, { 1: { notePos: 'n' }, 3: { notePos: 's' }, 4: { notePos: 's' } }), edges: E913.map(([a, b, w]) => [a, b, w]) });
        let run = null, sel = [4, 2];
        const frames = () => { run = floydWarshall(G); return run.mats.map((D, k) => ({ k, line: k ? [2, 5] : 1, note: k ? `Phase $k = ${k}$: vertex ${run.I[k - 1]} may now be an intermediate. ${plural(run.changed[k].size, 'cell')} improve${run.changed[k].size === 1 ? 's' : ''}.` : 'Phase 0: $D^{(0)}$ holds the edge weights — paths with no intermediate vertex.' })); };
        const S = v.steps({ frames, code: FW_CODE, codeTitle: 'Floyd–Warshall(W)', codePos: 'below', speed: 0.9, start: 2, still: 2, counter: 'phase' });
        G.onChange = () => S.reset({ at: 'keep' });
        const T = v.table(ts, { rows: 5, cols: 5, maxCell: 50, size: 15, rowLabels: (i) => `${i + 1}`, colLabels: (j) => `${j + 1}`, cornerLabel: 'i \\ j' });
        ts.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        v.render(() => {
          const k = S.frame.k, D = run.mats[k], n = run.n, ch = run.changed[k], I = run.I;
          const [i, j] = sel, P = fwPath(run.vias[k], D, i, j), pv = P ? P.map((x) => I[x]) : [], pe = new Set(pathEdges(G, pv));
          const allowed = new Set(I.slice(0, k));
          G.draw({
            nodeFill: (id) => (K(id) === I[i] || K(id) === I[j] ? 'accent' : null),
            nodeRing: (id) => (allowed.has(K(id)) ? 'green' : null),
            nodeColor: (id) => (K(id) === I[k - 1] ? 'gold' : null),
            dim: I.filter((x) => !allowed.has(x) && x !== I[i] && x !== I[j]),
            edgeColor: (e) => (pe.has(e) ? 'green' : null), edgeWidth: (e) => (pe.has(e) ? 4.5 : null),
          });
          T.draw({
            value: (a, b) => D[a][b],
            fill: (a, b) => (a === b && D[a][b] < 0 ? ['red', 0.45] : ch.has(a * n + b) ? ['orange', 0.4] : null),
            activeRow: k ? k - 1 : null, activeCol: k ? k - 1 : null, activeColor: 'gold',
            highlight: [[i, j, 'accent']],
          });
        });
        v.legend([['orange', 'improved in this phase', { area: true }], ['gold', 'row and column k (the cross)', { area: true }], ['green', 'allowed intermediates (rings) / chosen path'], ['accent', 'selected pair']]);
        v.readout(() => {
          if (!run) return '';
          const k = S.frame.k, I = run.I, [i, j] = sel, D = run.mats[k], Dp = run.mats[Math.max(0, k - 1)];
          const P = fwPath(run.vias[k], D, i, j);
          const cmp = k ? `$D^{(${k})}[${I[i]}][${I[j]}] = \\min\\{${tnum(Dp[i][j])},\\ ${tnum(Dp[i][k - 1])} + ${tnum(Dp[k - 1][j])}\\} = ${tnum(D[i][j])}$` : `$D^{(0)}[${I[i]}][${I[j]}] = ${tnum(D[i][j])}$`;
          const B = allPairsBrute(G), Dn = run.mats[run.n], neg = Dn.some((r, a) => r[a] < 0), bneg = B.D.some((r) => r.some((x) => x === -INF));
          const ok = neg ? bneg : B.D.every((r, a) => r.every((x, b) => x === Dn[a][b]));
          return `${cmp}${P ? ` along ${P.map((x) => I[x]).join('→')}` : ''} · intermediates allowed: {${I.slice(0, k).join(', ') || '∅'}} · ${neg ? `negative diagonal entry in $D^{(n)}$: a negative cycle — brute force agrees ${ok ? '✓' : '✗'}` : `final $D^{(${run.n})}$ equals brute force over all simple paths for all ${run.n ** 2} pairs ${ok ? '✓' : '✗'}`} · ${run.n}³ = ${run.n ** 3} updates`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.14
    {
      num: '9.14',
      kind: 'Algorithm',
      name: 'Johnson’s algorithm',
      statement: String.raw`**Input:** a directed graph with possibly negative weights. **Algorithm:** add a new vertex $q$ with an edge $q\to v$ of weight $0$ to every vertex, and run Bellman–Ford from $q$. If it reports a negative cycle, stop. Otherwise set $h(v)=\delta(q,v)$ and reweight $w_h(u,v)=w(u,v)+h(u)-h(v)\ge0$. Run Dijkstra from every vertex $u$ under $w_h$, and recover $\delta(u,v)=\delta_h(u,v)-h(u)+h(v)$. **Running time:** $O(nm)$ for Bellman–Ford plus $n$ Dijkstra runs, $O(nm\log n)$ with binary heaps or $O(nm+n^2\log n)$ with Fibonacci heaps. On sparse graphs that beats Floyd–Warshall's $\Theta(n^3)$.`,
      idea: String.raw`Reweighting by any potential preserves shortest paths (9.11), so the only question is how to find a potential with all $w_h\ge0$. Distances from a single vertex are such a potential, by the triangle inequality, and the extra vertex $q$ reaches everything with zero-weight edges, so $h(v)=\delta(q,v)\le0$ is defined everywhere. Bellman–Ford (9.7) computes it, or finds a negative cycle, in which case there is nothing to compute. After that, the graph has nonnegative weights and Dijkstra (9.9) is correct from every source.`,
      caption: String.raw`Step through the four phases. Add the vertex q (dashed zero edges). Bellman–Ford from q gives the potentials $h$, written beside each vertex and drawn as purple bars under the table. Reweighting turns every edge label nonnegative: green zeros mark tight edges. Then one Dijkstra run per source fills one row of the table, the green tree showing the current run. **Click weights** to edit them. A negative cycle stops the algorithm at phase 2. The readout compares the table with Floyd–Warshall.`,
      deps: ['algo-9.11', 'algo-9.7', 'algo-9.8'],
      refs: ['CLRS 4e §23.3', 'Erickson Ch. 9'],
      tags: ['shortest paths', 'all pairs', 'potentials'],
      credit: 'Johnson, 1977',
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6.1], axes: false, equal: true, height: 340, weight: 1.15 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.85 });
        const V = ['a', 'b', 'c', 'd', 'e'];
        const nodes = nodesAt(P914, { a: { notePos: 'w' }, b: { notePos: 'n' }, c: { notePos: 'n' }, d: { notePos: 'n' }, e: { notePos: 's' }, q: { notePos: 'e', hidden: true } });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', draggable: false, editable: { editWeight: true, minWeight: -9, maxWeight: 12 }, nodes, edges: E914.map(([a, b, w]) => [a, b, w]).concat(V.map((x) => ['q', x, { w: 0, dash: [4, 4] }])) });
        G.onClick = ({ edge }) => (edge && K(edge.from) === 'q');
        let run = null;
        const frames = () => {
          const base = G.edges.filter((e) => K(e.from) !== 'q').map((e) => ({ from: K(e.from), to: K(e.to), w: W(e), edge: e }));
          const withQ = fakeGraph(V.concat(['q']), base.concat(V.map((x) => ({ from: 'q', to: x, w: 0 }))));
          const bf = bellmanFord(withQ, 'q'), F = [];
          F.push({ ph: 0, line: [], note: 'Some weights are negative, so Dijkstra cannot be run directly.' });
          F.push({ ph: 1, line: 1, note: 'Add a vertex q with a zero-weight edge to every vertex: q reaches everything, and no new cycle appears.' });
          if (bf.cycle) { F.push({ ph: 2, cycle: bf.cycle, line: 2, note: `Bellman–Ford from q finds a negative cycle ${bf.cycle.join(' → ')} → ${bf.cycle[0]}: shortest paths are undefined, stop.` }); run = { bf, F, cycle: bf.cycle }; return F; }
          const h = bf.dist, wh = (e) => W(e) + h[K(e.from)] - h[K(e.to)];
          F.push({ ph: 2, line: 2, note: `Bellman–Ford from q: $h = (${V.map((x) => tnum(h[x])).join(', ')})$ for ${V.join(', ')}. Each $h(v) \\le 0$.` });
          F.push({ ph: 3, line: 3, note: `Reweight every edge: $w_h = w + h(u) - h(v)$. All ${base.length} new weights are $\\ge 0$, so Dijkstra is safe.` });
          const red = fakeGraph(V, base.map((a) => ({ ...a, w: a.w + h[a.from] - h[a.to] })));
          const rows = {};
          for (const u of V) {
            const r = dijkstra(red, u, { frames: false });
            rows[u] = V.map((x) => (r.dist[x] === INF ? INF : r.dist[x] - h[u] + h[x]));
            const treeArcs = Object.values(r.prevEdge).filter(Boolean).map((a) => a.edge);
            F.push({ ph: 4, u, tree: new Set(treeArcs), rows: { ...rows }, line: [4, 5], note: `Dijkstra from ${u} under $w_h$, then shift back: row ${u} = ${rows[u].map(fmt).join(', ')}.` });
          }
          F.push({ ph: 5, rows: { ...rows }, line: [], note: `Done: one Bellman–Ford and ${V.length} Dijkstra runs give all ${V.length ** 2} distances.` });
          run = { bf, F, h, wh, rows };
          return F;
        };
        const S = v.steps({ frames, code: JOHNSON_CODE, codeTitle: 'Johnson(G)', codePos: 'below', speed: 0.8, start: 'end', still: 5 });
        G.onChange = () => S.reset({ at: 'keep' });
        const T = v.table(ts, { rows: 5, cols: 5, maxCell: 40, size: 14, rowLabels: (i) => V[i], colLabels: (j) => V[j], cornerLabel: 'u \\ v', region: [0, 0.42, 1, 1] });
        v.render(() => {
          const f = S.frame, ph = f.ph ?? 0;
          G.node('q').hidden = ph < 1;
          const cyc = f.cycle ? new Set(pathEdges(G, f.cycle.concat([f.cycle[0]]))) : new Set();
          const showH = ph >= 2 && run.h, showWh = ph >= 3 && run.wh;
          G.draw({
            nodeFill: (id) => (K(id) === f.u ? 'gold' : K(id) === 'q' ? 'muted' : null),
            nodeColor: (id) => (f.cycle && f.cycle.includes(K(id)) ? 'red' : null),
            nodeNote: (id) => (showH && K(id) !== 'q' ? `h ${fmt(run.h[K(id)])}` : null), noteColor: () => 'purple',
            edgeLabel: (e) => (K(e.from) === 'q' ? (ph >= 3 ? null : '0') : fmt(showWh ? run.wh(e) : W(e))),
            edgeColor: (e) => (cyc.has(e) ? 'red' : f.tree && f.tree.has(e) ? 'green' : K(e.from) === 'q' ? (ph >= 3 ? 'faint' : 'purple') : showWh && near(run.wh(e), 0) ? 'green' : !showWh && W(e) < 0 ? 'red' : null),
            edgeWidth: (e) => (cyc.has(e) ? 5 : f.tree && f.tree.has(e) ? 4 : null),
            edgeLabelColor: (e) => (showWh && near(run.wh(e), 0) ? 'green' : !showWh && W(e) < 0 && K(e.from) !== 'q' ? 'red' : null),
          });
          T.draw({
            value: (i, j) => (f.rows && f.rows[V[i]] ? f.rows[V[i]][j] : null),
            fill: (i, j) => (f.u === V[i] ? ['gold', 0.3] : null),
          });
          // the potentials as bars hanging below a zero line
          const Wd = ts.width, Ht = ts.height, Y0 = Ht - 90, bw = Math.min(46, (Wd - 120) / V.length), X0 = (Wd - V.length * bw) / 2;
          TX(ts, showH ? 'potentials h(v) = δ(q, v)' : 'potentials: after Bellman–Ford', Wd / 2, Y0 - 34, { align: 'center', size: 12, weight: 600, color: 'muted' });
          R(ts, X0 - 10, Y0, X0 + V.length * bw + 10, Y0 + 1.2, { fill: 'ink', fillAlpha: 0.6, stroke: false });
          V.forEach((x, k) => {
            const X = X0 + k * bw + bw / 2, hv = showH ? run.h[x] : 0, len = -hv * 16;
            if (len > 0) R(ts, X - bw * 0.3, Y0, X + bw * 0.3, Y0 + len, { fill: 'purple', fillAlpha: 0.55, color: 'purple', width: 1.2, radius: 2 });
            TX(ts, x, X, Y0 - 3, { align: 'center', baseline: 'bottom', size: 11.5, weight: 600, color: 'ink' });
            if (showH) TX(ts, fmt(hv), X, Y0 + len + 9, { align: 'center', size: 11, weight: 700, color: 'purple' });
          });
        });
        v.legend([['purple', 'zero edges from q / potentials h'], ['red', 'negative weight / negative cycle'], ['green', 'reduced weight 0 / current Dijkstra tree'], ['gold', 'current source', { dot: true }]]);
        v.readout(() => {
          if (!run) return '';
          const f = S.frame;
          if (run.cycle) return `negative cycle ${run.cycle.join(' → ')} → ${run.cycle[0]} of weight ${fmt(cycleW(G, run.cycle))} — brute force finds ${plural(simpleCycles(G).filter((c) => c.w < 0).length, 'negative cycle')} ✓; Johnson stops after Bellman–Ford`;
          const base = G.edges.filter((e) => K(e.from) !== 'q'), nonneg = base.every((e) => run.wh(e) >= -1e-9);
          const sub = fakeGraph(V, base.map((e) => ({ from: K(e.from), to: K(e.to), w: W(e) }))), FW = floydWarshall(sub), Dn = FW.mats[FW.n];
          const done = Object.keys(run.rows).length === V.length, ok = done && V.every((u, i) => V.every((x, j) => run.rows[u][j] === Dn[i][j]));
          return `potentials $h$ = ${V.map((x) => `${x} ${fmt(run.h[x])}`).join(', ')} · every reweighted edge $w_h \\ge 0$ ${nonneg ? '✓' : '✗'} · ${(f.ph ?? 0) >= 4 ? `${Object.keys(f.rows).length} of ${V.length} Dijkstra runs shown` : 'step on to the Dijkstra runs'} · the complete table equals Floyd–Warshall's ${ok ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.15
    {
      num: '9.15',
      kind: 'Algorithm',
      name: 'Difference constraints via Bellman–Ford',
      statement: String.raw`A system of **difference constraints** is a set of inequalities $x_j-x_i\le c_{ij}$ on real unknowns $x_1,\dots,x_n$. Build the **constraint graph**: a vertex for each unknown, an edge $i\to j$ of weight $c_{ij}$ for each constraint, and a source $v_0$ with an edge of weight $0$ to every vertex. Then:
(a) if the graph has no negative cycle, $x_i=\delta(v_0,i)$ satisfies every constraint;
(b) if it has a negative cycle, the system has no solution.
So Bellman–Ford decides feasibility and finds a solution in $O(nm)$ time. Solutions are closed under adding a constant to every $x_i$, and the one returned has $\max_i x_i\le0$.`,
      idea: String.raw`(a) is the triangle inequality: for every edge, $\delta(v_0,j)\le\delta(v_0,i)+c_{ij}$, which is exactly the constraint. (b) Along a cycle $i_1\to i_2\to\cdots\to i_1$, add up the corresponding constraints. The left-hand sides telescope to $0$, so any solution would satisfy $0\le w(C)$. A negative cycle is therefore a short, checkable proof of infeasibility. Scheduling with "at least / at most this long after" rules, and layout and timing analysis, reduce to this.`,
      caption: String.raw`Type constraints of the form x2 - x1 <= 3, separated by commas; the **slider** sets one more, $x_1-x_5\le c$. Left: the constraint graph, with $v_0$ and its dashed zero edges. Right: one row per constraint, with the solution from Bellman–Ford drawn as points on the number line below. Each arrow runs from $x_i$ to $x_j$; green rows hold with equality (they are shortest-path tree edges). Lower $c$ below 1 and a negative cycle appears in red: adding its constraints gives $0\le$ a negative number, and the readout shows the sum.`,
      deps: ['algo-9.7'],
      refs: ['CLRS 4e §22.4'],
      tags: ['shortest paths', 'constraints'],
      viz(v) {
        const inp = v.input('constraints', C915, { width: 560 });
        const cS = v.slider('c in  x1 − x5 ≤ c', -6, 8, 4, { int: true });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 340, weight: 1 });
        const ns = v.stage({ x: [-6, 2], y: [-1.6, 8.6], axes: 'box', gutter: { l: 104, b: 46, t: 10, r: 14 }, height: 340, weight: 1.15, xlabel: 'value' });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', draggable: false, r: 14 });
        let info = null, lastKey = '';
        v.render(() => {
          const P = parseConstraints(inp.value), list = P.list.concat([{ j: 'x1', i: 'x5', c: cS.value, slider: true }]);
          const vars = [...new Set(list.flatMap((c) => [c.i, c.j]))].sort();
          const key = JSON.stringify(list);
          if (key !== lastKey) {
            lastKey = key;
            const nodes = [{ id: 'v0', x: 0.9, y: 3.0, notePos: 's' }].concat(vars.map((x, k) => { const a = Math.PI / 2 - (2 * Math.PI * k) / vars.length; return { id: x, x: 6.1 + 2.6 * Math.cos(a), y: 3.0 + 2.6 * Math.sin(a), notePos: Math.sin(a) < -0.3 ? 's' : 'n' }; }));
            const edges = list.map((c) => [c.i, c.j, { w: c.c, con: c }]).concat(vars.map((x) => ['v0', x, { w: 0, dash: [4, 4], zero: true }]));
            G.set({ nodes, edges });
          }
          const bf = bellmanFord(G, 'v0'), cyc = bf.cycle ? new Set(pathEdges(G, bf.cycle.concat([bf.cycle[0]]))) : new Set(), x = bf.dist;
          const tight = (e) => !bf.cycle && near(x[K(e.from)] + W(e), x[K(e.to)]);
          G.draw({
            nodeFill: (id) => (K(id) === 'v0' ? 'muted' : null),
            nodeColor: (id) => (bf.cycle && bf.cycle.includes(K(id)) ? 'red' : K(id) === 'v0' ? null : 'accent'),
            nodeNote: (id) => (bf.cycle || K(id) === 'v0' ? null : fmt(x[K(id)])), noteColor: () => 'accent',
            edgeLabel: (e) => (e.zero ? null : fmt(W(e))),
            edgeColor: (e) => (cyc.has(e) ? 'red' : e.zero ? 'faint' : tight(e) ? 'green' : null),
            edgeWidth: (e) => (cyc.has(e) ? 4.5 : e.zero ? 1.4 : tight(e) ? 3 : null),
          });
          // constraint rows over the number line
          const m = list.length;
          if (!bf.cycle) {
            const vals = vars.map((y) => x[y]), lo = Math.min(...vals) - 0.8, hi = Math.max(...vals) + 0.8;
            ns.setView([lo, hi], [-1.6, m + 0.4]);
            ns.setTicks(null, list.map((c, k) => [m - k, `${c.j} − ${c.i} ≤ ${fmt(c.c)}`]));
            ns.hline(-0.6, { color: 'ink', width: 1.4 });
            const groups = new Map(); vars.forEach((y) => { const k = fmt(x[y]); groups.set(k, (groups.get(k) || []).concat([y])); });
            for (const g of groups.values()) { const xv = x[g[0]]; ns.vline(xv, { color: 'faint', width: 1, dash: [2, 4] }); ns.dot(xv, -0.6, { r: 5, color: 'accent' }); ns.text(g.join(', '), xv, -0.6, { dy: 14, align: 'center', baseline: 'top', size: 12, color: 'accent', weight: 600 }); }
            list.forEach((c, k) => {
              const a = x[c.i], b = x[c.j], yy = m - k, ok = b - a <= c.c + 1e-9, tg = near(b - a, c.c), col = !ok ? 'red' : tg ? 'green' : 'accent';
              if (Math.abs(b - a) > 1e-9) ns.arrow(a, yy, b, yy, { color: col, width: 2.2, head: 7 }); else ns.dot(a, yy, { r: 4, color: col });
              ns.text(`= ${fmt(b - a)}`, Math.max(a, b), yy, { dx: 8, size: 11, color: col, align: 'left' });
            });
          } else {
            ns.setView([0, 10], [-1.6, m + 0.4]); ns.setTicks([], list.map((c, k) => [m - k, `${c.j} − ${c.i} ≤ ${fmt(c.c)}`]));
            const C = bf.cycle, cons = C.map((u, k) => list.find((c) => c.i === u && c.j === C[(k + 1) % C.length]));
            const inC = new Set(cons);
            list.forEach((c, k) => { if (inC.has(c)) ns.rect(0.2, m - k - 0.4, 9.8, m - k + 0.4, { fill: 'red', fillAlpha: 0.15, color: 'red', width: 1 }); });
            ns.text('red rows add up to 0 ≤ ' + fmt(cycleW(G, C)), 5, -0.7, { align: 'center', size: 13, color: 'red', weight: 700 });
          }
          info = { list, bf, vars, P };
        });
        v.legend([['accent', 'value x_i / constraint with slack'], ['green', 'tight constraint (tree edge)'], ['red', 'negative cycle: infeasible']]);
        v.readout(() => {
          if (!info) return '';
          const { list, bf, vars, P } = info, x = bf.dist;
          const bad = P.bad.length ? ` · ignored: ${P.bad.map((b) => `“${b}”`).join(', ')} (write xj - xi <= c)` : '';
          if (bf.cycle) {
            const C = bf.cycle, sum = cycleW(G, C), neg = simpleCycles(G).filter((c) => c.w < 0).length;
            const terms = C.map((u, k) => `(${C[(k + 1) % C.length]} − ${u})`).join(' + ');
            return `**infeasible**: ${terms} = 0, yet the same constraints add up to ≤ ${fmt(sum)} < 0 · brute force over simple cycles finds ${plural(neg, 'negative cycle')} ${neg ? '✓' : '✗'}${bad}`;
          }
          const ok = list.every((c) => x[c.j] - x[c.i] <= c.c + 1e-9);
          return `feasible: ${vars.map((y) => `$${y.replace(/(\d)/, '_$1')} = ${tnum(x[y])}$`).join(', ')} · all ${list.length} constraints checked directly ${ok ? '✓' : '✗'} · ${list.filter((c) => near(x[c.j] - x[c.i], c.c)).length} hold with equality · max $x_i$ = ${fmt(Math.max(...vars.map((y) => x[y])))} ≤ 0${bad}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.16
    {
      num: '9.16',
      kind: 'Algorithm',
      name: 'All-pairs shortest paths by min-plus matrix squaring',
      statement: String.raw`Define the **min-plus product** of $n\times n$ matrices by $(A\otimes B)[i][j]=\min_k\big(A[i][k]+B[k][j]\big)$: ordinary matrix multiplication with $(+,\times)$ replaced by $(\min,+)$. It is associative. Let $W$ be the weight matrix with $0$ on the diagonal. Then $W^{\otimes m}[i][j]$ is the least weight of an $i$–$j$ walk with **at most $m$ edges**. If there is no negative cycle, $W^{\otimes m}=W^{\otimes(n-1)}$ for all $m\ge n-1$. So repeated squaring, $W, W^{\otimes2}, W^{\otimes4},\dots$, reaches all-pairs distances after $\lceil\log_2(n-1)\rceil$ products: $\Theta(n^3\log n)$ time, against $\Theta(n^4)$ for multiplying by $W$ one step at a time.`,
      idea: String.raw`A walk of at most $a+b$ edges splits at its $a$-th vertex (or ends earlier) into a walk of at most $a$ edges and one of at most $b$. The best one is the best split over all middle vertices $k$, which is $(W^{\otimes a}\otimes W^{\otimes b})[i][j]$. The diagonal zeros let shorter walks count as well. Squaring doubles the edge budget, so this is exponentiation by repeated squaring (2.12) in the min-plus semiring, applied to the edge-budget dynamic program of Bellman–Ford (9.6). Fast matrix multiplication does not carry over, because $\min$ has no inverse; whether all-pairs shortest paths can be solved in truly subcubic time is a central open question of fine-grained complexity.`,
      caption: String.raw`Step through the squarings $W, W^{\otimes2}, W^{\otimes4}, W^{\otimes8}$. The right table is the new power and the left one the previous power it was squared from; orange cells changed. **Click a cell** of the right table: the left table shades row $i$ and column $j$ and outlines the best pair $(i,k)$, $(k,j)$. The graph shows the lightest walk using at most $m$ edges. A long chain of cheap edges forces long paths, and the table stops changing after $\lceil\log_2 5\rceil=3$ squarings. **Click weights** to edit them.`,
      deps: ['algo-9.2', 'algo-7.2', 'algo-2.12'],
      refs: ['CLRS 4e §23.1', 'Erickson Ch. 9'],
      tags: ['shortest paths', 'matrices', 'all pairs'],
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 290, weight: 0.85 });
        const ts = v.stage({ x: [0, 2], y: [0, 1], axes: false, height: 290, weight: 1.5 });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', editable: { editWeight: true, minWeight: -3, maxWeight: 12 }, nodes: nodesAt(P916), edges: E916.map(([a, b, w]) => [a, b, w]) });
        const I = ids(G).map(K), n = I.length;
        let run = null, sel = [0, 4];
        const frames = () => {
          const ix = new Map(I.map((u, i) => [u, i]));
          const Wm = I.map((u, i) => I.map((x, j) => (i === j ? 0 : INF)));
          for (const a of arcs(G)) { const i = ix.get(a.from), j = ix.get(a.to); if (a.w < Wm[i][j]) Wm[i][j] = a.w; }
          const F = [{ m: 1, L: Wm, prev: null, arg: null, line: [], note: '$W = W^{\\otimes 1}$: walks with at most one edge.' }];
          let L = Wm, m = 1;
          while (m < n - 1 || F.length < 2 || m < 2 * (n - 1)) {
            const { C, arg } = minPlus(L, L), ch = C.reduce((t, r, i) => t + r.filter((x, j) => x !== L[i][j]).length, 0);
            F.push({ m: 2 * m, L: C, prev: L, arg, changed: ch, note: `$W^{\\otimes ${2 * m}} = W^{\\otimes ${m}} \\otimes W^{\\otimes ${m}}$: at most ${2 * m} edges; ${plural(ch, 'cell')} changed.${ch === 0 ? ' Nothing changed: the distances are final.' : ''}` });
            L = C; m *= 2; if (ch === 0 || m > 64) break;
          }
          run = { Wm, F };
          return F;
        };
        const S = v.steps({ frames, speed: 0.8, start: 2, still: 2, counter: 'product' });
        G.onChange = () => S.reset({ at: 'keep' });
        ts.onClick((x, y) => { const c = TR.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        const tspec = { rows: n, cols: n, maxCell: 40, size: 13, labelSize: 12, rowLabels: (i) => I[i], colLabels: (j) => I[j] };
        const TL = v.table(ts, { ...tspec, region: [0.02, 0, 0.98, 0.9] }), TR = v.table(ts, { ...tspec, region: [1.02, 0, 1.98, 0.9] });
        v.render(() => {
          const f = S.frame, [i, j] = sel, L = f.L, Pm = f.prev || f.L, k = f.arg ? f.arg[i][j] : -1;
          ts.text(f.prev ? `previous: $W^{\\otimes ${f.m / 2}}$` : 'previous: —', 0.5, 0.95, { align: 'center', size: 13 });
          ts.text(`$W^{\\otimes ${f.m}}$ (at most ${f.m} edges)`, 1.5, 0.95, { align: 'center', size: 13 });
          TL.draw({ value: (a, b) => (f.prev ? Pm[a][b] : null), activeRow: f.prev ? i : null, activeCol: f.prev ? j : null, activeColor: 'accent', highlight: f.prev && k >= 0 ? [[i, k, 'gold'], [k, j, 'gold']] : [] });
          TR.draw({ value: (a, b) => L[a][b], fill: (a, b) => (f.prev && L[a][b] !== Pm[a][b] ? ['orange', 0.38] : null), highlight: [[i, j, 'gold']] });
          const walk = budgetWalk(run.Wm, i, j, Math.min(f.m, 64)), wv = walk ? walk.map((x) => I[x]) : [], we = new Set(pathEdges(G, wv));
          G.draw({
            nodeFill: (id) => (K(id) === I[i] || K(id) === I[j] ? 'accent' : null),
            nodeRing: (id) => (k >= 0 && K(id) === I[k] && f.prev ? 'gold' : null),
            edgeColor: (e) => (we.has(e) ? 'green' : null), edgeWidth: (e) => (we.has(e) ? 4.5 : null),
          });
        });
        v.legend([['gold', 'selected cell / best middle vertex k'], ['accent', 'row i and column j it reads', { area: true }], ['orange', 'changed by this squaring', { area: true }], ['green', 'lightest walk with ≤ m edges']]);
        v.readout(() => {
          if (!run) return '';
          const f = S.frame, [i, j] = sel, k = f.arg ? f.arg[i][j] : -1;
          const exp = f.prev ? `$W^{\\otimes ${f.m}}[${I[i]}][${I[j]}] = \\min_k (W^{\\otimes ${f.m / 2}}[${I[i]}][k] + W^{\\otimes ${f.m / 2}}[k][${I[j]}]) = ${tnum(f.prev[i][k] ?? INF)} + ${tnum(f.prev[k]?.[j] ?? INF)} = ${tnum(f.L[i][j])}$${k >= 0 ? ` at $k = ${I[k]}$` : ''}` : `$W[${I[i]}][${I[j]}] = ${tnum(f.L[i][j])}$`;
          const last = run.F[run.F.length - 1].L, B = allPairsBrute(G), ok = B.D.every((r, a) => r.every((x, b) => x === last[a][b] || (x === -INF)));
          const stab = run.F.findIndex((fr) => fr.changed === 0);
          return `${exp} · ${stab > 0 ? `the powers stop changing after ${plural(stab - 1, 'squaring')} (⌈log₂(n − 1)⌉ = ${Math.ceil(Math.log2(n - 1))}, against ${n - 2} products by $W$)` : 'the powers keep changing: a negative cycle'} · final table equals brute force for all ${n * n} pairs ${ok ? '✓' : '✗'} · each product: $n^3$ = ${n ** 3} additions`;
        });
      },
    },
  ],
};
