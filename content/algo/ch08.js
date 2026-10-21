// Algorithms — Chapter 8: Graph search (items 8.1–8.10; 8.11–8.20 in ch08-b.js)
import { K, COMP, LAYER, KIND_COL, clamp, plural, ids, nodesAt, DFS_CODE, dfsTrace, dfsView, isAnc, kindByTimes, closure, relaxDist, twoColourings, blob, strip, arcPx } from './ch08.shared.js';

const NAMES = 'abcdefghijklmnopqrstuvwxyz';
/** Keep a picked vertex valid after edits. */
const validPick = (G, id, k = 0) => (G.has(id) ? id : (ids(G)[k] ?? null));
/** Pixel helpers for a [0,1]² stage used as a free canvas. */
const R = (s, X0, Y0, X1, Y1, st) => s.rect(s.invX(X0), s.invY(Y1), s.invX(X1), s.invY(Y0), st);
const L = (s, X0, Y0, X1, Y1, st) => s.line(s.invX(X0), s.invY(Y0), s.invX(X1), s.invY(Y1), st);
const T = (s, str, X, Y, st) => s.textPx(String(str), X, Y, st);

// ---------------------------------------------------------------- 8.1
const P81 = { a: [1.0, 4.6], b: [3.1, 5.3], c: [2.5, 2.9], d: [4.9, 3.9], e: [5.3, 1.5], f: [1.2, 1.1], g: [7.0, 4.9], h: [7.6, 2.2], i: [9.2, 3.6], j: [9.1, 1.0] };
const E81 = [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['c', 'f'], ['d', 'e'], ['f', 'e'], ['d', 'g'], ['h', 'i'], ['i', 'j'], ['h', 'j']];

// ---------------------------------------------------------------- 8.3 whatever-first search
const P83 = { s: [0.7, 3.0], a: [2.6, 5.2], b: [2.4, 0.9], c: [4.5, 3.1], d: [5.4, 5.4], e: [6.0, 0.9], f: [7.3, 3.2], g: [9.3, 5.1], h: [9.3, 1.2] };
const E83 = [['s', 'a', 4], ['s', 'b', 2], ['s', 'c', 7], ['a', 'c', 3], ['a', 'd', 5], ['b', 'c', 1], ['b', 'e', 6], ['c', 'd', 2], ['c', 'e', 4], ['c', 'f', 5], ['d', 'f', 3], ['d', 'g', 8], ['e', 'f', 2], ['e', 'h', 7], ['f', 'g', 1], ['f', 'h', 4], ['g', 'h', 3]];
const WFS_CODE = [
  'put (∅, s) in the bag',
  'while the bag is not empty:',
  '  take some (p, v) out of the bag          ▷ the bag decides which',
  '  if v is unmarked:',
  '    mark v;  parent(v) ← p',
  '    for each edge vw with w unmarked:  put (v, w) in the bag',
];
const BAGS = { stack: 'stack', queue: 'queue', pq: 'priority queue' };
/** Erickson's whatever-first search with a stack, a queue, or a priority queue keyed by edge weight. */
function wfs(G, src, bag) {
  const items = [{ p: null, v: src, w: 0, seq: 0, edge: null }], mark = {}, pe = {}, parent = {}, order = [], F = []; let seq = 1;
  const snap = (e) => F.push({ ...e, bag: items.slice(), mark: { ...mark }, pe: { ...pe }, parent: { ...parent }, order: order.slice() });
  snap({ line: 1, note: `Put the pair (∅, ${G.lab(src)}) in the bag.` });
  while (items.length) {
    let k = 0;
    if (bag === 'stack') k = items.length - 1;
    else if (bag === 'pq') items.forEach((it, i) => { if (it.w < items[k].w || (it.w === items[k].w && it.seq < items[k].seq)) k = i; });
    const it = items.splice(k, 1)[0], v = K(it.v);
    if (mark[v]) { snap({ took: it, line: [3, 4], note: `Take (${G.lab(it.p)}, ${G.lab(it.v)}) — but ${G.lab(it.v)} is already marked: throw it away.` }); continue; }
    mark[v] = true; pe[v] = it.edge; parent[v] = it.p; order.push(it.v);
    const add = G.adj(it.v).filter(({ id }) => !mark[K(id)]).map(({ id, edge, w }) => ({ p: it.v, v: id, w, seq: seq++, edge }));
    items.push(...add);
    snap({ took: it, added: add, line: [3, 5, 6], note: `Take (${it.p == null ? '∅' : G.lab(it.p)}, ${G.lab(it.v)}): mark **${G.lab(it.v)}**${it.p == null ? '' : `, parent ${G.lab(it.p)}`}; put ${add.length ? add.map((a) => `(${G.lab(a.p)}, ${G.lab(a.v)})`).join(', ') : 'nothing'} in the bag.` });
  }
  snap({ line: 2, done: true, note: `The bag is empty: ${order.length} vertices marked, and the parent edges form a spanning tree of them.` });
  return F;
}
function treeStats(G, src, pe) {
  const parent = {}; for (const [v, e] of Object.entries(pe)) if (e) parent[v] = K(e.from) === v ? K(e.to) : K(e.from);
  let depth = 0, weight = 0;
  for (const v of Object.keys(pe)) { let d = 0, x = v; while (parent[x] != null && d < 99) { x = parent[x]; d++; } depth = Math.max(depth, d); if (pe[v]) weight += pe[v].w ?? 1; }
  return { depth, weight, n: Object.keys(pe).length };
}

// ---------------------------------------------------------------- 8.4 BFS
const P84 = { s: [0.8, 3.0], a: [2.5, 4.9], b: [2.5, 1.1], c: [4.3, 3.0], d: [4.5, 5.4], e: [4.6, 0.6], f: [6.3, 4.2], g: [6.4, 1.8], h: [8.0, 5.2], i: [8.2, 3.0], j: [8.0, 0.8], k: [9.6, 2.0] };
const E84 = [['s', 'a'], ['s', 'b'], ['s', 'c'], ['a', 'd'], ['a', 'c'], ['b', 'e'], ['c', 'f'], ['c', 'g'], ['d', 'f'], ['e', 'g'], ['f', 'h'], ['f', 'i'], ['g', 'i'], ['g', 'j'], ['i', 'k'], ['j', 'k'], ['h', 'i']];

// ---------------------------------------------------------------- 8.5 grid search
const BFS_CODE = ['for each vertex u:  d[u] ← ∞', 'd[s] ← 0;  Q ← ⟨s⟩', 'while Q is not empty:', '  u ← dequeue(Q)                 ▷ first in, first out', '  for each neighbour v of u:', '    if d[v] = ∞:', '      d[v] ← d[u] + 1;  enqueue(Q, v)'];
const LIFO_CODE = BFS_CODE.map((l, i) => (i === 3 ? '  u ← pop(Q)                     ▷ a stack: last in, first out' : l));
function gridRun(G, src, walls, lifo) {
  const lab = {}, F = []; let bag = [src], maxDistinct = 1, maxBag = 1; lab[K(src)] = 0;
  const comp = () => { const ls = bag.map((x) => lab[K(x)]), lo = Math.min(...ls); return [ls.filter((x) => x === lo).length, ls.filter((x) => x === lo + 1).length, ls.filter((x) => x > lo + 1).length, new Set(ls).size, lo]; };
  F.push({ lab: { ...lab }, bag: bag.slice(), comp: comp(), line: [1, 2], note: 'The source gets label 0 and is the only vertex in the bag.' });
  while (bag.length) {
    const u = lifo ? bag.pop() : bag.shift(), found = [];
    for (const { id } of G.adj(u)) if (!walls.has(K(id)) && lab[K(id)] == null) { lab[K(id)] = lab[K(u)] + 1; bag.push(id); found.push(id); }
    const c = bag.length ? comp() : [0, 0, 0, 0, 0]; maxDistinct = Math.max(maxDistinct, c[3]); maxBag = Math.max(maxBag, bag.length);
    F.push({ u, found, lab: { ...lab }, bag: bag.slice(), comp: c, line: [4, 5, 6, 7], note: `${lifo ? 'Pop' : 'Dequeue'} a cell with label ${lab[K(u)]}${found.length ? `; ${plural(found.length, 'new neighbour')} get${found.length === 1 ? 's' : ''} label ${lab[K(u)] + 1}` : '; no new neighbours'}. ${lifo ? 'Bag' : 'Queue'} size ${bag.length}${bag.length ? `, labels ${c[3] === 1 ? `all ${c[4]}` : `from ${c[4]} to ${Math.max(...bag.map((x) => lab[K(x)]))}`}` : ''}.` });
  }
  F.push({ lab: { ...lab }, bag: [], comp: [0, 0, 0, 0, 0], done: true, line: 3, note: lifo ? 'The stack is empty. Every reachable cell has a label — but compare the labels with the true distances.' : 'The queue is empty: every reachable cell carries its label, and each label is checked against the true distance.' });
  F.maxDistinct = maxDistinct; F.maxBag = maxBag;
  return F;
}

// ---------------------------------------------------------------- 8.6 bipartiteness
const P86 = { a: [0.9, 3.2], b: [2.6, 5.2], c: [2.6, 1.2], d: [4.6, 5.3], e: [4.6, 3.2], f: [4.6, 1.1], g: [6.6, 4.4], h: [6.6, 2.0], i: [8.5, 5.0], j: [8.6, 3.0], k: [8.5, 0.9] };
const E86 = [['a', 'b'], ['a', 'c'], ['b', 'd'], ['b', 'e'], ['c', 'e'], ['c', 'f'], ['d', 'g'], ['e', 'g'], ['e', 'h'], ['f', 'h'], ['g', 'i'], ['g', 'j'], ['h', 'j'], ['h', 'k']];
const BIP_CODE = [
  'for each vertex s that has no colour yet:',
  '  colour[s] ← 0;  layer[s] ← 0;  Q ← ⟨s⟩',
  '  while Q is not empty:  u ← dequeue(Q)',
  '    for each neighbour w of u:',
  '      if w has no colour:  colour[w] ← 1 − colour[u];  layer[w] ← layer[u] + 1;  enqueue w',
  '      elif colour[w] = colour[u]:  conflict — an odd cycle',
  'no conflict ⇒ the two colour classes are a bipartition',
];
function bipRun(G) {
  const col = {}, lay = {}, par = {}, root = {}, F = [], bad = [];
  const snap = (e) => F.push({ ...e, col: { ...col }, lay: { ...lay }, par: { ...par }, bad: bad.slice() });
  snap({ line: 1, note: 'No vertex is coloured yet.' });
  for (const s0 of ids(G)) {
    if (col[K(s0)] != null) continue;
    col[K(s0)] = 0; lay[K(s0)] = 0; par[K(s0)] = null; root[K(s0)] = s0; const Q = [s0];
    snap({ u: s0, line: 2, note: `New component: colour ${G.lab(s0)} blue, layer 0.` });
    while (Q.length) {
      const u = Q.shift(), found = [], conf = [];
      for (const { id: w, edge } of G.adj(u)) {
        if (col[K(w)] == null) { col[K(w)] = 1 - col[K(u)]; lay[K(w)] = lay[K(u)] + 1; par[K(w)] = u; Q.push(w); found.push(w); }
        else if (col[K(w)] === col[K(u)] && !bad.includes(edge)) { bad.push(edge); conf.push(w); }
      }
      snap({ u, line: conf.length ? [4, 6] : [3, 4, 5], note: `Dequeue ${G.lab(u)} (layer ${lay[K(u)]})${found.length ? `: ${found.map((w) => G.lab(w)).join(', ')} get the opposite colour, layer ${lay[K(u)] + 1}` : ''}${conf.length ? `. **Conflict:** ${conf.map((w) => `${G.lab(u)}–${G.lab(w)}`).join(', ')} joins two vertices of the same colour (same layer ${lay[K(u)]})` : found.length ? '' : ': nothing new'}.` });
    }
  }
  snap({ line: 7, done: true, note: bad.length ? `${plural(bad.length, 'conflict edge')}: the graph is **not bipartite**; the red odd cycle proves it.` : 'No conflicts: blue and orange are the two sides of a bipartition.' });
  return F;
}
/** Odd cycle closed by the same-layer edge e, through the BFS tree. */
function oddCycle(par, lay, e) {
  let a = K(e.from), b = K(e.to); const A = [a], B = [b];
  while (a !== b) { if (lay[a] >= lay[b]) { a = K(par[a]); A.push(a); } else { b = K(par[b]); B.push(b); } }
  if (A[A.length - 1] === B[B.length - 1]) B.pop();
  return A.concat(B.reverse());
}

