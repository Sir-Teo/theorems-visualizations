// Graph Theory (Diestel) — Chapter 1: The Basics (§§1.1–1.3; §§1.4–1.6 in ch01-b.js, §§1.7–1.10 in ch01-c.js)
import { K, ix, degrees, bfs, girth, longestPath, longestCycle, eccs, parPath, pathEdges, n0, named, randomCubic, girthSwitch, radial, ekey } from './ch01.shared.js';

// ---------- local helpers ----------
const fixed = (P, E) => ({ nodes: Object.entries(P).map(([id, [x, y]]) => ({ id, x, y })), edges: E.trim().split(/\s+/).map((p) => [p[0], p[1]]), layout: 'none' });
const gstage = (v, o = {}) => v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 320, ...o });
const EDIT = 'click empty space to add a vertex, click two vertices to add or remove the edge between them, Alt-click to delete, drag to move';
/** Kit edge objects for a list of edge indices. */
const eset = (H, ks) => new Set(ks.map((k) => H.E[k][2]));
const fmt2 = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2));
/** Structural summary used by the isomorphism item. */
function invariants(G) {
  const H = ix(G), d = degrees(H).sort((a, b) => b - a), { g } = girth(H), e = eccs(H);
  let tri = 0; const A = H.adj.map((l) => new Set(l.map(([w]) => w)));
  H.E.forEach(([a, b]) => { for (const w of A[a]) if (w > b && A[b].has(w)) tri++; });
  const cnt = {}; d.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1));
  return { n: H.n, m: H.m, deg: Object.keys(cnt).sort((a, b) => b - a).map((x) => `${x}^${cnt[x]}`).join(' '), g, diam: e.diam, tri };
}
/** Random graph with girth ≥ t and average degree ≥ d (greedy insertion); returns {n, avg, g}. */
function greedyGirth(n, t, d, r) {
  const adj = Array.from({ length: n }, () => []), pairs = []; let m = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
  const near = (u, w) => { // is w within distance t − 2 of u?
    if (t <= 3) return false; const dist = new Map([[u, 0]]), q = [u];
    for (let i = 0; i < q.length; i++) { const x = q[i], dx = dist.get(x); if (dx >= t - 2) continue; for (const y of adj[x]) if (!dist.has(y)) { if (y === w) return true; dist.set(y, dx + 1); q.push(y); } }
    return false;
  };
  for (const [u, w] of pairs) { if (2 * m >= d * n) break; if (!near(u, w)) { adj[u].push(w); adj[w].push(u); m++; } }
  const H = { n, adj: adj.map((l, u) => l.map((w) => [w, u < w ? u * n + w : w * n + u])) };
  return { n, avg: (2 * m) / n, g: girth(H).g };
}
const CUBIC_CAGES = [[4, 3, 'K_4'], [6, 4, 'K_{3,3}'], [10, 5, '\\text{Petersen}'], [14, 6, '\\text{Heawood}'], [24, 7, '\\text{McGee}'], [30, 8, '\\text{Tutte–Coxeter}'], [58, 9, ''], [70, 10, ''], [112, 11, ''], [126, 12, '']];

