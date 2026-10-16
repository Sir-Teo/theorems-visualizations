// Algorithms — Chapter 9: Shortest paths (items 9.1–9.8; 9.9–9.16 in ch09-b.js; papers 9.17–9.18 in ch09-papers.js)
import { K, INF, W, ids, plural, clamp, fmt, tnum, nodesAt, arcs, pathW, pathEdges, predPath, predIsTree, bruteSP, simpleCycles, simplePaths, bellmanFord, cycleW, BF_CODE, dijkstra, DIJ_CODE, topoOrder, R, TX, blob, strip, heapPic } from './ch09.shared.js';

// ---------------------------------------------------------------- the running example (9.1, 9.3, 9.4, 9.6)
const PA = { s: [0.7, 3.0], a: [3.0, 5.2], b: [3.0, 0.8], c: [5.2, 3.0], d: [7.3, 5.2], e: [7.3, 0.8], t: [9.4, 3.0] };
const EA = [['s', 'a', 4], ['s', 'b', 2], ['b', 'a', 1], ['a', 'c', 3], ['c', 'b', -2], ['b', 'e', 7], ['a', 'd', 6], ['c', 'd', 2], ['c', 'e', 3], ['d', 'e', -1], ['d', 't', 3], ['e', 't', 5]];
const graphA = (v, s, extra = {}) => v.graph(s, { directed: true, weights: true, layout: 'none', nodes: nodesAt(PA, { s: { notePos: 'n' }, b: { notePos: 's' }, e: { notePos: 's' }, t: { notePos: 's' } }), edges: EA.map(([a, b, w]) => [a, b, w]), ...extra });
/** Vertex colours for per-vertex series. */
const VCOL = ['ink', 'blue', 'orange', 'teal', 'purple', 'pink', 'green', 'red', 'gold'];

// ---------------------------------------------------------------- 9.2 a non-negative graph with many routes
const PB = { s: [0.6, 3.0], a: [2.4, 5.3], b: [2.4, 0.7], c: [4.3, 3.0], d: [6.1, 5.3], e: [6.1, 0.7], f: [7.9, 3.0], t: [9.6, 3.0] };
const EB = [['s', 'a', 3], ['s', 'b', 2], ['a', 'c', 2], ['b', 'c', 4], ['b', 'a', 2], ['a', 'd', 6], ['b', 'e', 5], ['c', 'd', 3], ['c', 'e', 2], ['c', 'f', 6], ['d', 'f', 2], ['e', 'f', 4], ['d', 't', 7], ['e', 't', 8], ['f', 't', 2]];

// ---------------------------------------------------------------- 9.5 a DAG (node list deliberately not in topological order)
const N95 = ['c', 's', 't', 'a', 'r', 'd', 'b'];
const E95 = [['r', 's', 5], ['r', 'a', 3], ['s', 'a', 2], ['s', 'b', 6], ['a', 'b', 7], ['a', 'c', 4], ['a', 'd', 2], ['b', 'c', -1], ['b', 'd', 1], ['c', 'd', -2], ['c', 't', 3], ['d', 't', 2]];
const DAG_CODE = [
  'topologically sort the vertices          ▷ DFS finishing times, 8.13',
  'for each vertex v:  d[v] ← ∞;  π[v] ← nil;   d[s] ← 0',
  'for each vertex u in topological order:',
  '  for each edge u → v of weight w:',
  '    if d[u] + w < d[v]:  d[v] ← d[u] + w;  π[v] ← u     ▷ relax',
];
/** DAG shortest (sign = 1) or longest (sign = −1) paths, one frame per step. */
function dagRun(G, s, sign) {
  const order = topoOrder(G), L = (x) => `**${G.lab(x)}**`, I = ids(G).map(K);
  if (!order) return { order: null, frames: [{ cyc: true, line: 1, note: 'DFS meets a back edge: the graph has a **cycle**, so no topological order exists and the one-sweep method does not apply (use Bellman–Ford, 9.6).' }] };
  const d = {}, prev = {}, prevEdge = {}, done = [], F = [];
  for (const u of I) { d[u] = INF; prev[u] = null; prevEdge[u] = null; }
  d[K(s)] = 0; let rel = 0;
  const snap = (e) => F.push({ ...e, d: { ...d }, prevEdge: { ...prevEdge }, done: done.slice(), rel });
  snap({ line: [1, 2], note: `Topological order from DFS finishing times: ${order.map((x) => G.lab(x)).join(', ')}. Every estimate is ∞ except $d[${G.lab(s)}] = 0$.` });
  for (const u of order) {
    if (d[u] === INF) { done.push(u); rel += G.adj(u).length; snap({ u, line: 3, note: `${L(u)} has $d = \\infty$ (it is not reachable from ${G.lab(s)}): relaxing its ${plural(G.adj(u).length, 'edge')} changes nothing ($\\infty + w = \\infty$).` }); continue; }
    snap({ u, line: 3, note: `Take ${L(u)}. Every edge into it comes from a vertex already processed, so $d[${G.lab(u)}] = ${tnum(sign * d[u])}$ is final.` });
    for (const { id, edge, w } of G.adj(u)) {
      const x = K(id), nd = d[u] + sign * w, old = d[x], better = nd < old; rel++;
      if (better) { d[x] = nd; prev[x] = u; prevEdge[x] = edge; }
      const sh = (y) => fmt(sign * y);
      snap({ u, edge, x, better, line: better ? [4, 5] : 4, note: `Relax ${G.lab(u)}→${G.lab(x)}: ${sh(d[u])} ${w >= 0 ? '+' : '−'} ${fmt(Math.abs(w))} = ${sh(nd)}${better ? `, ${sign > 0 ? 'less' : 'more'} than ${sh(old)}: improve ${L(x)}.` : `: no improvement on ${sh(old)}.`}` });
    }
    done.push(u);
  }
  snap({ line: 3, end: true, note: `Done after one sweep: ${plural(rel, 'relaxation')}, one per edge — $O(n + m)$ time, negative weights and all.` });
  return { order, frames: F, d, prevEdge };
}

// ---------------------------------------------------------------- 9.6 Bellman–Ford as a table
const BFDP_CODE = [
  '$d_0(s) = 0$,  $d_0(v) = \\infty$ for $v \\ne s$',
  'for $k = 1, 2, \\dots, n-1$:                ▷ one row per round',
  '  for each vertex $v$:',
  '    $d_k(v) = \\min\\{\\,d_{k-1}(v),\\ \\min_{u\\to v}\\, d_{k-1}(u) + w(u,v)\\,\\}$',
  'row $n$ once more: any change ⇒ a negative cycle',
];
function bfTable(G, s) {
  const I = ids(G).map(K), n = I.length, ix = new Map(I.map((u, i) => [u, i]));
  const D = [I.map((u) => (u === K(s) ? 0 : INF))], F = [];
  F.push({ k: 0, j: -1, D: D.map((r) => r.slice()), line: 1, note: `Row 0: only paths with no edges, so $d_0(${G.lab(s)}) = 0$ and every other entry is ∞.` });
  for (let k = 1; k <= n; k++) {
    D.push(new Array(n).fill(null));
    for (let j = 0; j < n; j++) {
      const v = I[j], keep = D[k - 1][j];
      const cand = G.inn(v).map(({ id, edge, w }) => ({ u: K(id), edge, w, val: D[k - 1][ix.get(K(id))] + w })).filter((c) => ix.has(c.u));
      let best = keep, via = null; for (const c of cand) if (c.val < best) { best = c.val; via = c; }
      D[k][j] = best;
      const show = cand.map((c) => `${fmt(D[k - 1][ix.get(c.u)])} + ${fmt(c.w)} via ${G.lab(c.u)}`).join(', ');
      F.push({ k, j, cand, via, D: D.map((r) => r.slice()), line: k === n ? 5 : [3, 4], note: `$d_{${k}}(${G.lab(v)}) = \\min\\{${tnum(keep)}${cand.length ? ', ' : ''}${cand.map((c) => tnum(c.val)).join(', ')}\\} = ${tnum(best)}$${cand.length ? ` (keep ${fmt(keep)}, or ${show})` : ' (no edges enter it)'}${via ? ` — improved through ${G.lab(via.u)}.` : '.'}` });
    }
  }
  return { I, n, D, frames: F };
}