// ---------------------------------------------------------------- 8.7 / 8.8 / 8.10 directed sample graphs
const P87 = { a: [0.9, 4.4], b: [3.5, 5.4], c: [6.2, 4.4], d: [9.2, 5.1], e: [0.9, 1.1], f: [3.5, 1.0], g: [6.2, 1.2], h: [9.2, 1.4] };
const E87 = [['a', 'b'], ['a', 'e'], ['a', 'f'], ['b', 'c'], ['b', 'f'], ['c', 'a'], ['c', 'g'], ['g', 'h'], ['h', 'c'], ['e', 'f'], ['d', 'c'], ['d', 'h'], ['f', 'g']];
const P88 = { a: [1.0, 3.2], b: [3.0, 5.2], c: [3.0, 1.2], d: [5.1, 5.4], e: [5.0, 3.2], f: [5.1, 1.0], g: [7.2, 4.4], h: [7.2, 1.8], i: [9.2, 3.1] };
const E88 = [['a', 'b'], ['a', 'c'], ['b', 'd'], ['b', 'e'], ['c', 'e'], ['c', 'f'], ['d', 'g'], ['e', 'g'], ['g', 'b'], ['f', 'h'], ['h', 'e'], ['g', 'i'], ['h', 'i']];
/** Timestamps from a queue instead of a stack: d when enqueued, f when its scan ends. */
function queueStamps(G, roots) {
  const d = {}, f = {}, prev = {}; let t = 0;
  for (const id of ids(G)) { d[K(id)] = null; f[K(id)] = null; prev[K(id)] = null; }
  for (const r of roots) {
    if (d[K(r)] != null) continue; d[K(r)] = ++t; const Q = [r];
    while (Q.length) { const u = Q.shift(); for (const { id: w } of G.adj(u)) if (d[K(w)] == null) { d[K(w)] = ++t; prev[K(w)] = u; Q.push(w); } f[K(u)] = ++t; }
  }
  return { d, f, prev };
}

// ---------------------------------------------------------------- 8.9 white-path graph
const P89 = { a: [0.9, 4.6], b: [3.0, 5.3], c: [3.0, 2.6], d: [5.0, 4.0], e: [6.8, 5.3], f: [8.9, 4.6], g: [7.0, 2.2], h: [4.9, 0.9], i: [9.0, 1.0] };
const E89 = [['a', 'b'], ['b', 'c'], ['a', 'd'], ['d', 'c'], ['d', 'e'], ['e', 'f'], ['f', 'd'], ['e', 'g'], ['d', 'h'], ['h', 'g'], ['g', 'i'], ['c', 'h']];

// ---------------------------------------------------------------- 8.10 edge classification graph
const P810 = { a: [1.0, 4.6], b: [3.6, 5.5], c: [6.3, 4.4], d: [8.9, 5.3], e: [1.2, 1.3], f: [4.0, 2.2], g: [6.6, 1.0], h: [9.0, 1.6] };
const E810 = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'b'], ['a', 'f'], ['b', 'f'], ['f', 'c'], ['e', 'a'], ['e', 'f'], ['f', 'g'], ['g', 'c'], ['g', 'h'], ['h', 'd'], ['a', 'c']];