export default {
  collection: 'graph',
  chapter: 1,
  title: 'The Basics',
  summary: String.raw`The opening chapter fixes the working vocabulary — graphs, degrees, paths and cycles, connectivity, trees, bipartite graphs, minors — and at once relates invariants to one another: a high average degree forces a dense core and even a highly connected subgraph, a high minimum degree forces long paths and cycles, and girth, diameter and order constrain each other through the Moore bounds. Euler's theorem characterises the graphs with an Euler tour by their degrees, and the chapter ends with the linear algebra of a graph over $\mathbb F_2$, where the cycle space and the cut space are orthogonal complements spanned by the fundamental cycles and fundamental cuts of any spanning tree.`,
  items: [
    // ================================================================== 1.1 Graphs
    {
      num: '1.1.1a', kind: 'Definition', name: 'Graph: vertices and edges', verify: true,
      statement: String.raw`A **graph** is a pair $G=(V,E)$ of disjoint sets with $E\subseteq[V]^2$, the set of 2-element subsets of $V$. The elements of $V$ are the **vertices** of $G$, the elements of $E$ its **edges**; an edge $\{x,y\}$ is written $xy$, it **joins** its **ends** $x$ and $y$, which are then **adjacent** (neighbours), and it is **incident** with each of them. The number of vertices is the **order** $|G|$, the number of edges is $\|G\|$. A graph is determined by which pairs are edges — not by how it is drawn.`,
      idea: String.raw`Everything in graph theory is built on this one combinatorial datum: a set and a family of 2-subsets of it. Loops (an edge from a vertex to itself) and repeated edges are excluded by the definition; they return in multigraphs (1.10.1a). Since $E\subseteq[V]^2$, a graph of order $n$ has at most $\binom n2$ edges, with equality exactly for the complete graph $K^n$.`,
      caption: String.raw`The left panel is one drawing of $G$, the right panel is $G$ itself: the triangle of all pairs $\{x,y\}$ with the edges filled in. Click a cell to toggle that pair, or edit the drawing (${EDIT}); both views and the sets below stay in sync. Vertex 6 is isolated: it belongs to $V$ but to no edge.`,
      deps: [], see: ['algo-8.1'], refs: ['Diestel §1.1'], tags: ['graphs'],
      viz(v) {
        const s = gstage(v, { y: [0, 6.6], height: 320, title: 'a drawing of $G=(V,E)$' });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'the edge set $E\\subseteq[V]^2$' });
        const P = { 1: [1.0, 3.2], 2: [2.6, 1.0], 5: [3.6, 3.7], 7: [5.4, 5.7], 3: [7.6, 1.2], 4: [9.0, 3.6], 6: [6.4, 3.0] };
        const G = v.graph(s, { nodes: Object.entries(P).map(([id, [x, y]]) => ({ id: +id, x, y })), edges: [[1, 2], [1, 5], [2, 5], [3, 4], [5, 7]], editable: true, r: 14, layout: 'none' });
        G.onChange = (kind, obj) => { if (kind === 'add-node' && G.nodes.length > 10) G.removeNode(obj.id); };
        const T = v.table(t, { rows: 7, cols: 7, maxCell: 36, size: 12.5 });
        const ids = () => G.nodes.map((n) => n.id).sort((a, b) => a - b);
        t.onClick((x, y) => {
          const c = T.hit(x, y), I = ids(); if (!c || c.i < 0 || c.j < 0 || c.i === c.j) return;
          const a = I[Math.min(c.i, c.j)], b = I[Math.max(c.i, c.j)], e = G.edge(a, b); if (e) G.removeEdge(e); else G.addEdge(a, b);
        });
        v.render(() => {
          const I = ids(), n = I.length, iso = new Set(I.filter((id) => G.degree(id) === 0));
          G.draw({ nodeColor: (id) => (iso.has(id) ? 'muted' : 'accent') });
          T.draw({
            rows: n, cols: n, rowLabels: I, colLabels: I,
            value: (i, j) => (i < j ? (G.edge(I[i], I[j]) ? `${I[i]}${I[j] > 9 ? '·' : ''}${I[j]}` : '') : null),
            fill: (i, j) => (i < j ? (G.edge(I[i], I[j]) ? ['accent', 0.55] : ['faint', 0.1]) : null),
            textColor: () => 'ink', size: n > 8 ? 10.5 : 12.5,
          });
        });
        v.legend([['accent', 'edge: a pair in $E$', { area: true }], ['faint', 'pair in $[V]^2\\setminus E$', { area: true }]]);
        v.readout(() => {
          const I = ids(), n = I.length, E = G.edges.map((e) => [Math.min(e.from, e.to), Math.max(e.from, e.to)]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
          return `V = {${I.join(', ')}} · E = {${E.map(([a, b]) => `{${a},${b}}`).join(', ')}} · $|G| = ${n}$, $\\|G\\| = ${E.length}$ of the $\\binom{${n}}{2} = ${(n * (n - 1)) / 2}$ possible pairs`;
        });
      },
    },
    {
      num: '1.1.1b', kind: 'Definition', name: 'Isomorphism, graph properties and invariants', verify: true,
      statement: String.raw`A map $\varphi\colon V\to V'$ is a **homomorphism** from $G=(V,E)$ to $G'=(V',E')$ if it sends adjacent vertices to adjacent vertices. If $\varphi$ is bijective and $xy\in E\iff\varphi(x)\varphi(y)\in E'$ for all $x,y\in V$, it is an **isomorphism**, and $G$ and $G'$ are **isomorphic**, $G\cong G'$; an isomorphism from $G$ to itself is an **automorphism**. A class of graphs closed under isomorphism is a **graph property**, and a map that assigns equal values to isomorphic graphs is a **graph invariant** — the order, the number of edges, the degree sequence, the girth and the diameter are examples.`,
      idea: String.raw`An isomorphism is a renaming of the vertices that carries edges to edges *and* non-edges to non-edges, so isomorphic graphs are the same abstract graph drawn differently. Invariants give a cheap one-way test: if any invariant differs the graphs cannot be isomorphic, while equal invariants prove nothing — deciding isomorphism in general needs a search like the backtracking used here.`,
      caption: String.raw`Click a vertex of $G$, then a vertex of $G'$ to set its image. An edge turns green when its image is an edge and red when it is not (on the right, red marks an edge whose preimage is a non-edge). **Complete** extends your partial map by backtracking, if it can be extended. Switch $G'$ to the pentagonal prism: the order, size and degrees agree, but the girth does not, so no bijection can ever turn everything green.`,
      deps: ['graph-1.1.1a'], refs: ['Diestel §1.1'], tags: ['graphs', 'isomorphism'],
      viz(v) {
        const which = v.select("$G'$ =", [{ value: 'pet', label: 'Petersen, redrawn' }, { value: 'prism', label: 'pentagonal prism' }], 'pet', { onChange: () => setRight() });
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.3], axes: false, equal: true, height: 300, title: '$G$ (Petersen graph)' });
        const R = v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.3], axes: false, equal: true, height: 300, title: "$G'$" });
        const PET = named('petersen'), LET = 'abcdefghij';
        const GL = v.graph(L, { nodes: PET.nodes.map((n) => ({ ...n, label: LET[n.id] })), edges: PET.edges, layout: 'fit', r: 13, pad: 30 });
        const GR = v.graph(R, { nodes: [], edges: [], layout: 'none', r: 13, pad: 30 });
        const cyc = [3, 4, 9, 6, 8, 5, 0, 1, 2], sig = { 7: 9 }; cyc.forEach((u, i) => (sig[u] = i));
        const ringXY = (i) => (i < 9 ? [Math.cos(Math.PI / 2 - (2 * Math.PI * i) / 9), Math.sin(Math.PI / 2 - (2 * Math.PI * i) / 9)] : [0, 0]);
        let phi = new Map(), selL = null, msg = '';
        function setRight() {
          if (which.value === 'pet') GR.set({ nodes: [...Array(10)].map((_, i) => ({ id: 'r' + i, label: String(i + 1), x: ringXY(i)[0], y: ringXY(i)[1] })), edges: PET.edges.map(([a, b]) => ['r' + sig[a], 'r' + sig[b]]) }).layout('fit');
          else { const P = named('prism', 5); GR.set({ nodes: P.nodes.map((n) => ({ id: 'r' + n.id, label: String(n.id + 1), x: n.x, y: n.y })), edges: P.edges.map(([a, b]) => ['r' + a, 'r' + b]) }).layout('fit'); }
          phi = new Map(); selL = null; msg = '';
          if (which.value === 'pet') for (const u of [0, 1, 5]) phi.set(u, 'r' + sig[u]);
        }
        setRight();
        GL.onClick = ({ node }) => { selL = node ? (selL === node.id ? null : node.id) : null; msg = ''; return true; };
        GR.onClick = ({ node }) => {
          if (!node) return true; msg = '';
          for (const [l, r] of phi) if (r === node.id) phi.delete(l);
          if (selL != null) { phi.set(selL, node.id); const free = GL.nodes.find((n) => !phi.has(n.id)); selL = free ? free.id : null; }
          return true;
        };
        function complete() {
          const HL = ix(GL), HR = ix(GR), n = HL.n, AL = HL.adj.map((l) => new Set(l.map(([w]) => w))), AR = HR.adj.map((l) => new Set(l.map(([w]) => w)));
          const map = new Array(n).fill(-1), used = new Array(n).fill(false);
          for (const [l, r] of phi) { map[HL.at(l)] = HR.at(r); used[HR.at(r)] = true; }
          const ok = (u, w) => { if (AL[u].size !== AR[w].size) return false; for (let x = 0; x < n; x++) if (map[x] >= 0 && x !== u && AL[u].has(x) !== AR[w].has(map[x])) return false; return true; };
          for (let u = 0; u < n; u++) if (map[u] >= 0 && !ok(u, map[u])) return false;
          const todo = [...Array(n).keys()].filter((u) => map[u] < 0);
          const rec = (i) => { if (i === todo.length) return true; const u = todo[i]; for (let w = 0; w < n; w++) if (!used[w] && ok(u, w)) { map[u] = w; used[w] = true; if (rec(i + 1)) return true; map[u] = -1; used[w] = false; } return false; };
          if (!rec(0)) return false;
          phi = new Map(map.map((w, u) => [HL.ids[u], HR.ids[w]])); return true;
        }
        v.button('Complete', () => { msg = complete() ? 'found an isomorphism' : 'this partial map extends to no isomorphism'; selL = null; });
        v.button('Clear', () => { phi = new Map(); selL = null; msg = ''; });
        const status = () => {
          const img = (a, b) => phi.has(a) && phi.has(b) ? (GR.edge(phi.get(a), phi.get(b)) ? 1 : -1) : 0, inv = new Map([...phi].map(([l, r]) => [r, l]));
          const pre = (a, b) => inv.has(a) && inv.has(b) ? (GL.edge(inv.get(a), inv.get(b)) ? 1 : -1) : 0;
          return { img, pre, inv };
        };
        v.render(() => {
          const { img, pre, inv } = status();
          GL.draw({ nodeFill: (id) => (id === selL ? 'gold' : phi.has(id) ? 'teal' : null), nodeNote: (id) => (phi.has(id) ? GR.lab(phi.get(id)) : null), noteColor: () => 'teal',
            edgeColor: (e) => ({ 1: 'green', '-1': 'red' })[img(e.from, e.to)] ?? null, edgeWidth: (e) => (img(e.from, e.to) ? 3.2 : null) });
          GR.draw({ nodeFill: (id) => (inv.has(id) ? 'teal' : null), nodeNote: (id) => (inv.has(id) ? LET[inv.get(id)] : null), noteColor: () => 'teal',
            edgeColor: (e) => ({ 1: 'green', '-1': 'red' })[pre(e.from, e.to)] ?? null, edgeWidth: (e) => (pre(e.from, e.to) ? 3.2 : null), edgeDash: (e) => pre(e.from, e.to) === -1 });
        });
        v.legend([['teal', 'mapped vertex', { dot: true }], ['gold', 'selected', { dot: true }], ['green', 'adjacency preserved'], ['red', 'adjacency broken']]);
        const IL = invariants(GL);
        v.readout(() => {
          const { img } = status(); let good = 0, bad = 0; for (const e of GL.edges) { const s = img(e.from, e.to); if (s > 0) good++; else if (s < 0) bad++; }
          const IR = invariants(GR), row = (name, a, b) => `${name} ${a} | ${b}${a === b ? '' : ' ✗'}`;
          const verdict = phi.size === 10 && bad === 0 && good === 15 ? ' — **an isomorphism**' : msg ? ` — ${msg}` : '';
          return `φ maps ${phi.size}/10 vertices · ${good} edges preserved, ${bad} broken${verdict}\n\ninvariants $G$ | $G'$: ${row('order', IL.n, IR.n)} · ${row('edges', IL.m, IR.m)} · ${row('degrees', `$${IL.deg}$`, `$${IR.deg}$`)} · ${row('girth', IL.g, IR.g)} · ${row('diameter', IL.diam, IR.diam)}`;
        });
      },
    },
    {
      num: '1.1.1c', kind: 'Definition', name: 'Subgraphs, induced subgraphs and spanning subgraphs', verify: true,
      statement: String.raw`Let $G=(V,E)$ and $G'=(V',E')$ be graphs. If $V'\subseteq V$ and $E'\subseteq E$, then $G'$ is a **subgraph** of $G$, written $G'\subseteq G$. It is an **induced** subgraph if it contains every edge of $G$ with both ends in $V'$; then $V'$ **induces** (spans) $G'$ and we write $G'=G[V']$. It is a **spanning** subgraph if $V'=V$. For $U\subseteq V$ we write $G-U:=G[V\setminus U]$, and for a set $F$ of pairs, $G-F:=(V,E\setminus F)$ and $G+F:=(V,E\cup F)$.`,
      idea: String.raw`A subgraph may drop vertices and edges freely; an induced subgraph is pinned down by its vertex set alone, since it keeps *all* edges among those vertices; a spanning subgraph keeps all vertices and may drop edges. The two restrictions are independent: $G$ itself is both, $G[U]$ for $U\ne V$ is induced but not spanning, and $G-e$ is spanning but not induced.`,
      caption: String.raw`Click vertices to put them in $U$ (filled) or take them out; the subgraph $H$ starts as $G[U]$. Click an edge of $G[U]$ to delete it from $H$ (dashed red) or restore it. The badges in the corner report whether $H$ is induced, spanning, both or neither.`,
      deps: ['graph-1.1.1a'], refs: ['Diestel §1.1'], tags: ['graphs', 'subgraphs'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...fixed({ a: [1, 1.2], b: [3.1, 0.6], c: [5.2, 1.1], d: [7.4, 0.8], j: [9.2, 2.0], e: [2.1, 3.3], f: [4.3, 3.4], g: [6.6, 3.1], h: [3.2, 5.5], i: [5.8, 5.6], k: [8.4, 4.9] },
          'ab bc cd dj ae be bf cf cg dg ef fg eh fh fi gi hi gk jk ik'), r: 14 });
        let U = new Set(['b', 'c', 'e', 'f', 'h']), gone = new Set();
        const inU = (e) => U.has(e.from) && U.has(e.to);
        G.onClick = ({ node, edge }) => {
          if (node) { if (U.has(node.id)) U.delete(node.id); else U.add(node.id); }
          else if (edge && inU(edge)) { if (gone.has(edge)) gone.delete(edge); else gone.add(edge); }
          return true;
        };
        gone.add(G.edge('e', 'f'));
        v.button('Make it $G[U]$', () => gone.clear());
        v.button('$U = V$', () => { U = new Set(G.nodes.map((n) => n.id)); });
        v.button('Clear', () => { U.clear(); gone.clear(); });
        const kind = () => {
          const miss = G.edges.filter((e) => inU(e) && gone.has(e)), induced = miss.length === 0, spanning = U.size === G.nodes.length;
          return { miss, induced, spanning };
        };
        v.render(() => {
          G.draw({
            nodeFill: (id) => (U.has(id) ? 'accent' : null), nodeColor: (id) => (U.has(id) ? null : 'faint'),
            edgeColor: (e) => (inU(e) ? (gone.has(e) ? 'red' : 'accent') : null), edgeWidth: (e) => (inU(e) ? (gone.has(e) ? 2 : 3.6) : 1.3),
            edgeDash: (e) => inU(e) && gone.has(e), dim: G.edges.filter((e) => !inU(e)),
          });
          const k = kind();
          s.corner(`${k.induced ? '✓' : '✗'} induced`, 'tl', { color: k.induced ? 'green' : 'red', weight: 700, size: 13 });
          s.corner(`${k.spanning ? '✓' : '✗'} spanning`, 'tr', { color: k.spanning ? 'green' : 'red', weight: 700, size: 13 });
        });
        v.legend([['accent', 'vertices and edges of $H$'], ['red', 'edge of $G[U]$ missing from $H$', { dash: true }], ['faint', 'rest of $G$']]);
        v.readout(() => {
          const k = kind(), all = G.edges.filter(inU).length;
          const what = k.induced && k.spanning ? '$H = G$: induced and spanning' : k.induced ? `$H = G[U]$: induced, not spanning` : k.spanning ? '$H$ is spanning, not induced' : '$H$ is a subgraph that is neither induced nor spanning';
          return `$|U| = ${U.size}$ of ${G.nodes.length} · $\\|H\\| = ${all - k.miss.length}$, $\\|G[U]\\| = ${all}$${k.miss.length ? ` (missing ${k.miss.map((e) => e.from + e.to).join(', ')})` : ''} · ${what}`;
        });
      },
    },
    // ================================================================== 1.2 The degree of a vertex
    {
      num: '1.2.1a', kind: 'Definition', name: 'Degree; minimum, maximum and average degree', verify: true,
      statement: String.raw`The **degree** $d(v)=d_G(v)$ of a vertex $v$ is the number $|E(v)|$ of edges at $v$, which in a graph equals the number of its neighbours; a vertex of degree $0$ is **isolated**. The **minimum degree** is $\delta(G)=\min_v d(v)$, the **maximum degree** $\Delta(G)=\max_v d(v)$, and the **average degree** $d(G)=\frac1{|V|}\sum_v d(v)$, so that $\delta(G)\le d(G)\le\Delta(G)$. If all degrees equal $k$, $G$ is **$k$-regular** (**cubic** when $k=3$). The ratio $\varepsilon(G)=|E|/|V|$ of edges per vertex satisfies $\varepsilon(G)=\tfrac12 d(G)$.`,
      idea: String.raw`Summing the degrees counts every edge exactly twice, once from each end: $\sum_v d(v)=2|E|$. Dividing by $|V|$ gives $d(G)=2\varepsilon(G)$, so the average degree and the edge density are the same global quantity on two scales, while $\delta$ and $\Delta$ record the local extremes.`,
      caption: String.raw`Each vertex shows its degree; blue rings mark the vertices of minimum degree and red rings those of maximum degree. Edit the graph (${EDIT}) and watch the degree histogram, $\delta\le d(G)\le\Delta$ and $\varepsilon = d/2$ update.`,
      deps: ['graph-1.1.1a'], refs: ['Diestel §1.2'], tags: ['degree'],
      viz(v) {
        const s = gstage(v, { height: 300 });
        const p = v.stage({ x: [-0.6, 6.6], y: [0, 4], axes: 'box', gutter: true, height: 300, xlabel: 'degree', ylabel: 'vertices', title: 'degree histogram' });
        const G = v.graph(s, { ...fixed({ a: [1, 1], b: [3.2, 0.7], c: [5.6, 1.2], d: [8.6, 1.0], e: [1.6, 4.0], f: [4.2, 3.3], g: [6.8, 3.6], h: [4.6, 5.8], i: [8.9, 5.0] }, 'ab bc ae be bf cf cg cd fg eh fh gh gi'), editable: true, r: 14 });
        v.render(() => {
          const H = ix(G), d = degrees(H), n = H.n; if (!n) return;
          const lo = Math.min(...d), hi = Math.max(...d), avg = d.reduce((a, b) => a + b, 0) / n;
          G.draw({ nodeLabel: (id) => d[H.at(id)], nodeRing: (id) => (d[H.at(id)] === hi ? 'red' : d[H.at(id)] === lo ? 'blue' : null) });
          const cnt = new Array(Math.max(n, hi + 1)).fill(0); d.forEach((x) => cnt[x]++);
          const top = Math.max(...cnt) + 1.6; p.setView([-0.6, Math.max(n - 1, hi) + 0.6], [0, top]);
          p.bars(cnt, { x0: 0, color: (c, i) => (i === lo ? 'blue' : i === hi ? 'red' : 'accent'), fillAlpha: 0.55 });
          const marks = [[lo, 'blue', '\\delta'], [avg / 2, 'orange', '\\varepsilon'], [avg, 'green', 'd(G)'], [hi, 'red', '\\Delta']];
          marks.forEach(([x, c, lab], i) => { p.vline(x, { color: c, width: 2, dash: c === 'orange' ? [5, 4] : false }); p.tex(lab, x, top - 0.25 - 0.42 * (i % 2), { color: c, size: 14, align: 'center', baseline: 'top', plate: true }); });
        });
        v.legend([['blue', '$\\delta(G)$'], ['green', 'average degree $d(G)$'], ['red', '$\\Delta(G)$'], ['orange', '$\\varepsilon(G)=d(G)/2$', { dash: true }]]);
        v.readout(() => {
          const H = ix(G), d = degrees(H), n = H.n; if (!n) return 'empty graph';
          const sum = d.reduce((a, b) => a + b, 0);
          return String.raw`$\delta(G) = ${Math.min(...d)} \le d(G) = ${sum}/${n} = ${fmt2(sum / n)} \le \Delta(G) = ${Math.max(...d)}$ · $\varepsilon(G) = \|G\|/|G| = ${H.m}/${n} = ${fmt2(H.m / n)} = \tfrac12 d(G)$${Math.min(...d) === Math.max(...d) ? ` · ${Math.min(...d)}-regular` : ''}`;
        });
      },
    },
    {
      num: '1.2.1', kind: 'Proposition', name: 'Handshake lemma: an even number of odd-degree vertices',
      statement: String.raw`In every graph the number of vertices of odd degree is even.`,
      idea: String.raw`Counting edge–end incidences in two ways gives $\sum_{v}d(v)=2\|G\|$, an even number. A sum of integers is even only if an even number of its terms are odd. Dynamically: adding or deleting an edge changes the degrees of exactly two vertices by one, so the number of odd vertices changes by $-2$, $0$ or $+2$ and stays even.`,
      caption: String.raw`Odd-degree vertices are red; the gold edge is the last one changed, with its two ends flipping parity. Add edges with **Random edge** or by clicking two vertices (${EDIT}). The step chart records the number of odd vertices after every edit: it only ever moves by $0$ or $\pm2$.`,
      deps: ['graph-1.2.1a'], refs: ['Diestel §1.2'], tags: ['degree', 'parity'],
      viz(v) {
        const s = gstage(v, { height: 300 });
        const p = v.stage({ x: [0, 12], y: [0, 8], axes: 'box', gutter: true, height: 300, xlabel: 'edit number', ylabel: 'odd vertices', yticks: [0, 2, 4, 6, 8], title: 'number of odd-degree vertices' });
        const BASE = { a: [1.2, 1.2], b: [3.6, 0.8], c: [6.2, 1.0], d: [8.7, 1.5], e: [1.0, 4.4], f: [3.8, 3.4], g: [6.4, 3.8], h: [8.8, 4.6], i: [4.4, 5.9] };
        const SCRIPT = ['ab', 'bf', 'fg', 'ae', 'cd', 'gh', 'ef', 'bc', 'fi', 'gc'];
        const G = v.graph(s, { ...fixed(BASE, 'ab'), editable: true, r: 14 });
        let hist = [], last = null;
        const odd = () => degrees(ix(G)).filter((x) => x % 2).length;
        function reset() { G.set(fixed(BASE, SCRIPT[0])); hist = [0, odd()]; for (const p2 of SCRIPT.slice(1)) { last = G.addEdge(p2[0], p2[1]); hist.push(odd()); } }
        reset();
        G.onChange = (kind, obj) => { last = kind === 'add-edge' ? obj : null; hist.push(odd()); };
        const rng = v.rng(5);
        v.button('Random edge', () => {
          const ids = G.nodes.map((n) => n.id), free = []; for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (!G.edge(ids[i], ids[j])) free.push([ids[i], ids[j]]);
          if (free.length) { const [a, b] = free[Math.floor(rng() * free.length)]; last = G.addEdge(a, b); hist.push(odd()); }
        });
        v.button('Reset', reset);
        v.render(() => {
          const H = ix(G), d = degrees(H), ends = last ? [K(last.from), K(last.to)] : [];
          G.draw({ nodeLabel: (id) => d[H.at(id)], nodeFill: (id) => (d[H.at(id)] % 2 ? 'red' : null), nodeRing: (id) => (ends.includes(K(id)) ? 'gold' : null),
            edgeColor: (e) => (e === last ? 'gold' : null), edgeWidth: (e) => (e === last ? 4 : null) });
          const n = hist.length, top = Math.max(8, ...hist) + 1; p.setView([-0.5, Math.max(12, n - 0.5)], [0, top]);
          p.setTicks(undefined, [...Array(Math.floor(top / 2) + 1).keys()].map((k) => 2 * k));
          const pts = []; hist.forEach((h, i) => { if (i) pts.push([i, hist[i - 1]]); pts.push([i, h]); });
          p.path(pts, { color: 'accent', width: 2 });
          hist.forEach((h, i) => p.dot(i, h, { r: 3.5, color: i === n - 1 ? 'gold' : 'accent' }));
        });
        v.legend([['red', 'odd degree', { dot: true }], ['gold', 'last edge changed']]);
        v.readout(() => {
          const H = ix(G), d = degrees(H), sum = d.reduce((a, b) => a + b, 0), o = d.filter((x) => x % 2).length, ch = hist.length > 1 ? hist[hist.length - 1] - hist[hist.length - 2] : 0;
          return String.raw`$\sum_v d(v) = ${sum} = 2\cdot\|G\| = 2\cdot${H.m}$ · odd-degree vertices: **${o}** (even) · last edit changed the count by ${ch > 0 ? '+' : ch < 0 ? '−' : '±'}${Math.abs(ch)}`;
        });
      },
    },
    {
      num: '1.2.2', kind: 'Proposition', name: 'Every graph has a core of minimum degree above its density',
      statement: String.raw`Every graph $G$ with at least one edge has a subgraph $H$ with $\delta(H)>\varepsilon(H)\ge\varepsilon(G)$.`,
      idea: String.raw`Peel off vertices of small degree: as long as the current graph $G_i$ has a vertex $v$ with $d(v)\le\varepsilon(G_i)$, delete it. Losing one vertex and at most $\varepsilon(G_i)$ edges cannot lower the ratio of edges to vertices, so $\varepsilon(G_{i+1})\ge\varepsilon(G_i)\ge\varepsilon(G)>0$. The process cannot reach a single vertex (where $\varepsilon=0$), so it stops at a non-empty $H$ in which no vertex qualifies: $\delta(H)>\varepsilon(H)$. Peeling with the *fixed* threshold $\varepsilon(G)$ instead is the classical $k$-core with $k=\lfloor\varepsilon(G)\rfloor+1$, a special case of the same argument.`,
      caption: String.raw`Step through the peeling (gold = the vertex deleted next). The chart tracks $\varepsilon(G_i)$, which never drops below the dashed line $\varepsilon(G)$, and $\delta(G_i)$, which ends strictly above $\varepsilon$. Switch to the fixed threshold to get the $k$-core instead; edit the graph (${EDIT}) or **Resample** to test other inputs.`,
      deps: ['graph-1.2.1a'], refs: ['Diestel §1.2'], tags: ['degree', 'density', 'cores'],
      viz(v) {
        const rule = v.select('delete while', [{ value: 'eps', label: 'd(v) ≤ ε(Gᵢ)' }, { value: 'core', label: 'd(v) ≤ ε(G)  (k-core)' }], 'eps', { onChange: () => S.reset({ at: 'end' }) });
        const s = gstage(v, { height: 300 });
        const p = v.stage({ x: [0, 8], y: [0, 4], axes: 'box', gutter: true, height: 300, xlabel: 'step i', title: 'density and minimum degree of $G_i$' });
        const BASE = () => fixed({ a: [4.0, 2.4], b: [5.6, 1.6], c: [6.9, 2.7], d: [6.4, 4.3], e: [4.6, 4.4], f: [5.5, 3.2], g: [1.0, 1.0], h: [2.3, 2.6], i: [1.0, 4.6], j: [2.6, 5.6], k: [8.9, 1.0], l: [9.0, 4.9], m: [3.0, 0.6] },
          'ab bc cd de ea af bf cf df ef ah hg hi ij ck dl gm hm ac');
        const G = v.graph(s, { ...BASE(), editable: true, r: 13 });
        const rng = v.rng(11);
        const eps = (H, alive) => { let n = 0, m = 0; for (let u = 0; u < H.n; u++) if (alive[u]) n++; H.E.forEach(([a, b]) => { if (alive[a] && alive[b]) m++; }); return n ? m / n : 0; };
        function frames() {
          const H = ix(G), alive = new Array(H.n).fill(true), out = [], e0 = eps(H, alive), deg = () => { const d = new Array(H.n).fill(0); H.E.forEach(([a, b]) => { if (alive[a] && alive[b]) { d[a]++; d[b]++; } }); return d; };
          const stat = () => { const d = deg(), al = d.filter((_, u) => alive[u]); return { eps: eps(H, alive), delta: al.length ? Math.min(...al) : 0 }; };
          for (let it = 0; it <= H.n; it++) {
            const d = deg(), e = eps(H, alive), thr = rule.value === 'eps' ? e : e0;
            let pick = -1; for (let u = 0; u < H.n; u++) if (alive[u] && d[u] <= thr + 1e-9 && (pick < 0 || d[u] < d[pick])) pick = u;
            const st = stat(), aliveIds = new Set(H.ids.filter((_, u) => alive[u]));
            if (pick < 0 || aliveIds.size <= 1) { out.push({ alive: aliveIds, del: null, ...st, e0, note: `No vertex has degree ≤ ${fmt2(thr)}: stop. $H$ has $\\delta(H) = ${st.delta} > \\varepsilon(H) = ${fmt2(st.eps)} \\ge \\varepsilon(G) = ${fmt2(e0)}$.` }); break; }
            out.push({ alive: aliveIds, del: H.ids[pick], ...st, e0, note: `$d(${H.ids[pick]}) = ${d[pick]} \\le ${rule.value === 'eps' ? `\\varepsilon(G_{${it}})` : '\\varepsilon(G)'} = ${fmt2(thr)}$: delete ${H.ids[pick]}.` });
            alive[pick] = false;
          }
          return out;
        }
        const S = v.steps({ frames, speed: 1.6, start: 'end', still: 'end' });
        G.onChange = () => S.reset({ at: 'end' });
        v.button('Resample', () => {
          const ids = G.nodes.map((n) => n.id), E = [];
          for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (rng() < (i < 6 && j < 6 ? 0.75 : 0.14)) E.push([ids[i], ids[j]]);
          G.edges = E; S.reset({ at: 'end' });
        });
        v.render(() => {
          const f = S.frame; if (!f.alive) return; const fin = f.del == null;
          G.draw({ nodeFill: (id) => (id === f.del ? 'gold' : fin && f.alive.has(id) ? 'green' : null), nodeColor: (id) => (f.alive.has(id) ? 'accent' : null),
            dim: G.nodes.filter((n) => !f.alive.has(n.id)).map((n) => n.id), edgeColor: (e) => (fin && f.alive.has(e.from) && f.alive.has(e.to) ? 'green' : null),
            edgeWidth: (e) => (fin && f.alive.has(e.from) && f.alive.has(e.to) ? 3 : null) });
          const F = S.frames, top = Math.max(...F.map((x) => Math.max(x.eps, x.delta))) + 0.8; p.setView([-0.4, Math.max(4, F.length - 0.6)], [0, top]);
          p.hline(f.e0, { color: 'muted', dash: [6, 4], width: 1.5 });
          p.text('ε(G)', F.length - 0.6, f.e0, { color: 'muted', align: 'right', baseline: 'top', dy: 4, size: 12 });
          const shown = F.slice(0, S.i + 1);
          p.path(shown.map((x, i) => [i, x.eps]), { color: 'accent', width: 2.4 }); p.path(shown.map((x, i) => [i, x.delta]), { color: 'orange', width: 2, dash: [4, 3] });
          shown.forEach((x, i) => { p.dot(i, x.eps, { r: 3.5, color: 'accent' }); p.dot(i, x.delta, { r: 3, color: 'orange' }); });
        });
        v.legend([['accent', '$\\varepsilon(G_i)$'], ['orange', '$\\delta(G_i)$', { dash: true }], ['gold', 'deleted next', { dot: true }], ['green', 'the final $H$']]);
        v.readout(() => { const f = S.frame; return f.alive ? `$|G_i| = ${f.alive.size}$, $\\varepsilon(G_i) = ${fmt2(f.eps)} \\ge \\varepsilon(G) = ${fmt2(f.e0)}$, $\\delta(G_i) = ${f.delta}$${f.del == null ? (f.delta > f.eps ? ' — **δ(H) > ε(H) ≥ ε(G)** ✓' : ' — check failed') : ''}` : ''; });
      },
    },
    // ================================================================== 1.3 Paths and cycles
    {
      num: '1.3.1a', kind: 'Definition', name: 'Paths and cycles', verify: true,
      statement: String.raw`A **path** is a non-empty graph $P=(\{x_0,\dots,x_k\},\{x_0x_1,x_1x_2,\dots,x_{k-1}x_k\})$ with the $x_i$ all distinct; it **links** its **ends** $x_0$ and $x_k$, and its **length** is its number $k$ of edges ($P^k$ denotes the path of length $k$). If $P=x_0\dots x_{k-1}$ is a path with $k\ge3$, then $C:=P+x_{k-1}x_0$ is a **cycle** of length $k$, a $k$-cycle $C^k$. A **walk** of length $k$ is an alternating sequence $v_0e_0v_1\dots e_{k-1}v_k$ with $e_i=v_iv_{i+1}$; it is **closed** if $v_0=v_k$. A walk may repeat vertices and edges, but every walk between two vertices contains a path between them.`,
      idea: String.raw`Paths and cycles are the subgraphs that a walk traces when it never revisits a vertex (except, for a cycle, its start at the end). To extract a path from a walk, repeatedly cut out the stretch between two visits to the same vertex; what remains still joins the same ends and repeats nothing.`,
      caption: String.raw`Click vertices one after another to trace a walk (each click must be a neighbour of the last vertex). Edge labels give the step numbers. The app classifies the walk as a path, a cycle or a general walk, and in the last case draws in green the path obtained by cutting out the repeated stretches. **Undo** removes the last step.`,
      deps: ['graph-1.1.1c'], refs: ['Diestel §1.3'], tags: ['paths', 'cycles'],
      viz(v) {
        const s = gstage(v, { height: 330 });
        const G = v.graph(s, { ...fixed({ a: [1.2, 1.0], b: [3.8, 0.8], c: [6.4, 1.0], d: [8.8, 1.4], e: [1.0, 3.6], f: [3.6, 3.2], g: [6.2, 3.4], h: [8.8, 4.0], i: [2.4, 5.8], j: [5.2, 5.6], k: [7.8, 6.0] },
          'ab bc cd ae bf cg dh ef fg gh ei fj gj hk ij jk'), r: 14 });
        let walk = ['e', 'f', 'g', 'j', 'f', 'b', 'c'], msg = '';
        G.onClick = ({ node }) => {
          if (!node) return true; msg = '';
          if (!walk.length || G.edge(walk[walk.length - 1], node.id)) walk.push(node.id); else msg = `${node.id} is not adjacent to ${walk[walk.length - 1]}`;
          return true;
        };
        v.button('Undo', () => { walk.pop(); msg = ''; });
        v.button('Clear', () => { walk = []; msg = ''; });
        const classify = () => {
          const k = walk.length - 1, distinct = new Set(walk).size === walk.length;
          const closedCycle = k >= 3 && walk[0] === walk[k] && new Set(walk.slice(0, k)).size === k;
          // path inside the walk: cut out loops
          const P = []; for (const x of walk) { const i = P.indexOf(x); if (i >= 0) P.length = i + 1; else P.push(x); }
          return { k, distinct, closedCycle, P };
        };
        v.render(() => {
          const c = classify(), steps = new Map();
          for (let i = 0; i + 1 < walk.length; i++) { const e = G.edge(walk[i], walk[i + 1]); steps.set(e, (steps.has(e) ? steps.get(e) + ',' : '') + (i + 1)); }
          const pathE = new Set(); if (!c.distinct && !c.closedCycle) for (let i = 0; i + 1 < c.P.length; i++) pathE.add(G.edge(c.P[i], c.P[i + 1]));
          const col = c.closedCycle ? 'orange' : c.distinct ? 'accent' : 'gold';
          G.draw({ nodeFill: (id) => (id === walk[walk.length - 1] ? col : null), nodeColor: (id) => (walk.includes(id) ? col : null), nodeRing: (id) => (id === walk[0] ? 'ink' : null),
            edgeColor: (e) => (pathE.has(e) ? 'green' : steps.has(e) ? col : null), edgeWidth: (e) => (pathE.has(e) ? 5 : steps.has(e) ? 3 : null),
            edgeLabel: (e) => steps.get(e) ?? null, edgeLabelColor: () => 'ink' });
          if (msg) s.corner(msg, 'bl', { color: 'red', weight: 600 });
        });
        v.legend([['accent', 'path'], ['orange', 'cycle'], ['gold', 'walk with repetitions'], ['green', 'the path inside the walk']]);
        v.readout(() => {
          const c = classify(); if (walk.length === 0) return 'Click a vertex to start a walk.';
          const seq = walk.join(' ');
          if (c.closedCycle) return `${seq}: closed, no other repetition — a **cycle** $C^{${c.k}}$ of length ${c.k}`;
          if (c.distinct) return `${seq}: all vertices distinct — a **path** $P^{${c.k}}$ of length ${c.k} from ${walk[0]} to ${walk[c.k]}`;
          return `${seq}: a ${walk[0] === walk[c.k] ? 'closed ' : ''}**walk** of length ${c.k} with repeated vertices; it contains the path ${c.P.join(' ')} of length ${c.P.length - 1}`;
        });
      },
    },
    {
      num: '1.3.1b', kind: 'Definition', name: 'Girth and circumference', verify: true,
      statement: String.raw`The **girth** $g(G)$ of a graph is the minimum length of a cycle in $G$, and its **circumference** the maximum length of a cycle; for a graph without cycles (a forest) we set $g(G)=\infty$ and the circumference to $0$. An edge joining two vertices of a cycle without lying on it is a **chord**; a cycle with no chord is **induced**.`,
      idea: String.raw`Both numbers are graph invariants, but they are very different to compute: a shortest cycle is found by breadth-first search from every vertex (polynomial time), while deciding whether the circumference equals $|G|$ is the Hamiltonian cycle problem, which is NP-complete. A shortest cycle is always induced, since a chord would split it into two shorter cycles.`,
      caption: String.raw`Left: a shortest cycle (blue); right: a longest cycle (orange), both recomputed after every edit (${EDIT}; the panels share the vertices). The Petersen graph has girth 5 and circumference 9 — it has no Hamiltonian cycle.`,
      deps: ['graph-1.3.1a'], refs: ['Diestel §1.3'], tags: ['cycles', 'girth'],
      viz(v) {
        const PRE = { pet: () => named('petersen'), k33: () => named('kmn', 3, 3), cube: () => named('cube'), wheel: () => { const W = v.graphs('wheel', 7); return { nodes: W.nodes, edges: W.edges.map((e) => [e.from, e.to]), layout: 'fit' }; } };
        const pre = v.select('', [{ value: 'pet', label: 'Petersen' }, { value: 'k33', label: '$K_{3,3}$' }, { value: 'cube', label: 'cube' }, { value: 'wheel', label: 'wheel' }], 'pet', { onChange: () => load() });
        const A = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.25], axes: false, equal: true, height: 290, title: 'a shortest cycle' });
        const B = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.25], axes: false, equal: true, height: 290, title: 'a longest cycle' });
        const G = v.graph(A, { nodes: [], edges: [], editable: true, r: 12, nodeLabel: '' });
        const G2 = v.graph(B, { nodes: [], edges: [], r: 12 });
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: '' })), edges: P.edges }).layout('fit'); }
        load();
        v.render(() => {
          G2.nodes = G.nodes; G2.edges = G.edges;
          const H = ix(G), sc = girth(H), lc = longestCycle(H), S1 = eset(H, pathEdges(H, sc.cycle, true)), S2 = eset(H, pathEdges(H, lc.cycle, true));
          const on1 = new Set(sc.cycle.map((u) => H.ids[u])), on2 = new Set(lc.cycle.map((u) => H.ids[u]));
          G.draw({ nodeFill: (id) => (on1.has(id) ? 'blue' : null), edgeColor: (e) => (S1.has(e) ? 'blue' : null), edgeWidth: (e) => (S1.has(e) ? 4 : null) });
          G2.draw({ nodeFill: (id) => (on2.has(id) ? 'orange' : null), edgeColor: (e) => (S2.has(e) ? 'orange' : null), edgeWidth: (e) => (S2.has(e) ? 4 : null) });
          A.corner(sc.g === Infinity ? 'no cycle: g = ∞' : `g(G) = ${sc.g}`, 'tl', { color: 'blue', weight: 700, size: 13 });
          B.corner(`circumference ${lc.cycle.length}${lc.exact ? '' : ' (search capped)'}`, 'tl', { color: 'orange', weight: 700, size: 13 });
        });
        v.readout(() => {
          const H = ix(G), sc = girth(H), lc = longestCycle(H);
          return `$|G| = ${H.n}$, $\\|G\\| = ${H.m}$ · girth $g(G) = ${sc.g === Infinity ? '\\infty' : sc.g}$ · circumference ${lc.cycle.length}${lc.cycle.length === H.n && H.n ? ' (a Hamiltonian cycle)' : H.n ? ` < |G| = ${H.n}: not Hamiltonian` : ''}`;
        });
      },
    },
    {
      num: '1.3.1', kind: 'Proposition', name: 'Long paths and cycles from minimum degree',
      statement: String.raw`Every graph $G$ contains a path of length $\delta(G)$ and, provided $\delta(G)\ge2$, a cycle of length at least $\delta(G)+1$.`,
      idea: String.raw`Take a longest path $x_0\dots x_k$. Every neighbour of $x_k$ lies on it — otherwise the path could be extended — so $k\ge d(x_k)\ge\delta(G)$. If $x_i$ is the first vertex of the path adjacent to $x_k$, then $x_i\dots x_kx_i$ is a cycle; it contains $x_k$ together with all its $\ge\delta(G)$ neighbours, so its length is at least $\delta(G)+1$.`,
      caption: String.raw`A longest path is drawn in green with its end $x_k$ in gold; the orange-ringed vertices are the neighbours of $x_k$ — all on the path. The purple cycle closes at the first of them, $x_i$. The lower panel straightens the path out as in Diestel's figure. Edit the graph (${EDIT}) and watch the bounds hold; with $\delta\le1$ no cycle is promised.`,
      deps: ['graph-1.3.1a', 'graph-1.2.1a'], refs: ['Diestel §1.3'], tags: ['paths', 'cycles', 'degree'],
      viz(v) {
        const s = gstage(v, { height: 290, full: true });
        const L = v.stage({ x: [-0.6, 10.6], y: [-0.9, 3.4], axes: false, height: 150, full: true, title: 'the longest path $x_0\\dots x_k$ and the neighbours of $x_k$' });
        const G = v.graph(s, { ...fixed({ a: [1.0, 1.2], b: [3.0, 0.6], c: [5.2, 0.9], d: [7.6, 0.7], e: [9.4, 2.0], f: [2.0, 3.4], g: [4.2, 2.8], h: [6.4, 3.0], i: [8.4, 4.2], j: [3.4, 5.6], k: [6.0, 5.6], l: [1.2, 5.4] },
          'ab bc cd de af bg ch di ei fg gh hi fj gk hk ij jk jl fl lj bf cg dh ek'), editable: true, r: 13 });
        const comp = () => {
          const H = ix(G), d = degrees(H), del = H.n ? Math.min(...d) : 0, lp = longestPath(H, 6e5), P = lp.path, k = P.length - 1, xk = P[k];
          const nb = new Set(H.adj[xk] ? H.adj[xk].map(([w]) => w) : []); let i = P.findIndex((u) => nb.has(u));
          return { H, d, del, P, k, xk, nb, i, exact: lp.exact };
        };
        v.render(() => {
          const c = comp(), H = c.H; if (!H.n) return;
          const pathE = eset(H, pathEdges(H, c.P)), onP = new Set(c.P.map((u) => H.ids[u]));
          const cyc = c.del >= 2 && c.i >= 0 ? c.P.slice(c.i) : [], cycE = eset(H, pathEdges(H, cyc, true)), nbIds = new Set([...c.nb].map((u) => H.ids[u]));
          G.draw({ nodeFill: (id) => (H.at(id) === c.xk ? 'gold' : onP.has(id) ? 'green' : null), nodeRing: (id) => (nbIds.has(id) ? 'orange' : null),
            edgeColor: (e) => (cycE.has(e) && !pathE.has(e) ? 'purple' : pathE.has(e) ? 'green' : null), edgeWidth: (e) => (cycE.has(e) || pathE.has(e) ? 4 : null) });
          // straightened path
          const k = c.k; L.setView([-0.7, k + 0.7], [-0.9, Math.max(2.2, (k + 1) / 2.6)]);
          L.line(0, 0, k, 0, { color: 'green', width: 4 });
          for (const u of c.nb) { const j = c.P.indexOf(u); if (j < 0 || j === k - 1) continue; const r = (k - j) / 2, cx = (k + j) / 2, col = j === c.i && c.del >= 2 ? 'purple' : 'orange';
            L.curve((t) => [cx + r * Math.cos(Math.PI * t), r * 0.9 * Math.sin(Math.PI * t)], 0, 1, { color: col, width: j === c.i ? 3 : 1.8, n: 60 }); }
          c.P.forEach((u, j) => {
            L.dot(j, 0, { r: 9, color: j === k ? 'gold' : c.nb.has(u) ? 'orange' : 'green' });
            L.text(H.ids[u], j, 0, { align: 'center', size: 11, color: 'panel', halo: false, weight: 700 });
            if (j === 0 || j === k || j === c.i) L.tex(j === 0 ? 'x_0' : j === k ? 'x_k' : 'x_i', j, 0, { dy: 20, color: 'muted', size: 13 });
          });
        });
        v.legend([['green', 'longest path'], ['gold', 'its end $x_k$', { dot: true }], ['orange', 'neighbours of $x_k$', { dot: true }], ['purple', 'cycle $x_i\\dots x_kx_i$']]);
        v.readout(() => {
          const c = comp(); if (!c.H.n) return '';
          const cyc = c.del >= 2 ? ` · cycle length $k - i + 1 = ${c.k - c.i + 1} \\ge \\delta + 1 = ${c.del + 1}$ ✓` : ' · $\\delta(G) < 2$: no cycle is promised';
          return `$\\delta(G) = ${c.del}$ · longest path length $k = ${c.k} \\ge d(x_k) = ${c.d[c.xk]} \\ge \\delta(G)$ ✓${cyc}${c.exact ? '' : ' (search capped)'}`;
        });
      },
    },
    {
      num: '1.3.1c', kind: 'Definition', name: 'Distance, diameter and radius', verify: true,
      statement: String.raw`The **distance** $d_G(x,y)$ of two vertices is the length of a shortest $x$–$y$ path in $G$, and $d_G(x,y)=\infty$ if there is none. The **diameter** $\operatorname{diam}(G)$ is the greatest distance between two vertices. A vertex is **central** if its greatest distance to any other vertex (its eccentricity) is as small as possible; this smallest eccentricity is the **radius** $\operatorname{rad}(G)=\min_x\max_y d_G(x,y)$. One always has $\operatorname{rad}(G)\le\operatorname{diam}(G)\le2\operatorname{rad}(G)$.`,
      idea: String.raw`Breadth-first search from $x$ visits the vertices in layers $D_0=\{x\},D_1,D_2,\dots$ by distance, so one search per vertex gives every eccentricity. The diameter is the largest and the radius the smallest eccentricity; and since any two vertices are within $\operatorname{rad}(G)$ of a central vertex $z$, the triangle inequality gives $\operatorname{diam}(G)\le 2\operatorname{rad}(G)$.`,
      caption: String.raw`Click a vertex to make it the root: every vertex shows its distance from it, coloured by BFS layer. Green rings mark the central vertices; the orange dashed path joins a diametral pair. The bars on the right are the eccentricities, with $\operatorname{rad}$, $\operatorname{diam}$ and $2\operatorname{rad}$. Choose *edit* to change the graph (${EDIT}).`,
      deps: ['graph-1.3.1a'], see: ['algo-8.5'], refs: ['Diestel §1.3'], tags: ['distance'],
      viz(v) {
        const mode = v.select('click to', [{ value: 'root', label: 'choose the root' }, { value: 'edit', label: 'edit the graph' }], 'root');
        const s = gstage(v, { height: 300, weight: 1.5 });
        const p = v.stage({ x: [-0.6, 10.6], y: [0, 6], axes: 'box', gutter: true, height: 300, ylabel: 'eccentricity', title: 'eccentricities' });
        const G = v.graph(s, { ...fixed({ a: [0.8, 3.2], b: [2.2, 1.4], c: [2.2, 5.0], d: [4.0, 3.2], e: [5.6, 1.6], f: [5.6, 4.8], g: [7.2, 3.2], h: [8.6, 1.4], i: [8.6, 5.0], j: [9.6, 3.2], k: [4.0, 0.6] },
          'ab ac bd cd de df eg fg gh gi hj ij bk ke'), editable: true, r: 13 });
        let root = 'd';
        G.onClick = ({ node }) => { if (mode.value === 'root' && node) { root = node.id; return true; } return mode.value === 'root'; };
        const RING = ['ink', 'blue', 'teal', 'green', 'gold', 'orange', 'red', 'pink', 'purple'];
        v.render(() => {
          const H = ix(G); if (!H.n) return; if (!G.has(root)) root = H.ids[0];
          const r = H.at(root), dist = bfs(H, r).dist, E = eccs(H), cen = new Set(E.center.map((u) => H.ids[u]));
          const [x, y] = E.far, dp = parPath(bfs(H, x).par, y), dpE = E.diam < Infinity ? eset(H, pathEdges(H, dp)) : new Set();
          G.draw({ nodeLabel: (id) => (dist[H.at(id)] < Infinity ? dist[H.at(id)] : '∞'), nodeFill: (id) => (id === root ? 'ink' : null),
            nodeColor: (id) => (dist[H.at(id)] < Infinity ? RING[Math.min(dist[H.at(id)], 8)] : 'faint'), nodeRing: (id) => (cen.has(id) ? 'green' : null),
            edgeColor: (e) => (dpE.has(e) ? 'orange' : null), edgeDash: (e) => dpE.has(e), edgeWidth: (e) => (dpE.has(e) ? 3 : null) });
          const fin = E.ecc.every((e) => e < Infinity); if (!fin) { p.corner('disconnected: all eccentricities ∞', 'tl', { color: 'red' }); return; }
          p.setView([-0.7, H.n - 0.3], [0, 2 * E.rad + 1.4]); p.setTicks(H.ids.map((id, i) => [i, String(id)]), null);
          p.bars(E.ecc, { x0: 0, color: (e, i) => (H.ids[i] === root ? 'ink' : e === E.rad ? 'green' : e === E.diam ? 'orange' : 'accent'), fillAlpha: 0.6 });
          [[E.rad, 'green', 'rad'], [E.diam, 'orange', 'diam'], [2 * E.rad, 'muted', '2·rad']].forEach(([yv, c, lab], i) => { p.hline(yv, { color: c, width: 1.6, dash: i === 2 ? [5, 4] : false }); p.text(lab, H.n - 0.4, yv, { color: c, align: 'right', baseline: 'bottom', dy: -2, size: 12, weight: 600 }); });
        });
        v.legend([['green', 'central vertex', { dot: true }], ['orange', 'diametral path', { dash: true }]]);
        v.readout(() => {
          const H = ix(G); if (!H.n) return ''; const E = eccs(H), r = H.at(root);
          if (E.diam === Infinity) return 'The graph is disconnected: some distances are ∞, and so is the diameter.';
          return String.raw`eccentricity of ${root}: ${E.ecc[r]} · $\operatorname{rad}(G) = ${E.rad} \le \operatorname{diam}(G) = ${E.diam} \le 2\operatorname{rad}(G) = ${2 * E.rad}$ · central: ${E.center.map((u) => H.ids[u]).join(', ')}`;
        });
      },
    },
    {
      num: '1.3.2', kind: 'Proposition', name: 'Girth is at most twice the diameter plus one',
      statement: String.raw`Every graph $G$ containing a cycle satisfies $g(G)\le 2\operatorname{diam}(G)+1$.`,
      idea: String.raw`Let $C$ be a shortest cycle. If $g(G)\ge2\operatorname{diam}(G)+2$, two antipodal vertices $x,y$ of $C$ are at distance at least $\operatorname{diam}(G)+1$ along $C$, yet at distance at most $\operatorname{diam}(G)$ in $G$. A shortest $x$–$y$ path in $G$ therefore leaves $C$, and one of its excursions off $C$ (a $C$-path) together with the shorter arc of $C$ between its ends forms a cycle shorter than $C$ — a contradiction.`,
      caption: String.raw`The blue cycle is a shortest cycle $C$; $x$ and $y$ are antipodal on it and the orange path is a shortest $x$–$y$ path in $G$. Delete chords to make $C$ long (${EDIT}): the diameter grows with it, and the point $(\operatorname{diam},g)$ on the right never enters the red region $g>2\operatorname{diam}+1$. Moore graphs such as the Petersen graph sit on its boundary.`,
      deps: ['graph-1.3.1b', 'graph-1.3.1c'], refs: ['Diestel §1.3'], tags: ['girth', 'diameter'],
      viz(v) {
        const PRE = { pet: () => named('petersen'), c9: () => named('cycle', 9), hea: () => named('heawood'), prism: () => named('prism', 6) };
        const pre = v.select('', [{ value: 'pet', label: 'Petersen' }, { value: 'c9', label: '$C^9$' }, { value: 'hea', label: 'Heawood' }, { value: 'prism', label: 'prism' }], 'pet', { onChange: () => load() });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.25], axes: false, equal: true, height: 310 });
        const p = v.stage({ x: [0, 5], y: [0, 11], axes: 'box', gutter: true, height: 310, xlabel: 'diameter', ylabel: 'girth', xticks: [0, 1, 2, 3, 4, 5], title: '$g \\le 2\\operatorname{diam}+1$' });
        const G = v.graph(s, { nodes: [], edges: [], editable: true, r: 12, nodeLabel: '' });
        function load() { const P = PRE[pre.value](); G.set({ nodes: P.nodes.map((n) => ({ ...n, label: '' })), edges: P.edges }).layout('fit'); }
        load();
        const REF = [[1, 3, 'K_n'], [2, 5, '\\text{Petersen}'], [3, 6, '\\text{Heawood}'], [4, 8, '\\text{Tutte–Coxeter}'], [2, 4, 'K_{3,3}'], [3, 4, 'Q_3'], [4, 7, '\\text{McGee}']];
        const comp = () => {
          const H = ix(G), gc = girth(H), E = eccs(H); let x = -1, y = -1, P = [];
          if (gc.g < Infinity) { const C = gc.cycle; x = C[0]; y = C[Math.floor(C.length / 2)]; P = parPath(bfs(H, x).par, y); }
          return { H, gc, E, x, y, P };
        };
        v.render(() => {
          const c = comp(), H = c.H; if (!H.n) return;
          const CE = eset(H, pathEdges(H, c.gc.cycle, true)), PE = eset(H, pathEdges(H, c.P)), onC = new Set(c.gc.cycle.map((u) => H.ids[u]));
          G.draw({ nodeFill: (id) => (H.at(id) === c.x || H.at(id) === c.y ? 'orange' : onC.has(id) ? 'blue' : null), nodeLabel: (id) => (H.at(id) === c.x ? 'x' : H.at(id) === c.y ? 'y' : ''),
            edgeColor: (e) => (PE.has(e) ? 'orange' : CE.has(e) ? 'blue' : null), edgeWidth: (e) => (PE.has(e) ? 3 : CE.has(e) ? 4.5 : null), edgeDash: (e) => PE.has(e) && !CE.has(e) });
          p.poly([[0, 1], [5, 11], [0, 11]], { fill: 'red', fillAlpha: 0.12, stroke: false });
          p.line(0, 1, 5, 11, { color: 'red', width: 1.6 });
          p.text('g > 2 diam + 1: impossible', 0.25, 10.2, { color: 'red', size: 12, weight: 600 });
          for (let n = 3; n <= 11; n++) p.dot(Math.floor(n / 2), n, { r: 3, color: 'muted' });
          p.text('cycles Cⁿ', 4.2, 8.3, { color: 'muted', size: 11.5, align: 'center' });
          REF.forEach(([dx, gy, lab]) => { p.dot(dx, gy, { r: 4, color: 'teal' }); p.tex(lab, dx, gy, { color: 'teal', size: 11.5, align: 'left', dx: 7, dy: 7 }); });
          if (c.gc.g < Infinity && c.E.diam < Infinity) p.dot(c.E.diam, c.gc.g, { r: 7, color: 'accent' });
        });
        v.legend([['blue', 'shortest cycle $C$'], ['orange', 'shortest $x$–$y$ path in $G$', { dash: true }], ['accent', 'this graph', { dot: true }], ['teal', 'named graphs', { dot: true }]]);
        v.readout(() => {
          const c = comp(); if (c.gc.g === Infinity) return 'No cycle: $g(G) = \\infty$ and the proposition says nothing.';
          if (c.E.diam === Infinity) return 'Disconnected: $\\operatorname{diam}(G) = \\infty$ and the bound is trivial.';
          const g = c.gc.g, D = c.E.diam, dC = Math.floor(g / 2), dG = c.P.length - 1;
          return String.raw`$g(G) = ${g} \le 2\operatorname{diam}(G) + 1 = ${2 * D + 1}$${g === 2 * D + 1 ? ' (tight)' : ''} · antipodal $x, y$ on $C$: $d_C(x,y) = ${dC}$, $d_G(x,y) = ${dG} \le \operatorname{diam}(G) = ${D}$`;
        });
      },
    },
    {
      num: '1.3.3', kind: 'Proposition', name: 'Moore-type bound from radius and maximum degree',
      statement: String.raw`A graph $G$ of radius at most $k$ and maximum degree at most $d\ge3$ has fewer than $\dfrac{d}{d-2}(d-1)^k$ vertices.`,
      idea: String.raw`Let $z$ be a central vertex and $D_i$ the set of vertices at distance $i$ from $z$; these $k+1$ layers cover $V(G)$. Clearly $|D_0|=1$ and $|D_1|\le d$, and each vertex of $D_i$ ($i\ge1$) has a neighbour in $D_{i-1}$, hence at most $d-1$ neighbours in $D_{i+1}$; every vertex of $D_{i+1}$ has a neighbour in $D_i$, so $|D_{i+1}|\le(d-1)|D_i|$. Summing the geometric series $1+d\sum_{i<k}(d-1)^i$ gives a number below $\frac d{d-2}(d-1)^k$.`,
      caption: String.raw`The graph is drawn in BFS layers around a central vertex (click another vertex to re-root; its eccentricity then plays the role of $k$). The bars compare each layer size $|D_i|$ with its bound $d(d-1)^{i-1}$. Moore graphs such as Petersen and Hoffman–Singleton fill every layer to the bound — and still stay below $\frac d{d-2}(d-1)^k$.`,
      deps: ['graph-1.3.1c', 'graph-1.2.1a'], refs: ['Diestel §1.3'], tags: ['degree', 'diameter', 'Moore bound'],
      viz(v) {
        const tree = () => { const nodes = [{ id: 0 }], edges = []; let lev = [0], id = 1; for (let dpt = 0; dpt < 3; dpt++) { const nx = []; for (const p of lev) for (let c = 0; c < (dpt ? 2 : 3); c++) { nodes.push({ id }); edges.push([p, id]); nx.push(id++); } lev = nx; } return { nodes, edges }; };
        const rnd = () => { const r = v.rng(17), n = 22, E = [], dg = new Array(n).fill(0), A = new Set(); for (let t = 0; t < 400 && E.length < 34; t++) { const a = r.int(0, n - 1), b = r.int(0, n - 1); if (a === b || dg[a] >= 4 || dg[b] >= 4 || A.has(ekey(a, b))) continue; A.add(ekey(a, b)); dg[a]++; dg[b]++; E.push([a, b]); } for (let a = 1; a < n; a++) if (!dg[a]) E.push([a, a - 1]); return { nodes: [...Array(n)].map((_, i) => ({ id: i })), edges: E }; };
        const PRE = { pet: () => named('petersen'), hs: () => named('hoffmanSingleton'), tc: () => named('tutteCoxeter'), tree, rnd };
        const pre = v.select('', [{ value: 'pet', label: 'Petersen' }, { value: 'hs', label: 'Hoffman–Singleton' }, { value: 'tc', label: 'Tutte–Coxeter' }, { value: 'tree', label: 'tree' }, { value: 'rnd', label: 'random, Δ ≤ 4' }], 'pet', { onChange: () => load() });
        const s = v.stage({ x: [-1.2, 1.2], y: [-1.15, 1.2], axes: false, equal: true, height: 330 });
        const p = v.stage({ x: [-0.6, 4.6], y: [0, 50], axes: 'box', gutter: true, height: 330, xlabel: 'layer i', ylabel: 'vertices', title: 'layer sizes $|D_i|$ vs $d(d-1)^{i-1}$' });
        const G = v.graph(s, { nodes: [], edges: [], r: 7, nodeLabel: '', draggable: false });
        let base = null, root = 0;
        function lay() { const H = ix(base), R = radial(H, H.at(root)); G.set({ nodes: base.nodes.map((n, i) => ({ id: n.id, label: '', x: R.P[i][0], y: R.P[i][1] })), edges: base.edges }).layout('fit'); }
        function load() { base = PRE[pre.value](); const H = ix(base), E = eccs(H); root = H.ids[E.center[0]]; lay(); }
        load();
        G.onClick = ({ node }) => { if (node) { root = node.id; lay(); } return true; };
        const comp = () => {
          const H = ix(G), d = Math.max(3, ...degrees(H)), dist = bfs(H, H.at(root)).dist, k = Math.max(...dist), cnt = new Array(k + 1).fill(0); dist.forEach((x) => cnt[x]++);
          const bnd = cnt.map((_, i) => (i === 0 ? 1 : d * Math.pow(d - 1, i - 1)));
          return { H, d, k, cnt, bnd, dist };
        };
        v.render(() => {
          const c = comp(), H = c.H, RING = ['ink', 'accent', 'teal', 'orange', 'purple', 'pink'];
          const rp = G.node(root); for (let i = 1; i <= c.k; i++) { const u = c.dist.indexOf(i), q = G.node(H.ids[u]); s.circle(rp.x, rp.y, Math.hypot(q.x - rp.x, q.y - rp.y), { color: 'faint', width: 1, dash: [3, 4] }); }
          G.draw({ nodeFill: (id) => RING[Math.min(c.dist[H.at(id)], 5)], edgeColor: (e) => (Math.abs(c.dist[H.at(e.from)] - c.dist[H.at(e.to)]) === 1 ? 'muted' : 'faint'), edgeWidth: () => (H.m > 60 ? 0.8 : 1.4) });
          const top = Math.max(...c.bnd, ...c.cnt) * 1.15; p.setView([-0.6, c.k + 0.6], [0, top]); p.setTicks([...Array(c.k + 1).keys()], null);
          c.bnd.forEach((b, i) => p.rect(i - 0.36, 0, i + 0.36, b, { color: 'orange', width: 1.8, dash: [4, 3], fill: 'orange', fillAlpha: 0.06 }));
          p.bars(c.cnt, { x0: 0, color: 'accent', fillAlpha: 0.7, barWidth: 0.5 });
          c.cnt.forEach((x, i) => p.text(String(x), i, x, { align: 'center', baseline: 'bottom', dy: -3, size: 12, weight: 700 }));
        });
        v.legend([['accent', '$|D_i|$', { area: true }], ['orange', 'bound $d(d-1)^{i-1}$', { dash: true }]]);
        v.readout(() => {
          const c = comp(), bound = (c.d / (c.d - 2)) * Math.pow(c.d - 1, c.k);
          return String.raw`$d = \max(3,\Delta) = ${c.d}$, root eccentricity $k = ${c.k}$ · $|G| = ${c.H.n} < \frac{d}{d-2}(d-1)^k = ${fmt2(bound)}$ ${c.H.n < bound ? '✓' : '✗'} · layers full: ${c.cnt.filter((x, i) => x === c.bnd[i]).length} of ${c.k + 1}`;
        });
      },
    },
    {
      num: '1.3.4', kind: 'Theorem', name: 'Alon–Hoory–Linial Moore bound for average degree', credit: 'Alon, Hoory & Linial, 2002',
      statement: String.raw`For real $d\ge2$ and $g\in\mathbb N$ put $n_0(d,g)=1+d\sum_{i=0}^{r-1}(d-1)^i$ if $g=2r+1$ is odd and $n_0(d,g)=2\sum_{i=0}^{r-1}(d-1)^i$ if $g=2r$ is even. Then every graph $G$ with average degree $d(G)\ge d$ and girth $g(G)\ge g$ has at least $n_0(d,g)$ vertices.`,
      idea: String.raw`For *minimum* degree $\delta$ this is the counting argument of 1.3.3 run in reverse: around a vertex (odd $g$) or an edge (even $g$), girth $\ge g$ forces the first $r-1$ BFS layers to be trees, which already contain $n_0(\delta,g)$ vertices. The theorem replaces $\delta$ by the average degree; its proof counts non-backtracking walks and uses the convexity of $x\mapsto(x-1)^i$, so that vertices of high degree more than compensate for those of low degree.`,
      caption: String.raw`Each dot is a random graph built by inserting random edges that keep the girth at least some target, until its average degree reaches the slider value $d$. Filled dots satisfy $d(G)\ge d$ and sit on or above the curve $n_0(d,g)$; hollow ones stalled below $d$ (hypothesis fails). The cubic cages (teal) show the bound is sharp for $d=3$: Petersen and Heawood lie exactly on it. **Resample** for new graphs.`,
      deps: ['graph-1.3.1b', 'graph-1.2.1a'], refs: ['Diestel §1.3'], tags: ['girth', 'degree', 'Moore bound'],
      viz(v) {
        const dS = v.slider('$d$', 2, 5, 3, { step: 0.1 });
        const fails = v.toggle('show samples with $d(G) < d$', true);
        const p = v.stage({ x: [2.5, 10.5], y: [3, 500], ylog: true, axes: 'box', gutter: true, height: 360, full: true, xlabel: 'girth g(G)', ylabel: 'order |G|', xticks: [3, 4, 5, 6, 7, 8, 9, 10] });
        let seed = 1, cache = { key: '', pts: [] };
        v.button('Resample', () => { seed++; });
        const samples = () => {
          const key = dS.value.toFixed(1) + ':' + seed; if (cache.key === key) return cache.pts;
          const r = v.rng(1000 + seed * 31 + Math.round(dS.value * 10)), pts = [];
          for (let t = 0; t < 30; t++) { const n = Math.round(Math.exp(Math.log(8) + r() * (Math.log(64) - Math.log(8)))), tg = 3 + Math.floor(r() * 6); pts.push(greedyGirth(n, tg, dS.value, r)); }
          cache = { key, pts }; return pts;
        };
        v.render(() => {
          const d = dS.value, pts = samples();
          const curve = []; for (let g = 3; g <= 10; g++) curve.push([g, n0(d, g)]);
          p.path(curve, { color: 'red', width: 2.2 }); curve.forEach(([g, n]) => p.dot(g, n, { r: 3.5, color: 'red' }));
          p.text('n₀(d, g)', 10.2, n0(d, 10), { color: 'red', align: 'right', baseline: 'bottom', dy: -6, size: 12, weight: 600 });
          for (const q of pts) { if (q.g === Infinity || q.g > 10.4) continue; const ok = q.avg >= d - 1e-9; if (!ok && !fails.value) continue; p.dot(q.g + (q.n % 5 - 2) * 0.05, q.n, ok ? { r: 4, color: 'accent', alpha: 0.85 } : { r: 4, hollow: true, color: 'muted' }); }
          for (const [n, g, lab] of CUBIC_CAGES) { if (g > 10) continue; p.dot(g, n, { r: 5, color: 'teal' }); if (lab) p.tex(lab, g, n, { color: 'teal', size: 11.5, align: 'left', dx: 8, dy: 8 }); }
        });
        v.legend([['red', '$n_0(d,g)$'], ['accent', 'sample with $d(G)\\ge d$', { dot: true }], ['muted', 'sample with $d(G)<d$', { dot: true }], ['teal', 'cubic cages', { dot: true }]]);
        v.readout(() => {
          const d = dS.value, ok = samples().filter((q) => q.avg >= d - 1e-9 && q.g < Infinity);
          if (!ok.length) return `No sample reached average degree ${d.toFixed(1)} with its girth target — at small orders the bound forbids it.`;
          const tight = ok.reduce((b, q) => (q.n / n0(d, q.g) < b.n / n0(d, b.g) ? q : b));
          return String.raw`${ok.length} samples with $d(G)\ge${d.toFixed(1)}$, all with $|G|\ge n_0(d,g(G))$ ✓ · tightest: $|G| = ${tight.n}$, $g = ${tight.g}$, $n_0 = ${fmt2(n0(d, tight.g))}$ (ratio ${(tight.n / n0(d, tight.g)).toFixed(2)})`;
        });
      },
    },
    {
      num: '1.3.5', kind: 'Corollary', name: 'Minimum degree three forces girth below 2 log n',
      statement: String.raw`If $\delta(G)\ge3$, then $g(G)<2\log_2|G|$.`,
      idea: String.raw`With minimum degree $3$ the counting bound gives $|G|\ge n_0(3,g)$ for $g=g(G)$. For even $g$, $n_0(3,g)=2(2^{g/2}-1)=2^{g/2}+(2^{g/2}-2)>2^{g/2}$; for odd $g$, $n_0(3,g)=1+3(2^{(g-1)/2}-1)=\tfrac3{\sqrt2}2^{g/2}-2>2^{g/2}$. So $|G|>2^{g/2}$, i.e. $g<2\log_2|G|$: a graph of minimum degree $3$ always has a cycle of logarithmic length.`,
      caption: String.raw`Slide $n$ to build a random cubic graph, improved by edge switches to have large girth; its shortest cycle is blue. Its point $(n,g)$ joins the samples on the right, all below the curve $2\log_2 n$, with the cubic cages (teal) coming closest. Switch to $\delta=2$: cycles $C^n$ have girth $n$ and break through the curve.`,
      deps: ['graph-1.3.1b'], see: ['graph-1.3.4'], refs: ['Diestel §1.3'], tags: ['girth', 'degree'],
      viz(v) {
        const mode = v.select('', [{ value: '3', label: 'δ = 3 (cubic)' }, { value: '2', label: 'δ = 2 (cycle Cⁿ)' }], '3');
        const nS = v.slider('$n$', 6, 40, 18, { step: 2, int: true });
        const s = v.stage({ x: [-1.2, 1.2], y: [-1.15, 1.2], axes: false, equal: true, height: 310 });
        const p = v.stage({ x: [4, 140], y: [0, 14], xlog: true, axes: 'box', gutter: true, height: 310, xlabel: 'order n', ylabel: 'girth', title: '$g(G)$ against $2\\log_2 n$' });
        const G = v.graph(s, { nodes: [], edges: [], r: 6, nodeLabel: '', draggable: true });
        const rng = v.rng(3), cache = new Map(), samples = [];
        const cubic = (n) => {
          if (!cache.has(n)) { const E = girthSwitch(n, randomCubic(n, rng), rng, n > 26 ? 140 : 220); const H = ix({ nodes: [...Array(n)].map((_, i) => ({ id: i })), edges: E }); cache.set(n, E); samples.push([n, girth(H).g]); }
          return cache.get(n);
        };
        for (const n of [8, 12, 16, 22, 30]) cubic(n);
        let key = '';
        v.render(() => {
          const n = nS.value, cyc = mode.value === '2';
          if (key !== mode.value + n) { key = mode.value + n; const E = cyc ? named('cycle', n).edges : cubic(n); G.set({ nodes: [...Array(n)].map((_, i) => ({ id: i })), edges: E }).layout(cyc ? 'circle' : 'force', { seed: 2 }); }
          const H = ix(G), gc = girth(H), CE = eset(H, pathEdges(H, gc.cycle, true)), on = new Set(gc.cycle.map((u) => H.ids[u]));
          G.draw({ nodeFill: (id) => (on.has(id) ? 'blue' : 'muted'), edgeColor: (e) => (CE.has(e) ? 'blue' : null), edgeWidth: (e) => (CE.has(e) ? 3.5 : 1.3) });
          p.fn((x) => 2 * Math.log2(x), { color: 'red', width: 2.2 });
          p.text('2 log₂ n', 100, 2 * Math.log2(100), { color: 'red', baseline: 'top', dy: 8, size: 12, weight: 600, align: 'center' });
          if (cyc) { p.fn((x) => x, { color: 'orange', width: 2, dash: [5, 4] }); p.text('cycles: g = n', 9.5, 12.5, { color: 'orange', size: 12, weight: 600 }); }
          for (const [cn, cg, lab] of CUBIC_CAGES) { p.dot(cn, cg, { r: 4.5, color: 'teal' }); if (lab && cn >= 10) p.tex(lab, cn, cg, { color: 'teal', size: 11, align: 'right', dx: -7, dy: -8 }); }
          for (const [sn, sg] of samples) p.dot(sn, sg, { r: 4, color: 'accent', alpha: 0.85 });
          p.dot(n, gc.g, { r: 7, color: cyc ? 'orange' : 'gold' });
        });
        v.legend([['red', '$2\\log_2 n$'], ['accent', 'random cubic samples', { dot: true }], ['teal', 'cubic cages', { dot: true }], ['gold', 'the graph shown', { dot: true }]]);
        v.readout(() => {
          const H = ix(G), g = girth(H).g, n = H.n, b = 2 * Math.log2(n), dmin = Math.min(...degrees(H));
          return String.raw`$\delta(G) = ${dmin}$, $|G| = ${n}$: $g(G) = ${g}$ ${g < b ? '<' : '\\ge'} $2\log_2 ${n} = ${b.toFixed(2)}$ ${dmin >= 3 ? (g < b ? '✓' : '✗') : '— minimum degree 2 is not enough'}`;
        });
      },
    },
  ],
};