// ---------------------------------------------------------------- 9.7 a graph with an adjustable cycle
const P97 = { s: [0.7, 3.0], a: [2.6, 5.0], b: [2.6, 1.0], x: [4.9, 3.0], y: [7.0, 5.2], z: [7.0, 0.8], t: [9.4, 3.0] };
// listed roughly against the flow, so the in-place rounds converge slowly enough to watch
const E97 = [['z', 't', 6], ['y', 't', 4], ['z', 'x', -5], ['y', 'z', 2], ['x', 'y', 1], ['b', 'z', 9], ['b', 'x', 4], ['a', 'x', 2], ['a', 'b', -1], ['s', 'b', 5], ['s', 'a', 3]];

// ---------------------------------------------------------------- 9.8 Dijkstra's example
const P98 = { s: [0.7, 3.0], a: [2.6, 5.2], b: [2.6, 0.8], c: [4.4, 3.0], d: [6.0, 5.3], e: [6.0, 0.7], f: [7.6, 3.0], g: [9.3, 5.0], t: [9.3, 1.0] };
const E98 = [['s', 'a', 4], ['s', 'b', 1], ['b', 'a', 2], ['a', 'c', 3], ['b', 'c', 6], ['a', 'd', 7], ['c', 'd', 2], ['c', 'e', 3], ['b', 'e', 9], ['d', 'f', 1], ['e', 'f', 2], ['d', 'g', 5], ['f', 'g', 3], ['f', 't', 4], ['e', 't', 6], ['g', 't', 2]];