export default {
  collection: 'algo',
  chapter: 8,
  title: 'Graph search',
  summary: String.raw`One search loop, run with a queue or with a stack, explores a graph in breadth-first or depth-first order. Breadth-first search finds fewest-edge paths and tests bipartiteness; depth-first search stamps every vertex with a discovery and a finishing time, and the way those intervals nest exposes the structure of the graph. Out of the timestamps come cycle detection, topological sorting, strongly connected components, cut vertices and bridges, and Euler tours — every one in linear time, $O(n+m)$.`,
  items: [
    // ------------------------------------------------------------------ 8.1
    {
      num: '8.1',
      kind: 'Definition',
      name: 'Graphs, paths and connectivity',
      statement: String.raw`A **graph** $G=(V,E)$ consists of a finite set $V$ of **vertices** and a set $E$ of **edges**. In an **undirected** graph an edge is an unordered pair $\{u,v\}$; in a **directed** graph it is an ordered pair $(u,v)$, drawn as an arrow $u\to v$. We write $n=|V|$ and $m=|E|$.

A **walk** from $s$ to $t$ is a sequence $s=v_0,v_1,\dots,v_k=t$ in which each consecutive pair is an edge (followed in its direction, if directed); $k$ is its **length**, and it is a **path** if no vertex repeats. Every walk from $s$ to $t$ contains a path from $s$ to $t$.

An undirected graph is **connected** if every two vertices are joined by a path. Its maximal connected subgraphs, the **connected components**, partition $V$. In a directed graph, $t$ is **reachable** from $s$ if there is a directed path from $s$ to $t$; this relation need not be symmetric. Counting edge ends gives $\sum_v\deg v=2m$ (undirected) and $\sum_v\deg^+v=\sum_v\deg^-v=m$ (directed).`,
      idea: String.raw`"Joined by a path" is an equivalence relation on $V$: a path of length 0 makes it reflexive, reversing a path makes it symmetric, and concatenating two paths (then cutting out the loop between two visits of a repeated vertex) makes it transitive. Its classes are the components. In a directed graph the reversal step fails, so reachability is only a preorder; its symmetric part gives the strongly connected components of 8.15. Deciding whether $t$ is reachable from $s$ is the basic question every search in this chapter answers; the readout uses breadth-first search (8.4) to produce a fewest-edge path.`,
      caption: String.raw`In **pick endpoints** mode, click two vertices. A fewest-edge path between them lights up in green, or the readout says why there is none. Undirected components are shaded in different colours. In **edit the graph** mode, click empty space to add a vertex, click two vertices to add or remove the edge between them, Alt-click to delete, and drag to move. Turn on **directed**: the same edges become one-way arrows, the shading shows what can be reached from $s$, and reachability stops being symmetric.`,
      deps: [],
      refs: ['CLRS 4e App. B.4', 'Erickson Ch. 5'],
      tags: ['graphs'],
      viz(v) {
        const mode = v.select('click to', [{ value: 'pick', label: 'pick endpoints' }, { value: 'edit', label: 'edit the graph' }], 'pick');
        const dir = v.toggle('directed', false, { onChange: (x) => G.set({ directed: x }) });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 350 });
        const G = v.graph(s, { layout: 'none', editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true }, nodes: nodesAt(P81), edges: E81.map(([a, b]) => [a, b]) });
        let pick = ['a', 'e'];
        G.onClick = ({ node }) => {
          if (mode.value !== 'pick') return false;
          if (node && K(node.id) !== K(pick[1])) pick = [pick[1], node.id];
          return true;
        };
        let info = {};
        v.render(() => {
          pick = [validPick(G, pick[0], 0), validPick(G, pick[1], 1)];
          const [A, B] = pick; if (A == null) { G.draw(); info = {}; return; }
          const r = G.bfs(A), path = r.dist[K(B)] < Infinity ? G.path(r.prev, B) : [];
          const comps = G.components(), compOf = {}; comps.forEach((c, k) => c.forEach((id) => { compOf[K(id)] = k; }));
          if (!G.directed) comps.forEach((c, k) => { if (c.length > 1) blob(v, s, c.map((id) => [G.node(id).x, G.node(id).y]), 24, { color: COMP[k % COMP.length], alpha: 0.07, edge: 0.3 }); });
          const reach = (id) => r.dist[K(id)] < Infinity;
          G.draw({
            highlightPath: path,
            nodeColor: (id) => (G.directed ? (reach(id) ? 'teal' : null) : COMP[compOf[K(id)] % COMP.length]),
            nodeRing: (id) => (K(id) === K(A) ? 'ink' : K(id) === K(B) ? 'gold' : null),
            nodeNote: (id) => (K(id) === K(A) ? 's' : K(id) === K(B) ? 't' : null), noteColor: (id) => (K(id) === K(A) ? 'ink' : 'gold'),
          });
          info = { A, B, path, comps, back: G.directed ? G.bfs(B).dist[K(A)] < Infinity : null, nReach: ids(G).filter(reach).length };
        });
        v.legend([['green', 'fewest-edge path s → t'], ['ink', 's', { dot: true }], ['gold', 't', { dot: true }], ['teal', 'reachable from s (directed mode)', { dot: true }]]);
        v.readout(() => {
          const { A, B, path, comps, back, nReach } = info; if (A == null) return 'Add a vertex to start.';
          const n = G.nodes.length, m = G.edges.length, lab = (x) => G.lab(x);
          if (!G.directed) {
            const sum = ids(G).reduce((t, id) => t + G.degree(id), 0);
            const p = path.length ? `path ${path.map(lab).join('–')} of length **${path.length - 1}** (fewest edges)` : `**no path**: ${lab(A)} and ${lab(B)} lie in different components`;
            return `$n = ${n}$, $m = ${m}$, $\\sum \\deg = ${sum} = 2m$ ${sum === 2 * m ? '✓' : '✗'} · ${plural(comps.length, 'connected component')} · ${lab(A)} to ${lab(B)}: ${p}`;
          }
          const outS = ids(G).reduce((t, id) => t + G.adj(id).length, 0), inS = ids(G).reduce((t, id) => t + G.inn(id).length, 0);
          const fwd = path.length ? `${lab(B)} is reachable from ${lab(A)}: ${path.map(lab).join('→')} (${path.length - 1} edges)` : `${lab(B)} is **not** reachable from ${lab(A)}`;
          return `$\\sum \\deg^+ = ${outS}$, $\\sum \\deg^- = ${inS}$, $m = ${m}$ ${outS === m && inS === m ? '✓' : '✗'} · ${fwd} · ${lab(A)} is ${back ? '' : '**not** '}reachable from ${lab(B)}${!!path.length !== !!back ? ' — not symmetric' : ''} · ${nReach} of ${n} vertices reachable from ${lab(A)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.2
    {
      num: '8.2',
      kind: 'Definition',
      name: 'Adjacency lists and adjacency matrices',
      statement: String.raw`Number the vertices $1,\dots,n$. The **adjacency matrix** of $G$ is the $n\times n$ array with $A_{uv}=1$ if $uv$ is an edge and $0$ otherwise (symmetric when $G$ is undirected). The **adjacency-list** representation stores, for each vertex $u$, a list of its (out-)neighbours.

The matrix takes $\Theta(n^2)$ space whatever $m$ is, answers "is $uv$ an edge?" in $O(1)$ time, but needs $\Theta(n)$ time to list the neighbours of a vertex. The lists take $\Theta(n+m)$ space (each undirected edge appears twice) and list the neighbours of $u$ in $O(1+\deg u)$ time, but testing a single pair takes $O(1+\deg u)$. Unless stated otherwise, the graph algorithms in this course assume adjacency lists, so "linear time" means $O(n+m)$.`,
      idea: String.raw`A matrix stores one entry per *possible* edge and a list stores one entry per *actual* edge. Most large graphs met in practice (road maps, the web, social networks) are sparse: $m$ is a small multiple of $n$, while $n^2$ is astronomically larger. A search that touches every vertex and edge once (8.3) then runs in $O(n+m)$ with lists but needs $\Theta(n^2)$ with a matrix, just to read the zeros. The matrix earns its keep on dense graphs and when constant-time edge tests or matrix algebra are needed (counting walks by matrix powers, 5.1).`,
      caption: String.raw`Drag the **density** slider: edges appear one by one (the same random order each time), and the matrix, the lists and the space chart update together. Click two vertices of the graph, or click a matrix cell, to toggle that edge. The chart compares $n^2$ matrix cells with $n+2m$ list cells (or $n+m$ when directed); the shaded gap is the zeros the matrix stores. The readout also gives the cost of the two basic queries in each representation.`,
      deps: ['algo-8.1', 'algo-5.1'],
      refs: ['CLRS 4e §20.1'],
      tags: ['graphs'],
      viz(v) {
        let seed = 4;
        const nS = v.slider('vertices $n$', 4, 12, 8, { int: true, onChange: () => regen() });
        const pS = v.slider('density $p$', 0, 1, 0.3, { step: 0.01, onChange: () => regen() });
        const dir = v.toggle('directed', false, { onChange: () => regen() });
        v.button('Resample', () => { seed++; regen(); });
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], axes: false, equal: true, height: 290, minWidth: 380, title: 'the graph' });
        const sm = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, minWidth: 380, title: 'adjacency matrix' });
        const sl = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 260, minWidth: 380, title: 'adjacency lists' });
        const sc = v.stage({ x: [0, 1], y: [0, 150], axes: 'box', gutter: true, height: 260, minWidth: 380, xlabel: 'density p', ylabel: 'memory cells', title: 'space used' });
        const G = v.graph(s, { nodes: [], edges: [], layout: 'none', editable: { addEdge: true, deleteEdge: true }, draggable: false, r: 12, fontSize: 12 });
        const TB = v.table(sm, { rows: 8, cols: 8, maxCell: 30, minCell: 14, size: 12, margin: 6 });
        function regen() {
          const n = nS.value, r = v.rng(seed * 131 + n * 7), E = [];
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (i === j || (!dir.value && j < i)) continue; if (r() < pS.value) E.push([NAMES[i], NAMES[j]]); }
          G.set({ directed: dir.value, nodes: [...NAMES.slice(0, n)].map((id, i) => ({ id, x: Math.sin((2 * Math.PI * i) / n), y: Math.cos((2 * Math.PI * i) / n) })), edges: E });
        }
        regen();
        const toggleEdge = (a, b) => {
          const e = G.directed ? G.edges.find((x) => K(x.from) === K(a) && K(x.to) === K(b)) : G.edge(a, b);
          if (e) G.removeEdge(e); else G.addEdge(a, b);
        };
        sm.onClick((x, y) => { const c = TB.hit(x, y); if (c && c.i >= 0 && c.j >= 0 && c.i !== c.j && c.i < G.nodes.length && c.j < G.nodes.length) toggleEdge(G.nodes[c.i].id, G.nodes[c.j].id); });
        let info = {};
        v.render(() => {
          const n = G.nodes.length, A = G.matrix(false), I = ids(G), m = G.edges.length;
          G.draw({ nodeColor: 'accent' });
          TB.draw({ rows: n, cols: n, value: (i, j) => A[i][j], rowLabels: I, colLabels: I,
            fill: (i, j) => (A[i][j] ? ['accent', 0.4] : i === j ? ['faint', 0.25] : null), textColor: (i, j) => (A[i][j] ? 'ink' : 'faint'), weight: (i, j) => (A[i][j] ? 700 : 400) });
          // adjacency lists
          const W = sl.width, H = sl.height, rowH = Math.min(26, (H - 16) / n), ch = Math.min(20, rowH - 4);
          I.forEach((u, k) => {
            const Y = 8 + k * rowH, nb = G.adj(u).map((a) => a.id);
            strip(sl, [{ label: u, fill: 'accent' }], 10, Y, { w: 22, h: ch, size: 11.5 });
            if (!nb.length) { T(sl, '∅', 44, Y + ch / 2, { size: 12, color: 'faint' }); return; }
            L(sl, 33, Y + ch / 2, 41, Y + ch / 2, { color: 'muted', width: 1.2 });
            strip(sl, nb.map((x) => ({ label: x, color: 'accent' })), 42, Y, { w: 20, h: ch, gap: 3, size: 11, maxW: W - 52 });
          });
          // space chart
          const N2 = n * n, lists = (p) => n + p * n * (n - 1), top = Math.max(N2, 10) * 1.12, cells = n + (G.directed ? m : 2 * m);
          sc.setView([0, 1], [0, top]);
          sc.between(() => N2, (p) => lists(p), 0, 1, { fill: 'orange', fillAlpha: 0.1 });
          sc.hline(N2, { color: 'orange', width: 2.2 });
          sc.fn(lists, { color: 'accent', width: 2.2 });
          sc.text(`matrix  n² = ${N2}`, 0.03, N2, { dy: -10, size: 11.5, color: 'orange', weight: 600 });
          sc.text('lists, expected', 0.6, lists(0.6), { dy: 14, size: 11, color: 'accent', weight: 600 });
          const dens = n > 1 ? (G.directed ? m : 2 * m) / (n * (n - 1)) : 0;
          sc.dot(dens, cells, { r: 5, color: 'accent', label: `${cells}`, labelPos: 'nw' });
          info = { n, m, N2, cells, dens, sym: !G.directed && A.every((row, i) => row.every((x, j) => x === A[j][i])), ones: A.flat().reduce((t, x) => t + x, 0), listTot: I.reduce((t, u) => t + G.adj(u).length, 0) };
        });
        v.legend([['accent', 'adjacency lists'], ['orange', 'adjacency matrix'], ['orange', 'zeros stored by the matrix', { area: true }]]);
        v.readout(() => {
          const { n, m, N2, cells, dens, sym, ones, listTot } = info;
          const avgDeg = n ? listTot / n : 0;
          return `$m = ${m}$, density ${dens.toFixed(2)} · matrix: ${N2} cells, of which ${ones} are 1 ${G.directed ? '' : `(symmetric ${sym ? '✓' : '✗'})`} · lists: $n + ${G.directed ? 'm' : '2m'} = ${cells}$ cells · both encode the same ${ones} ${G.directed ? 'arcs' : 'edge ends'} ${ones === listTot ? '✓' : '✗'}\n"is $uv$ an edge?": matrix 1 probe, lists ≈ ${(avgDeg / 2 + 0.5).toFixed(1)} on average · "list $N(u)$": matrix ${n} probes, lists ≈ ${avgDeg.toFixed(1)} · the lists save ${N2 - cells} cells (${N2 ? Math.round(100 * (N2 - cells) / N2) : 0}%)`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.3
    {
      num: '8.3',
      kind: 'Method',
      name: 'Whatever-first search',
      statement: String.raw`**Whatever-first search** from a vertex $s$ keeps a **bag** of pairs $(p,v)$ ("reach $v$ from $p$"). It starts with $(\varnothing,s)$ in the bag; while the bag is non-empty it takes out *some* pair $(p,v)$, and if $v$ is still unmarked it marks $v$, records $\mathrm{parent}(v)=p$, and puts $(v,w)$ into the bag for every edge $vw$.

Whatever rule the bag uses to choose, the search marks exactly the vertices reachable from $s$, and the parent edges form a spanning tree of them, rooted at $s$. With $O(1)$ bag operations it runs in $O(n+m)$ time on adjacency lists, since each vertex is marked once and each edge is put in the bag at most twice. The choice of bag decides the *shape* of the tree. A **stack** gives a depth-first tree, a **queue** a breadth-first tree, and a **priority queue** keyed by edge weight gives Prim's minimum spanning tree (then the time is $O(m\log n)$).`,
      idea: String.raw`Two invariants do all the work. Every marked vertex is reachable, because its parent was marked before it. And if $v$ is reachable, then by induction along a path $s\leadsto v$ some pair leading to $v$ eventually enters the bag; since the loop runs until the bag is empty, $v$ gets marked. Each vertex except $s$ is marked through exactly one parent edge, so $k$ marked vertices come with $k-1$ parent edges joining them all to $s$: a tree. Nothing in this argument used the order in which pairs leave the bag, so the order is free to be chosen, and BFS (8.4), DFS (8.7), Prim and Dijkstra are all this one loop.`,
      caption: String.raw`Choose the **bag** and step through the same loop. The bag strip shows its pairs $p\to v$ (the next one taken is outlined in gold). The panel at the bottom draws the final trees of all three bags on this graph: a long, deep stack tree, a shallow layered queue tree, and a cheapest-first priority-queue tree. Click an edge's weight to change it (shift-click lowers it). The priority-queue tree always has the weight of a minimum spanning tree.`,
      deps: ['algo-8.2'],
      refs: ['Erickson Ch. 5'],
      tags: ['graphs', 'search'],
      credit: 'Framing as one loop with a bag ("whatever-first search"): J. Erickson, Algorithms, 2019, Ch. 5',
      viz(v) {
        const bagSel = v.select('bag', [{ value: 'stack', label: 'stack' }, { value: 'queue', label: 'queue' }, { value: 'pq', label: 'priority queue (weight)' }], 'queue', { onChange: () => S.reset({ at: 'end' }) });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 300 });
        const s3 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 240, full: true });
        const sb = s3;
        const G = v.graph(s, { weights: true, layout: 'none', editable: { editWeight: true, minWeight: 1, maxWeight: 9 }, nodes: nodesAt(P83), edges: E83.map(([a, b, w]) => [a, b, w]) });
        G.onChange = () => S.reset({ at: 'keep' });
        const S = v.steps({ frames: () => wfs(G, 's', bagSel.value), code: WFS_CODE, codeTitle: 'WhateverFirst(G, s)', codePos: 'below', speed: 2, start: 9, still: 9 });
        const nextIdx = (bag, kind) => { if (!bag.length) return -1; if (kind === 'stack') return bag.length - 1; if (kind === 'queue') return 0; let k = 0; bag.forEach((it, i) => { if (it.w < bag[k].w || (it.w === bag[k].w && it.seq < bag[k].seq)) k = i; }); return k; };
        let info = {};
        v.render(() => {
          const f = S.frame, kind = bagSel.value, tree = new Set(Object.values(f.pe || {}).filter(Boolean)), cur = f.took ? K(f.took.v) : null;
          const added = new Set((f.added || []).map((a) => a.edge));
          G.draw({
            nodeFill: (id) => (K(id) === cur && !f.done ? 'gold' : f.mark?.[K(id)] ? 'accent' : null),
            nodeColor: (id) => (f.bag?.some((it) => K(it.v) === K(id)) && !f.mark?.[K(id)] ? 'orange' : null),
            edgeColor: (e) => (tree.has(e) ? 'green' : added.has(e) ? 'orange' : null), edgeWidth: (e) => (tree.has(e) ? 3.4 : added.has(e) ? 2.6 : null),
          });
          // the bag
          const bag = f.bag || [], k = nextIdx(bag, kind);
          const shown = kind === 'pq' ? bag.map((it, i) => [it, i]).sort((x, y) => x[0].w - y[0].w || x[0].seq - y[0].seq) : bag.map((it, i) => [it, i]);
          T(sb, kind === 'stack' ? 'stack (top →)' : kind === 'queue' ? 'queue (front →)' : 'priority queue', 10, 12, { size: 12, weight: 600, color: 'muted' });
          strip(sb, shown.map(([it, i]) => ({ label: `${it.p == null ? '∅' : G.lab(it.p)}→${G.lab(it.v)}`, color: f.mark?.[K(it.v)] ? 'faint' : i === k ? 'gold' : 'orange', width: i === k ? 2.6 : 1.4, note: kind === 'pq' ? it.w : null })), 10, 22, { w: 40, h: 22, gap: 4, size: 11, maxW: sb.width - 20, empty: 'empty' });
          if (kind === 'stack' && shown.length) { /* order already bottom → top */ }
          // the three final trees
          const W = s3.width, H = s3.height, xs = G.nodes.map((n) => n.x), ys = G.nodes.map((n) => n.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
          const stats = {};
          ['stack', 'queue', 'pq'].forEach((b, j) => {
            const F = b === kind ? S.frames : wfs(G, 's', b), last = F[F.length - 1], te = new Set(Object.values(last.pe).filter(Boolean)), st = treeStats(G, 's', last.pe); stats[b] = st;
            const PX0 = (j * W) / 3 + 14, PW = W / 3 - 28, PY0 = 96, PH = H - 106, sc = Math.min(PW / (x1 - x0 || 1), PH / (y1 - y0 || 1));
            const mx = (x) => PX0 + (PW - sc * (x1 - x0)) / 2 + sc * (x - x0), my = (y) => PY0 + (PH - sc * (y1 - y0)) / 2 + sc * (y1 - y);
            if (b === kind) R(s3, (j * W) / 3 + 4, 66, ((j + 1) * W) / 3 - 4, H - 2, { color: 'gold', width: 1.6, fill: 'gold', fillAlpha: 0.05, radius: 8 });
            for (const e of G.edges) { const a = G.node(e.from), c = G.node(e.to); L(s3, mx(a.x), my(a.y), mx(c.x), my(c.y), te.has(e) ? { color: 'green', width: 3 } : { color: 'faint', width: 1 }); }
            for (const nd of G.nodes) s3.dot(s3.invX(mx(nd.x)), s3.invY(my(nd.y)), { r: nd.id === 's' ? 5 : 3.6, color: nd.id === 's' ? 'ink' : 'accent' });
            T(s3, `${BAGS[b]}: depth ${st.depth}, weight ${st.weight}`, (j * W) / 3 + W / 6, 80, { align: 'center', size: 12, weight: 700, color: b === kind ? 'ink' : 'muted' });
          });
          info = { stats, f, kind, mst: G.mst().weight, ecc: Math.max(...Object.values(relaxDist(G, 's')).filter((x) => x < Infinity)) };
        });
        v.legend([['gold', 'taken now', { dot: true }], ['accent', 'marked', { dot: true }], ['orange', 'waiting in the bag', { dot: true }], ['green', 'parent (tree) edges']]);
        v.readout(() => {
          const { stats, kind, mst, ecc } = info; if (!stats) return '';
          const st = stats[kind];
          return `${BAGS[kind]}: ${st.n} vertices marked with ${st.n - 1} parent edges, a spanning tree ✓ · queue tree depth ${stats.queue.depth} = largest distance from s (${ecc}) ${stats.queue.depth === ecc ? '✓' : '✗'} · priority-queue tree weight ${stats.pq.weight} = minimum spanning tree weight (Kruskal) ${mst} ${stats.pq.weight === mst ? '✓' : '✗'} · stack tree depth ${stats.stack.depth}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.4
    {
      num: '8.4',
      kind: 'Algorithm',
      name: 'Breadth-first search',
      statement: String.raw`**Breadth-first search** from a source $s$ is whatever-first search with a FIFO queue. It sets $d[s]=0$ and $d[v]=\infty$ for every other vertex, and puts $s$ in the queue. Then, until the queue is empty, it dequeues a vertex $u$, and for each neighbour $v$ with $d[v]=\infty$ it sets $d[v]=d[u]+1$ and $\pi[v]=u$ and enqueues $v$.

Each vertex is enqueued and dequeued at most once, and each adjacency list is scanned once, so BFS runs in $O(n+m)$ time on adjacency lists. The vertices are discovered **layer by layer**: all vertices with $d=k$ come out of the queue before any vertex with $d=k+1$. The edges $\pi[v]v$ form the **BFS tree**, in which every tree edge joins consecutive layers.`,
      idea: String.raw`Marking a vertex the moment it is *discovered* (rather than when it is dequeued) keeps every vertex in the queue at most once, which gives the linear bound. The queue holds a run of layer-$k$ vertices followed by a run of layer-$(k+1)$ vertices. Dequeuing a layer-$k$ vertex can only append layer-$(k+1)$ vertices, so this shape is preserved and the layers leave the queue in order. In an undirected graph every edge therefore joins two vertices whose layers differ by at most 1. The next item (8.5) turns this into the statement that $d[v]$ is the true distance.`,
      caption: String.raw`Step through BFS. The gold vertex is being dequeued, outlined vertices wait in the queue, and filled vertices are finished. Colours mark the layers, and the notes give $d$. The lower panel shows the queue (front on the left) above the layers found so far. In **set the source** mode click any vertex to restart from it; in **edit edges** mode click two vertices to add or remove an edge. At the end the readout checks that every edge spans at most one layer.`,
      deps: ['algo-8.3'],
      refs: ['CLRS 4e §20.2'],
      tags: ['graphs', 'search'],
      credit: 'Moore, 1959 (maze search); Lee, 1961 (wire routing)',
      viz(v) {
        const mode = v.select('click a vertex to', [{ value: 'src', label: 'set the source' }, { value: 'edit', label: 'edit edges' }], 'src');
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 320 });
        const sq = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true });
        const G = v.graph(s, { layout: 'none', editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P84), edges: E84.map(([a, b]) => [a, b]) });
        let src = 's';
        G.onClick = ({ node }) => { if (mode.value === 'src') { if (node) { src = node.id; S.reset(); } return true; } return false; };
        G.onChange = () => S.reset({ at: 'end' });
        const S = v.steps({ frames: () => G.bfs(src).events, code: BFS_CODE, codeTitle: 'BFS(G, s)', codePos: 'below', speed: 3, start: 14, still: 14 });
        const lc = (k) => LAYER[k % LAYER.length];
        let info = {};
        v.render(() => {
          const f = S.frame, dist = f.dist || {}, done = new Set((f.done || []).map(K)), inQ = new Set((f.queue || []).map(K)), cur = f.node != null && f.type !== 'done' && f.type !== 'init' ? K(f.node) : null;
          const tree = new Set(Object.values(f.prevEdge || {}).filter(Boolean));
          G.draw({
            nodeFill: (id) => (K(id) === cur ? 'gold' : done.has(K(id)) ? lc(dist[K(id)]) : null),
            nodeColor: (id) => (dist[K(id)] < Infinity ? lc(dist[K(id)]) : null),
            nodeRing: (id) => (K(id) === K(src) ? 'ink' : inQ.has(K(id)) ? 'orange' : null),
            nodeNote: (id) => (dist[K(id)] < Infinity ? dist[K(id)] : null), noteColor: (id) => lc(dist[K(id)] ?? 0),
            edgeColor: (e) => (e === f.edge ? (f.skipped ? 'red' : 'orange') : tree.has(e) ? 'green' : null),
            edgeWidth: (e) => (e === f.edge ? 4 : tree.has(e) ? 3.2 : null), edgeDash: (e) => e === f.edge && !!f.skipped,
          });
          // queue and layers
          const W = sq.width;
          strip(sq, (f.queue || []).map((id) => ({ label: G.lab(id), color: lc(dist[K(id)]), note: dist[K(id)] })), 14, 10, { title: 'queue  →', titleW: 92, w: 30, h: 26, maxW: W - 28, empty: 'empty' });
          const layers = []; for (const id of ids(G)) { const d = dist[K(id)]; if (d < Infinity) (layers[d] ||= []).push(id); }
          layers.forEach((Lr, k) => strip(sq, Lr.map((id) => ({ label: G.lab(id), fill: done.has(K(id)) ? lc(k) : null, color: lc(k), width: K(id) === cur ? 2.8 : 1.4 })), 14, 62 + k * 30, { title: `layer ${k}`, titleW: 92, w: 30, h: 24, maxW: W - 28 }));
          if (!layers.length) T(sq, 'no layers yet', 14, 70, { color: 'faint' });
          info = { f, dist, layers };
        });
        v.legend([['gold', 'dequeued now', { dot: true }], ['orange', 'in the queue (ring)', { dot: true }], ['green', 'BFS tree'], ['ink', 'source (ring)', { dot: true }]]);
        v.readout(() => {
          const { f, dist } = info; if (!f || !f.dist) return '';
          const q = (f.queue || []).map((x) => dist[K(x)]), qs = [...new Set(q)];
          if (f.type !== 'done') return `Queue labels: ${q.length ? q.join(', ') : '—'} — ${qs.length <= 2 && (qs.length < 2 || qs[1] === qs[0] + 1) ? `a run of layer ${qs[0] ?? '·'}${qs.length > 1 ? ` then layer ${qs[1]}` : ''} ✓` : 'not two consecutive layers ✗'} · ${f.done.length} of ${G.nodes.length} vertices dequeued`;
          let treeOK = true, spanOK = true, maxSpan = 0;
          for (const e of G.edges) { const a = dist[K(e.from)], b = dist[K(e.to)]; if (a === Infinity && b === Infinity) continue; const gap = Math.abs(a - b); if (gap > 1) spanOK = false; maxSpan = Math.max(maxSpan, gap === Infinity ? 99 : gap); if (Object.values(f.prevEdge).includes(e) && gap !== 1) treeOK = false; }
          const reached = ids(G).filter((id) => dist[K(id)] < Infinity).length;
          return `Done: ${reached} of ${G.nodes.length} vertices reached in ${info.layers.length} layers · every tree edge joins consecutive layers ${treeOK ? '✓' : '✗'} · every edge spans at most one layer (largest gap ${maxSpan === 99 ? '∞' : maxSpan}) ${spanOK ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.5
    {
      num: '8.5',
      kind: 'Theorem',
      name: 'BFS computes unweighted shortest-path distances',
      statement: String.raw`Run breadth-first search from $s$ on a directed or undirected graph. When it ends, $d[v]=\delta(s,v)$ for every vertex $v$, where $\delta(s,v)$ is the least number of edges on a path from $s$ to $v$ ($\infty$ if none exists). For every reachable $v\ne s$, following $\pi$ back from $v$ gives a shortest path from $s$ to $v$ read in reverse. Throughout the run, the queue holds vertices with labels $k,\dots,k,k+1,\dots,k+1$ for some $k$: never more than two different labels, and these are consecutive.`,
      idea: String.raw`First, $d[v]\ge\delta(s,v)$ always, since every label is the length of an actual path (the one through $\pi$). For the reverse inequality, use the queue invariant (8.4): vertices are dequeued in non-decreasing order of label. Suppose some $v$ had $d[v]>\delta(s,v)$, and take such a $v$ with $\delta(s,v)$ as small as possible. Let $u$ be its predecessor on a shortest path; then $d[u]=\delta(s,u)=\delta(s,v)-1$. When $u$ was dequeued, $v$ was either still undiscovered (so it got $d[u]+1$), or already discovered by a vertex dequeued no later than $u$ (so its label is at most $d[u]+1$). Either way $d[v]\le\delta(s,v)$, a contradiction. A stack breaks the invariant: labels in the bag then spread out, and a vertex can be labelled through a long detour first.`,
      caption: String.raw`Cells of a grid maze carry their BFS labels. Step through, or click cells to **toggle walls** (or choose **move the source**) and watch the wavefront re-flow. The chart plots the queue's contents at every step, split into the current lowest label (blue), the next label (teal), and anything else (red): the red part never appears. Turn on **use a stack** to break the theorem. Red then floods the chart, and cells whose labels exceed the true distance (computed independently by Bellman–Ford relaxation) turn red.`,
      deps: ['algo-8.4'],
      refs: ['CLRS 4e §20.2'],
      tags: ['graphs', 'shortest paths'],
      viz(v) {
        const Rr = 8, C = 14, id = (i, j) => i * C + j;
        const mode = v.select('click a cell to', [{ value: 'wall', label: 'toggle a wall' }, { value: 'src', label: 'move the source' }], 'wall');
        const lifo = v.toggle('use a stack (breaks it)', false, { onChange: () => { S.setCode(lifo.value ? LIFO_CODE : BFS_CODE, lifo.value ? 'Search with a stack' : 'BFS(G, s)'); S.reset({ at: 'end' }); } });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330 });
        const sc = v.stage({ x: [0, 100], y: [0, 10], axes: 'box', gutter: true, height: 170, full: true, xlabel: 'step', ylabel: 'queue size' });
        const G = v.graph(s, { ...v.graphs('grid', Rr, C), r: 12, autoRadius: false, fontSize: 10.5, draggable: false });
        let src = id(3, 2);
        const walls = new Set([[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [6, 5], [7, 5], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [1, 10], [1, 11], [1, 12], [5, 2], [5, 3], [6, 3]].map(([i, j]) => K(id(i, j))));
        const S = v.steps({ frames: () => gridRun(G, src, walls, lifo.value), code: BFS_CODE, codeTitle: 'BFS(G, s)', codePos: 'below', speed: 8, start: 'end', still: 'end' });
        G.onClick = ({ node }) => {
          if (!node || K(node.id) === K(src)) return true;
          if (mode.value === 'src') { if (!walls.has(K(node.id))) src = node.id; }
          else if (walls.has(K(node.id))) walls.delete(K(node.id)); else walls.add(K(node.id));
          S.reset({ at: 'end' }); return true;
        };
        let info = {};
        v.render(() => {
          const f = S.frame, lab = f.lab || {}, truth = relaxDist(G, src, (x) => walls.has(K(x))), inBag = new Set((f.bag || []).map(K));
          const maxT = Math.max(1, ...Object.values(truth).filter((x) => x < Infinity));
          let bad = 0, ok = 0;
          G.draw({
            nodeFill: (k) => {
              if (walls.has(K(k))) return 'muted';
              if (K(k) === K(f.u) && !f.done) return 'gold';
              const l = lab[K(k)]; if (l == null) return null;
              if (f.done || !inBag.has(K(k))) return l > truth[K(k)] ? 'red' : v.ramp(0.25 + 0.6 * (l / maxT), 'accent', 'panel');
              return null;
            },
            nodeColor: (k) => (inBag.has(K(k)) ? 'orange' : lab[K(k)] != null ? 'accent' : null),
            nodeRing: (k) => (K(k) === K(src) ? 'ink' : null),
            nodeLabel: (k) => (walls.has(K(k)) ? '' : lab[K(k)] ?? ''),
            edgeColor: () => 'faint', edgeWidth: () => 1,
          });
          if (f.done) for (const nd of G.nodes) { const l = lab[K(nd.id)]; if (l == null) continue; if (l === truth[K(nd.id)]) ok++; else bad++; }
          // queue composition chart
          const F = S.frames, N = F.length, top = Math.max(4, F.maxBag);
          sc.setView([0, Math.max(N - 1, 1)], [0, top * 1.1]);
          F.forEach((fr, t) => {
            const [a, b, c] = fr.comp, x0 = t - 0.5, x1 = t + 0.5;
            if (a) sc.rect(x0, 0, x1, a, { fill: 'blue', fillAlpha: 0.75, stroke: false });
            if (b) sc.rect(x0, a, x1, a + b, { fill: 'teal', fillAlpha: 0.6, stroke: false });
            if (c) sc.rect(x0, a + b, x1, a + b + c, { fill: 'red', fillAlpha: 0.75, stroke: false });
          });
          sc.vline(S.i, { color: 'gold', width: 2 });
          info = { f, bad, ok, F, truth };
        });
        v.legend([['blue', 'lowest label in the queue', { area: true }], ['teal', 'lowest + 1', { area: true }], ['red', 'any other label / wrong distance', { area: true }], ['gold', 'current step']]);
        v.readout(() => {
          const { f, bad, ok, F } = info; if (!f) return '';
          const bag = lifo.value ? 'stack' : 'queue';
          const inv = F.maxDistinct <= 2 && F.every((fr) => fr.comp[2] === 0);
          const head = `${bag} held at most ${plural(F.maxDistinct, 'distinct label')} at once${inv ? ', always consecutive ✓' : ' ✗'} (largest size ${F.maxBag})`;
          if (!f.done) return `${head} · go to the last step for the distance check`;
          return `${head} · labels vs true distances (Bellman–Ford): ${ok} of ${ok + bad} reached cells agree${bad ? ` — **${bad} too large** ✗` : ' ✓'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.6
    {
      num: '8.6',
      kind: 'Algorithm',
      name: 'Testing bipartiteness by BFS',
      statement: String.raw`An undirected graph is **bipartite** if its vertices can be split into two sides so that every edge has one end on each side, or equivalently if it has a proper 2-colouring. **Theorem.** A graph is bipartite if and only if it contains no cycle of odd length.

**Algorithm.** Run BFS from an uncoloured vertex of each component, and colour every vertex by the parity of its layer. If some edge joins two vertices of the same colour, the graph is not bipartite: that edge lies inside one layer, and together with the two tree paths up to their lowest common ancestor it closes an odd cycle. If no edge does, the two colour classes form a bipartition. The test runs in $O(n+m)$ time.`,
      idea: String.raw`Along any cycle the colours of a proper 2-colouring alternate, so an odd cycle cannot be 2-coloured. This proves one direction and makes an odd cycle a short, checkable certificate of non-bipartiteness. For the algorithm: BFS edges join layers that differ by at most 1 (8.5). An edge between layers $k$ and $k+1$ joins different parities. So a conflict can only be an edge $uw$ inside a single layer $k$. Climb from $u$ and $w$ through the BFS tree until the two paths meet at a vertex in layer $j$; the cycle has $2(k-j)+1$ edges, which is odd. Hence: no conflict means a valid 2-colouring, and a conflict means an explicit odd cycle.`,
      caption: String.raw`Step through the colouring BFS. Vertices are coloured blue or orange by layer parity, and the right panel redraws the graph with one column per layer. **Add the chord e–f** (or click any two vertices to toggle an edge): if it closes an odd cycle it appears *inside* a column, in red, and the odd cycle it certifies is traced in red on the graph. The readout confirms the verdict by trying every 2-colouring.`,
      deps: ['algo-8.5'],
      refs: ['KT §3.4'],
      tags: ['graphs'],
      viz(v) {
        const chord = v.toggle('add the chord e–f', false, { onChange: (x) => { const e = G.edge('e', 'f'); if (x && !e) G.addEdge('e', 'f'); if (!x && e) G.removeEdge(e); S.reset({ at: 'end' }); } });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 300, weight: 1.15 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'one column per BFS layer' });
        const G = v.graph(s, { layout: 'none', editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P86), edges: E86.map(([a, b]) => [a, b]) });
        const H = v.graph(s2, { nodes: [], edges: [], layout: 'none', draggable: false, r: 12, fontSize: 11.5 });
        G.onChange = () => { chord.value = !!G.edge('e', 'f'); S.reset({ at: 'end' }); };
        const S = v.steps({ frames: () => bipRun(G), code: BIP_CODE, codeTitle: 'TwoColour(G)', codePos: 'below', speed: 2, start: 'end', still: 'end' });
        const SIDE = ['blue', 'orange'];
        let info = {};
        v.render(() => {
          const f = S.frame, col = f.col || {}, lay = f.lay || {}, bad = new Set(f.bad || []);
          const cyc = f.done && f.bad.length ? oddCycle(f.par, lay, f.bad[0]) : [];
          const cycE = new Set(); for (let k = 0; k < cyc.length; k++) { const e = G.edge(cyc[k], cyc[(k + 1) % cyc.length]); if (e) cycE.add(e); }
          const tree = new Set(ids(G).filter((x) => f.par?.[K(x)] != null).map((x) => G.edge(x, f.par[K(x)])));
          G.draw({
            nodeFill: (id) => (col[K(id)] != null ? SIDE[col[K(id)]] : null),
            nodeRing: (id) => (K(id) === K(f.u) && !f.done ? 'gold' : null),
            nodeNote: (id) => (lay[K(id)] != null ? `L${lay[K(id)]}` : null), noteColor: 'muted',
            edgeColor: (e) => (cycE.has(e) || bad.has(e) ? 'red' : tree.has(e) ? 'ink' : null),
            edgeWidth: (e) => (cycE.has(e) ? 4 : bad.has(e) ? 3.4 : tree.has(e) ? 2.2 : null), edgeDash: (e) => bad.has(e) && !cycE.has(e),
          });
          // layered redraw
          const cols = []; for (const x of ids(G)) if (lay[K(x)] != null) (cols[lay[K(x)]] ||= []).push(x);
          const nc = Math.max(1, cols.length), tall = Math.max(1, ...cols.map((c) => c?.length || 0));
          const nodes = [];
          cols.forEach((c, k) => c.forEach((x, i) => nodes.push({ id: x, x: (k + 0.5) / nc, y: 1 - (i + 1) / (tall + 1) })));
          const edges = G.edges.filter((e) => lay[K(e.from)] != null && lay[K(e.to)] != null).map((e) => ({ from: e.from, to: e.to, ref: e, bend: lay[K(e.from)] === lay[K(e.to)] ? 22 : 0 }));
          H.set({ nodes, edges });
          for (let k = 0; k < cols.length; k++) { s2.vband(k / nc + 0.01, (k + 1) / nc - 0.01, { color: SIDE[k % 2], alpha: 0.06 }); s2.text(`L${k}`, (k + 0.5) / nc, 1, { dy: 10, align: 'center', size: 11.5, weight: 700, color: SIDE[k % 2] }); }
          H.draw({ nodeFill: (x) => SIDE[col[K(x)]], edgeColor: (e) => (bad.has(e.ref) ? 'red' : null), edgeWidth: (e) => (bad.has(e.ref) ? 3.4 : null) });
          info = { f, cyc, brute: twoColourings(G), comps: G.components().length };
        });
        v.legend([['blue', 'even layer', { dot: true }], ['orange', 'odd layer', { dot: true }], ['ink', 'BFS tree'], ['red', 'same-colour edge / odd cycle']]);
        v.readout(() => {
          const { f, cyc, brute, comps } = info; if (!f) return '';
          if (!f.done) return `${Object.keys(f.col).length} of ${G.nodes.length} vertices coloured · ${f.bad.length ? `${plural(f.bad.length, 'conflict')} so far` : 'no conflict yet'}`;
          const bf = brute == null ? '' : ` · brute force: ${brute} of $2^{${G.nodes.length}}$ colourings are proper ${(brute > 0) === !f.bad.length ? '✓' : '✗'}`;
          if (!f.bad.length) return `**Bipartite**: blue and orange are the two sides (${plural(comps, 'component')}, so $2^{${comps}} = ${2 ** comps}$ proper colourings)${bf}`;
          return `**Not bipartite**: the odd cycle ${cyc.map((x) => G.lab(x)).join('–')}–${G.lab(cyc[0])} has ${cyc.length} edges ${cyc.length % 2 ? '(odd) ✓' : '✗'}${bf}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.7
    {
      num: '8.7',
      kind: 'Algorithm',
      name: 'Depth-first search with timestamps',
      statement: String.raw`**Depth-first search** explores as far as possible along each branch before backing up. Starting with all vertices **white** and a global clock at 0, $\mathrm{DFS}(G)$ calls $\mathrm{Visit}(u)$ for each still-white vertex $u$ in turn. $\mathrm{Visit}(u)$ ticks the clock and records the **discovery time** $d[u]$, colours $u$ **grey**, and calls $\mathrm{Visit}(v)$ (with $\pi[v]=u$) for every white out-neighbour $v$. It then ticks the clock again, records the **finishing time** $f[u]$, and colours $u$ **black**.

Every vertex receives $1\le d[u]<f[u]\le 2n$, and the $2n$ timestamps are distinct. The grey vertices at any moment are exactly the vertices on the recursion stack, and they form a path of tree edges from the current root. The edges $\pi[v]v$ form the **DFS forest**. The running time is $O(n+m)$.`,
      idea: String.raw`DFS is whatever-first search with a stack (8.3), written recursively so that each vertex knows when its exploration *ends*. Each $\mathrm{Visit}(u)$ is called once (only white vertices are visited, and the call colours them grey at once), and it scans the adjacency list of $u$ once. That gives $O(n+m)$. A vertex is grey exactly while its call is active, so the grey vertices are the active calls, each the parent of the next. The two timestamps are what make DFS powerful: the next items show that the intervals $[d,f]$ encode ancestry (8.8), reachability (8.9) and the type of every edge (8.10).`,
      caption: String.raw`Step through DFS on a directed graph. Notes show $d/f$; the gold vertex is the one being processed, grey vertices have an orange outline, and black vertices are filled. In the timeline, each vertex owns a bar that starts at its discovery and grows (orange) until it finishes (blue). The strip above it is the recursion stack. Click two vertices to add or remove an edge, or empty space to add a vertex; the run restarts.`,
      deps: ['algo-8.3'],
      refs: ['CLRS 4e §20.3', 'Erickson Ch. 6'],
      tags: ['graphs', 'search'],
      credit: 'Trémaux (maze exploration), 19th c.; Hopcroft & Tarjan, 1973',
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 300 });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, full: true });
        const G = v.graph(s, { directed: true, layout: 'none', editable: { addNode: true, addEdge: true, deleteNode: true, deleteEdge: true }, nodes: nodesAt(P87, { e: { notePos: 's' }, f: { notePos: 's' }, g: { notePos: 's' }, h: { notePos: 's' } }), edges: E87.map(([a, b]) => [a, b]) });
        G.onChange = () => S.reset();
        const S = v.steps({ frames: () => dfsTrace(G).events, code: DFS_CODE, codeTitle: 'DFS(G)', codePos: 'below', speed: 1.5, start: 13, still: 13 });
        v.render(() => {
          const f = S.frame; if (!f.color) return;
          G.draw(dfsView(f));
          const I = ids(G), n = I.length, W = st.width, Hh = st.height, x0 = 44, x1 = W - 16, top = 56, rowH = Math.min(26, (Hh - top - 26) / Math.max(n, 1));
          const X = (t) => x0 + ((x1 - x0) * t) / (2 * n + 1);
          strip(st, f.stack.map((u, i) => ({ label: G.lab(u), color: 'orange', fill: i === f.stack.length - 1 ? 'orange' : null })), 10, 8, { title: 'stack (top →)', titleW: 96, w: 28, h: 24, maxW: W - 20, empty: 'empty — between searches' });
          for (let t = 1; t <= 2 * n; t++) { L(st, X(t), top - 4, X(t), top + n * rowH, { color: 'grid', width: 1 }); if (n <= 12 || t % 2 === 0) T(st, t, X(t), top + n * rowH + 10, { align: 'center', size: 10.5, color: t === f.time ? 'ink' : 'muted', weight: t === f.time ? 800 : 500 }); }
          I.forEach((u, k) => {
            const Y = top + k * rowH + rowH / 2, d = f.d[K(u)], fi = f.f[K(u)];
            T(st, G.lab(u), 18, Y, { align: 'center', size: 12.5, weight: 700, color: f.color[K(u)] === 1 ? 'orange' : f.color[K(u)] === 2 ? 'accent' : 'muted' });
            if (d == null) return;
            const end = fi ?? f.time + 0.5, col = fi != null ? 'accent' : 'orange';
            R(st, X(d) - 4, Y - rowH * 0.32, X(end) + (fi != null ? 4 : 0), Y + rowH * 0.32, { fill: col, fillAlpha: K(u) === K(f.u) ? 0.75 : 0.45, color: col, width: 1.2, radius: 4 });
            T(st, d, X(d), Y, { align: 'center', size: 10.5, weight: 700, color: 'ink' });
            if (fi != null) T(st, fi, X(fi), Y, { align: 'center', size: 10.5, weight: 700, color: 'ink' });
          });
          L(st, X(f.time + 0.5), top - 6, X(f.time + 0.5), top + n * rowH, { color: 'gold', width: 2 });
        });
        v.legend([['gold', 'current vertex', { dot: true }], ['orange', 'grey: on the stack', { dot: true }], ['accent', 'black: finished', { dot: true }], ['green', 'tree edge']]);
        v.readout(() => {
          const f = S.frame; if (!f.color) return '';
          const pathOK = f.stack.every((u, i) => i === 0 || K(f.prev[K(u)]) === K(f.stack[i - 1]));
          const grey = ids(G).filter((u) => f.color[K(u)] === 1).length;
          const head = `clock = ${f.time} · grey vertices ${grey} = stack depth ${f.stack.length} ${grey === f.stack.length ? '✓' : '✗'}, and the stack is a path of tree edges ${pathOK ? '✓' : '✗'}`;
          if (f.type !== 'done') return head;
          const stamps = ids(G).flatMap((u) => [f.d[K(u)], f.f[K(u)]]), distinct = new Set(stamps).size === stamps.length && stamps.every((t) => t >= 1 && t <= 2 * G.nodes.length);
          return `${head} · ${stamps.length} distinct stamps in $1..2n$ ${distinct ? '✓' : '✗'}, $d < f$ for every vertex ${ids(G).every((u) => f.d[K(u)] < f.f[K(u)]) ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.8
    {
      num: '8.8',
      kind: 'Theorem',
      name: 'Parenthesis theorem',
      statement: String.raw`In any depth-first search of a directed or undirected graph, for every two vertices $u$ and $v$ exactly one of the following holds:
(a) the intervals $[d[u],f[u]]$ and $[d[v],f[v]]$ are disjoint, and neither vertex is a descendant of the other in the DFS forest;
(b) $[d[u],f[u]]\subset[d[v],f[v]]$, and $u$ is a descendant of $v$;
(c) $[d[v],f[v]]\subset[d[u],f[u]]$, and $v$ is a descendant of $u$.

So writing "$(u$" at time $d[u]$ and "$u)$" at time $f[u]$ produces a well-nested parenthesis expression. In particular, $v$ is a proper descendant of $u$ if and only if $d[u]<d[v]<f[v]<f[u]$.`,
      idea: String.raw`Suppose $d[u]<d[v]$. If $d[v]<f[u]$, then $v$ was discovered while $u$ was grey, that is while $\mathrm{Visit}(u)$ was on the call stack, so $v$ is a descendant of $u$. Its call is nested inside $u$'s, so it returns first: $f[v]<f[u]$, case (c). Otherwise $f[u]<d[v]$, the two calls do not overlap, and neither vertex lies below the other, case (a). The nesting is that of a call stack, which is last-in first-out, and a FIFO queue does not nest. Stamping vertices when a queue admits and releases them produces crossing intervals.`,
      caption: String.raw`The bottom panel draws every interval $[d,f]$ as a bracket, stacked by depth in the DFS forest, with the parenthesis word underneath. Pick the **start** vertex, or switch to **edit edges** and click pairs of vertices: the brackets always nest or sit side by side. Click a vertex (in **inspect** mode) to light up its interval and its descendants. Turn on **stamp with a queue** to break it: crossing intervals appear in red.`,
      deps: ['algo-8.7'],
      refs: ['CLRS 4e §20.3'],
      tags: ['graphs', 'dfs'],
      viz(v) {
        const startSel = v.select('start at', [...'abcdefghi'].map((x) => ({ value: x, label: x })), 'a');
        const mode = v.select('click a vertex to', [{ value: 'see', label: 'inspect' }, { value: 'edit', label: 'edit edges' }], 'see');
        const useQ = v.toggle('stamp with a queue (breaks it)', false);
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 290 });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true });
        const G = v.graph(s, { directed: true, layout: 'none', editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P88, { a: { notePos: 'w' }, c: { notePos: 's' }, f: { notePos: 's' }, h: { notePos: 's' } }), edges: E88.map(([a, b]) => [a, b]) });
        let sel = 'b';
        G.onClick = ({ node }) => { if (mode.value === 'see') { if (node) sel = node.id; return true; } return false; };
        let info = {};
        v.render(() => {
          const r0 = G.has(startSel.value) ? startSel.value : ids(G)[0], roots = [r0, ...ids(G).filter((x) => K(x) !== K(r0))];
          const Rr = useQ.value ? queueStamps(G, roots) : dfsTrace(G, { roots, events: false });
          const I = ids(G), n = I.length, depth = {}; for (const u of I) { let k = 0, x = u; while (Rr.prev[K(x)] != null && k < 99) { x = Rr.prev[K(x)]; k++; } depth[K(u)] = k; }
          const desc = (a, b) => K(a) !== K(b) && isAnc(Rr.prev, a, b);
          const crosses = []; let nestOK = 0, pairs = 0, ancOK = 0;
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
            const a = K(I[i]), b = K(I[j]), [da, fa, db, fb] = [Rr.d[a], Rr.f[a], Rr.d[b], Rr.f[b]]; pairs++;
            const inAB = db > da && fb < fa, inBA = da > db && fa < fb, disj = fa < db || fb < da;
            if (inAB || inBA || disj) nestOK++; else crosses.push([a, b]);
            if ((inAB === desc(a, b)) && (inBA === desc(b, a))) ancOK++;
          }
          const selK = K(validPick(G, sel)), inSel = (x) => Rr.d[K(x)] > Rr.d[selK] && Rr.f[K(x)] < Rr.f[selK];
          const crossV = new Set(crosses.flat());
          G.draw({
            nodeFill: (x) => (K(x) === selK ? 'gold' : inSel(x) ? 'green' : null),
            nodeColor: (x) => (crossV.has(K(x)) ? 'red' : 'accent'),
            nodeNote: (x) => `${Rr.d[K(x)]}/${Rr.f[K(x)]}`, noteColor: (x) => (crossV.has(K(x)) ? 'red' : 'muted'),
            nodeRing: (x) => (K(x) === K(r0) ? 'ink' : null),
            edgeColor: (e) => (Rr.prev[K(e.to)] != null && K(Rr.prev[K(e.to)]) === K(e.from) ? 'green' : null),
            edgeWidth: (e) => (Rr.prev[K(e.to)] != null && K(Rr.prev[K(e.to)]) === K(e.from) ? 3 : null),
          });
          // brackets
          const W = st.width, Hh = st.height, x0 = 20, x1 = W - 20, maxD = Math.max(...Object.values(depth)), rowH = Math.min(30, (Hh - 70) / (maxD + 1)), X = (t) => x0 + ((x1 - x0) * (t - 0.5)) / (2 * n);
          for (let t = 1; t <= 2 * n; t++) T(st, t, X(t), 10, { align: 'center', size: 10, color: 'faint' });
          I.forEach((u) => {
            const k = depth[K(u)], Y0 = 22 + k * rowH, Y1 = Y0 + rowH - 5, d = Rr.d[K(u)], fi = Rr.f[K(u)];
            const col = crossV.has(K(u)) ? 'red' : K(u) === selK ? 'gold' : inSel(u) ? 'green' : COMP[k % COMP.length];
            R(st, X(d) - 7, Y0, X(fi) + 7, Y1, { fill: col, fillAlpha: K(u) === selK || inSel(u) ? 0.35 : 0.14, color: col, width: crossV.has(K(u)) ? 2.2 : 1.3, radius: 6 });
            T(st, G.lab(u), X(d) + 1, (Y0 + Y1) / 2, { align: 'left', size: 12, weight: 700, color: col === 'gold' ? 'ink' : col });
          });
          // the parenthesis word
          const Yw = Hh - 16, word = [];
          for (const u of I) { word.push([Rr.d[K(u)], `(${G.lab(u)}`, u]); word.push([Rr.f[K(u)], `${G.lab(u)})`, u]); }
          word.sort((a, b) => a[0] - b[0]).forEach(([t, w, u]) => T(st, w, X(t), Yw, { align: 'center', size: 12.5, weight: 700, color: crossV.has(K(u)) ? 'red' : K(u) === selK ? 'gold' : inSel(u) ? 'green' : 'muted' }));
          info = { pairs, nestOK, ancOK, crosses, selK, descN: I.filter((x) => inSel(x)), dfsDesc: I.filter((x) => desc(selK, x)), Rr };
        });
        v.legend([['gold', 'selected vertex', { dot: true }], ['green', 'intervals inside it = its descendants', { dot: true }], ['red', 'crossing intervals', { dot: true }], ['ink', 'start vertex (ring)', { dot: true }]]);
        v.readout(() => {
          const { pairs, nestOK, ancOK, crosses, selK, descN, dfsDesc, Rr } = info; if (!Rr) return '';
          const lab = (x) => G.lab(x);
          const head = `${nestOK} of ${pairs} pairs of intervals nested or disjoint ${crosses.length ? `— **${crosses.length} cross** (${crosses.slice(0, 4).map(([a, b]) => `${lab(a)}/${lab(b)}`).join(', ')}${crosses.length > 4 ? ', …' : ''}) ✗` : '✓'}`;
          const anc = useQ.value ? '' : ` · nesting ⇔ ancestry for ${ancOK} of ${pairs} pairs ${ancOK === pairs ? '✓' : '✗'}`;
          const sameSet = descN.length === dfsDesc.length && descN.every((x) => dfsDesc.includes(x));
          return `${head}${anc} · ${lab(selK)} = [${Rr.d[selK]}, ${Rr.f[selK]}] contains {${descN.map(lab).join(', ')}}${useQ.value ? '' : `, its descendants ${sameSet ? '✓' : '✗'}`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.9
    {
      num: '8.9',
      kind: 'Theorem',
      name: 'White-path theorem',
      statement: String.raw`In a depth-first search of a directed or undirected graph, a vertex $v$ becomes a descendant of $u$ in the DFS forest if and only if, at the time $d[u]$ when $u$ is discovered, there is a path from $u$ to $v$ consisting entirely of white vertices (apart from $u$ itself, which has just turned grey).`,
      idea: String.raw`If $v$ is a descendant of $u$, the tree path from $u$ to $v$ will do: by the parenthesis theorem (8.8) every vertex on it is discovered after $u$, so at time $d[u]$ they are all still white. Conversely, suppose a white path $u=w_0,w_1,\dots,w_k=v$ exists at time $d[u]$, but $v$ does not become a descendant; take the first $w_i$ on the path that does not. Its predecessor $w_{i-1}$ is a descendant (or $u$ itself), so $f[w_{i-1}]\le f[u]$. The vertex $w_i$ is white when $u$ is discovered, so $d[u]<d[w_i]$. And $w_i$ must be discovered before $w_{i-1}$ finishes, because $\mathrm{Visit}(w_{i-1})$ scans the edge to it. So $d[u]<d[w_i]<f[w_{i-1}]\le f[u]$, and by 8.8 $w_i$ is a descendant after all. Reachability alone is not enough: vertices that are already black when $u$ is discovered are reachable without becoming descendants.`,
      caption: String.raw`Choose a vertex $u$ and step through DFS. From the moment $u$ is discovered, the vertices reachable from it through white vertices carry **gold rings**. Vertices reachable only through already-finished ones carry **red rings**: they never become descendants. Descendants of $u$ turn **green** as they finish. In the timeline, the band marks $u$'s interval $[d[u],f[u]]$. Use **Shuffle start order** to run the search from different roots; the readout compares the two sets every time.`,
      deps: ['algo-8.8'],
      refs: ['CLRS 4e §20.3'],
      tags: ['graphs', 'dfs'],
      viz(v) {
        const uSel = v.select('u =', [...'abcdefghi'].map((x) => ({ value: x, label: x })), 'd', { onChange: () => S.reset({ at: 'keep' }) });
        let order = [...'abcdefghi'];
        v.button('Shuffle start order', () => { const r = v.rng(order.join('').charCodeAt(order.length - 1) + order.indexOf('d') * 13 + 7); order = r.shuffle(order.slice()); S.reset({ at: 'end' }); });
        v.button('Reset order', () => { order = [...'abcdefghi']; S.reset({ at: 'end' }); });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 300 });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true });
        const G = v.graph(s, { directed: true, layout: 'none', draggable: true, nodes: nodesAt(P89, { c: { notePos: 's' }, h: { notePos: 's' }, g: { notePos: 's' }, i: { notePos: 's' } }), edges: E89.map(([a, b]) => [a, b]) });
        const run = () => dfsTrace(G, { roots: order.filter((x) => G.has(x)) });
        const S = v.steps({ frames: () => run().events, code: DFS_CODE, codeTitle: 'DFS(G)', codePos: 'below', speed: 1.5, start: 'end', still: 'end' });
        /** White-reachable set from u in the snapshot taken when u was discovered. */
        const whiteSet = (evs, u) => {
          const e0 = evs.find((e) => (e.type === 'enter' || e.type === 'start') && K(e.u) === K(u)); if (!e0) return null;
          const seen = new Set([K(u)]), q = [u];
          while (q.length) { const x = q.shift(); for (const { id } of G.adj(x)) if (!seen.has(K(id)) && e0.color[K(id)] === 0) { seen.add(K(id)); q.push(id); } }
          const all = new Set([K(u)]), q2 = [u]; while (q2.length) { const x = q2.shift(); for (const { id } of G.adj(x)) if (!all.has(K(id))) { all.add(K(id)); q2.push(id); } }
          return { W: seen, all, t: e0.time };
        };
        let info = {};
        v.render(() => {
          const f = S.frame; if (!f.color) return;
          const u = uSel.value, ws = whiteSet(S.frames, u), discovered = f.d[K(u)] != null;
          const desc = (x) => K(x) !== K(u) && isAnc(f.prev, u, x);
          const base = dfsView(f);
          G.draw({
            ...base,
            nodeFill: (x) => (desc(x) && f.color[K(x)] === 2 ? 'green' : base.nodeFill(x)),
            nodeRing: (x) => (!discovered || !ws ? (K(x) === K(u) ? 'ink' : null) : ws.W.has(K(x)) ? 'gold' : ws.all.has(K(x)) ? 'red' : null),
          });
          // timeline with u's interval band
          const I = ids(G), n = I.length, W = st.width, Hh = st.height, x0 = 40, x1 = W - 14, top = 14, rowH = Math.min(24, (Hh - top - 24) / n), X = (t) => x0 + ((x1 - x0) * t) / (2 * n + 1);
          if (discovered) R(st, X(f.d[K(u)]), top - 6, X(f.f[K(u)] ?? f.time + 0.5), top + n * rowH, { fill: 'gold', fillAlpha: 0.12, color: 'gold', width: 1.4, dash: f.f[K(u)] == null ? [5, 4] : null, radius: 4 });
          for (let t = 1; t <= 2 * n; t++) T(st, t, X(t), top + n * rowH + 10, { align: 'center', size: 10, color: t === f.time ? 'ink' : 'faint' });
          I.forEach((x, k) => {
            const Y = top + k * rowH + rowH / 2, d = f.d[K(x)], fi = f.f[K(x)];
            const col = K(x) === K(u) ? 'gold' : desc(x) ? 'green' : ws && discovered && ws.all.has(K(x)) && !ws.W.has(K(x)) ? 'red' : 'accent';
            T(st, G.lab(x), 16, Y, { align: 'center', size: 12, weight: 700, color: col === 'accent' ? 'muted' : col });
            if (d == null) return;
            R(st, X(d) - 3, Y - rowH * 0.3, X(fi ?? f.time + 0.5) + 3, Y + rowH * 0.3, { fill: col, fillAlpha: 0.5, color: col, width: 1, radius: 4 });
          });
          info = { f, u, ws, discovered, descs: I.filter(desc) };
        });
        v.legend([['gold', 'white-reachable at time d[u] (ring)', { dot: true }], ['red', 'reachable, but already black (ring)', { dot: true }], ['green', 'finished descendant of u', { dot: true }], ['orange', 'grey', { dot: true }]]);
        v.readout(() => {
          const { f, u, ws, discovered, descs } = info; if (!f) return '';
          const lab = (x) => G.lab(x), order2 = order.filter((x) => G.has(x)).join(' ');
          if (!discovered || !ws) return `Start order: ${order2} · $u = ${u}$ is still white — step on until it is discovered`;
          const Wm = [...ws.W].filter((x) => x !== K(u)), blackR = [...ws.all].filter((x) => !ws.W.has(x));
          const head = `Start order: ${order2} · at $d[${u}] = ${ws.t}$ white paths reach {${Wm.map(lab).join(', ') || '∅'}}${blackR.length ? `; {${blackR.map(lab).join(', ')}} reachable but already black` : ''}`;
          if (f.f[K(u)] == null) return `${head} · ${u} is still grey`;
          const same = Wm.length === descs.length && Wm.every((x) => descs.map(K).includes(x));
          return `${head} · descendants of ${u}: {${descs.map(lab).join(', ') || '∅'}} ${same ? '= the white-reachable set ✓' : '≠ ✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.10
    {
      num: '8.10',
      kind: 'Definition',
      name: 'Tree, back, forward and cross edges',
      statement: String.raw`A depth-first search sorts the edges $u\to v$ of a directed graph into four types:
- **tree edges**: edges of the DFS forest ($v$ was discovered along $u\to v$);
- **back edges**: $v$ is an ancestor of $u$ (self-loops included);
- **forward edges**: non-tree edges with $v$ a proper descendant of $u$;
- **cross edges**: all others; then $v$ finished before $u$ was discovered ($f[v]<d[u]$).

When the edge is first examined, the colour of $v$ tells the type: white means tree, grey means back, and black means forward if $d[u]<d[v]$ and cross otherwise. In an **undirected** graph every edge is a tree edge or a back edge.`,
      idea: String.raw`When DFS examines $u\to v$, $u$ is grey. If $v$ is grey too, both calls are active and $v$'s is older, so $v$ is an ancestor: a back edge. If $v$ is black it has finished. By the parenthesis theorem (8.8), either $[d[v],f[v]]$ lies inside $u$'s still-open interval (a descendant, so forward) or entirely before it (cross). So the colour test and the interval test agree, and cross edges always point "backwards in time". In an undirected graph, the first time an edge $uv$ is examined from the side discovered earlier, say $u$, the other end $v$ is either white (giving a tree edge) or a descendant still being explored. In the second case $v$ examines $uv$ from its own side first, while $u$ is grey, and classifies it as back. So forward and cross edges never arise.`,
      caption: String.raw`Step through DFS: each edge takes its type's colour at the moment it is examined. In the arc diagram, vertices are lined up by discovery time; tree and forward edges arc above the line and point later in time, while back and cross edges arc below and point earlier. Toggle **undirected**: purple and teal disappear. The readout reclassifies every edge from the final timestamps alone and compares.`,
      deps: ['algo-8.8'],
      refs: ['CLRS 4e §20.3'],
      tags: ['graphs', 'dfs'],
      viz(v) {
        const und = v.toggle('undirected', false, { onChange: (x) => { G.set({ directed: !x }); S.reset({ at: 'end' }); } });
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 300 });
        const sa = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true });
        const G = v.graph(s, { directed: true, layout: 'none', editable: { addEdge: true, deleteEdge: true }, nodes: nodesAt(P810, { e: { notePos: 's' }, f: { notePos: 's' }, g: { notePos: 's' }, h: { notePos: 's' } }), edges: E810.map(([a, b]) => [a, b]) });
        G.onChange = () => S.reset({ at: 'end' });
        const S = v.steps({ frames: () => dfsTrace(G).events, code: DFS_CODE, codeTitle: 'DFS(G)', codePos: 'below', speed: 2, start: 'end', still: 'end' });
        let info = {};
        v.render(() => {
          const f = S.frame; if (!f.color) return;
          G.draw(dfsView(f));
          const last = S.frames[S.frames.length - 1], I = ids(G).slice().sort((a, b) => last.d[K(a)] - last.d[K(b)]), n = I.length, W = sa.width, Hh = sa.height, Y = Hh / 2, x0 = 34, x1 = W - 34;
          const X = (u) => x0 + ((x1 - x0) * I.findIndex((x) => K(x) === K(u))) / Math.max(1, n - 1);
          L(sa, x0 - 14, Y, x1 + 14, Y, { color: 'faint', width: 1 });
          for (const e of G.edges) {
            const kind = f.kinds.get(e); if (!kind) continue;
            let a = e.from, b = e.to;
            if (!G.isDirected(e) && last.d[K(a)] > last.d[K(b)] === (kind === 'tree')) [a, b] = [b, a];
            const Xa = X(a), Xb = X(b), up = kind === 'tree' || kind === 'forward', hgt = Math.min(Hh / 2 - 20, 10 + 0.3 * Math.abs(Xb - Xa));
            if (K(a) === K(b)) { sa.circle(sa.invX(Xa), sa.invY(Y + 16), (sa.invX(Xa + 9) - sa.invX(Xa)), { color: 'red', width: 2 }); continue; }
            arcPx(sa, Xa, Xb, Y, up ? -hgt : hgt, { color: KIND_COL[kind], width: e === f.edge ? 3.4 : kind === 'tree' ? 2.4 : 1.8, dash: kind === 'tree' ? null : [5, 4], head: G.isDirected(e) });
          }
          I.forEach((u) => {
            const st0 = f.color[K(u)];
            sa.dot(sa.invX(X(u)), sa.invY(Y), { r: 11, color: K(u) === K(f.u) && f.type !== 'done' ? 'gold' : st0 === 2 ? 'accent' : st0 === 1 ? 'orange' : 'faint' });
            T(sa, G.lab(u), X(u), Y, { align: 'center', size: 11.5, weight: 700, color: 'panel', halo: false });
            if (last.d[K(u)] != null) T(sa, `d=${last.d[K(u)]}`, X(u), Y + 22, { align: 'center', size: 10, color: 'muted' });
          });
          T(sa, 'later in time →', x1 + 4, 12, { align: 'right', size: 10.5, color: 'faint' });
          const cnt = { tree: 0, back: 0, forward: 0, cross: 0 }; for (const k of f.kinds.values()) cnt[k]++;
          let agree = 0, total = 0;
          if (f.type === 'done') for (const e of G.edges) { total++; if (kindByTimes(last, e, G.isDirected(e)) === last.kinds.get(e)) agree++; }
          info = { f, cnt, agree, total };
        });
        v.legend([['green', 'tree'], ['red', 'back', { dash: true }], ['purple', 'forward', { dash: true }], ['teal', 'cross', { dash: true }]]);
        v.readout(() => {
          const { f, cnt, agree, total } = info; if (!f) return '';
          const c = `tree ${cnt.tree} · back ${cnt.back} · forward ${cnt.forward} · cross ${cnt.cross}`;
          if (f.type !== 'done') return `${c} so far`;
          return `${c} · interval test (from $d$, $f$ only) agrees on ${agree} of ${total} edges ${agree === total ? '✓' : '✗'}${und.value ? ` · undirected: forward + cross = ${cnt.forward + cnt.cross} ${cnt.forward + cnt.cross === 0 ? '✓' : '✗'}` : ''}`;
        });
      },
    },
  ],
};