export default {
  collection: 'algo',
  chapter: 9,
  title: 'Shortest paths',
  summary: String.raw`Edge weights turn graph search into optimization. Every single-source method repeatedly **relaxes** edges, lowering an upper bound $d[v]$ on the distance until it is exact; the methods differ only in the order of relaxations. A DAG needs one sweep in topological order. Bellman–Ford is a dynamic program over the number of edges, and its extra round detects negative cycles. Dijkstra settles vertices greedily from a priority queue, which is correct exactly when weights are nonnegative. Vertex potentials reweight edges without changing which paths are shortest; they explain both A* and Johnson's all-pairs algorithm. Floyd–Warshall and min-plus matrix squaring solve all pairs at once by dynamic programming.`,
  items: [
    // ------------------------------------------------------------------ 9.1
    {
      num: '9.1',
      kind: 'Definition',
      name: 'Shortest paths and negative cycles',
      statement: String.raw`Let $G=(V,E)$ be a directed graph with real edge weights $w:E\to\R$ (an undirected graph counts each edge in both directions). The **weight** of a walk $P=v_0v_1\cdots v_k$ is $w(P)=\sum_{i=1}^{k}w(v_{i-1},v_i)$. The **shortest-path distance** from $s$ to $v$ is
$$\delta(s,v)=\inf\{\,w(P): P \text{ a walk from } s \text{ to } v\,\},$$
with $\delta(s,v)=\infty$ when $v$ is unreachable. A **shortest path** is a walk attaining this value.

A **negative cycle** is a closed walk of negative total weight. If some walk from $s$ to $v$ can pass through a negative cycle, going around it again and again makes the weight arbitrarily low, so $\delta(s,v)=-\infty$ and no shortest path exists. Otherwise, deleting a cycle from a walk never increases its weight, so $\delta(s,v)$ is finite and is attained by a **simple** path, which has at most $n-1$ edges.`,
      idea: String.raw`Everything in the chapter rests on the dichotomy in the last paragraph. If no negative cycle can be reached, every walk can be shortcut to a simple path that weighs no more. There are only finitely many simple paths, so the infimum is a minimum. If a negative cycle $C$ sits on some walk from $s$ to $v$, the walks that go around $C$ $k$ times weigh $c + k\,w(C)$ with $c$ fixed, and these tend to $-\infty$. Negative *edges* are harmless on their own; only negative *cycles* destroy the problem. In an undirected graph, though, a negative edge is itself a negative cycle (walk along it and back), which is why undirected shortest paths are usually studied with nonnegative weights.`,
      caption: String.raw`Each vertex is labelled with $\delta(s,\cdot)$, computed by brute force over every simple path and every simple cycle. **Drag the slider** to lower the weight of c → b (or click any weight: +1, shift-click −1). Once the triangle a → c → b → a weighs less than 0 it turns red, and every vertex reachable from it drops to $-\infty$. The chart shows why: the walk s ⇝ a, then $k$ times around the triangle, then a ⇝ t, gets cheaper with every lap. Click a vertex to move the source or the target (switch with the selector).`,
      deps: ['algo-8.1'],
      refs: ['CLRS 4e Ch. 22', 'Erickson Ch. 8'],
      tags: ['shortest paths', 'graphs'],
      viz(v) {
        const mode = v.select('click a vertex to set the', [{ value: 'src', label: 'source' }, { value: 'dst', label: 'target' }], 'src');
        const cw = v.slider('weight of c → b', -8, 6, -2, { int: true, onChange: () => { eCB.w = cw.value; } });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 330, weight: 1.55, title: 'distances $\\delta(s,\\cdot)$ by exhaustive search' });
        const ch = v.stage({ x: [-0.5, 7.5], y: [-10, 20], axes: 'box', gutter: true, height: 330, xlabel: 'laps k around a → c → b → a', ylabel: 'walk weight', title: 'walk s ⇝ a, k laps, a ⇝ t' });
        const G = graphA(v, s, { editable: { editWeight: true, minWeight: -9, maxWeight: 9 } });
        const eCB = G.edge('c', 'b');
        let src = 's', dst = 't', info = null;
        G.onClick = ({ node }) => { if (!node) return false; if (mode.value === 'src') src = node.id; else dst = node.id; return true; };
        G.onChange = (k, e) => { if (e === eCB) cw.set(eCB.w); };
        const TRI = ['a', 'c', 'b'];
        v.render(() => {
          const B = bruteSP(G, src);
          const negE = new Set(B.cycles.flatMap((c) => pathEdges(G, c.nodes.concat([c.nodes[0]]))));
          const fin = B.dist[K(dst)] > -INF && B.dist[K(dst)] < INF, P = fin ? B.path[K(dst)] : null, pe = new Set(P ? pathEdges(G, P) : []);
          G.draw({
            nodeFill: (id) => (K(id) === K(src) ? 'accent' : null),
            nodeColor: (id) => (B.dist[K(id)] === -INF ? 'red' : B.dist[K(id)] === INF ? null : 'accent'),
            nodeRing: (id) => (K(id) === K(dst) ? 'gold' : null),
            nodeNote: (id) => fmt(B.dist[K(id)]),
            noteColor: (id) => (B.dist[K(id)] === -INF ? 'red' : B.dist[K(id)] === INF ? 'faint' : 'accent'),
            edgeColor: (e) => (negE.has(e) ? 'red' : pe.has(e) ? 'green' : null),
            edgeWidth: (e) => (negE.has(e) || pe.has(e) ? 4 : null),
          });
          // laps chart
          const wc = cycleW(G, TRI), toA = simplePaths(G, src, 'a')[0], fromA = simplePaths(G, 'a', dst)[0];
          let vals = null;
          if (toA && fromA) {
            vals = []; for (let k = 0; k <= 7; k++) vals.push(toA.w + k * wc + fromA.w);
            const lo = Math.min(0, ...vals), hi = Math.max(1, ...vals), pad = 0.12 * (hi - lo || 1);
            ch.setView([-0.6, 7.6], [lo - pad, hi + pad]);
            ch.hline(0, { color: 'faint', width: 1 });
            vals.forEach((y, k) => ch.rect(k - 0.32, Math.min(0, y), k + 0.32, Math.max(0, y), { fill: wc < 0 ? 'red' : 'green', fillAlpha: 0.55, color: wc < 0 ? 'red' : 'green', width: 1.2 }));
            ch.path(vals.map((y, k) => [k, y]), { color: wc < 0 ? 'red' : 'green', width: 1.5, dash: [4, 3] });
            ch.corner(`lap weight w(C) = ${fmt(wc)}`, 'tr', { color: wc < 0 ? 'red' : 'green', weight: 700, plate: true });
          } else { ch.setView([-0.6, 7.6], [-1, 1]); ch.corner(toA ? 'a cannot reach the target' : 'the source cannot reach a', 'tl', { color: 'muted', plate: true }); }
          info = { B, P, wc };
        });
        v.legend([['accent', 'finite distance', { dot: true }], ['red', 'negative cycle / −∞'], ['green', 'a shortest path to the target'], ['gold', 'target (ring)', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { B, P } = info, bf = bellmanFord(G, src), d = B.dist[K(dst)], L = (x) => G.lab(x);
          const agree = (B.cycles.length > 0) === (bf.cycle != null) && ids(G).every((u) => B.dist[K(u)] === -INF || B.dist[K(u)] === bf.dist[K(u)]);
          const head = d === -INF ? `$\\delta(${L(src)},${L(dst)}) = -\\infty$: ${plural(B.cycles.length, 'negative simple cycle')} reachable from ${L(src)} (e.g. ${B.cycles[0].nodes.map(L).join(' → ')} → ${L(B.cycles[0].nodes[0])}, weight ${fmt(B.cycles[0].w)}), so ${ids(G).filter((u) => B.dist[K(u)] === -INF).map(L).join(', ')} have no shortest path`
            : d === INF ? `${L(dst)} is unreachable from ${L(src)}: $\\delta = \\infty$`
              : `$\\delta(${L(src)},${L(dst)}) = ${tnum(d)}$ along ${P.map(L).join(' → ')} (${plural(P.length - 1, 'edge')}, a simple path)${B.cycles.length ? '' : ' — no negative cycle is reachable'}`;
          return `${head} · brute force examined ${B.count} simple paths and ${plural(simpleCycles(G).length, 'simple cycle')} · Bellman–Ford, an independent method, ${agree ? 'agrees ✓' : 'disagrees ✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.2
    {
      num: '9.2',
      kind: 'Lemma',
      name: 'Subpaths of shortest paths are shortest',
      statement: String.raw`Let $P=v_0v_1\cdots v_k$ be a shortest path from $v_0$ to $v_k$ in a weighted digraph. Then for all $0\le i\le j\le k$, the subpath $P_{ij}=v_i\cdots v_j$ is a shortest path from $v_i$ to $v_j$. In particular, $\delta(v_0,v_k)=\delta(v_0,v_i)+\delta(v_i,v_k)$ for every vertex $v_i$ on $P$.`,
      idea: String.raw`Cut and paste. Write $P$ as $P_{0i}\,P_{ij}\,P_{jk}$, so $w(P)=w(P_{0i})+w(P_{ij})+w(P_{jk})$. If some walk $Q$ from $v_i$ to $v_j$ were lighter than $P_{ij}$, then $P_{0i}\,Q\,P_{jk}$ would be a walk from $v_0$ to $v_k$ lighter than $P$, contradicting minimality. (The spliced walk may repeat vertices; that does not matter, since $\delta$ is an infimum over walks.) This is the **optimal substructure** (algo-7.3) that every shortest-path algorithm exploits: a distance can be assembled from distances to earlier vertices.`,
      caption: String.raw`The blue route is an $s$–$t$ path, by default the shortest. **Click two vertices on it** to mark a subpath (gold), and **drag the detour slider** to splice in another route between them (orange, dashed). The chart shows the total weight of the spliced walk for every possible detour: none falls below the red line (the current total) while the route is shortest. Move the route slider to a longer route and some detours undercut it, so its subpaths are not shortest either. Click a weight to change it (shift-click lowers it).`,
      deps: ['algo-9.1', 'algo-7.3'],
      refs: ['CLRS 4e §22.5'],
      tags: ['shortest paths', 'optimal substructure'],
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320, weight: 1.5 });
        const ch = v.stage({ x: [0, 10], y: [0, 20], axes: 'box', gutter: true, height: 320, xlabel: 'detours, cheapest first', ylabel: 'spliced total', title: 'every detour spliced in' });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', editable: { editWeight: true, minWeight: 0, maxWeight: 12 }, nodes: nodesAt(PB, { s: { notePos: 'w' }, t: { notePos: 'e' }, b: { notePos: 's' }, e: { notePos: 's' } }), edges: EB.map(([a, b, w]) => [a, b, w]) });
        const NP = simplePaths(G, 's', 't').length;
        const rk = v.slider('$s$–$t$ route (1 = shortest)', 1, NP, 1, { int: true });
        const dt = v.slider('detour #', 1, 12, 2, { int: true });
        let ends = ['a', 'f'], info = null;
        G.onClick = ({ node }) => {
          if (!node) return false;
          const P = simplePaths(G, 's', 't')[rk.value - 1].nodes;
          if (!P.includes(K(node.id))) return true;
          ends = [ends[1], K(node.id)];
          if (ends[0] === ends[1]) ends = [P[0] === ends[1] ? P[1] : P[0], ends[1]];
          return true;
        };
        v.render(() => {
          const paths = simplePaths(G, 's', 't'), route = paths[Math.min(rk.value, paths.length) - 1], P = route.nodes;
          let i = P.indexOf(ends[0]), j = P.indexOf(ends[1]);
          if (i < 0 || j < 0 || i === j) { i = Math.min(1, P.length - 2); j = P.length - 2 > i ? P.length - 2 : P.length - 1; }
          if (i > j) [i, j] = [j, i];
          const u = P[i], x = P[j], sub = P.slice(i, j + 1), subW = pathW(G, sub);
          const dets = simplePaths(G, u, x), di = Math.min(dt.value, dets.length) - 1, det = dets[di];
          const spliced = (q) => route.w - subW + q.w;
          const pe = new Set(pathEdges(G, P)), se = new Set(pathEdges(G, sub)), de = new Set(pathEdges(G, det.nodes));
          G.draw({
            nodeColor: (id) => (P.includes(K(id)) ? 'accent' : null),
            nodeRing: (id) => (K(id) === u || K(id) === x ? 'gold' : null),
            nodeFill: (id) => (K(id) === 's' || K(id) === 't' ? 'accent' : null),
            edgeColor: (e) => (de.has(e) && !se.has(e) ? 'orange' : se.has(e) ? 'gold' : pe.has(e) ? 'accent' : null),
            edgeWidth: (e) => (de.has(e) || se.has(e) ? 5 : pe.has(e) ? 3.5 : null),
            edgeDash: (e) => (de.has(e) && !se.has(e) ? [7, 4] : null),
          });
          // chart of spliced totals
          const tots = dets.map(spliced), hi = Math.max(route.w, ...tots) * 1.3 + 1;
          ch.setView([0.3, dets.length + 0.7], [0, hi]);
          ch.setTicks(dets.length <= 12 ? dets.map((_, k) => k + 1) : null, null);
          tots.forEach((y, k) => ch.rect(k + 0.65, 0, k + 1.35, y, { fill: y < route.w ? 'red' : k === di ? 'orange' : 'accent', fillAlpha: k === di ? 0.75 : 0.35, color: y < route.w ? 'red' : k === di ? 'orange' : 'accent', width: k === di ? 2.2 : 1 }));
          ch.hline(route.w, { color: 'red', width: 1.8, dash: [6, 4] });
          ch.corner(`dashed line: current total ${fmt(route.w)}`, 'tr', { color: 'red', weight: 600, plate: true });
          info = { paths, route, P, u, x, sub, subW, dets, det, di, tots };
        });
        v.legend([['accent', 'the s–t route'], ['gold', 'chosen subpath'], ['orange', 'detour spliced in', { dash: true }], ['red', 'detours that would shorten the route', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { route, paths, u, x, sub, subW, dets, det, di, tots } = info, L = (y) => G.lab(y);
          const best = dets[0].w, under = tots.filter((y) => y < route.w).length, isShortest = route.w === paths[0].w;
          const walk = new Set(route.nodes.slice(0, route.nodes.indexOf(u)).concat(route.nodes.slice(route.nodes.indexOf(x) + 1))), rep = det.nodes.slice(1, -1).filter((y) => walk.has(y));
          return `route #${Math.min(rk.value, paths.length)} of ${paths.length}: weight ${fmt(route.w)}${isShortest ? ' (a shortest route)' : `, shortest is ${fmt(paths[0].w)}`} · subpath ${sub.map(L).join('→')} weighs ${fmt(subW)}, the lightest ${L(u)}–${L(x)} path weighs ${fmt(best)} ${subW === best ? '— the subpath is shortest ✓' : '— the subpath is **not** shortest'} · detour #${di + 1} of ${dets.length} (${det.nodes.map(L).join('→')}, weight ${fmt(det.w)}) gives total **${fmt(tots[di])}**${rep.length ? ` (a walk: it revisits ${rep.map(L).join(', ')})` : ''} · ${under ? `${plural(under, 'detour')} beat the route, so it cannot be shortest${isShortest ? ' ✗' : ' ✓'}` : `no detour beats the route${isShortest ? ' ✓' : ''}`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.3
    {
      num: '9.3',
      kind: 'Definition',
      name: 'Relaxation and shortest-path trees',
      statement: String.raw`Single-source algorithms keep, for every vertex $v$, an **estimate** $d[v]$ and a **predecessor** $\pi[v]$. Initially $d[s]=0$, $d[v]=\infty$ for $v\ne s$, and every $\pi[v]=\text{nil}$. To **relax** an edge $u\to v$ of weight $w$ means:
$$\text{if } d[u]+w<d[v]:\quad d[v]\leftarrow d[u]+w,\ \ \pi[v]\leftarrow u.$$
An edge is **tense** if $d[u]+w<d[v]$, so relaxing it changes something. In any sequence of relaxations (assuming no negative cycle is reachable from $s$):
(a) **upper bound**: $d[v]\ge\delta(s,v)$ always, and $d[v]$ only decreases;
(b) $d[v]$ is always the weight of an actual walk from $s$ to $v$, namely the one traced back through $\pi$;
(c) the predecessor edges form a tree rooted at $s$;
(d) when no edge is tense, $d[v]=\delta(s,v)$ for every $v$, and the predecessor tree is a **shortest-path tree**: its path from $s$ to each reachable $v$ is a shortest path.`,
      idea: String.raw`Relaxing $u\to v$ sets $d[v]$ to the weight of a walk (the walk to $u$ extended by one edge), so by induction every finite estimate is the weight of a real walk. That walk weighs at least $\delta(s,v)$, which proves (a) and (b). A cycle in the predecessor graph would have to be a negative cycle, which rules it out and gives (c). For (d), take a shortest path $s=v_0,\dots,v_k=v$. If no edge is tense, then $d[v_i]\le d[v_{i-1}]+w(v_{i-1},v_i)$ for each $i$; summing gives $d[v]\le\delta(s,v)$. Every algorithm in this chapter is a strategy for choosing which tense edge to relax next.`,
      caption: String.raw`**Click any edge to relax it**, in any order you like. Orange numbers are the current estimates $d[v]$; they turn green once they reach the true distance. Dashed orange edges are tense. Green edges are the predecessor pointers $\pi$, which always form a tree. The bars on the right compare each $d[v]$ with $\delta(s,v)$ (black ticks): bars only shrink, and they never cross their ticks. When no dashed edge is left, every bar sits exactly on its tick.`,
      deps: ['algo-9.1'],
      refs: ['CLRS 4e §22.5', 'Erickson Ch. 8'],
      tags: ['shortest paths', 'relaxation'],
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320, weight: 1.5, title: 'click an edge to relax it' });
        const bs = v.stage({ x: [-0.6, 6.6], y: [-3, 15], axes: 'box', gutter: true, height: 320, ylabel: 'estimate d[v]', title: '$d[v]$ (bars) against $\\delta(s,v)$ (ticks)' });
        const G = graphA(v, s);
        const I = ids(G).map(K), truth = bruteSP(G, 's').dist;
        let d, prev, prevEdge, nRel, nImp, last, lastImp;
        const reset = () => { d = {}; prev = {}; prevEdge = {}; for (const u of I) { d[u] = INF; prev[u] = null; prevEdge[u] = null; } d.s = 0; nRel = 0; nImp = 0; last = null; lastImp = false; };
        reset();
        const relax = (e) => { const a = K(e.from), b = K(e.to); nRel++; last = e; lastImp = d[a] + W(e) < d[b]; if (lastImp) { d[b] = d[a] + W(e); prev[b] = a; prevEdge[b] = e; nImp++; } };
        for (const [a, b] of [['s', 'a'], ['a', 'c'], ['c', 'd'], ['s', 'b'], ['b', 'e']]) relax(G.edge(a, b));  // a few relaxations to start from
        const tense = (e) => d[K(e.from)] + W(e) < d[K(e.to)];
        G.onClick = ({ edge }) => { if (edge) relax(edge); return true; };
        v.button('relax every edge once', () => { for (const e of G.edges) relax(e); });
        v.button('relax a tense edge', () => { const T = G.edges.filter(tense); if (T.length) relax(T[(nRel * 7 + 3) % T.length]); });
        v.button('reset', reset);
        bs.setTicks(I.map((u, i) => [i, u]), null);
        v.render(() => {
          G.draw({
            nodeFill: (id) => (K(id) === 's' ? 'accent' : null),
            nodeColor: (id) => (d[K(id)] === INF ? null : d[K(id)] === truth[K(id)] ? 'green' : 'orange'),
            nodeNote: (id) => fmt(d[K(id)]),
            noteColor: (id) => (d[K(id)] === INF ? 'faint' : d[K(id)] === truth[K(id)] ? 'green' : 'orange'),
            edgeColor: (e) => (e === last ? (lastImp ? 'gold' : 'red') : Object.values(prevEdge).includes(e) ? 'green' : tense(e) ? 'orange' : null),
            edgeWidth: (e) => (e === last ? 4.5 : Object.values(prevEdge).includes(e) ? 3.4 : tense(e) ? 2.4 : null),
            edgeDash: (e) => (e !== last && tense(e) && !Object.values(prevEdge).includes(e) ? [6, 4] : null),
          });
          I.forEach((u, i) => {
            const y = d[u], top = 14.2;
            if (y === INF) { bs.rect(i - 0.32, 0, i + 0.32, top, { fill: 'faint', fillAlpha: 0.18, color: 'faint', width: 1, dash: [3, 3] }); bs.text('∞', i, top - 0.9, { align: 'center', size: 13, color: 'muted' }); }
            else bs.rect(i - 0.32, Math.min(0, y), i + 0.32, Math.max(0, y), { fill: y === truth[u] ? 'green' : 'orange', fillAlpha: 0.5, color: y === truth[u] ? 'green' : 'orange', width: 1.2 });
            bs.line(i - 0.44, truth[u], i + 0.44, truth[u], { color: 'ink', width: 2.6 });
          });
          bs.hline(0, { color: 'faint', width: 1 });
        });
        v.legend([['orange', 'estimate above δ / tense edge'], ['green', 'exact estimate / π-edges'], ['gold', 'last relaxation (improved)'], ['red', 'last relaxation (no change)']]);
        v.readout(() => {
          const T = G.edges.filter(tense).length, ub = I.every((u) => d[u] >= truth[u]), tree = predIsTree(prev, 's', I.length), exact = I.every((u) => d[u] === truth[u]);
          const walkOK = I.every((u) => d[u] === INF || pathW(G, predPath(prev, u, I.length)) <= d[u] + 1e-9);
          return `${plural(nRel, 'relaxation')} (${nImp} changed something) · $d[v] \\ge \\delta(s,v)$ for all $v$ ${ub ? '✓' : '✗'} · each $d[v]$ is the weight of its π-walk ${walkOK ? '✓' : '✗'} · π-edges form a tree rooted at s ${tree ? '✓' : '✗'} · tense edges left: **${T}**${T ? '' : ` — so $d = \\delta$ everywhere ${exact ? '✓' : '✗'} and the green tree is a shortest-path tree`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.4
    {
      num: '9.4',
      kind: 'Lemma',
      name: 'Convergence and path-relaxation properties',
      statement: String.raw`Run any sequence of relaxations from the initial state of 9.3, on a graph with no negative cycle reachable from $s$.
(a) **Convergence.** If $s\leadsto u\to v$ is a shortest path and $d[u]=\delta(s,u)$ holds at some moment, then $d[v]=\delta(s,v)$ holds at all times after the edge $u\to v$ is next relaxed.
(b) **Path relaxation.** If $P=v_0v_1\cdots v_k$ is a shortest path from $s=v_0$, and the edges $v_0v_1, v_1v_2,\dots,v_{k-1}v_k$ are relaxed in this order, with any other relaxations interleaved, then $d[v_k]=\delta(s,v_k)$ from then on.
(c) Once $d[v]=\delta(s,v)$, it never changes again.`,
      idea: String.raw`(c) follows from the upper-bound property: $d[v]$ never drops below $\delta(s,v)$ and never increases. For (a): after $u\to v$ is relaxed, $d[v]\le d[u]+w(u,v)=\delta(s,u)+w(u,v)=\delta(s,v)$, the last step by 9.2; combined with $d[v]\ge\delta(s,v)$ this gives equality. (b) is induction on $i$ using (a): when $v_{i-1}v_i$ is relaxed, $d[v_{i-1}]$ is already exact. Bellman–Ford makes (b) happen by relaxing every edge in each round; Dijkstra and the DAG algorithm arrange the relaxations so that each edge of a shortest path is relaxed after its tail is final.`,
      caption: String.raw`A shortest path to the chosen target is marked in blue, its edges numbered #1, #2, … in order. Step through a relaxation sequence: the path edges appear in order (blue cells), interleaved with random other relaxations (grey). The chart tracks the target's estimate. It reaches $\delta$ (dashed) at the latest when edge #k is relaxed, and then stays put. **Resample** the interleaving, pick another target, or relax the path edges **in reverse order**: the estimate then stays too high.`,
      deps: ['algo-9.3', 'algo-9.2'],
      refs: ['CLRS 4e §22.5'],
      tags: ['shortest paths', 'relaxation'],
      viz(v) {
        const tgt = v.select('target', ['t', 'e', 'd', 'c'], 't', { onChange: () => S.reset() });
        const rev = v.toggle('path edges in reverse order', false, { onChange: () => S.reset() });
        let seed = 3;
        v.button('resample', () => { seed++; S.reset(); });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 300, weight: 1.45 });
        const ch = v.stage({ x: [0, 20], y: [0, 20], axes: 'box', gutter: true, height: 300, xlabel: 'relaxation step', ylabel: 'estimate d[target]' });
        const sq = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 64, full: true });
        const G = graphA(v, s);
        const I = ids(G).map(K);
        let run = null;
        const frames = () => {
          const t = tgt.value, B = bruteSP(G, 's'), P = B.path[t], pe = pathEdges(G, P), others = G.edges.filter((e) => !pe.includes(e)), r = v.M.rng(seed * 17 + t.charCodeAt(0));
          const order = rev.value ? pe.slice().reverse() : pe, seq = [];
          for (const e of order) { const k = r.int(1, 3); for (let j = 0; j < k; j++) seq.push({ e: r.pick(others) }); seq.push({ e, idx: pe.indexOf(e) + 1 }); }
          for (let j = 0; j < 2; j++) seq.push({ e: r.pick(others) });
          const d = {}, prevEdge = {}; for (const u of I) { d[u] = INF; prevEdge[u] = null; } d.s = 0;
          const F = [{ i: -1, d: { ...d }, prevEdge: { ...prevEdge }, nextIdx: 1, note: `Start: $d[s] = 0$, all else ∞. The shortest path to ${t} has ${plural(pe.length, 'edge')}.` }];
          let next = 1, exactAt = null, inOrderAt = null;
          seq.forEach((st, i) => {
            const a = K(st.e.from), b = K(st.e.to), imp = d[a] + W(st.e) < d[b];
            if (imp) { d[b] = d[a] + W(st.e); prevEdge[b] = st.e; }
            if (st.idx === next) { next++; if (next > pe.length) inOrderAt = i; }
            if (exactAt == null && d[t] === B.dist[t]) exactAt = i;
            F.push({ i, st, imp, d: { ...d }, prevEdge: { ...prevEdge }, nextIdx: next, note: `Step ${i + 1}: relax ${a}→${b}${st.idx ? ` (path edge **#${st.idx}**${st.idx === next - 1 ? ', next in order' : ', out of order'})` : ''}: ${imp ? `$d[${b}]$ drops to ${fmt(d[b])}` : 'no change'}.${inOrderAt === i ? ` All path edges have now been relaxed in order, so $d[${t}] = ${tnum(d[t])} = \\delta(s,${t})$.` : ''}` });
          });
          run = { t, P, pe, seq, delta: B.dist[t], exactAt, inOrderAt };
          return F;
        };
        const S = v.steps({ frames, speed: 2.5, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame, { t, P, pe, seq, delta } = run, cur = f.st ? f.st.e : null;
          G.draw({
            nodeFill: (id) => (K(id) === 's' ? 'accent' : null),
            nodeRing: (id) => (K(id) === t ? 'gold' : null),
            nodeColor: (id) => (P.includes(K(id)) ? 'accent' : null),
            nodeNote: (id) => fmt(f.d[K(id)]),
            noteColor: (id) => (f.d[K(id)] === INF ? 'faint' : 'orange'),
            edgeColor: (e) => (e === cur ? (f.imp ? 'gold' : 'red') : pe.includes(e) ? 'accent' : null),
            edgeWidth: (e) => (e === cur ? 5 : pe.includes(e) ? 3.4 : null),
            edgeLabel: (e) => (pe.includes(e) ? `${fmt(W(e))} · #${pe.indexOf(e) + 1}` : fmt(W(e))),
          });
          // chart of d[target] over steps
          const N = seq.length, F = S.frames, ys = F.map((fr) => fr.d[t]).filter((y) => y < INF), hi = Math.max(delta + 4, ...ys) + 1, lo = Math.min(0, delta - 1);
          ch.setView([-1.5, N + 0.5], [lo, hi]);
          ch.hline(delta, { color: 'green', width: 1.6, dash: [6, 4] });
          ch.text(`δ(s, ${t}) = ${fmt(delta)}`, N + 0.4, delta, { align: 'right', baseline: 'top', dy: 4, size: 11.5, color: 'green' });
          if (run.inOrderAt != null) { ch.vline(run.inOrderAt, { color: 'accent', width: 1.4, dash: [3, 3] }); ch.text(`#${pe.length} relaxed in order`, run.inOrderAt, lo, { align: 'right', baseline: 'bottom', dx: -5, dy: -5, size: 11, color: 'accent', plate: true }); }
          ch.text('∞', -1.2, hi, { align: 'center', size: 13, color: 'muted' });
          const pts = []; F.slice(0, S.i + 1).forEach((fr) => { const y = fr.d[t] === INF ? hi : fr.d[t]; pts.push([fr.i, y]); });
          const stepPts = []; pts.forEach((p, k) => { if (k) stepPts.push([p[0], pts[k - 1][1]]); stepPts.push(p); });
          ch.path(stepPts, { color: 'orange', width: 2.6 });
          if (pts.length) { const p = pts[pts.length - 1]; ch.dot(p[0], p[1], { r: 5, color: f.d[t] === delta ? 'green' : 'orange' }); }
          // sequence strip
          strip(sq, seq.map((st, i) => ({ label: st.idx ? `#${st.idx}` : `${st.e.from}${st.e.to}`, fill: i === f.i ? 'gold' : st.idx ? 'accent' : null, color: st.idx ? 'accent' : 'muted', width: i === f.i ? 2.6 : 1.2 })), 12, (sq.height - 26) / 2, { title: 'sequence', titleW: 74, w: 34, h: 26, gap: 3, maxW: sq.width - 24, size: 10.5 });
        });
        v.legend([['accent', 'shortest path to the target, edges #1…#k'], ['gold', 'relaxed now'], ['orange', 'd[target] over time'], ['green', 'true distance', { dash: true }]]);
        v.readout(() => {
          const f = S.frame, { t, pe, delta, exactAt, inOrderAt } = run, k = pe.length;
          const after = inOrderAt == null ? null : S.frames.slice(inOrderAt + 1).every((fr) => fr.d[t] === delta);
          const conv = S.frames.every((fr, i) => i === 0 || fr.d[t] <= S.frames[i - 1].d[t]);
          const status = inOrderAt != null ? `the path edges were relaxed in order by step ${inOrderAt + 1}; $d[${t}]$ became exact at step ${exactAt + 1} (no later) ${exactAt <= inOrderAt ? '✓' : '✗'} and stayed exact ${after ? '✓' : '✗'}`
            : `the path edges were **not** relaxed in order (only #1…#${f.nextIdx - 1} of ${k} so far), and ${exactAt == null ? `$d[${t}]$ never reached $\\delta$ — the lemma's hypothesis is what made it work` : `$d[${t}]$ happened to become exact at step ${exactAt + 1} through other relaxations`}`;
          return `now $d[${t}] = ${tnum(f.d[t])}$, $\\delta(s,${t}) = ${tnum(delta)}$ · ${status} · estimates never increase ${conv ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.5
    {
      num: '9.5',
      kind: 'Algorithm',
      name: 'Shortest paths in a DAG',
      statement: String.raw`**Input:** a weighted directed acyclic graph $G$ (weights may be negative) and a source $s$. **Algorithm:** topologically sort the vertices (8.13), set $d[s]=0$ and $d[v]=\infty$ otherwise, then take the vertices in topological order and relax every edge leaving each one. **Output:** $d[v]=\delta(s,v)$ for all $v$, with the predecessor pointers forming a shortest-path tree. The running time is $O(n+m)$: one topological sort, then one relaxation per edge.

Negating every weight turns the same sweep into a **longest-path** algorithm for DAGs, the basis of critical-path scheduling. In a general graph, by contrast, finding a longest simple path is NP-hard.`,
      idea: String.raw`A DAG has no cycles, let alone negative ones, so every $\delta(s,v)$ is $\infty$ or a finite minimum. Every path visits its vertices in topological order. So for a shortest path $s=v_0,\dots,v_k$ the sweep relaxes $v_0v_1$, then $v_1v_2$, and so on, in exactly the order the path-relaxation property (9.4) asks for, and $d[v_k]$ comes out exact. Equivalently, when the sweep reaches $u$, every edge into $u$ comes from an earlier vertex and has already been relaxed, so $d[u]=\min_{x\to u}\{d[x]+w(x,u)\}$ is final: the dynamic program of 7.2, evaluated in topological order.`,
      caption: String.raw`The DAG is drawn along its topological order, computed by DFS finishing times; the node list is deliberately scrambled. Step through the sweep: the gold vertex is being processed, filled vertices are final, and green edges form the shortest-path tree. **Click a weight** to change it (negative values are fine). Switch to **longest paths** for the critical path. Turn on the **back edge** t → a: it closes a cycle, the topological sort fails, and the method no longer applies. The readout checks every distance against brute force.`,
      deps: ['algo-9.4', 'algo-8.13'],
      refs: ['CLRS 4e §22.2', 'Erickson Ch. 8'],
      tags: ['shortest paths', 'dags'],
      viz(v) {
        const goal = v.select('compute', [{ value: 1, label: 'shortest paths' }, { value: -1, label: 'longest paths' }], 1, { onChange: () => S.reset({ at: 'end' }) });
        const back = v.toggle('add the back edge t → a', false, { onChange: () => { if (back.value) G.addEdge('t', 'a', 1); else G.removeEdge(G.edge('t', 'a')); S.reset({ at: 'end' }); } });
        const s = v.stage({ x: [0, 10], y: [0.2, 4.15], axes: false, height: 240 });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', editable: { editWeight: true, minWeight: -9, maxWeight: 9 }, draggable: false, nodes: N95.map((id) => ({ id, x: 5, y: 2.1, notePos: 's' })), edges: E95.map(([a, b, w]) => [a, b, w]) });
        let run = null, order = null;
        const place = () => {
          const o = topoOrder(G); if (o) order = o; if (!order) return;
          const pos = new Map(order.map((u, i) => [u, i]));
          G.nodes.forEach((n) => { n.x = 0.7 + (8.6 * pos.get(K(n.id))) / (order.length - 1); n.y = 2.1; });
          let up = true;
          for (const e of G.edges) {
            const a = pos.get(K(e.from)), b = pos.get(K(e.to)), span = Math.abs(b - a);
            if (span <= 1) { e.bend = 0; continue; }
            const leftIsP = K(e.from) < K(e.to) ? a < b : b < a, m = 6 + 15 * span;
            e.bend = up ? (leftIsP ? -m : m) : leftIsP ? m : -m; up = !up;
          }
        };
        const frames = () => { place(); run = dagRun(G, 's', +goal.value); return run.frames; };
        const S = v.steps({ frames, code: DAG_CODE, codeTitle: 'DAG-Shortest-Paths(G, s)', codePos: 'below', speed: 2.5, start: 'end', still: 'end' });
        G.onChange = () => S.reset({ at: 'end' });
        v.render(() => {
          const f = S.frame, sign = +goal.value;
          if (f.cyc) {
            const cyc = simpleCycles(G)[0], ce = new Set(cyc ? pathEdges(G, cyc.nodes.concat([cyc.nodes[0]])) : []);
            G.draw({ edgeColor: (e) => (ce.has(e) ? 'red' : null), edgeWidth: (e) => (ce.has(e) ? 4 : null), nodeColor: (id) => (cyc && cyc.nodes.includes(K(id)) ? 'red' : null) });
            s.corner('cycle: no topological order', 'tl', { color: 'red', weight: 700, plate: true });
            return;
          }
          const done = new Set(f.done), tree = new Set(Object.values(f.prevEdge).filter(Boolean));
          G.draw({
            nodeFill: (id) => (K(id) === K(f.u) && !f.end ? 'gold' : done.has(K(id)) ? 'accent' : null),
            nodeColor: (id) => (f.d[K(id)] < INF ? 'orange' : null),
            nodeRing: (id) => (K(id) === 's' ? 'ink' : null),
            nodeNote: (id) => fmt(sign * f.d[K(id)]),
            noteColor: (id) => (done.has(K(id)) ? 'accent' : f.d[K(id)] < INF ? 'orange' : 'faint'),
            edgeColor: (e) => (e === f.edge ? (f.better ? 'gold' : 'red') : tree.has(e) ? 'green' : null),
            edgeWidth: (e) => (e === f.edge ? 4.5 : tree.has(e) ? 3.4 : null),
          });
          run.order.forEach((u, i) => s.text(`${i + 1}`, G.node(u).x, 3.95, { align: 'center', size: 11, color: 'faint' }));
          s.corner('topological order →', 'bl', { size: 11.5, color: 'muted' });
        });
        v.legend([['gold', 'processing now', { dot: true }], ['accent', 'final', { dot: true }], ['orange', 'tentative estimate', { dot: true }], ['green', 'path tree'], ['ink', 'source s (ring)', { dot: true }]]);
        v.readout(() => {
          const f = S.frame; if (!run) return '';
          if (f.cyc) return 'with the edge t → a there is a cycle a → d → t → a (or similar): DFS finds a back edge, there is no topological order, and the one-sweep method has nothing to work with ✗';
          const sign = +goal.value, I = ids(G).map(K);
          let truth;
          if (sign > 0) truth = bruteSP(G, 's').dist;
          else { truth = {}; for (const u of I) { const ps = simplePaths(G, 's', u, 5000); truth[u] = ps.length ? Math.max(...ps.map((p) => p.w)) : -INF; } }
          const got = (u) => sign * f.d[u];
          const ok = f.end ? I.every((u) => got(u) === truth[u]) : null;
          return `${f.done.length} of ${I.length} vertices processed, ${plural(f.rel, 'relaxation')} so far (the whole sweep uses exactly $m$ = ${G.edges.length}) · ${f.end ? `${sign > 0 ? 'shortest' : 'longest'} distances in topological order ${run.order.map((u) => `${u} ${fmt(got(u))}`).join(', ')} — brute force over all simple paths agrees ${ok ? '✓' : '✗'}` : 'step to the end for the check'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.6
    {
      num: '9.6',
      kind: 'Algorithm',
      name: 'Bellman–Ford as dynamic programming',
      statement: String.raw`Let $d_k(v)$ be the least weight of a walk from $s$ to $v$ that uses **at most $k$ edges**. Then $d_0(s)=0$, $d_0(v)=\infty$ for $v\ne s$, and
$$d_k(v)=\min\Big\{\,d_{k-1}(v),\ \min_{u\to v\in E}\big(d_{k-1}(u)+w(u,v)\big)\Big\}.$$
If no negative cycle is reachable from $s$, a shortest path is simple and has at most $n-1$ edges, so $\delta(s,v)=d_{n-1}(v)$. Filling the table row by row costs $O(m)$ per row, $O(nm)$ in all, with $O(n)$ space if only the last row is kept. The **Bellman–Ford algorithm** is this dynamic program run in place: $n-1$ rounds, each relaxing every edge once. Updating in place can only make the estimates converge sooner.`,
      idea: String.raw`A walk with at most $k$ edges either has at most $k-1$ (giving $d_{k-1}(v)$) or ends with an edge $u\to v$ after a walk of at most $k-1$ edges to $u$; that is the recurrence. Subpaths of shortest paths are shortest (9.2), so the best such walk to $u$ costs exactly $d_{k-1}(u)$. With no negative cycle, nothing is gained beyond $n-1$ edges, so the rows stop changing by row $n-1$ and row $n$ repeats it. A change in row $n$ is therefore a certificate of a negative cycle (9.7). Bellman (1958) and Ford (1956) gave the method; Moore (1959) and Shimbel (1955) found it independently.`,
      caption: String.raw`The table has one row per edge budget $k$ and one column per vertex. Step through it cell by cell. For the gold cell, the in-edges of its vertex light up on the graph with the candidates $d_{k-1}(u)+w$, and the cells of row $k-1$ it reads are outlined. Orange cells improved on the row above. **Click a weight** to edit it: the rows always stop changing by row $n-1$ = 6. Make the triangle a → c → b negative (lower c → b to −5), and row $n$ = 7 keeps changing.`,
      deps: ['algo-9.4', 'algo-7.2'],
      refs: ['CLRS 4e §22.1', 'KT §6.8'],
      tags: ['shortest paths', 'dynamic programming'],
      credit: 'Shimbel 1955; Ford 1956; Bellman 1958; Moore 1959',
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 300, weight: 1.05 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.15 });
        const G = graphA(v, s, { editable: { editWeight: true, minWeight: -9, maxWeight: 9 } });
        let run = null;
        const S = v.steps({ frames: () => (run = bfTable(G, 's')).frames, code: BFDP_CODE, codeTitle: 'Bellman–Ford as a table', codePos: 'below', speed: 6, start: 'end', still: 'end' });
        G.onChange = () => S.reset({ at: 'end' });
        const T = v.table(ts, { rows: 8, cols: 7, square: false, maxCell: 40, cellAspect: 1.2, size: 13.5, labelSize: 12 });
        v.render(() => {
          const f = S.frame, { I, n } = run, cand = new Map((f.cand || []).map((c) => [c.edge, c]));
          const curV = f.j >= 0 ? I[f.j] : null;
          G.draw({
            nodeFill: (id) => (K(id) === curV ? 'gold' : null),
            nodeRing: (id) => (K(id) === 's' ? 'ink' : null),
            nodeColor: (id) => ((f.cand || []).some((c) => c.u === K(id)) ? 'accent' : null),
            nodeNote: (id) => { const row = f.D[f.k]; const j = I.indexOf(K(id)); return row && row[j] != null ? fmt(row[j]) : fmt(f.D[f.k - 1]?.[j]); },
            noteColor: () => 'orange',
            edgeColor: (e) => (cand.has(e) ? (f.via && f.via.edge === e ? 'green' : 'accent') : null),
            edgeWidth: (e) => (cand.has(e) ? 4 : null),
            edgeLabel: (e) => (cand.has(e) ? `${fmt(W(e))} → ${fmt(cand.get(e).val)}` : fmt(W(e))),
          });
          const rowsDone = f.D.length;
          let stable = null; for (let k = 1; k < rowsDone; k++) if (f.D[k].every((x, j) => x != null && x === f.D[k - 1][j])) { stable = k; break; }
          T.draw({
            rows: n + 1, cols: n,
            value: (i, j) => (f.D[i] && f.D[i][j] != null ? f.D[i][j] : null),
            fill: (i, j) => (i === f.k && j === f.j ? ['gold', 0.55] : f.D[i] && f.D[i][j] != null && i > 0 && f.D[i][j] < f.D[i - 1][j] ? (i === n ? ['red', 0.4] : ['orange', 0.3]) : null),
            highlight: f.j >= 0 ? [[f.k, f.j, 'gold'], [f.k - 1, f.j, 'accent'], ...(f.cand || []).map((c) => [f.k - 1, I.indexOf(c.u), 'accent'])] : [],
            rowLabels: (k) => (k === n ? `k = ${k} (check)` : `k = ${k}`),
            rowLabelColor: (k) => (k === n ? 'red' : stable != null && k >= stable ? 'green' : 'muted'),
            colLabels: (j) => I[j],
          });
        });
        v.legend([['gold', 'cell being filled'], ['accent', 'cells and edges it reads'], ['orange', 'improved on the row above', { area: true }], ['green', 'rows that no longer change (labels)']]);
        v.readout(() => {
          const f = S.frame, { I, n, D } = run;
          const B = bruteSP(G, 's'), last = D[n - 1], chk = D[n];
          let stable = null; for (let k = 1; k <= n; k++) if (D[k].every((x, j) => x === D[k - 1][j])) { stable = k - 1; break; }
          const neg = chk.some((x, j) => x < last[j]);
          const okRow = I.every((u, j) => B.dist[u] === -INF || last[j] === B.dist[u]);
          return `${n} vertices, so $n - 1$ = ${n - 1} rounds · the rows ${stable != null ? `stop changing after row **${stable}**` : '**never** stop changing'} · ${neg ? `row ${n} still improves (${I.filter((u, j) => chk[j] < last[j]).join(', ')}): a negative cycle is reachable — brute force finds ${plural(B.cycles.length, 'negative cycle')} ${B.cycles.length ? '✓' : '✗'}` : `row ${n} repeats row ${n - 1} ✓ and row ${n - 1} matches brute force over all simple paths ${okRow ? '✓' : '✗'}`} · ${n + 1} rows × ${G.edges.length} edges: $O(nm)$ work`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.7
    {
      num: '9.7',
      kind: 'Theorem',
      name: 'Bellman–Ford detects negative cycles',
      statement: String.raw`Run $n-1$ rounds of Bellman–Ford from $s$, then one more pass over the edges.
(a) If no negative cycle is reachable from $s$, then no edge is tense in that pass, and $d[v]=\delta(s,v)$ for all $v$.
(b) If a negative cycle is reachable from $s$, then some edge $u\to v$ still has $d[u]+w(u,v)<d[v]$.
In case (b), relax that edge and walk back $n$ steps along predecessor pointers from $v$; the walk ends on a cycle of the predecessor graph, and that cycle has negative weight. So Bellman–Ford either returns all distances or exhibits a negative cycle, in $O(nm)$ time.`,
      idea: String.raw`(a) is 9.6: after $n-1$ rounds every estimate is exact, and an exact estimate cannot be lowered. For (b), let $C=v_0v_1\cdots v_k=v_0$ be a reachable negative cycle, and suppose no edge of $C$ were tense: $d[v_i]\le d[v_{i-1}]+w(v_{i-1},v_i)$ for all $i$. All these values are finite, since $C$ is reachable. Summing around the cycle, the $d$ terms cancel and leave $0\le w(C)<0$, a contradiction. For the certificate: any cycle in the predecessor graph is negative, and after an improving relaxation, $n$ steps back along $\pi$ must repeat a vertex.`,
      caption: String.raw`**Drag the slider** to change the weight of z → x, which closes the cycle x → y → z → x. Step through the rounds: orange edges improved an estimate in that round. The chart plots every vertex's estimate round by round, continuing past round $n-1$ (dashed line). Once the cycle weighs less than 0, the lines never level off. In the check round the red edges are still tense, and the predecessor walk traces the negative cycle in thick red.`,
      deps: ['algo-9.6'],
      refs: ['CLRS 4e §22.1', 'KT §6.10'],
      tags: ['shortest paths', 'negative cycles'],
      viz(v) {
        const wz = v.slider('weight of z → x', -7, 4, -5, { int: true, onChange: () => { G.edge('z', 'x').w = wz.value; S.reset({ at: 'end' }); } });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 300, weight: 1.3 });
        const ch = v.stage({ x: [0, 14], y: [-10, 12], axes: 'box', gutter: true, height: 300, xlabel: 'round', ylabel: 'estimate d[v]', title: 'estimates, round by round' });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', nodes: nodesAt(P97, { s: { notePos: 'n' }, b: { notePos: 's' }, z: { notePos: 's' }, t: { notePos: 's' } }), edges: E97.map(([a, b, w]) => [a, b, w]) });
        let run = null;
        const S = v.steps({ frames: () => (run = bellmanFord(G, 's', { extra: 2 * G.nodes.length })).frames, code: BF_CODE, codeTitle: 'Bellman–Ford(G, s)', codePos: 'below', speed: 1.2, start: 'end', still: 'end' });
        const I = ids(G).map(K), n = I.length;
        v.render(() => {
          const f = S.frame, cyc = f.cycle ? new Set(pathEdges(G, f.cycle.concat([f.cycle[0]]))) : new Set(), tree = new Set(Object.values(f.prevEdge).filter(Boolean));
          G.draw({
            nodeFill: (id) => (K(id) === 's' ? 'accent' : null),
            nodeColor: (id) => (f.cycle && f.cycle.includes(K(id)) ? 'red' : f.dist[K(id)] < INF ? 'orange' : null),
            nodeNote: (id) => fmt(f.dist[K(id)]),
            noteColor: (id) => (f.dist[K(id)] === INF ? 'faint' : 'orange'),
            edgeColor: (e) => (cyc.has(e) ? 'red' : f.bad && f.bad.has(e) ? 'red' : f.improved.has(e) ? 'orange' : tree.has(e) ? 'green' : null),
            edgeWidth: (e) => (cyc.has(e) ? 5.5 : f.bad && f.bad.has(e) ? 3 : f.improved.has(e) ? 3.6 : tree.has(e) ? 2.6 : null),
            edgeDash: (e) => (f.bad && f.bad.has(e) && !cyc.has(e) ? [6, 4] : null),
          });
          // history chart
          const H = run.history, Rn = H.length - 1, vals = H.flatMap((h) => I.map((u) => h[u]).filter((y) => y < INF));
          const lo = Math.min(...vals), hi = Math.max(...vals);
          ch.setView([0, Rn + 1.6], [lo - 0.08 * (hi - lo + 1), hi + 0.08 * (hi - lo + 1)]);
          ch.vband(f.round - 0.5, f.round + 0.5, { color: 'gold', alpha: 0.16, edges: false });
          ch.vline(n - 1, { color: 'ink', width: 1.4, dash: [5, 4] });
          ch.text('round n − 1', n - 1, lo, { align: 'right', baseline: 'bottom', dx: -4, dy: -4, size: 11, color: 'ink', plate: true });
          I.forEach((u, k) => {
            const pts = H.map((h, r) => (h[u] < INF ? [r, h[u]] : null));
            const col = VCOL[(k + 1) % VCOL.length];
            ch.path(pts, { color: col, width: 2, alpha: 0.9 });
            const lastPt = pts[pts.length - 1]; if (lastPt) ch.text(u, Rn + 0.3, lastPt[1], { size: 11.5, color: col, align: 'left' });
          });
        });
        v.legend([['orange', 'improved this round'], ['red', 'tense in the check round / negative cycle'], ['green', 'predecessor edges'], ['gold', 'current round', { area: true }]]);
        v.readout(() => {
          const f = S.frame; if (!run) return '';
          const B = bruteSP(G, 's'), wc = cycleW(G, ['x', 'y', 'z']);
          if (run.cycle) {
            const cw = cycleW(G, run.cycle);
            return `cycle x → y → z → x weighs ${fmt(wc)} · check round: ${plural([...run.frames[run.frames.length - 1].bad].length, 'edge')} still tense → negative cycle ${run.cycle.join(' → ')} → ${run.cycle[0]} of weight **${fmt(cw)}** ${cw < 0 ? '✓' : '✗'} · brute force over simple cycles: ${plural(B.cycles.length, 'negative cycle')} reachable from s ${B.cycles.length ? '✓' : '✗'} · past round $n-1$ the estimates keep falling forever`;
          }
          const ok = I.every((u) => run.dist[u] === B.dist[u]);
          return `cycle x → y → z → x weighs ${fmt(wc)} ≥ 0 · estimates stop changing after round ${run.stable ? run.stable - 1 : n - 1} ≤ $n - 1$ = ${n - 1} · check round: nothing tense ✓ · brute force: no negative cycle ${B.cycles.length ? '✗' : '✓'}, and every $d[v]$ equals $\\delta(s,v)$ ${ok ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.8
    {
      num: '9.8',
      kind: 'Algorithm',
      name: 'Dijkstra’s algorithm',
      statement: String.raw`**Input:** a directed graph with **nonnegative** weights and a source $s$. **Algorithm:** keep the unsettled vertices with finite estimates in a min-priority queue keyed by $d$. Start with $d[s]=0$ and $Q=\{s\}$. Repeatedly extract the vertex $u$ with the smallest estimate, declare it **settled**, and relax every edge from $u$ to an unsettled vertex, inserting a vertex into $Q$ or decreasing its key when its estimate drops. **Output:** $d[v]=\delta(s,v)$ for every $v$, with $\pi$ giving a shortest-path tree.

With a binary heap (algo-3.8) there are at most $n$ inserts and extract-mins and at most $m$ decrease-keys, each $O(\log n)$: $O((n+m)\log n)$ time. A Fibonacci heap makes decrease-key $O(1)$ amortized, for $O(m+n\log n)$. An unsorted array gives $O(n^2)$, which is better for dense graphs.`,
      idea: String.raw`Dijkstra's algorithm is relaxation (9.3) with a greedy choice of order: always continue from the unsettled vertex that looks closest. With nonnegative weights, the settled vertices are exactly those nearest to $s$, settled in order of distance. Each settled vertex already has its final estimate when its edges are relaxed, so every shortest path gets its edges relaxed in order, as 9.4 requires. The proof that the greedy choice is safe is 9.9; with a negative edge it is not (9.10). The priority queue only makes "find the closest unsettled vertex" fast.`,
      caption: String.raw`Step through Dijkstra's algorithm. The blue region holds the settled vertices, whose distances are final. Orange-ringed vertices wait in the priority queue, drawn below as a binary heap (tree and array) with keys $d[v]$. Gold marks the vertex being extracted or the edge being relaxed. **Drag nodes**, or **click a weight** to change it (0–12). The readout counts heap operations and checks the result against Bellman–Ford.`,
      deps: ['algo-9.4', 'algo-3.8'],
      refs: ['CLRS 4e §22.3', 'KT §4.4'],
      tags: ['shortest paths', 'greedy', 'priority queues'],
      credit: 'Dijkstra, 1959',
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320 });
        const hp = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 190, full: true });
        const G = v.graph(s, { directed: true, weights: true, layout: 'none', editable: { editWeight: true, minWeight: 0, maxWeight: 12 }, nodes: nodesAt(P98, { s: { notePos: 'w' }, b: { notePos: 's' }, e: { notePos: 's' }, t: { notePos: 's' } }), edges: E98.map(([a, b, w]) => [a, b, w]) });
        let run = null;
        const S = v.steps({ frames: () => (run = dijkstra(G, 's')).frames, code: DIJ_CODE, codeTitle: 'Dijkstra(G, s)', codePos: 'below', speed: 2, start: 17, still: 17 });
        G.onChange = (k) => { if (k !== 'move') S.reset({ at: 'keep' }); };
        v.render(() => {
          const f = S.frame, done = new Set(f.settled), inQ = new Set(f.heap), tree = new Set(Object.values(f.prevEdge).filter(Boolean));
          const cur = f.type === 'extract' ? f.u : null;
          blob(v, s, G.nodes.filter((n) => done.has(K(n.id))).map((n) => [n.x, n.y]), 24, { color: 'accent', alpha: 0.1 });
          G.draw({
            nodeFill: (id) => (K(id) === cur ? 'gold' : done.has(K(id)) ? 'accent' : null),
            nodeColor: (id) => (inQ.has(K(id)) ? 'orange' : null),
            nodeRing: (id) => (inQ.has(K(id)) ? 'orange' : null),
            nodeNote: (id) => fmt(f.dist[K(id)]),
            noteColor: (id) => (done.has(K(id)) ? 'accent' : f.dist[K(id)] < INF ? 'orange' : 'faint'),
            edgeColor: (e) => (e === f.edge ? (f.type === 'relax' ? (f.improved ? 'gold' : 'red') : 'muted') : tree.has(e) ? 'green' : null),
            edgeWidth: (e) => (e === f.edge ? 4.5 : tree.has(e) ? 3.2 : null),
            edgeDash: (e) => (e === f.edge && !f.improved ? [5, 4] : null),
          });
          // heap + settled order
          const Wd = hp.width, half = Math.min(Wd * 0.58, 520);
          TX(hp, 'priority queue (binary min-heap, key = d)', 14, 12, { size: 12, weight: 600, color: 'muted' });
          heapPic(hp, f.heap, (x) => f.dist[x], 14, 22, half - 20, hp.height - 26, { hot: (x) => (x === f.v && f.improved ? 'gold' : null) });
          TX(hp, 'settled, in order of distance', half + 16, 12, { size: 12, weight: 600, color: 'muted' });
          strip(hp, f.settled.map((x) => ({ label: x, fill: x === cur ? 'gold' : 'accent', note: fmt(f.dist[x]), noteColor: 'accent' })), half + 16, 30, { w: 32, h: 26, maxW: Wd - half - 30 });
          const ops = f.ops; TX(hp, `inserts ${ops.ins} · extract-mins ${ops.ext}`, half + 16, 96, { size: 12, color: 'ink' }); TX(hp, `decrease-keys ${ops.dec} · relaxations ${ops.rel}`, half + 16, 116, { size: 12, color: 'ink' });
        });
        v.legend([['accent', 'settled (final)', { area: true }], ['orange', 'in the queue (ring)', { dot: true }], ['gold', 'current vertex / edge'], ['green', 'shortest-path tree']]);
        v.readout(() => {
          const f = S.frame; if (!run) return '';
          const bf = bellmanFord(G, 's'), I = ids(G).map(K), ok = I.every((u) => run.dist[u] === bf.dist[u]);
          const n = I.length, m = G.edges.length, o = run.ops;
          const mono = f.settled.every((x, i) => i === 0 || f.dist[x] >= f.dist[f.settled[i - 1]]);
          return `settled so far in non-decreasing order of distance ${mono ? '✓' : '✗'} · whole run: ${o.ins} inserts ≤ n = ${n}, ${o.ext} extract-mins, ${o.dec} decrease-keys ≤ m = ${m}, each $O(\\log n)$ · final distances ${I.map((u) => `${u} ${fmt(run.dist[u])}`).join(', ')} — Bellman–Ford agrees ${ok ? '✓' : '✗'}`;
        });
      },
    },
  ],
};
